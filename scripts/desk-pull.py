#!/usr/bin/env python3
"""Bring the website's sticker-desk decisions down to the studio machine.

This is how Rick's and the founder's choices on
https://cartoon-brown-seven.vercel.app/desk reach the GPU. The site cannot
draw; it records DECISIONS. This script fetches the new ones, writes each to
canon/room-kit/v2/decisions/<id>.json, and prints them so the next thing you
run - scripts/sticker-desk.mjs, scripts/room-part.py, scripts/compose-layers.py
- knows what was asked for.

    python scripts/desk-pull.py                    # everything new since last run
    python scripts/desk-pull.py --all              # every decision on record
    python scripts/desk-pull.py --since 2026-09-05T00:00:00Z
    python scripts/desk-pull.py --base http://127.0.0.1:3000
    python scripts/desk-pull.py --apply-layout     # also write layout.json from
                                                   # the newest decision

Standard library only - urllib, hmac, hashlib, json. No requests, no npm, no
paid API, nothing sent anywhere.

AUTHENTICATION. The whole site is behind one shared login (middleware.ts). The
session cookie is HMAC-SHA256(secret, "backroom-door-v1"), where the secret is
AUTH_SECRET, or SHA-256("sd-derived-secret:" + ADMIN_PASSWORD) when AUTH_SECRET
is not set - the same derivation as lib/backroom-auth.ts. This script reads
those from the environment, or from .env.production.local / .env.local in the
repo (which Vercel CLI wrote), and mints the cookie itself. It never prints a
secret and never asks anyone to type one.
"""
from __future__ import annotations

import argparse
import hashlib
import hmac
import json
import os
import re
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
DECISIONS = REPO / "canon" / "room-kit" / "v2" / "decisions"
HISTORY = REPO / "canon" / "room-kit" / "v2" / "history"
LAYOUT = REPO / "canon" / "room-kit" / "v2" / "layout.json"
STATE = DECISIONS / ".last-pull.json"
DEFAULT_BASE = "https://cartoon-brown-seven.vercel.app"
COOKIE_NAME = "sd_backroom"
DOOR_PHRASE = b"backroom-door-v1"
ENV_FILES = (".env.production.local", ".env.local", ".env")


def log(msg: str) -> None:
    print(f"[desk-pull] {msg}")


# ------------------------------------------------------------------- secret

def env_value(name: str) -> str | None:
    if os.environ.get(name):
        return os.environ[name]
    for filename in ENV_FILES:
        path = REPO / filename
        if not path.exists():
            continue
        for line in path.read_text(encoding="utf-8", errors="replace").splitlines():
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, _, value = line.partition("=")
            if key.strip() != name:
                continue
            value = value.strip()
            if len(value) >= 2 and value[0] == value[-1] and value[0] in "\"'":
                value = value[1:-1]
            if value and value != "[SENSITIVE]":
                return value
    return None


def door_cookie() -> str:
    """The studio's own session cookie, derived - never typed, never printed."""
    explicit = env_value("DESK_COOKIE")
    if explicit:
        return explicit
    secret = env_value("AUTH_SECRET")
    if not secret:
        password = env_value("ADMIN_PASSWORD")
        if not password:
            raise SystemExit(
                "[desk-pull] No way to sign in. Set AUTH_SECRET or ADMIN_PASSWORD in the\n"
                "            environment or in .env.production.local (Vercel CLI writes it with\n"
                "            `vercel env pull .env.production.local`), then run this again."
            )
        secret = hashlib.sha256(f"sd-derived-secret:{password}".encode("utf-8")).hexdigest()
    return hmac.new(secret.encode("utf-8"), DOOR_PHRASE, hashlib.sha256).hexdigest()


# -------------------------------------------------------------------- fetch

def fetch(base: str, since: str | None, limit: int, cookie: str) -> dict:
    query = {"limit": str(limit)}
    if since:
        query["since"] = since
    url = f"{base.rstrip('/')}/api/desk/decisions?{urllib.parse.urlencode(query)}"
    request = urllib.request.Request(url, headers={
        "Cookie": f"{COOKIE_NAME}={cookie}",
        "Accept": "application/json",
        "User-Agent": "swinging-door-desk-pull/1",
    })
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            if response.status != 200:
                raise SystemExit(f"[desk-pull] the site answered {response.status}")
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as error:
        body = error.read().decode("utf-8", "replace")[:400]
        if error.code in (401, 307, 302):
            raise SystemExit(
                "[desk-pull] the site did not accept the studio session. Check that AUTH_SECRET\n"
                "            or ADMIN_PASSWORD here matches the deployed site, then try again."
            ) from None
        raise SystemExit(f"[desk-pull] the site answered {error.code}: {body}") from None
    except urllib.error.URLError as error:
        raise SystemExit(f"[desk-pull] could not reach {base}: {error.reason}") from None


# ------------------------------------------------------------------- output

SAFE_PART = re.compile(r"^[a-z0-9][a-z0-9-]{0,39}$")
SAFE_NAME = re.compile(r"[^A-Za-z0-9._-]")


def resolve_version(part: str, version: str) -> str | None:
    """Where the studio keeps the version the website chose. The part id and the
    version id are checked here too: this machine writes files from what the
    website answered, so it never builds a path out of an unchecked string."""
    if not SAFE_PART.match(part or "") or not re.match(r"^v\d{1,4}$", version or ""):
        return None
    folder = HISTORY / part
    if not folder.is_dir():
        return None
    for candidate in sorted(folder.glob(f"{version}-*.png")):
        if candidate.name.endswith("-in-context.png"):
            continue
        return str(candidate.relative_to(REPO)).replace("\\", "/")
    return None


