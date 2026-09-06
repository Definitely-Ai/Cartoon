import Link from "next/link";
import Image from "next/image";
export const metadata = { title: "Rick’s studio" };
const desks = [
  { href: "/library", title: "Every image, in one place.", description: "Artwork, early ideas, working parts and studies for Drew, Barclay and Abby. Open any image for a closer look.", action: "Explore the image library" },
  { href: "/reports", title: "See what changed.", description: "A day-by-day account of the work, with the pictures and GitHub changes behind it. Written in plain English.", action: "Read the daily report" },
  { href: "/newspaper", title: "Picture it in print.", description: "See the cartoon on a newspaper page, adjust its column width and print an editorial proof.", action: "Open the newspaper proof" },
];
export default function StudioHome() {
  return <main id="content" className="workspace-main">
    <header className="desk-heading"><p className="desk-eyebrow">Rick’s working studio</p><h1>A good cartoon.<br /><em>A place to build it together.</em></h1><p className="desk-intro">The artwork, the work in progress, and a clear view of what comes next. Welcome to The Swinging Door.</p></header>
    <section className="studio-feature" aria-labelledby="current-work">
      <Link href="/room" className="studio-feature-image" aria-label="Inspect the current bar scene and room rebuild"><Image src="/studio-room/previous-duo.png" width={1200} height={1800} alt="The current working scene: Drew and Barclay at the marble bar, with bottle shelves and the New York window behind them." priority /><span>Current working scene · open to inspect</span></Link>
      <div className="studio-feature-copy"><p className="desk-eyebrow">On the drawing board</p><h2 id="current-work">Build the room.<br />One piece at a time.</h2><p>Start with a room a person could actually build. Give each finished part its own layer, so a small correction stays small.</p><ol className="studio-next-steps"><li><span>First</span> Just the wall, the window and the bar.</li><li><span>Then</span> Add each shelf, the TV and the chalkboard.</li><li><span>Next</span> Refine Barclay’s head, then place the cast.</li></ol><Link href="/room" className="desk-button">Visit the drawing room ↗</Link><p className="desk-small">Working locally on the RTX 4090. New studies await review.</p></div>
    </section>
    <section className="studio-desks" aria-label="Your workspaces">{desks.map((d,i)=><Link href={d.href} className="studio-desk" key={d.href}><span className="studio-desk-number">0{i+1}</span><h2>{d.title}</h2><p>{d.description}</p><span className="studio-desk-action">{d.action} →</span></Link>)}</section>
    <section className="studio-bottom-grid"><div><p className="desk-eyebrow">The local conversation</p><h2>What’s on Naples’ mind?</h2><p>Financial story ideas, Google Trends evidence, and what we still need to learn from our own audience.</p><Link href="/topics" className="desk-text-link">Explore the topic desk →</Link></div><div><p className="desk-eyebrow">Keep the conversation going</p><h2>Look. React. Refine.</h2><p>Leave a note for each other, discuss a particular image, or review a batch together. Keep the character references close at hand.</p><div className="desk-link-row"><Link href="/notes">Shared notes →</Link><Link href="/models">Meet the cast →</Link></div></div></section>
  </main>;
}
