// The "TODAY'S STRIP" starburst badge: an inline SVG burst with a black
// outline and halftone-dot fill, plus a solid white center so the label
// stays legible. The label itself is HTML (crisp at every size). Its one
// small stamp scale-in — the site's only orchestrated motion — lives in
// variant-c.css under prefers-reduced-motion: no-preference.

const SPIKES = 16;
const CENTER = 100;
const OUTER = 97;
const INNER = 76;

// Deterministic 32-point burst polygon (alternating outer/inner radii).
const POINTS = Array.from({ length: SPIKES * 2 }, (_, i) => {
  const radius = i % 2 === 0 ? OUTER : INNER;
  const angle = (Math.PI * i) / SPIKES - Math.PI / 2;
  const x = CENTER + radius * Math.cos(angle);
  const y = CENTER + radius * Math.sin(angle);
  return `${x.toFixed(1)},${y.toFixed(1)}`;
}).join(" ");

export default function Starburst() {
  return (
    <div className="vc-burst-pin">
      <div className="vc-burst">
        <svg viewBox="0 0 200 200" aria-hidden="true" focusable="false">
          <defs>
            <pattern id="vc-burst-halftone" width="8" height="8" patternUnits="userSpaceOnUse">
              <circle cx="4" cy="4" r="1.7" fill="#000" />
            </pattern>
          </defs>
          {/* White backing first so the page's paper dots never show through. */}
          <polygon points={POINTS} fill="#fff" />
          <polygon
            points={POINTS}
            fill="url(#vc-burst-halftone)"
            stroke="#000"
            strokeWidth="4"
            strokeLinejoin="round"
          />
          <circle cx="100" cy="100" r="62" fill="#fff" stroke="#000" strokeWidth="4" />
        </svg>
        <p className="vc-burst-label">
          <span>Today’s</span>
          <span>Strip</span>
        </p>
      </div>
      {/* Hand-drawn arrow from the badge down toward the hero panel.
          Sibling of .vc-burst so the stamp animation moves ONLY the badge;
          desktop-only via CSS, decorative. */}
      <svg
        className="vc-burst-arrow"
        viewBox="0 0 100 110"
        aria-hidden="true"
        focusable="false"
      >
        <path
          d="M88 8 C 62 20, 76 50, 48 72 C 42 77, 34 84, 26 92"
          fill="none"
          stroke="#000"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        <path
          d="M26 92 l17 -7 M26 92 l6 -18"
          fill="none"
          stroke="#000"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