def show(decision: dict) -> None:
    layout = decision.get("layout") or {}
    notes = decision.get("notes") or {}
    approvals = decision.get("approvals") or {}
    print()
    print(f"  {decision.get('created_at') or decision.get('createdAt')}  {decision.get('author')}  [{decision.get('status')}]  {decision.get('id')}")
    if notes.get("_all"):
        print(f"    message: {notes['_all']}")
    for part in sorted(layout):
        layer = layout[part] or {}
        bits = []
        if layer.get("dx") or layer.get("dy"):
            bits.append(f"move dx {layer.get('dx', 0)} dy {layer.get('dy', 0)}")
        if not layer.get("visible", True):
            bits.append("hidden")
        if layer.get("version"):
            found = resolve_version(part, layer["version"])
            bits.append(f"version {layer['version']} -> {found or 'NOT FOUND in history/' + part}")
        verdict = approvals.get(part)
        if verdict:
            bits.append(f"{verdict.get('state')} ({verdict.get('author')})")
        if notes.get(part):
            bits.append(f"note: {notes[part]}")
        if bits:
            print(f"    {part:<16} {' | '.join(bits)}")


def write_layout(decision: dict) -> None:
    """Turn the newest decision into canon/room-kit/v2/layout.json, the file
    scripts/compose-layers.py already reads. A chosen version becomes that
    layer's `file` only when the studio actually holds it."""
    layers = {}
    for part, layer in (decision.get("layout") or {}).items():
        entry = {"dx": int(layer.get("dx", 0)), "dy": int(layer.get("dy", 0)), "visible": bool(layer.get("visible", True))}
        if layer.get("version"):
            found = resolve_version(part, layer["version"])
            if found:
                entry["file"] = found.split("canon/room-kit/v2/", 1)[-1]
            else:
                log(f"WARNING {part}: {layer['version']} is not in history/{part}/ - left on the current sticker")
        layers[part] = entry
    doc = {
        "_doc": (
            "Written by scripts/desk-pull.py from a sticker-desk decision made on the website, and read by "
            "scripts/compose-layers.py. Per layer: dx, dy in plate pixels from where room-part.py put it; "
            "visible; file, a version of that layer under canon/room-kit/v2/."
        ),
        "saved": decision.get("created_at") or decision.get("createdAt"),
        "fromDecision": decision.get("id"),
        "author": decision.get("author"),
        "layers": layers,
    }
    LAYOUT.write_text(json.dumps(doc, indent=2), encoding="utf-8")
    log(f"wrote {LAYOUT.relative_to(REPO)} from decision {decision.get('id')}")


def main() -> int:
    parser = argparse.ArgumentParser(description="Pull sticker-desk decisions from the website.")
    parser.add_argument("--base", default=os.environ.get("DESK_SITE") or DEFAULT_BASE, help="site address (default: the deployed studio)")
    parser.add_argument("--since", help="ISO timestamp; only decisions newer than this")
    parser.add_argument("--all", action="store_true", help="ignore the last-pull mark and take everything")
    parser.add_argument("--limit", type=int, default=100, help="most decisions to take at once (1-200)")
    parser.add_argument("--apply-layout", action="store_true", help="also write layout.json from the newest decision")
    args = parser.parse_args()

    since = args.since
    if not since and not args.all and STATE.exists():
        try:
            since = json.loads(STATE.read_text(encoding="utf-8")).get("last")
        except (OSError, ValueError):
            since = None

    payload = fetch(args.base, since, max(1, min(args.limit, 200)), door_cookie())
    decisions = payload.get("decisions") or []
    log(payload.get("storeNote") or f"store: {payload.get('store')}")
    if not decisions:
        log(f"nothing new{' since ' + since if since else ''}. {args.base}")
        return 0

    DECISIONS.mkdir(parents=True, exist_ok=True)
    newest = since or ""
    for decision in decisions:
        created = decision.get("createdAt") or decision.get("created_at") or ""
        record = {
            "_doc": "One decision made on the website's sticker desk (app/(studio)/desk) and pulled here by scripts/desk-pull.py. The site decides; this machine draws.",
            "id": decision.get("id"),
            "created_at": created,
            "author": decision.get("author"),
            "layout": decision.get("layout") or {},
            "notes": decision.get("notes") or {},
            "approvals": decision.get("approvals") or {},
            "status": decision.get("status"),
            "pulledFrom": args.base,
        }
        name = SAFE_NAME.sub("-", str(decision.get("id") or created))[:64] or "decision"
        (DECISIONS / f"{name}.json").write_text(json.dumps(record, indent=2), encoding="utf-8")
        show(record)
        newest = max(newest, created)

    print()
    log(f"{len(decisions)} decision(s) into {DECISIONS.relative_to(REPO)}")
    if newest:
        STATE.write_text(json.dumps({"last": newest, "base": args.base}, indent=2), encoding="utf-8")
    if args.apply_layout:
        newest_decision = max(decisions, key=lambda d: d.get("createdAt") or d.get("created_at") or "")
        write_layout({**newest_decision, "created_at": newest_decision.get("createdAt")})
        log("now run:  python scripts/compose-layers.py --verify")
    else:
        log("re-run with --apply-layout to turn the newest decision into canon/room-kit/v2/layout.json")
    return 0


if __name__ == "__main__":
    sys.exit(main())
