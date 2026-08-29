"use client";

// The only interactive thing on a print page: the button that opens the print
// dialog. It hides itself when the page is actually printing.

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="print-hide"
      // 44px tall: he prints these from an iPad, and a 34px button is a
      // button he taps twice.
      style={{
        fontFamily: "Georgia, 'Times New Roman', serif",
        fontSize: 15,
        minHeight: 44,
        padding: "9px 22px",
        borderRadius: 4,
        border: "1px solid #b9b0a0",
        background: "#f5f2ea",
        color: "#1a1a1a",
        cursor: "pointer",
      }}
    >
      Print
    </button>
  );
}
