export default function MeshBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-20" aria-hidden="true">
      {/* Base deep space */}
      <div className="absolute inset-0" style={{ background: "#05070f" }} />

      {/* Top center violet bloom */}
      <div
        className="absolute"
        style={{
          top: "-10%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "120vw",
          height: "70vh",
          background: "radial-gradient(ellipse at 50% 0%, rgba(124,58,237,0.14) 0%, rgba(6,182,212,0.04) 45%, transparent 70%)",
        }}
      />

      {/* Bottom-right cyan accent */}
      <div
        className="absolute"
        style={{
          bottom: 0,
          right: 0,
          width: "60vw",
          height: "50vh",
          background: "radial-gradient(ellipse at 100% 100%, rgba(6,182,212,0.08) 0%, transparent 60%)",
        }}
      />

      {/* Bottom-left subtle violet */}
      <div
        className="absolute"
        style={{
          bottom: "10%",
          left: 0,
          width: "40vw",
          height: "40vh",
          background: "radial-gradient(ellipse at 0% 100%, rgba(139,92,246,0.06) 0%, transparent 60%)",
        }}
      />
    </div>
  );
}
