// Public RSS discovery only. User input never becomes a fetch host or path.
// Headlines are leads, not full-article evidence or a measured popularity trend.
export function localNewsURL(place) {
  const clean = value => {
    if (typeof value !== 'string' || value.length > 80 || !/^[\p{L}\p{M} .'-]{2,80}$/u.test(value)) throw Error('Use a city and state name, without search operators.');
    return value.trim();
  };
  const url = new URL('https://news.google.com/rss/search');
  url.search = new URLSearchParams({q:`"${clean(place.name)}" "${clean(place.region)}" (housing OR economy OR business OR prices OR tourism) when:60d`,hl:'en-US',gl:'US',ceid:'US:en'}).toString();
  return url.href;
}
const text = value => String(value).replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,'$1').replace(/<[^>]+>/g,' ').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/\s+/g,' ').trim();
export function parseLocalNews(xml, place, now = Date.now()) {
  const matches = [...xml.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)], rows=[];
  for (const [,item] of matches.slice(0,60)) {
    const tag = name => text(item.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)<\\/${name}>`,'i'))?.[1] || '');
    const title=tag('title'), publishedAt=Date.parse(tag('pubDate')), link=tag('link'), publisher=tag('source');
    if (!title.toLowerCase().includes(place.name.toLowerCase()) || title.length<30 || title.length>300 || !Number.isFinite(publishedAt) || now-publishedAt>60*86400000 || publishedAt>now+86400000) continue;
    if (!/(hous|home|rent|mortgage|business|econom|price|touris|hotel|tax|cost|retail|market)/i.test(title) || /\b(kill|murder|death|arrest|tragedy|shooting)\b/i.test(title)) continue;
    let url;try {url=new URL(link);} catch {continue;}
    if(url.protocol!=='https:' || url.hostname!=='news.google.com' || !url.pathname.startsWith('/rss/articles/') || url.username || url.password) continue;
    if(rows.some(row=>row.title===title))continue;
    rows.push({url:url.href,title,publishedAt:new Date(publishedAt).toISOString(),publisher:publisher || 'Publisher identified in linked news item',text:title,
      scope:`Dated headline discovery for ${place.name}, ${place.region}. Headline only; full article NOT retrieved. Use only the literal subject as a comedy prompt. No statistics, causal claims, neighborhood claims, allegations or measured trends. Do not imply all residents share an experience. Regional reporting is not city-only measurement.`,
      discovery:'Public Google News RSS index; limited headline evidence, not independently verified full article'});
  }
  return rows.slice(0,8);
}
