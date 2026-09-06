import type { Metadata } from "next";
import { RESEARCH_SOURCES, TOPIC_LEADS, TOPIC_RESEARCH } from "@/lib/studio-topics";
import styles from "./topics.module.css";

export const metadata: Metadata = {
  title: "Naples story desk",
  description: "Source-backed cartoon ideas, a dated Google Trends snapshot and a clear record of the audience evidence still needed.",
};

export default function TopicsPage() {
  return (
    <main id="content" className={`br-main ${styles.page}`}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>The Naples story desk</p>
        <h1>What’s on people’s minds?</h1>
        <p className={styles.intro}>Financial stories with a local foothold, ready for Rick to review. Each idea pairs a search signal with an identifiable source and a possible joke.</p>
        <p className={styles.dateline}>Research snapshot · {TOPIC_RESEARCH.checkedLabel}</p>
      </header>

      <section className={styles.sources} aria-label="Research sources and availability">
        <article className={styles.sourceCard}>
          <span className={styles.badge}>Observed snapshot</span>
          <h2>Google Trends</h2>
          <p><strong>{TOPIC_RESEARCH.geography}</strong><br />{TOPIC_RESEARCH.displayedPeriod} · Web Search</p>
          <p>Local metro search interest was accessible. The combined city breakdown did not have enough data to establish a Naples-city ranking.</p>
          <a className={styles.action} href={TOPIC_RESEARCH.sourceUrl} target="_blank" rel="noreferrer">Open metro comparison ↗</a>
        </article>
        <article className={styles.sourceCard}>
          <span className={`${styles.badge} ${styles.pending}`}>No report connected</span>
          <h2>Google Analytics</h2>
          <p><strong>Our website’s audience</strong><br />No measured results on this page yet</p>
          <p>Signed-in Analytics was checked, but a Cartoon property was not found. We still need the intended public website’s GA4 property and a report covering Naples, Florida.</p>
          <a className={styles.action} href="#audience">See what we need ↓</a>
        </article>
        <article className={styles.sourceCard}>
          <span className={styles.badge}>Primary sources checked</span>
          <h2>The local facts</h2>
          <p><strong>Collier County · Naples area · Florida</strong><br />Geography stays attached to the source</p>
          <p>Property notices, housing activity and insurance documents provide the factual foundation. The cartoon premises below are our editorial ideas.</p>
          <a className={styles.action} href="#story-leads">Read the three leads ↓</a>
        </article>
      </section>

      <section id="story-leads" className={styles.leads} aria-labelledby="leads-heading">
        <div className={styles.sectionHeading}>
          <div><p className={styles.eyebrow}>For the next conversation</p><h2 id="leads-heading">Three leads to develop</h2></div>
          <p>Editorial shortlist · draft jokes · not approved cartoons</p>
        </div>
        {TOPIC_LEADS.map((lead, index) => (
          <article className={styles.lead} id={lead.id} key={lead.id}>
            <div className={styles.leadTitle}>
              <span className={styles.number}>{String(index + 1).padStart(2, "0")}</span>
              <div><h3>{lead.title}</h3><p>{lead.deck}</p></div>
            </div>
            <div className={styles.leadBody}>
              <div className={styles.evidence}>
                <p className={styles.label}>Search observation</p>
                <p className={styles.query}>“{lead.query}” <span className={styles.signal}>{lead.signal}</span></p>
                <p>{lead.trendContext}</p>
                <p className={styles.label}>Factual foothold</p>
                <p>{lead.localContext}</p>
                <a href={lead.sourceUrl} target="_blank" rel="noreferrer">{lead.sourceLabel} ↗</a>
                <small>{lead.sourcePeriod}</small>
              </div>
              <div className={styles.idea}>
                <p className={styles.label}>A possible scene</p>
                <p>{lead.premise}</p>
                <blockquote>“{lead.line}”</blockquote>
                <p className={styles.check}><strong>Before drawing:</strong> {lead.nextCheck}</p>
              </div>
            </div>
          </article>
        ))}
      </section>

      <section className={styles.notesGrid} aria-label="How to read this research">
        <article className={styles.note}>
          <p className={styles.eyebrow}>Read the signal carefully</p>
          <h2>Interest is a clue.</h2>
          <p>These percentages describe growth in related searches over the preceding comparison period. “Breakout” means growth above 5,000%; it can start from a small base. Neither is a count of Naples readers.</p>
          <p>Google Trends uses sampled, normalized data. A zero can reflect too little data. The broad metro includes more than Naples, and a 90-day rise does not establish that a subject is trending today.</p>
          <a href={RESEARCH_SOURCES[1].url} target="_blank" rel="noreferrer">Google’s explanation of rising searches ↗</a>
        </article>
        <article className={styles.note}>
          <p className={styles.eyebrow}>Editorial judgment</p>
          <h2>Some results need to be set aside.</h2>
          <p>“Retirement” brought back celebrity and sports retirement queries. “Stock market” included unrelated lifestyle phrases. Those results do not establish local interest in retirement finances or investing.</p>
          <p>All five starting terms were chosen by us. This is a focused comparison, not a claim that these are the region’s five most popular financial subjects.</p>
          <a href={TOPIC_RESEARCH.floridaUrl} target="_blank" rel="noreferrer">Compare the wider Florida context ↗</a>
        </article>
      </section>

      <section id="audience" className={styles.audience} aria-labelledby="audience-heading">
        <div><p className={styles.eyebrow}>The missing audience evidence</p><h2 id="audience-heading">Give Google Analytics a clear job.</h2></div>
        <p>Choose the public website whose readers we want to understand. A GA4 report can then show which pages those visitors actually read; it cannot tell us what all of Naples is searching for. Visits to this private studio would describe our own work, not the newspaper’s readership.</p>
        <ol>
          <li><strong>Identify the property.</strong> Confirm the website, the GA4 property and permission to read its reports.</li>
          <li><strong>Use an explicit local filter.</strong> Country: United States; region: Florida; city: Naples. Keep unknown locations and any broader regional view separate.</li>
          <li><strong>Compare complete periods.</strong> Start with the last 28 complete days and the previous 28. Record the property’s timezone, page paths, engaged sessions and relevant events.</li>
          <li><strong>Keep the limits visible.</strong> Exclude our own work where possible, retain threshold warnings, and describe small samples without claiming a winning topic.</li>
        </ol>
        <p className={styles.connectionNote}>No Google Analytics account, tracking code or reporting permission was created by this page. A verified report is still needed before audience numbers can be displayed.</p>
        <a className={styles.action} href="https://analytics.google.com/" target="_blank" rel="noreferrer">Open Google Analytics ↗</a>
      </section>

      <section className={styles.future} aria-labelledby="future-heading">
        <p className={styles.eyebrow}>The longer view</p>
        <h2 id="future-heading">A daily cartoon, with a human editor.</h2>
        <p>First, make the room and characters dependable. Then save dated local research, add actual audience feedback, and draft a few ideas for Rick to choose from. Automatic creation can come after that process consistently produces good work.</p>
        <p className={styles.pipeline}>Research <span>→</span> Choose the joke <span>→</span> Assemble the scene <span>→</span> Review <span>→</span> Newspaper proof</p>
      </section>

      <details className={styles.details}>
        <summary>Sources, dates and research record</summary>
        <dl>
          <div><dt>Observed</dt><dd>{TOPIC_RESEARCH.checkedLabel}</dd></div>
          <div><dt>Coverage</dt><dd>{TOPIC_RESEARCH.geography} ({TOPIC_RESEARCH.geo})</dd></div>
          <div><dt>Period shown</dt><dd>Past 90 days; chart labels June 3–September 3, 2026. The most recent day may be partial.</dd></div>
          <div><dt>Query settings</dt><dd>Web Search · All categories · search terms, not Google topic entities</dd></div>
          <div><dt>Refresh</dt><dd>This page preserves the observation date. Opening Google Trends shows a new rolling period; it does not update the saved snapshot here.</dd></div>
        </dl>
        <ul>{RESEARCH_SOURCES.map((source) => <li key={source.url}><a href={source.url} target="_blank" rel="noreferrer">{source.label} ↗</a></li>)}</ul>
        <a href="/topics/evidence" target="_blank" rel="noreferrer">Open the saved research record (JSON) ↗</a>
      </details>
    </main>
  );
}
