import Link from "next/link";
import CopyButton from "./CopyButton";

export const metadata = { title: "Connect your AI" };
export const dynamic = "force-dynamic";

// The connection address remains private and is assembled only on the server.
// Connecting a chat app does not by itself reach the local drawing workstation.
const PROJECT_INSTRUCTIONS =
  "You help Rick develop The Swinging Door. Speak in plain English. " +
  "Read get_canon and the relevant get_doc references before suggesting changes. " +
  "The current drawing workflow uses the studio's local RTX 4090 workstation; do not use Replicate or another hosted image generator. " +
  "Start the room with only the wall, window and bar. Add the shelves, television, chalkboard, outside view and characters as separate pieces after the base works. " +
  "Keep perspective, scale and lighting consistent so changing one piece does not redraw the rest. " +
  "For a story, discuss the angle and exact caption in plain words. Treat Google Trends and Analytics as separate sources and never invent Naples demand. " +
  "Only describe a drawing as created or filed after a tool or file confirms it exists. If this chat cannot reach the local drawing tools, prepare a clear handoff for the workstation. " +
  "Use get_light_table and get_feedback to see recorded work and reactions. Record feedback only as Rick or Zechariah gives it, never score on their behalf, and mark a keeper only when asked. " +
  "Link to the image library, drawing room, daily reports, or the exact review set so they can see what you mean.";

export default function ConnectPage() {
  const configuredSecret = process.env.MCP_SECRET;
  const secret = configuredSecret && configuredSecret !== "[SENSITIVE]" ? configuredSecret : null;
  const host = process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000";
  const url = secret ? `${host}/api/mcp?key=${secret}` : null;

  return <main id="content" className="br-main br-wire">
    <header className="br-table-head">
      <h1 className="br-date">Connect your AI</h1>
      <p className="br-status">Bring the studio’s references and feedback into your own conversation.</p>
    </header>

    <section className="br-wire-section">
      <h2 className="br-wire-head">The work starts in the studio</h2>
      <p>We are building the room in separate pieces on the local RTX 4090 workstation. The first piece is simply the wall, window and bar. The shelves, television, chalkboard, street view and cast follow as their own parts.</p>
      <p>The website is where we look at the results, keep the references together, and discuss changes. Connecting a chat app gives it the studio’s tools and records; access to the local drawing workstation still has to be available before it can create artwork.</p>
      <p><Link href="/room">See the drawing plan</Link> · <Link href="/library">Browse the artwork</Link> · <Link href="/reports">Read the daily report</Link></p>
    </section>

    {url ? <>
      <section className="br-wire-section">
        <h2 className="br-wire-head">Your private connection address</h2>
        <p className="br-address"><code>{url}</code></p>
        <CopyButton value={url} />
        <p className="br-warn">This address includes the studio’s access key. Use it only in your own AI accounts. Anyone holding it may be able to read studio feedback or file work through the connector.</p>
      </section>

      <section className="br-wire-section">
        <h2 className="br-wire-head">Connect a conversation</h2>
        <ol className="br-steps">
          <li>In an AI app that supports a custom MCP connection, add the private address above.</li>
          <li>Name the connection “The Swinging Door” and enable it in the conversation you want to use.</li>
          <li>Ask it to read the studio’s references and describe the current drawing approach. Confirm that it can read the studio before asking it to file anything.</li>
        </ol>
        <p className="br-wire-note">The available connection settings depend on the app and account. The existing address contains its access key; keep the full address private.</p>
      </section>
    </> : <section className="br-wire-section">
      <h2 className="br-wire-head">The connection address is not available here yet</h2>
      <p>The studio pages still work without a connected chat app. Once the connection setup is complete, return here for the private address.</p>
      <details className="legacy-connection"><summary>Setup details</summary><p>The server needs its existing <code>MCP_SECRET</code> configuration and production site address before it can show the connection.</p></details>
    </section>}

    <section className="br-wire-section">
      <h2 className="br-wire-head">Give it the current brief</h2>
      <p>Save these instructions with your cartoon conversation or project. They keep the local drawing method and the studio’s records in view.</p>
      <p className="br-instructions">{PROJECT_INSTRUCTIONS}</p>
      <CopyButton value={PROJECT_INSTRUCTIONS} label="Copy the current brief" />
    </section>

    <section className="br-wire-section">
      <h2 className="br-wire-head">A useful first request</h2>
      <p>“Read our room plan and the latest report. Show me what changed, then help me describe the next correction in plain English.”</p>
      <p>When a new drawing exists, open it in the image library or its review set. Tell us what looks right and what needs another pass. A saved note is useful; a clear picture beside it is even better.</p>
    </section>
  </main>;
}
