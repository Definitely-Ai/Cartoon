-- Generated work is private unless a signed-in human makes this separate decision.
create table public.cartoon_reviews (
  public_id text primary key check(public_id ~ '^generated-[a-f0-9-]{36}-[a-z0-9-]+$'),
  job_id uuid not null references public.automation_jobs(id),
  image_name text not null check(image_name ~ '^cartoon-[0-9]{2}\.png$'),
  owner_key text not null default 'backroom-owner' check(owner_key='backroom-owner'),
  decision text not null check(decision in ('approved','rejected','withdrawn')),
  image_sha256 text not null check(image_sha256 ~ '^[a-f0-9]{64}$'),
  report_sha256 text not null check(report_sha256 ~ '^[a-f0-9]{64}$'),
  snapshot jsonb,
  version integer not null check(version>0),
  updated_at timestamptz not null default now(),
  unique(job_id,image_name),
  check(decision<>'approved' or (snapshot is not null and jsonb_typeof(snapshot)='object' and snapshot->>'id' is not null and snapshot->>'id'=public_id and snapshot->>'sha256' is not null and snapshot->>'sha256'=image_sha256))
);
create index cartoon_reviews_published on public.cartoon_reviews(updated_at desc,public_id) where decision='approved';
create table public.cartoon_review_events (
  request_id uuid primary key,
  public_id text not null references public.cartoon_reviews(public_id),
  version integer not null,
  decision text not null check(decision in ('approved','rejected','withdrawn')),
  reviewer text not null check(reviewer='backroom-owner'),
  request jsonb not null,
  created_at timestamptz not null default now(),
  unique(public_id,version)
);
alter table public.cartoon_reviews enable row level security;
alter table public.cartoon_reviews force row level security;
alter table public.cartoon_review_events enable row level security;
alter table public.cartoon_review_events force row level security;
revoke all on public.cartoon_reviews,public.cartoon_review_events from public,anon,authenticated;
grant select,insert,update on public.cartoon_reviews to service_role;
grant select,insert on public.cartoon_review_events to service_role;

create or replace function public.review_generated_cartoon(p_job_id uuid,p_image_name text,p_public_id text,p_decision text,p_image_sha256 text,p_report_sha256 text,p_snapshot jsonb,p_expected_version integer,p_request_id uuid,p_checks jsonb)
returns public.cartoon_reviews language plpgsql security invoker set search_path='' as $$
declare j public.automation_jobs; r public.cartoon_reviews; e public.cartoon_review_events; payload jsonb;
begin
  -- Serialize first decisions too, without a transaction spanning any image fetch.
  select * into j from public.automation_jobs where id=p_job_id and owner_key='backroom-owner' for update;
  if not found or j.status<>'succeeded' then raise exception 'Completed owner job required' using errcode='40001'; end if;
  if p_public_id <> 'generated-'||p_job_id::text||'-'||replace(p_image_name,'.png','') or
     not exists(select 1 from jsonb_array_elements(j.artifacts) a where a->>'name'=p_image_name and a->>'kind'='image' and a->>'sha256'=p_image_sha256) or
     not exists(select 1 from jsonb_array_elements(j.artifacts) a where a->>'name'='edition-report.json' and a->>'sha256'=p_report_sha256) then
    raise exception 'Immutable artifact binding required' using errcode='40001';
  end if;
  if p_decision='approved' and p_checks <> '{"artwork":true,"caption":true,"context":true}'::jsonb then
    raise exception 'Human checklist required' using errcode='40001';
  end if;
  payload=jsonb_build_object('job',p_job_id,'image',p_image_name,'decision',p_decision,'imageSha',p_image_sha256,'reportSha',p_report_sha256,'snapshot',p_snapshot,'checks',p_checks,'expectedVersion',p_expected_version);
  select * into e from public.cartoon_review_events where request_id=p_request_id;
  select * into r from public.cartoon_reviews where public_id=p_public_id;
  if e.request_id is not null then
    if e.public_id<>p_public_id or e.request<>payload then raise exception 'Request identity conflict' using errcode='40001'; end if;
    return r; -- Lost response retry cannot undo a newer editorial decision.
  end if;
  if coalesce(r.version,0)<>p_expected_version then raise exception 'Editorial version changed' using errcode='40001'; end if;
  if p_decision='withdrawn' and (r.public_id is null or r.decision<>'approved') then raise exception 'Only published work can be withdrawn' using errcode='40001'; end if;
  insert into public.cartoon_reviews(public_id,job_id,image_name,decision,image_sha256,report_sha256,snapshot,version)
  values(p_public_id,p_job_id,p_image_name,p_decision,p_image_sha256,p_report_sha256,p_snapshot,p_expected_version+1)
  on conflict(public_id) do update set decision=excluded.decision,image_sha256=excluded.image_sha256,report_sha256=excluded.report_sha256,snapshot=excluded.snapshot,version=excluded.version,updated_at=now()
  returning * into r;
  insert into public.cartoon_review_events(request_id,public_id,version,decision,reviewer,request) values(p_request_id,p_public_id,r.version,p_decision,'backroom-owner',payload);
  if p_decision='approved' then
    insert into public.gallery_visibility(cartoon_id,hidden,updated_at) values(p_public_id,false,now())
    on conflict(cartoon_id) do update set hidden=false,updated_at=now();
  end if;
  return r;
end;
$$;
revoke all on function public.review_generated_cartoon(uuid,text,text,text,text,text,jsonb,integer,uuid,jsonb) from public,anon,authenticated;
grant execute on function public.review_generated_cartoon(uuid,text,text,text,text,text,jsonb,integer,uuid,jsonb) to service_role;
