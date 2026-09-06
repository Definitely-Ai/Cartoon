/**
 * Editorial research, not an automatic topic-ranking service.
 * Google Trends values below were read from the visible Explore interface.
 * Keep collection time and geography attached to every saved observation.
 */
export const TOPIC_RESEARCH = {
  checkedAt: "2026-09-03T18:48:51Z",
  checkedLabel: "September 3, 2026 · 2:48 p.m. Eastern",
  geography: "Ft. Myers–Naples FL metro",
  geo: "US-FL-571",
  displayedPeriod: "Past 90 days",
  firstDisplayedDate: "2026-06-03",
  lastDisplayedDate: "2026-09-03",
  searchType: "Web Search",
  category: "All categories",
  terms: ["mortgage rates", "home insurance", "property tax", "retirement", "stock market"],
  sourceUrl: "https://trends.google.com/trends/explore?date=today%203-m&geo=US-FL-571&q=mortgage%20rates,home%20insurance,property%20tax,retirement,stock%20market",
  floridaUrl: "https://trends.google.com/trends/explore?date=today%203-m&geo=US-FL&q=mortgage%20rates,home%20insurance,property%20tax,retirement,stock%20market",
  method: "Manual observation of the Google Trends Explore page. Metro selected from Florida's visible metro breakdown; the resulting URL supplied the geography ID. This is a dated snapshot, not a live feed.",
  cityStatus: "The combined city breakdown had insufficient data. No Naples-city ranking was established.",
  analyticsStatus: "Signed-in Google Analytics was accessible on September 3, 2026. A property search for Cartoon returned no Analytics results. No relevant GA4 property was verified or connected to this research page, so website engagement and Naples visitor counts are unavailable here.",
} as const;

export type TopicLead = {
  id: string;
  title: string;
  deck: string;
  query: string;
  signal: string;
  trendContext: string;
  localContext: string;
  sourceLabel: string;
  sourceUrl: string;
  sourcePeriod: string;
  premise: string;
  line: string;
  nextCheck: string;
};

export const TOPIC_LEADS: TopicLead[] = [
  {
    id: "property-tax",
    title: "One house. Several values.",
    deck: "The property-tax notice arriving at the kitchen table.",
    query: "property tax exemption florida",
    signal: "+80%",
    trendContext: "Appeared among rising related queries for ‘property tax’ in the Ft. Myers–Naples metro comparison.",
    localContext: "Collier County’s TRIM guide separates market, assessed and taxable value, then explains proposed taxes and budget hearings. Those different numbers are a concrete local source of confusion worth exploring.",
    sourceLabel: "Collier County Property Appraiser · TRIM guide",
    sourceUrl: "https://www.collierappraiser.com/trim/understandtrim.html",
    sourcePeriod: "Official explanatory guide, checked September 3, 2026",
    premise: "Barclay holds a property notice up in one hand, leaving the bar clear of papers. Drew notices that one house now has several official values.",
    line: "I asked what the house was worth. They sent me three answers.",
    nextCheck: "Use a fictional notice. Verify any specific year, deadline or tax proposal before it appears in a finished panel.",
  },
  {
    id: "mortgage-rates",
    title: "The price and the payment.",
    deck: "House hunting with two very different numbers in mind.",
    query: "what are the current mortgage rates",
    signal: "Breakout",
    trendContext: "Appeared among rising related queries for ‘mortgage rates’ in the same metro and period.",
    localContext: "NABOR’s July 2026 overview recorded a $590,000 median closed price and 108 days on market. It supplies a Naples-area housing backdrop; it does not establish today’s mortgage rate or any individual buyer’s payment.",
    sourceLabel: "Naples Area Board of REALTORS® · market data",
    sourceUrl: "https://www.nabor.com/",
    sourcePeriod: "July 2026 market data, checked September 3, 2026",
    premise: "Barclay holds an attractive house listing where Drew can see it, leaving the bar clear of papers. Drew studies the monthly payment instead of the photograph.",
    line: "The house is within my budget. The mortgage has other plans.",
    nextCheck: "Keep any rate off the drawing until a current primary source is checked. The July housing report describes completed market activity, not a forecast.",
  },
  {
    id: "home-insurance",
    title: "Reading the small print.",
    deck: "What a home-insurance quote actually covers.",
    query: "home insurance quotes florida",
    signal: "+50%",
    trendContext: "Appeared among rising related queries for ‘home insurance’; ‘home insurance fort myers fl’ also appeared as Breakout. These are metro observations, not Naples-city counts.",
    localContext: "Florida’s insurance regulator provides public policy-form and rate filings. A quote’s price and its coverage are separate details to inspect; this research does not claim that every local premium is rising or falling.",
    sourceLabel: "Florida Office of Insurance Regulation · forms and rates",
    sourceUrl: "https://irfssearch.floir.gov/",
    sourcePeriod: "Official filing search, checked September 3, 2026",
    premise: "Barclay holds a thick insurance policy in both hands, clear of the bar, while Drew waits for him to reach the exclusions.",
    line: "The premium fits on one line. The exceptions needed a second volume.",
    nextCheck: "Check a specific approved filing before naming an insurer or quoting a rate change. Avoid treating a search spike as evidence about insurance prices.",
  },
];

export const RESEARCH_SOURCES = [
  { label: "How Google Trends normalizes search interest", url: "https://support.google.com/trends/answer/4365533?hl=en" },
  { label: "What rising queries and Breakout mean", url: "https://support.google.com/trends/answer/4355000?hl=en" },
  { label: "Google Analytics geographic dimensions", url: "https://developers.google.com/analytics/devguides/reporting/data/v1/api-schema" },
  { label: "Google Analytics data thresholds", url: "https://support.google.com/analytics/answer/9383630?hl=en" },
] as const;
