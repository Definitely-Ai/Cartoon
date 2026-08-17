import CopyButton from "./CopyButton";

// THE WIRE — how cartoons come in from chat. This page assembles the MCP
// connector address from the environment (MCP_SECRET) and walks through
// hooking it up to ChatGPT or Claude, in steps an unhurried reader can
// follow once and never think about again. Login-gated like the rest of
// the room, because the address itself is a key.

export const metadata = {
  title: "The Wire",
};

// Rendered per-request: the address depends on MCP_SECRET, and baking it
// at build time would tie the page's truth to build-order coincidences.
export const dynamic = "force-dynamic";

// The once-only briefing for his ChatGPT Project — kept here, next to the
// address, so the whole hookup happens from this one page. Mirrors
// docs/SETUP.md; update both together.
const PROJECT_INSTRUCTIONS =
  "You draw cartoons for The Swinging Door, and we are in a training week: I am teaching you " +
  "my taste. When I ask for cartoons: call get_canon and follow it exactly; fetch " +
  "get_model_sheet for each character you'll draw and match the sheets; draw 3–5 " +
  "distinct, text-free candidates; file each with file_cartoon (title, caption, topic). Show " +
  "them to me here. When I react to one, record my words with record_feedback; star with " +
  "mark_keeper only when I say so. Never rate for me. When I ask what you've learned, read " +
  "get_feedback and tell me the patterns. Every couple of days we'll revise the bibles from " +
  "that data — then your next batches should test the revision, and the love-rate trend " +
  "tells us if it took. On the last day we run the graduation test: before I rate a fresh " +
  "batch, you predict my verdict for each cartoon and show me the predictions; four out of " +
  "five right means the bible is ready to present, and any miss tells us which chapter to fix.";

export default function ConnectPage() {
  const secret = process.env.MCP_SECRET;
  const host = process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000";
  const url = secret ? `${host}/api/mcp?key=${secret}` : null;

  return (
    <main id="content" className="br-main br-wire">
      <header className="br-table-head">
        <h1 className="br-date">The Wire</h1>
        <p className="br-status">Your AI files the day&rsquo;s cartoons through here.</p>
      </header>

      <section className="br-wire-section">
        <h2 className="br-wire-head">What this does</h2>
        <p>
          Once your AI (ChatGPT or Claude) is connected to the wire, the whole daily routine
          happens in one conversation: it reads the character bibles straight from the vault,
          draws the day&rsquo;s cartoons, files them here — the house typesets the words — and
          stars the ones you say you like. Everything it files lands on Today at the same time,
          bigger and easier to compare.
        </p>
      </section>

      {url ? (
        <>
          <section className="br-wire-section">
            <h2 className="br-wire-head">The address</h2>
            <p className="br-address">
              <code>{url}</code>
            </p>
            <CopyButton value={url} />
            <p className="br-warn">
              This address is a key: anyone holding it can file cartoons into the studio and read
              the week&rsquo;s feedback. Paste it only into your own AI accounts, never anywhere
              public.
            </p>
          </section>

          <section className="br-wire-section">
            <h2 className="br-wire-head">Hook up ChatGPT (once)</h2>
            <ol className="br-steps">
              <li>Open ChatGPT → Settings → Connectors.</li>
              <li>Under Advanced, turn on Developer mode.</li>
              <li>Choose Create connector, give it a name like &ldquo;The Swinging Door&rdquo;, and paste the address above. No authentication — the key is inside the address.</li>
              <li>Save. In a new chat, enable the connector and you&rsquo;re on the wire.</li>
            </ol>
          </section>

          <section className="br-wire-section">
            <h2 className="br-wire-head">Teach it the ritual (once)</h2>
            <p>
              In ChatGPT, make a Project for the cartoons, open its instructions, and paste this
              in. It tells the AI how the training week works — draw, file, listen, and never
              rate on your behalf.
            </p>
            <p className="br-instructions">{PROJECT_INSTRUCTIONS}</p>
            <CopyButton value={PROJECT_INSTRUCTIONS} label="Copy the instructions" />
          </section>

          <section className="br-wire-section">
            <h2 className="br-wire-head">Hook up Claude (once)</h2>
            <ol className="br-steps">
              <li>Open Claude → Settings → Connectors.</li>
              <li>Choose Add custom connector and paste the address above.</li>
              <li>Save — done.</li>
            </ol>
          </section>

          <section className="br-wire-section">
            <h2 className="br-wire-head">Then, any morning</h2>
            <ol className="br-steps">
              <li>&ldquo;I want them fishing today.&rdquo;</li>
              <li>It reads the character bibles, draws three to five takes, files them, and shows you right in the chat.</li>
              <li>&ldquo;I like the second and the last one.&rdquo; It stars them — your Keepers gallery grows.</li>
            </ol>
            <p className="br-wire-note">
              Prefer a bigger table? Everything it files is already waiting on Today. Two doors,
              one bar.
            </p>
          </section>
        </>
      ) : (
        <section className="br-wire-section">
          <h2 className="br-wire-head">The wire isn&rsquo;t connected yet</h2>
          <p>
            Add an environment variable named <code>MCP_SECRET</code> in the Vercel project (any
            long random string), redeploy, and revisit this page — the connection address will be
            printed here, with the hookup steps.
          </p>
        </section>
      )}
    </main>
  );
}
