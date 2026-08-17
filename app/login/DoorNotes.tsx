"use client";

import { useSearchParams } from "next/navigation";

// The door's responses, read from the query string on the client so the
// login page can stay statically generated.

export default function DoorNotes() {
  const params = useSearchParams();

  if (params.get("wrong")) {
    return (
      <p className="br-door-note" role="alert">
        That&rsquo;s not it — check the username and the password, then try again.
      </p>
    );
  }

  if (params.get("setup")) {
    return (
      <p className="br-door-note" role="alert">
        The door has no lock yet. Set <code>ADMIN_PASSWORD</code> (and <code>GITHUB_TOKEN</code>,
        for filing cartoons) in the Vercel project&rsquo;s environment variables, redeploy, then
        try again — details in docs/SETUP.md, &ldquo;The studio login.&rdquo; The username is{" "}
        <code>theswingingdoor</code> unless <code>ADMIN_USERNAME</code> says otherwise.
      </p>
    );
  }

  return null;
}
