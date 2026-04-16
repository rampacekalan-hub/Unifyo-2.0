"use client";
// src/app/global-error.tsx — kritická chyba celého layoutu (musí mať vlastné html/body)

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const code = error.digest ?? "CRITICAL";

  return (
    <html lang="sk">
      <head>
        <title>Kritická chyba — Unifyo</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body
        style={{
          margin: 0,
          padding: 0,
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
          background: "#080b12",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        {/* Ambient blob 1 */}
        <div
          style={{
            position: "fixed",
            top: "-20%",
            left: "-10%",
            width: "600px",
            height: "600px",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)",
            filter: "blur(80px)",
            pointerEvents: "none",
          }}
        />
        {/* Ambient blob 2 */}
        <div
          style={{
            position: "fixed",
            bottom: "-20%",
            right: "-10%",
            width: "500px",
            height: "500px",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(139,92,246,0.07) 0%, transparent 70%)",
            filter: "blur(80px)",
            pointerEvents: "none",
          }}
        />

        {/* Card */}
        <div
          style={{
            position: "relative",
            zIndex: 10,
            width: "100%",
            maxWidth: "440px",
            padding: "24px 16px",
            textAlign: "center",
          }}
        >
          {/* Logo */}
          <h1
            style={{
              fontSize: "1.5rem",
              fontWeight: 900,
              letterSpacing: "-0.03em",
              color: "#eef2ff",
              margin: "0 0 2.5rem",
            }}
          >
            Unifyo
          </h1>

          <div
            style={{
              background: "rgba(15,18,32,0.9)",
              border: "1px solid rgba(99,102,241,0.18)",
              borderRadius: "16px",
              padding: "40px 32px",
              backdropFilter: "blur(24px)",
              boxShadow: "0 0 60px rgba(99,102,241,0.08)",
            }}
          >
            {/* Icon */}
            <div
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "16px",
                background: "rgba(239,68,68,0.12)",
                border: "1px solid rgba(239,68,68,0.22)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 24px",
                fontSize: "2rem",
              }}
            >
              ⚠️
            </div>

            <h2
              style={{
                fontSize: "1.2rem",
                fontWeight: 700,
                color: "#eef2ff",
                margin: "0 0 8px",
              }}
            >
              Kritická chyba aplikácie
            </h2>
            <p
              style={{
                fontSize: "0.875rem",
                color: "#94a3b8",
                margin: "0 0 24px",
                lineHeight: 1.6,
              }}
            >
              Niečo sa vážne pokazilo. Naša podpora bola notifikovaná.
              Prosím obnovte stránku alebo nás kontaktujte.
            </p>

            {/* Error code */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "6px 12px",
                borderRadius: "8px",
                background: "rgba(99,102,241,0.08)",
                border: "1px solid rgba(99,102,241,0.18)",
                marginBottom: "28px",
              }}
            >
              <span
                style={{
                  fontSize: "0.7rem",
                  fontFamily: "monospace",
                  color: "#64748b",
                }}
              >
                Kód chyby:
              </span>
              <span
                style={{
                  fontSize: "0.7rem",
                  fontFamily: "monospace",
                  fontWeight: 700,
                  letterSpacing: "0.05em",
                  color: "#6366f1",
                }}
              >
                {code}
              </span>
            </div>

            {/* Buttons */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              <button
                onClick={reset}
                style={{
                  background: "linear-gradient(135deg, #6366f1, #5b21b6)",
                  color: "#fff",
                  border: "none",
                  borderRadius: "12px",
                  padding: "11px 20px",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  boxShadow: "0 0 20px rgba(99,102,241,0.35)",
                  width: "100%",
                }}
              >
                🔄 Skúsiť znova
              </button>
              <a
                href={`mailto:info@unifyo.online?subject=Kritická%20chyba%20${code}`}
                style={{
                  display: "block",
                  background: "rgba(99,102,241,0.1)",
                  border: "1px solid rgba(99,102,241,0.18)",
                  color: "#eef2ff",
                  borderRadius: "12px",
                  padding: "11px 20px",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  textDecoration: "none",
                  width: "100%",
                  boxSizing: "border-box",
                }}
              >
                ✉️ Kontaktovať podporu
              </a>
            </div>

            <a
              href="/"
              style={{
                display: "inline-block",
                marginTop: "16px",
                fontSize: "0.75rem",
                color: "#475569",
                textDecoration: "none",
              }}
            >
              ← Späť na hlavnú stránku
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
