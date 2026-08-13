// Ornamental section divider: a short rule broken by a diamond, drawn as
// inline SVG so it renders as crisp ink at any size — never an emoji or a
// dingbat font. Decorative only, hidden from assistive tech. The `small`
// variant is the front-matter engraving used once above the cover's issue
// line — same drawing at reduced scale.
export default function Fleuron({ className, small }: { className?: string; small?: boolean }) {
  const classes = ["vb-divider", small ? "vb-divider-small" : null, className]
    .filter(Boolean)
    .join(" ");
  return (
    <div className={classes} aria-hidden="true">
      <svg viewBox="0 0 120 10" width={small ? 72 : 120} height={small ? 6 : 10} focusable="false">
        <line x1="6" y1="5" x2="46" y2="5" stroke="currentColor" strokeWidth="1" />
        <path d="M60 0.5 L64.5 5 L60 9.5 L55.5 5 Z" fill="currentColor" />
        <line x1="74" y1="5" x2="114" y2="5" stroke="currentColor" strokeWidth="1" />
      </svg>
    </div>
  );
}
