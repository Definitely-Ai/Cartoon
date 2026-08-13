"use client";

import { useSearchParams } from "next/navigation";

// The door's responses, read from the query string on the client so the
// login page can stay statically generated.

export default function DoorNotes() {
  const params = useSearchParams();

  if (params.get("wrong")) {
    return <p className="br-door-note" role="alert">That&rsquo;s not the word.</p>;
  }

  if (params.get("setup")) {
    return (
      <p className="br-door-note" role="alert">
        The door has no lock yet. Set <code>ADMIN_PASSWORD</code> and <code>AUTH_SECRET</code> in
        the Vercel project&rsquo;s environment variables, redeploy, then knock again — details in
        docs/SETUP.md, &ldquo;The Back Room.&rdquo;
      </p>
    );
  }

  return null;
}
