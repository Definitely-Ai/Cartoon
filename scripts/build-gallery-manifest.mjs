import fs from "node:fs";
import path from "node:path";

const repoRoot = "C:\\Users\\admin\\Projects\\Cartoons\\Cartoon";
const galleryDir = path.join(repoRoot, "public", "gallery");
const manifestPath = path.join(galleryDir, "manifest.json");
const libManifestPath = path.join(repoRoot, "lib", "gallery-manifest.json");
const origFinalDir = "C:\\Users\\admin\\Projects\\Cartoons\\final";

const items = [];

function formatTime(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function getMtime(subPath, fallback) {
  const origPath = path.join(origFinalDir, subPath);
  if (fs.existsSync(origPath)) {
    return fs.statSync(origPath).mtime.toISOString();
  }
  const localPath = path.join(galleryDir, "final", subPath);
  if (fs.existsSync(localPath)) {
    return fs.statSync(localPath).mtime.toISOString();
  }
  return fallback;
}

const finalDir = path.join(galleryDir, "final");
const visionDir = path.join(galleryDir, "vision");

// 1. MASTER PRODUCTION BASES
if (fs.existsSync(path.join(finalDir, "BASE-A.jpg"))) {
  const mtime = getMtime("BASE-A.jpg", "2026-09-01T20:20:14.000Z");
  items.push({
    id: "final-base-a",
    title: "Master Production Plate: The Barroom Interior (Set A)",
    category: "final",
    src: "/gallery/final/BASE-A.jpg",
    caption: "The canonical full-room staging: dead-level marble slab, Abby polishing glassware, Drew and Barclay in conversation.",
    tv: "CNBC LIVE · MARKETS AT A GLANCE",
    tvPicture: "Live financial news feed with ticker strip across the lower third.",
    board: "THE SWINGING DOOR · EST. 1898",
    before: "Previous scene runs suffered from an uneven, stepped marble counter on Drew's left side; the camera was pitched at an awkward downward angle; Abby was erroneously rendered pouring liquid into full glasses.",
    changes: "Squared the camera completely flat to the counter; locked both near and far counter edges into a single dead-level horizontal plane from window to wall; Abby established with clean bar towel polishing glassware with a natural smile; drinks already served on coasters.",
    prompt: "A single-panel gag cartoon drawn like an antique steel engraving with fine pen crosshatching and stippling. Inside The Swinging Door: polished marble bar top, fine walnut-paneled walls, leather club chairs. The bar counter is ONE continuous horizontal slab at chest height. Drew the flamingo and Barclay the golden retriever sit at the bar. Abby the Westie bartender stands behind the counter smiling and wiping a glass with a clean towel. No drink pouring. Black and white only.",
    timestamp: mtime,
    formattedTime: formatTime(mtime),
  });
}

if (fs.existsSync(path.join(finalDir, "BASE-B.jpg"))) {
  const mtime = getMtime("BASE-B.jpg", "2026-09-01T20:15:00.000Z");
  items.push({
    id: "final-base-b",
    title: "Master Production Plate: The Barroom Interior (Set B)",
    category: "final",
    src: "/gallery/final/BASE-B.jpg",
    caption: "The canonical two-patron bar staging: Drew and Barclay side-by-side with level continuous marble slab and centered television.",
    tv: "CNBC LIVE · MARKET CLOSE WRAP",
    tvPicture: "The New York Stock Exchange trading floor with brokers watching the closing bell.",
    board: "THE SWINGING DOOR · SPECIALS PRICED DAILY",
    before: "Earlier two-patron bar plates had receding perspective lines where the marble dipped toward the window wall, creating an optical illusion that Drew was sliding down the bar.",
    changes: "Enforced a single continuous 42-inch high marble counter across the entire frame; eliminated floor/stools/legs; centered the CNBC television display and right-aligned the chalkboard menu in its wooden frame.",
    prompt: "Antique steel engraving of The Swinging Door. Drew the flamingo in dark gray suit and Barclay the golden retriever in navy blazer seated at the marble bar. Camera square to counter, showing a single continuous level slab. Television screen centered above high back-bar bottle shelves. Chalkboard in wooden frame on right. No floor or stools visible.",
    timestamp: mtime,
    formattedTime: formatTime(mtime),
  });
}

// 2. CURATED FINAL EDITIONS (A01 - A10)
const aEditions = [
  {
    num: "A01",
    title: "Edition A01: Time Served on Rate Cuts",
    speaker: "BARCLAY",
    caption: "I don't mind a rate hike. I'd just like two years of waiting for a cut counted as time served.",
    tv: "MARKETS NOW PRICE RATE HIKES, NOT CUTS",
    tvPicture: "A row of empty chairs in a waiting room under a plain wall clock.",
    board: "EASING $9 - DISCONTINUED 2024 / TIGHTENING - MARKET PRICE / NO SUBSTITUTIONS",
    action: "Barclay, resigned but pleasant, turns his old fashioned a quarter-turn on its coaster; Drew, amused, lifts his martini an inch in salute to the request.",
    before: "Previous revisions had the bar edge sloping downward behind Barclay, and earlier gags leaned heavily on alcohol pricing.",
    changes: "Shifted the punchline to pure Federal Reserve monetary policy satire; leveled the marble counterline; synchronized the CNBC waiting room graphic with the 'discontinued easing' chalkboard menu.",
    prompt: "Antique steel engraving. Drew the flamingo and Barclay the golden retriever at the marble bar. Barclay turns his glass on a coaster, resigned but pleasant. In background, flatscreen TV shows 'MARKETS NOW PRICE RATE HIKES, NOT CUTS' with empty waiting room chairs. Chalkboard on right reads 'EASING $9 - DISCONTINUED 2024 / TIGHTENING - MARKET PRICE'. Counter is dead level edge-to-edge.",
  },
  {
    num: "A02",
    title: "Edition A02: Nvidia Nostalgia",
    speaker: "DREW",
    caption: "There's something nostalgic about watching Nvidia do to semiconductors what Cisco did to routers.",
    tv: "CHIP RALLY EXTENDS INTO 18TH CONSECUTIVE MONTH",
    tvPicture: "A vintage 1999 Cisco Systems router on a glass pedestal in an auction room.",
    board: "1999 VINTAGE - 100X MULTIPLES / CISCO METHOD / STILL COOLING",
    action: "Drew, wistful for exactly one second, tilts his martini toward the screen; Barclay, amused, watches the ticker.",
    before: "Flamingo head anatomy in early runs often came back with an oversized cartoon beak and missing eye lids; tech gags lacked historical finance depth.",
    changes: "Drew's anatomy restored to Harrington's refined flamingo standard (long S-curve neck, small head, heavy cynical lid); gag connects 2024 Nvidia mania to the 1999 Cisco bubble; perfectly level bar counter.",
    prompt: "Steel engraving comic panel. Drew the flamingo in dark suit tilts his martini toward the TV. Barclay beside him smiles. TV chyron reads 'CHIP RALLY EXTENDS INTO 18TH CONSECUTIVE MONTH' with picture of a 1999 router on an auction pedestal. Chalkboard lists '1999 VINTAGE - 100X MULTIPLES'. Continuous level marble bar.",
  },
  {
    num: "A03",
    title: "Edition A03: The Dow on the First",
    speaker: "DREW",
    caption: "The Dow did its whole September on the first, so the rest of the month is just admin.",
    tv: "DOW FALLS 600 POINTS ON SEPTEMBER'S OPENING SESSION",
    tvPicture: "An empty trading desk after the bell with a single red paper cup left on the keyboard.",
    board: "SEPTEMBER SEASONALITY / FULL MONTH DAMAGE IN 6.5 HOURS / NO EXTENSIONS",
    action: "Drew, serene, folds his napkin and lays it beside his martini; Barclay, rueful, watches the ticker.",
    before: "Bar line dipped behind Drew; napkins and glasses were cluttered across the marble; Abby's hand was awkwardly hovering over the glass.",
    changes: "Squared bar line edge-to-edge; Drew neatly folds his napkin beside his martini; TV screen depicts post-bell trading floor aftermath; clean Wall Street seasonality satire.",
    prompt: "Antique steel engraving panel. Drew folds his napkin beside his martini glass with serene composure. Barclay looks at the television screen showing 'DOW FALLS 600 POINTS ON SEPTEMBER'S OPENING SESSION'. Chalkboard reads 'SEPTEMBER SEASONALITY / FULL MONTH DAMAGE IN 6.5 HOURS'. Dead-level counter.",
  },
  {
    num: "A04",
    title: "Edition A04: The Semiconductor Concentration",
    speaker: "BARCLAY",
    caption: "I own Nvidia, Broadcom and Marvell, so this is the index having words with itself.",
    tv: "THREE CHIPMAKERS NOW CONSTITUTE 41% OF TECH BENCHMARK",
    tvPicture: "Three neckties on hangers against an otherwise empty corporate wardrobe.",
    board: "CONCENTRATION RISK / $24 / NO DIVERSIFICATION / ALL EGGS, SAME SILICON",
    action: "Barclay, rueful, taps the edge of his coaster like a card player looking at an unhelpful draw; Drew listens deadpan.",
    before: "Broadcom and semiconductor jokes originally had generic tech jargon with hallucinatory fake logos on background bottles.",
    changes: "Stripped all micro-text from back-bar bottles (plain label law); grounded Barclay's portfolio joke in real index concentration statistics; aligned counter edge.",
    prompt: "Antique steel engraving. Barclay the golden retriever in navy blazer taps his drink coaster ruefully. Drew the flamingo listens impassively. Flatscreen TV above back bar displays 'THREE CHIPMAKERS NOW CONSTITUTE 41% OF TECH BENCHMARK'. Chalkboard reads 'CONCENTRATION RISK / $24'. Perfect horizontal marble slab.",
  },
  {
    num: "A05",
    title: "Edition A05: Oil at Ninety-Five",
    speaker: "BARCLAY",
    caption: "Oil went through ninety-five this morning, and I'm long three miles of pipeline in Oklahoma.",
    tv: "BRENT CRUDE SURPASSES $95 ON SUPPLY CURTAILMENTS",
    tvPicture: "A lone pumpjack silhouetted against a dusty prairie sunset.",
    board: "PERMIAN SOUR / PIPELINE FEE $4 / SURCHARGE ON SURCHARGE $6",
    action: "Barclay, quietly pleased, pats the jacket pocket where his contract confirmations live; Drew watches the screen.",
    before: "Abby was drawn pouring a beverage into Barclay's glass; the bar marble had an elevation break at the center tap tower.",
    changes: "Abby reframed polishing a clean rocks glass; removed all pouring actions; Barclay quietly satisfied with his midstream energy position; continuous level counter.",
    prompt: "Steel engraving cartoon. Barclay pats his jacket pocket with quiet satisfaction. TV screen behind bar shows a pumpjack silhouette with chyron 'BRENT CRUDE SURPASSES $95 ON SUPPLY CURTAILMENTS'. Chalkboard lists Permian pipeline fees. Abby smiles polishing a glass in background. No pouring. Flat marble bar.",
  },
  {
    num: "A06",
    title: "Edition A06: September Seasonality",
    speaker: "BARCLAY",
    caption: "We all complain September is the worst month and then we short everything right into the turn.",
    tv: "HISTORICAL DATA SHOWS SEPTEMBER NEGATIVE IN 7 OF LAST 10 YEARS",
    tvPicture: "A Wall Street bull statue with an autumn leaf stuck to its bronze horn.",
    board: "SEASONAL SPECIAL / BAD MONTH - 100 YR TRACK RECORD / CANNOT BE CANCELLED",
    action: "Barclay, earnest and a little rueful, turns his glass; Drew, impassive, contemplates his olive.",
    before: "The left window frame in previous iterations had street-level pavement and pedestrians visible, violating the elevated bar-height window rule.",
    changes: "Window corrected to show only upper building facades and glass-and-steel architecture; bar top runs dead-level; Barclay's dialogue captures perennial hedge fund frustration.",
    prompt: "Antique engraving of Barclay and Drew at the bar. Barclay speaks earnestly. TV shows Wall Street bronze bull with autumn leaf on horn: 'HISTORICAL DATA SHOWS SEPTEMBER NEGATIVE IN 7 OF LAST 10 YEARS'. Chalkboard reads 'SEASONAL SPECIAL / BAD MONTH'. High modern window shows upper building facades only. Level marble.",
  },
  {
    num: "A07",
    title: "Edition A07: Energy Independence",
    speaker: "DREW",
    caption: "Energy independence remains ours in the ground and theirs at the pump.",
    tv: "DOMESTIC PRODUCTION HITS RECORD AS RETAIL GAS REACHES YEARLY HIGH",
    tvPicture: "A refinery flare stack burning against an overcast industrial sky.",
    board: "PRODUCED HERE $3.50 / SOLD HERE $5.80 / SPREAD TO MIDDLEMEN",
    action: "Drew, deadpan, bill slightly parted, turns his martini a quarter-turn without looking at it.",
    before: "Early drafts had Drew looking directly into the camera lens, breaking the house rule forbidding fourth-wall breaks.",
    changes: "Drew's gaze redirected into the room to the middle distance; deadpan delivery; zero-pour bartender stance; TV refinery footage logically tied to gas pump spread joke.",
    prompt: "Steel engraving gag cartoon. Drew the flamingo speaks deadpan to the middle distance, turning his martini glass. TV displays refinery flare stack: 'DOMESTIC PRODUCTION HITS RECORD AS RETAIL GAS REACHES YEARLY HIGH'. Chalkboard lists production vs retail spread. Level bar counter.",
  },
  {
    num: "A08",
    title: "Edition A08: Bank Stress Tests",
    speaker: "DREW",
    caption: "Bank of America is stressing a key level, which is a polite way of saying no one wants the bonds.",
    tv: "FINANCIAL SECTOR LEADS DECLINES ON DURATION CONCERNS",
    tvPicture: "An empty boardroom table with eight leather chairs pushed neatly in.",
    board: "TIER 1 COMMON CAPITAL / LIQUIDITY COVERAGE RATIO / ALL OUT OF SPREAD",
    action: "Drew, deadpan, bill slightly parted, lowers his martini onto its coaster; Barclay listens with sympathetic gravity.",
    before: "Early versions featured random chalk scribbles that looked like fake equations; counter dipped on the left.",
    changes: "Chalkboard formatted with crisp financial terminology; level bar slab; Drew lowers his martini cleanly onto the coaster without spilling.",
    prompt: "Antique steel engraving. Drew lowers his martini onto coaster calmly. Barclay listens. TV shows empty boardroom: 'FINANCIAL SECTOR LEADS DECLINES ON DURATION CONCERNS'. Chalkboard reads 'TIER 1 COMMON CAPITAL / LIQUIDITY COVERAGE RATIO'. Sharp level counterline.",
  },
  {
    num: "A09",
    title: "Edition A09: Paused in Concept, Rising in Operations",
    speaker: "DREW",
    caption: "Rates remain paused in concept, rising in operations.",
    tv: "FED HOLDS BENCHMARK WHILE TEN-YEAR YIELD TOUCHES CYCLE PEAK",
    tvPicture: "A podium with three microphone goosenecks and no speaker present.",
    board: "PAUSED - 0 BPS / EFFECTIVE RATE - WHATEVER IT COSTS TO CLEAR",
    action: "Drew states it to the middle distance, martini balanced on his coaster; Barclay absorbs the distinction.",
    before: "Earlier drafts attempted humor around bar tabs; counter had a double step.",
    changes: "Elevated the satire to central bank rhetoric ('paused in concept, rising in operations'); TV graphic shows empty Fed press conference podium; bar counter fully continuous.",
    prompt: "Steel engraving cartoon. Drew delivers line to middle distance. Television shows empty podium with microphones: 'FED HOLDS BENCHMARK WHILE TEN-YEAR YIELD TOUCHES CYCLE PEAK'. Chalkboard reads 'PAUSED - 0 BPS / EFFECTIVE RATE - WHATEVER IT COSTS TO CLEAR'. Clean continuous marble.",
  },
  {
    num: "A10",
    title: "Edition A10: The Dow's September Loss",
    speaker: "DREW",
    caption: "The Dow lost eight-tenths today, its September average in a single lunch hour.",
    tv: "MARKET WRAP: EQUITIES RETREAT ACROSS BROAD BASKET",
    tvPicture: "A Bloomberg terminal monitor glowing in an otherwise dark cubicle.",
    board: "EARLY CLOSING SPECIAL / MARGIN CALL AT 3 PM / BRING CHECKS",
    action: "Drew, deadpan, bill slightly parted, tips his martini a quarter-inch in philosophical resignation; Barclay agrees.",
    before: "Bar surface showed reflections of nonexistent people; Abby was pouring from a mixing shaker.",
    changes: "Removed all pouring; reflections cleaned to only show bottles and chandelier lights; Drew tips his martini a quarter-inch in philosophical resignation.",
    prompt: "Antique steel engraving. Drew tips his martini glass slightly in philosophical resignation. Barclay nods. TV screen shows glowing terminal monitor: 'MARKET WRAP: EQUITIES RETREAT ACROSS BROAD BASKET'. Chalkboard: 'EARLY CLOSING SPECIAL / MARGIN CALL AT 3 PM'. Flat marble counter.",
  },
];

for (const ed of aEditions) {
  const file = path.join(finalDir, `${ed.num}-preview.jpg`);
  if (fs.existsSync(file)) {
    const mtime = getMtime(`${ed.num}-preview.jpg`, `2026-09-01T20:05:00.000Z`);
    items.push({
      id: `final-${ed.num}`,
      title: ed.title,
      category: "final",
      src: `/gallery/final/${ed.num}-preview.jpg`,
      caption: `${ed.speaker}: "${ed.caption}"`,
      tv: ed.tv,
      tvPicture: ed.tvPicture,
      board: ed.board,
      action: ed.action,
      before: ed.before,
      changes: ed.changes,
      prompt: ed.prompt,
      timestamp: mtime,
      formattedTime: formatTime(mtime),
    });
  }
}

// 3. CURATED FINAL EDITIONS (B01, B03, B05, B07, B08, B09)
const bEditions = [
  {
    num: "B01",
    title: "Edition B01: Shorting the Only Winner",
    speaker: "BARCLAY",
    caption: "Energy was today's only winner, and I'm short it till Tuesday.",
    tv: "XLE SECTOR FUND UP 2.4% AGAINST BROAD MARKET ROUT",
    tvPicture: "An oil tanker at anchor in calm gray water, no movement.",
    board: "ENERGY LONG ONLY / EVERYTHING ELSE OFF / TABLE SERVICE MANDATORY",
    action: "Barclay, earnest and resigned, swirls the ice in his glass; Drew listens with calm understanding.",
    before: "Counter line sloped down 3 inches on the left; Barclay's tail was drawn coming through the bar stool.",
    changes: "Cropped cleanly at mid-chest (no stool legs, no tail glitches); dead-level counter; classic contrarian short-seller humor.",
    prompt: "Antique steel engraving. Barclay the golden retriever in navy blazer swirls ice in his rocks glass, earnest and resigned. Drew the flamingo listens. TV shows oil tanker at anchor: 'XLE SECTOR FUND UP 2.4% AGAINST BROAD MARKET ROUT'. Chalkboard: 'ENERGY LONG ONLY'. Continuous level bar.",
  },
  {
    num: "B03",
    title: "Edition B03: Buying the Dip",
    speaker: "BARCLAY",
    caption: "I'm not chasing this dip, Drew. I only bought the last five.",
    tv: "S&P 500 TESTS 200-DAY MOVING AVERAGE FOR SIXTH TIME",
    tvPicture: "A stock chart line dropping through three successive red dotted support lines.",
    board: "FALLING KNIVES $12 / CATCH AT OWN RISK / NO REFUNDS ON DRIFT",
    action: "Barclay, sincere, lifts his glass as if toasting his own restraint; Drew deadpan beside him.",
    before: "Previous versions had drink glasses overlapping the character's clothing and an uneven marble seam.",
    changes: "Glasses set firmly on individual bar coasters on the marble slab; Barclay's earnest expression calibrated to capture the exhausted dip-buyer.",
    prompt: "Steel engraving comic panel. Barclay lifts his rocks glass with sincere self-deprecation. Drew listens deadpan. Flatscreen TV shows stock chart breaking support: 'S&P 500 TESTS 200-DAY MOVING AVERAGE FOR SIXTH TIME'. Chalkboard: 'FALLING KNIVES $12 / CATCH AT OWN RISK'. Dead-level counter.",
  },
  {
    num: "B05",
    title: "Edition B05: AI Infrastructure & Data Center Lunch",
    speaker: "BARCLAY",
    caption: "I bought AI infrastructure for the future. Today I bought lunch for the data center.",
    tv: "UTILITY SHARES SURGE AS TECH FIRMS CONTRACT POWER OUTPUT",
    tvPicture: "A sprawling modern data center complex with high-voltage electrical substations.",
    board: "MEGAWATT HOURS / $185 / SURCHARGE ON PEAK AIR CONDITIONING",
    action: "Barclay, hopeful, cradles his glass in both hands; Drew contemplates the power bill.",
    before: "Early iterations featured robotic sci-fi elements in the bar room, violating the 19th-hole traditional decor canon.",
    changes: "Kept the bar strictly timeless and upscale (walnut, marble, brass); placed the AI/power grid satire on the TV screen and chalkboard.",
    prompt: "Antique engraving. Barclay cradles his glass thoughtfully. TV screen displays high-voltage electrical substations: 'UTILITY SHARES SURGE AS TECH FIRMS CONTRACT POWER OUTPUT'. Chalkboard reads 'MEGAWATT HOURS / $185'. Drew beside him in dark suit. Level marble counter.",
  },
  {
    num: "B07",
    title: "Edition B07: Five Percent Mortgage",
    speaker: "BARCLAY",
    caption: "I'm holding out for a five percent mortgage. We closed at eight.",
    tv: "30-YEAR FIXED MORTGAGE RATE STUBBORNLY STALLS NEAR 7.8%",
    tvPicture: "A residential suburban home with a 'FOR SALE' yard sign.",
    board: "REFINANCE COCKTAIL / WAIT 3 YEARS / ASSUMABLE DEBT ONLY",
    action: "Barclay, upbeat, raises his glass as if announcing good news; Drew listens deadpan.",
    before: "Camera was tilted diagonally; glasses were floating above the bar.",
    changes: "Snapped camera square to the counter; locked all glasses to the flat counter surface; relatable real-estate financing gag.",
    prompt: "Steel engraving gag cartoon. Barclay raises his glass with upbeat resignation. Drew looks on impassively. TV displays suburban home: '30-YEAR FIXED MORTGAGE RATE STUBBORNLY STALLS NEAR 7.8%'. Chalkboard: 'REFINANCE COCKTAIL / WAIT 3 YEARS'. Flat marble slab.",
  },
  {
    num: "B08",
    title: "Edition B08: Central Bank Forward Guidance",
    speaker: "DREW",
    caption: "The Fed remains on hold in concept, tightening in operations.",
    tv: "YIELD CURVE INVERSION PERSISTS DESPITE PAUSE RHETORIC",
    tvPicture: "Federal Reserve building exterior pillars in late afternoon shadow.",
    board: "FORWARD GUIDANCE / PRICED AS GIVEN / SUBJECT TO TWEET RISK",
    action: "Drew, deadpan, holds his martini perfectly still; Barclay, upbeat, listens attentively.",
    before: "Drew's beak was drawn open in a smile, out of character for his sardonic deadpan personality.",
    changes: "Drew's bill slightly parted, completely impassive; martini held steady; macro yield curve satire.",
    prompt: "Antique steel engraving. Drew the flamingo holds his martini glass motionless, speaking deadpan. Barclay listens beside him. TV displays Federal Reserve building pillars: 'YIELD CURVE INVERSION PERSISTS DESPITE PAUSE RHETORIC'. Chalkboard: 'FORWARD GUIDANCE / PRICED AS GIVEN'. Dead-level marble.",
  },
  {
    num: "B09",
    title: "Edition B09: Taiwan Semiconductor Tariff",
    speaker: "DREW",
    caption: "Our tariff on Taiwan works out to a cover charge at the semiconductor bar.",
    tv: "NEW BILATERAL TRADE PROPOSALS INCLUDE WAFER IMPORT LEVIES",
    tvPicture: "A robotic silicon wafer manufacturing cleanroom with yellow lighting.",
    board: "FAB CAPACITY $10,000 / TARIFF 15% / PASSED THROUGH TO PHONE BILL",
    action: "Drew, bill parted, delivers it to his martini without looking at Barclay; Barclay watches the wafer footage.",
    before: "Early version had the TV chyron repeating fake Latin filler text; bar was stepped.",
    changes: "TV chyron and chalkboard updated with authentic semiconductor supply chain economics; dead-level bar counter.",
    prompt: "Steel engraving comic panel. Drew delivers line deadpan toward his drink. Barclay looks up at TV showing silicon wafer cleanroom: 'NEW BILATERAL TRADE PROPOSALS INCLUDE WAFER IMPORT LEVIES'. Chalkboard: 'FAB CAPACITY $10,000 / TARIFF 15%'. Perfect level marble bar.",
  },
];

for (const ed of bEditions) {
  const file = path.join(finalDir, `${ed.num}-preview.jpg`);
  if (fs.existsSync(file)) {
    const mtime = getMtime(`${ed.num}-preview.jpg`, `2026-09-01T20:12:00.000Z`);
    items.push({
      id: `final-${ed.num}`,
      title: ed.title,
      category: "final",
      src: `/gallery/final/${ed.num}-preview.jpg`,
      caption: `${ed.speaker}: "${ed.caption}"`,
      tv: ed.tv,
      tvPicture: ed.tvPicture,
      board: ed.board,
      action: ed.action,
      before: ed.before,
      changes: ed.changes,
      prompt: ed.prompt,
      timestamp: mtime,
      formattedTime: formatTime(mtime),
    });
  }
}

// 4. MASTER REFERENCE PLATES & CHARACTER STUDIES
const masterPlates = [
  {
    file: "staging-plate.jpg",
    title: "Canon Master Reference: Dead-Level Bar Staging",
    date: "2026-09-01T20:31:00.000Z",
    caption: "The official master staging plate defining the level marble slab, centered 16:9 television, high bottle shelves, and square camera angle.",
    before: "Early batches had no master plate: each drawing generated a random camera pitch, varying bar heights, and stepped counter corners.",
    changes: "Created this single authoritative geometry reference: 42-inch chest-high counter running dead-level from the street window at left to the brass tap tower at right.",
    prompt: "An antique steel engraving master set plate of The Swinging Door interior with no characters. A continuous level marble counter spans the entire foreground. Centered flatscreen TV above high walnut bottle shelves. Chalkboard on right in dark wooden frame. Window on left showing upper city architecture.",
  },
  {
    file: "drew-plate1-bar-reference.jpg",
    title: "Character Study: Drew the Flamingo",
    date: "2026-08-31T18:00:00.000Z",
    caption: "Definitive Drew model: elegant flamingo anatomy, long S-curve neck, small refined head, deadpan heavy lid, tailored dark gray two-button suit.",
    before: "Previous rendering attempts made Drew look like a rubbery cartoon mascot with exaggerated eyes and neon pink coloring.",
    changes: "Anchored Drew in Victorian steel-engraving crosshatching; fine feathered textures; restrained posture; dry cynical Wall Street personality.",
    prompt: "Steel engraving character reference portrait of Drew the flamingo. Tailored charcoal suit, crisp white shirt, dark necktie. Long elegant S-curve neck, small head, heavy cynical eyelid. Fine pen crosshatching and stippling.",
  },
  {
    file: "barclay-reference.jpg",
    title: "Character Study: Barclay the Golden Retriever",
    date: "2026-08-31T18:00:00.000Z",
    caption: "Definitive Barclay model: golden retriever anatomy, soft earnest eyes, drop ears, closed-lip polite smile, traditional navy blazer.",
    before: "Barclay was frequently drawn with an open panting dog mouth or canine snout distortions that ruined his gentlemanly composure.",
    changes: "Established closed mouth, refined muzzle, flag pin on lapel, earnest country-club expression, tailored navy wool blazer.",
    prompt: "Steel engraving character study of Barclay the golden retriever. Tailored navy blazer, gold buttons, small American flag lapel pin. Soft warm eyes, drop ears, polite closed-lip smile. Crosshatched fur texture.",
  },
  {
    file: "abby-reference.jpg",
    title: "Character Study: Abby the Proprietor",
    date: "2026-08-31T18:00:00.000Z",
    caption: "Definitive Abby model: West Highland White Terrier proprietor, round groomed show head, warm knowing smile, green bartender apron, white bar towel.",
    before: "Abby was mistakenly depicted pouring drinks into customers' glasses, violating the bar workflow canon.",
    changes: "Locked Abby into her canonical role: proprietor holding a clean towel, polishing glassware or leaning pleasantly on the back bar; never pouring into full drinks.",
    prompt: "Steel engraving character reference of Abby the West Highland White Terrier bartender. Round groomed white coat, erect triangular ears, dark button nose, warm knowing smile. Clean bartender apron, holding white bar towel. Black and white ink.",
  },
  {
    file: "plate-1-security-and-martini-menu.jpg",
    title: "Harrington Plate 1: The Security Line",
    date: "2026-08-25T12:00:00.000Z",
    caption: "Foundational Harrington vision plate establishing the steel-engraving crosshatching standard and airport security/fare class humor.",
    before: "Initial concept art was digital vector art that felt like standard web cartoons without print heritage.",
    changes: "Commissioned the Harrington pen-and-ink steel engraving style that gives The Swinging Door its distinctive Wall Street journal editorial feel.",
    prompt: "Pen-and-ink steel engraving in the style of 19th-century newspaper illustration. Gentlemen at airport security. Fine crosshatching, silvery gray midtones, crisp paper highlights.",
  },
  {
    file: "plate-2-debt-ceiling-and-retirement.jpg",
    title: "Harrington Plate 2: Debt Ceiling Week",
    date: "2026-08-26T12:00:00.000Z",
    caption: "Foundational Harrington plate exploring Capitol Hill fiscal theater: 'Debt Ceiling Week, 16th annual · Retirement planning, live.'",
    before: "Political humor risked becoming partisan or hyperbolic.",
    changes: "Calibrated the comedy to institutional Wall Street cynicism: treating recurring debt ceiling crises as seasonal television programming.",
    prompt: "Historical newspaper engraving illustration. Congressional hearing room and retirement seminar satire. Rich hatched textures.",
  },
  {
    file: "plate-3-national-mall.jpg",
    title: "Harrington Plate 3: The National Mall",
    date: "2026-08-27T12:00:00.000Z",
    caption: "Harrington architectural study: 'The republic remains blue in concept, green in operations.'",
    before: "Outdoor scenes lacked the architectural weight of classic editorial cartoons.",
    changes: "Established rigorous classical perspective and crosshatching across monuments and public plazas.",
    prompt: "Steel engraving of National Mall architecture with neoclassical monuments in fine crosshatched detail.",
  },
  {
    file: "plate-4-nineteenth-hole-and-tariffs.jpg",
    title: "Harrington Plate 4: The 19th Hole",
    date: "2026-08-28T12:00:00.000Z",
    caption: "Harrington plate: 'The 19th hole · Patriotic imported beer · The globe, priced.'",
    before: "Clubhouse humor had drifted into generic sports jokes.",
    changes: "Re-centered on the nineteenth-hole bar atmosphere where trade tariffs, golf scores, and global markets are debated over drinks.",
    prompt: "Antique steel engraving of gentlemen at an upscale golf clubhouse bar discussing trade policy. Fine crosshatching and wood panelling.",
  },
  {
    file: "the-cast.jpg",
    title: "Ensemble Study: The Complete Cast",
    date: "2026-08-29T12:00:00.000Z",
    caption: "Studio portrait bringing Drew, Barclay, and Abby together to calibrate relative heights, head sizes, and tailoring.",
    before: "Characters were drawn in isolation with inconsistent relative scale (Barclay was sometimes larger than Drew, or Abby too small).",
    changes: "Fixed character proportions: Drew stands tallest with his long neck; Barclay sits solid and broad-shouldered; Abby stands behind the bar counter at eye level.",
    prompt: "Ensemble steel engraving portrait of Drew the flamingo in suit, Barclay the golden retriever in blazer, and Abby the Westie in apron. Accurate relative proportions.",
  },
  {
    file: "tv-reference.jpg",
    title: "Set Geometry: Television Containment & Shelving",
    date: "2026-08-29T14:00:00.000Z",
    caption: "Set design reference fixing the exact proportions of the wall-mounted flatscreen television, bottle risers, and wood panelling.",
    before: "TV screen was frequently drawn floating without mountings, or warped as a curved tube TV.",
    changes: "Standardized modern thin-bezel flatscreen TV integrated into the walnut wall panelling at eye level above the bottles.",
    prompt: "Architectural detail of bar back wall: modern flatscreen TV mounted securely on walnut panelling above high bottle shelves. Crosshatch engraving.",
  }
];

for (const p of masterPlates) {
  if (fs.existsSync(path.join(visionDir, p.file))) {
    items.push({
      id: `master-${p.file.replace(/\.[^.]+$/, "")}`,
      title: p.title,
      category: "master",
      src: `/gallery/vision/${p.file}`,
      caption: p.caption,
      before: p.before,
      changes: p.changes,
      prompt: p.prompt,
      timestamp: p.date,
      formattedTime: formatTime(p.date),
    });
  }
}

// 5. SORT STRICTLY BY TIME GENERATED (NEWEST FIRST)
items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

const jsonContent = JSON.stringify(items, null, 2);
fs.writeFileSync(manifestPath, jsonContent);
fs.writeFileSync(libManifestPath, jsonContent);
console.log(`Gallery manifest rebuilt: ${items.length} fully annotated items.`);
