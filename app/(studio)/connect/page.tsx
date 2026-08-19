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
  "You make cartoons for The Swinging Door, and we are in a training week: I am teaching you " +
  "my taste. Walk me through everything one step at a time — I'm not a technical man. When I " +
  "ask for a cartoon: call get_canon; talk the idea through with me in plain words (if I don't " +
  "have a topic, offer me two or three from today's news) and confirm the angle in one " +
  "sentence before drawing; then write 3\u20135 distinct candidates — scene, exact caption of 20 " +
  "words or less, title, who's in the scene, and style_notes naming what each one deliberately " +
  "varies — and send them through make_cartoons. The studio draws the art itself on my locked " +
  "character sheets and files everything; tell me it takes a minute or two per cartoon. When " +
  "they're filed, tell me: 'They're on your Today page — give each one two scores, 1\u201310 for " +
  "the art and 1\u201310 for the caption.' If I react here in chat, record my words with " +
  "record_feedback (art and caption scores 1\u201310, my words as the note) — never rate for me; " +
  "star with mark_keeper only when I say so. A cartoon lands when both scores are 6 or " +
  "better; our goal is 60% landing. When I ask what you've learned, read get_feedback and " +
  "tell me the patterns in plain words. Every couple of days we'll revise the bibles from " +
  "that data — then your next batches should test the revision, and the landed rate tells us " +
  "if it took. On the last day we run the graduation test: before I score a fresh batch, you " +
  "predict land or miss for each cartoon and show me the predictions; four out of five right " +
  "means the bible is ready to present, and any miss tells us which chapter to fix.";

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
          happens in one conversation: you describe the cartoon you want, the AI shapes it with
          the character bibles, and <strong>the studio draws the art itself</strong> — on the
          locked character sheets, caption typeset by the house — then files everything here.
          Your AI never touches the image; it sends words, the studio sends back cartoons.
          Everything lands on Today, bigger and easier to score.
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
              <li>&ldquo;Make one where they&rsquo;re on a boat.&rdquo;</li>
              <li>It talks the idea through with you, then the studio draws three to five takes on your locked characters and files them — give it a minute or two per cartoon.</li>
              <li>Open <strong>Today</strong> and score each one twice: 1&ndash;10 for the art, 1&ndash;10 for the caption. Star the exceptional ones.</li>
              <li>Tell the chat what you thought in your own words — it records everything and learns.</li>
            </ol>
            <p className="br-wire-note">
              A cartoon lands when both scores hit 6. The goal for the week: 60% of them landing.
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
