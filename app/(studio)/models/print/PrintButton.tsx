"use client";

// The only interactive thing on a print page: the button that opens the print
// dialog. It hides itself when the page is actually printing.

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="print-hide"
      style={{
        fontFamily: "Georgia, 'Times New Roman', serif",
        fontSize: 15,
        padding: "9px 20px",
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
