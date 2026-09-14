// Generate rollback-only PostgreSQL probes for a trusted operator to execute.
// This script makes no network requests and never reads environment credentials.
// Run: node scripts/test-automation-queue-live.mjs --print-sql
// Real simultaneous SKIP LOCKED behavior still requires two database sessions;
// the bounded probe below tests serial interleavings and SQL fencing invariants.
import { pathToFileURL } from "node:url";

export const transactionalSql = String.raw`
begin;
set local statement_timeout = '10s';
set local lock_timeout = '1s';
set local role service_role;
lock table public.automation_workers, public.automation_jobs in share row exclusive mode nowait;
do $probe$
declare
  wa uuid := gen_random_uuid(); wb uuid := gen_random_uuid();
  ha text; hb text;
  ja uuid := gen_random_uuid(); jb uuid := gen_random_uuid(); jf uuid := gen_random_uuid();
  ta uuid; tb uuid;
  claimed jsonb; changed jsonb; duplicate jsonb;
  manifest jsonb := '[{"name":"synthetic-lease-probe.png","kind":"image","note":"SQL probe only; no real artifact or API completion"}]'::jsonb;
begin
  if exists (select 1 from public.automation_jobs where status in ('queued', 'running')) then
    raise exception 'Probe refused: real pending/running jobs exist. Run before connecting the worker.';
  end if;
  ha := replace(wa::text, '-', '') || replace(wa::text, '-', '');
  hb := replace(wb::text, '-', '') || replace(wb::text, '-', '');
  insert into public.automation_workers(id, name, token_hash) values
    (wa, 'ROLLBACK lease probe A', ha), (wb, 'ROLLBACK lease probe B', hb);
  insert into public.automation_jobs(id, request_id, input_hash, input, due_at, available_at, created_at) values
    (ja, gen_random_uuid(), ha, '{"quantity":1}', now() - interval '2 minutes', now() - interval '2 minutes', now() - interval '2 minutes'),
    (jb, gen_random_uuid(), hb, '{"quantity":1}', now() - interval '1 minute', now() - interval '1 minute', now() - interval '1 minute'),
    (jf, gen_random_uuid(), ha, '{"quantity":1}', now() + interval '1 day', now() + interval '1 day', now());

  claimed := public.automation_claim_job(wa, ha);
  if claimed->>'id' is distinct from ja::text or (claimed->>'attempt')::int <> 1 then raise exception 'First due claim failed'; end if;
  ta := (claimed->>'lease_token')::uuid;
  duplicate := public.automation_claim_job(wa, ha);
  if duplicate->>'id' is distinct from ja::text or duplicate->>'lease_token' is distinct from ta::text then raise exception 'Repeat claim changed live lease'; end if;
  claimed := public.automation_claim_job(wb, hb);
  if claimed->>'id' is distinct from jb::text then raise exception 'Second worker did not get a distinct due job'; end if;
  tb := (claimed->>'lease_token')::uuid;

  update public.automation_jobs set lease_expires_at = now() + interval '10 seconds' where id = ja;
  changed := public.automation_update_job(wa, ha, ja, ta, 'heartbeat', '{"stage":"Synthetic probe","completed":0,"total":1}');
  if (changed->>'lease_expires_at')::timestamptz < now() + interval '170 seconds' or changed->'progress'->>'stage' <> 'Synthetic probe' then raise exception 'Heartbeat failed'; end if;
  update public.automation_jobs set lease_expires_at = now() - interval '1 second' where id = ja;
  claimed := public.automation_claim_job(wb, hb);
  if claimed->>'id' is distinct from jb::text then raise exception 'Worker acquired two active leases'; end if;
  perform public.automation_update_job(wb, hb, jb, tb, 'fail', p_error => 'Synthetic nonretryable probe', p_retryable => false);
  claimed := public.automation_claim_job(wb, hb);
  if claimed->>'id' is distinct from ja::text or (claimed->>'attempt')::int <> 2 or claimed->>'lease_token' = ta::text then raise exception 'Expired lease was not fenced and reclaimed'; end if;
  tb := (claimed->>'lease_token')::uuid;
  if public.automation_claim_job(wa, ha) is not null then raise exception 'Future job was claimed too early'; end if;
  begin
    perform public.automation_update_job(wa, ha, ja, ta, 'heartbeat');
    raise exception 'Stale heartbeat was accepted';
  exception when sqlstate '40001' then null;
  end;
  begin
    perform public.automation_update_job(wa, ha, ja, ta, 'complete', p_artifacts => manifest);
    raise exception 'Stale completion was accepted';
  exception when sqlstate '40001' then null;
  end;
  changed := public.automation_update_job(wb, hb, ja, tb, 'complete', p_artifacts => manifest);
  duplicate := public.automation_update_job(wb, hb, ja, tb, 'complete', p_artifacts => manifest);
  if changed->>'status' <> 'succeeded' or changed is distinct from duplicate then raise exception 'Identical completion was not idempotent'; end if;
  begin
    perform public.automation_update_job(wb, hb, ja, tb, 'complete', p_artifacts => '[{"different":true}]');
    raise exception 'Mismatched repeated completion was accepted';
  exception when sqlstate '40001' then null;
  end;
  begin
    perform public.automation_claim_job(wa, repeat('0', 64));
    raise exception 'Wrong token was accepted';
  exception when sqlstate '28000' then null;
  end;
  update public.automation_workers set enabled = false where id = wb;
  begin
    perform public.automation_update_job(wb, hb, ja, tb, 'complete', p_artifacts => manifest);
    raise exception 'Revoked token could repeat completion';
  exception when sqlstate '28000' then null;
  end;

  update public.automation_jobs set due_at = now() - interval '1 second', available_at = now() - interval '1 second' where id = jf;
  claimed := public.automation_claim_job(wa, ha);
  ta := (claimed->>'lease_token')::uuid;
  changed := public.automation_update_job(wa, ha, jf, ta, 'fail', p_error => 'Synthetic retryable outage', p_retryable => true);
  if changed->>'status' <> 'queued' or (changed->>'available_at')::timestamptz <= now() then raise exception 'Retryable failure did not persist backoff'; end if;
  if public.automation_claim_job(wa, ha) is not null then raise exception 'Backoff was ignored'; end if;
  update public.automation_jobs set available_at = now() - interval '1 second' where id = jf;
  claimed := public.automation_claim_job(wa, ha);
  if (claimed->>'attempt')::int <> 2 or claimed->>'lease_token' = ta::text then raise exception 'Retry did not issue fresh attempt token'; end if;
  ta := (claimed->>'lease_token')::uuid;
  changed := public.automation_update_job(wa, ha, jf, ta, 'fail', p_error => 'Synthetic creative failure', p_retryable => false);
  if changed->>'status' <> 'failed' or changed->>'finished_at' is null then raise exception 'Nonretryable failure was not retained'; end if;
  raise notice 'PASS: due gating, stable single lease, distinct workers, heartbeat, expiry recovery, stale rejection, idempotent completion, revocation, retry backoff and visible fatal state; all rows rolled back.';
end;
$probe$;
rollback;
`;

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (process.argv[2] === "--print-sql") process.stdout.write(transactionalSql);
  else process.stdout.write("Use --print-sql to generate rollback-only probes. No database connection is made.\n");
}
