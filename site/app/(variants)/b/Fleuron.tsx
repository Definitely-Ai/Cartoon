// Ornamental section divider: a short rule broken by a diamond, drawn as
// inline SVG so it renders as crisp ink at any size — never an emoji or a
// dingbat font. Decorative only, hidden from assistive tech.
export default function Fleuron({ className }: { className?: string }) {
  return (
    <div className={className ? `vb-divider ${className}` : "vb-divider"} aria-hidden="true">
      <svg viewBox="0 0 120 10" width="120" height="10" focusable="false">
        <line x1="6" y1="5" x2="46" y2="5" stroke="currentColor" strokeWidth="1" />
        <path d="M60 0.5 L64.5 5 L60 9.5 L55.5 5 Z" fill="currentColor" />
        <line x1="74" y1="5" x2="114" y2="5" stroke="currentColor" strokeWidth="1" />
      </svg>
    </div>
  );
}
