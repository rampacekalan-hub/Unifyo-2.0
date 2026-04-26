"use client";

export default function PrintButton() {
  return (
    <button
      className="noprint"
      onClick={() => window.print()}
      style={{
        padding: "8px 16px",
        background: "#6366f1",
        color: "white",
        border: "none",
        borderRadius: 8,
        cursor: "pointer",
        fontSize: 13,
        fontWeight: 600,
      }}
    >
      Tlač / PDF
    </button>
  );
}
