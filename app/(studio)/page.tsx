import Link from "next/link";
import Image from "next/image";
export const metadata = { title: "Rick’s studio" };
const desks = [
  { href: "/room", title: "Step inside the setting.", description: "The marble bar, the bottle shelves and the room shared by Drew, Barclay and Abby. Explore the drawing room and its working parts.", action: "Visit the drawing room" },
  { href: "/library", title: "Every image, in one place.", description: "Artwork, early ideas, working parts and studies for Drew, Barclay and Abby. Open any image for a closer look.", action: "Explore the image library" },
  { href: "/reports", title: "See what changed.", description: "A day-by-day account of the work, with the pictures and GitHub changes behind it. Written in plain English.", action: "Read the daily report" },
  { href: "/newspaper", title: "Picture it in print.", description: "See the cartoon on a newspaper page, adjust its column width and print an editorial proof.", action: "Open the newspaper proof" },
];
export default function StudioHome() {
  return <main id="content" className="workspace-main">
    <header className="desk-heading"><p className="desk-eyebrow">Rick’s working studio</p><h1>A good cartoon.<br /><em>A place to build it together.</em></h1><p className="desk-intro">The artwork, the work in progress, and a clear view of what comes next. Welcome to The Swinging Door.</p></header>
    <section className="studio-feature" aria-labelledby="featured-cartoons">
      <Link href="/gallery/best-of" className="studio-feature-image" aria-label="Read the 38-cartoon collection"><Image src="/gallery/best-of-v1/previews/suitcase-first-class.webp" width={1024} height={1536} sizes="(max-width: 800px) 100vw, 50vw" alt="Drew and Barclay at the bar. Barclay says: I can afford the flight; it's my suitcase that wants to travel first class." priority /><span>The Swinging Door · 38 cartoons</span></Link>
      <div className="studio-feature-copy"><p className="desk-eyebrow">The latest collection</p><h2 id="featured-cartoons">Good company.<br />A fresh line.</h2><p>38 black-and-white cartoons about money, coastal life and the small contradictions we recognize in ourselves. Join Drew, Barclay and Abby at The Swinging Door.</p><p>25 duos and 13 trios, with matching television scenes, hand-lettered chalkboards and a different conversation at the bar.</p><Link href="/gallery/best-of" className="desk-button">Read the 38 cartoons ↗</Link><p className="desk-small">Browse by speaker or cast, open a cartoon for a closer look, and download the full-size artwork.</p></div>
    </section>
    <section className="studio-desks" aria-label="Your workspaces">{desks.map((d,i)=><Link href={d.href} className="studio-desk" key={d.href}><span className="studio-desk-number">0{i+1}</span><h2>{d.title}</h2><p>{d.description}</p><span className="studio-desk-action">{d.action} →</span></Link>)}</section>
    <section className="studio-bottom-grid"><div><p className="desk-eyebrow">The local conversation</p><h2>What’s on Naples’ mind?</h2><p>Financial story ideas, Google Trends evidence, and what we still need to learn from our own audience.</p><Link href="/topics" className="desk-text-link">Explore the topic desk →</Link></div><div><p className="desk-eyebrow">Keep the conversation going</p><h2>Look. React. Refine.</h2><p>Leave a note for each other, discuss a particular image, or review a batch together. Keep the character references close at hand.</p><div className="desk-link-row"><Link href="/notes">Shared notes →</Link><Link href="/models">Meet the cast →</Link></div></div></section>
  </main>;
}
