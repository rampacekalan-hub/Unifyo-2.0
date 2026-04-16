// src/app/dashboard/loading.tsx

export default function DashboardLoading() {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: "#05070f" }}
    >
      <div className="flex flex-col items-center gap-4">
        {/* Animated logo pulse */}
        <div className="relative">
          <div
            className="w-12 h-12 rounded-2xl animate-pulse"
            style={{ background: "rgba(99,102,241,0.2)" }}
          />
          <div
            className="absolute inset-0 rounded-2xl animate-ping"
            style={{ background: "rgba(99,102,241,0.1)" }}
          />
        </div>
        <p className="text-sm animate-pulse" style={{ color: "#4b5563" }}>
          Načítavám dashboard...
        </p>
      </div>
    </div>
  );
}
