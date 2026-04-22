import type { Metadata } from "next";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import PricingSection from "@/components/home/PricingSection";
import PricingComparisonTable from "@/components/home/PricingComparisonTable";
import NeuralBackground from "@/components/ui/NeuralBackground";
import { getSiteConfig } from "@/config/site-settings";
import { Sparkles } from "lucide-react";

const config = getSiteConfig();

export const metadata: Metadata = {
  title: `Cenník — ${config.name}`,
  description:
    "Transparentné ceny Unifyo — plat si podľa toho, čo reálne využívaš. Bez skrytých poplatkov, kedykoľvek môžeš zrušiť.",
  alternates: { canonical: "/cennik" },
};

export default function CennikPage() {
  return (
    <>
      <NeuralBackground themeEngine={config.branding.themeEngine} />
      <Navbar />
      <main className="flex-1" style={{ position: "relative", zIndex: 1 }}>
        {/* Page hero */}
        <section
          style={{
            paddingTop: "clamp(120px, 16vw, 160px)",
            paddingBottom: "clamp(24px, 5vw, 48px)",
          }}
          className="px-6 text-center"
        >
          <div className="max-w-3xl mx-auto flex flex-col items-center gap-5">
            <span
              className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold"
              style={{
                background: "rgba(139,92,246,0.1)",
                border: "1px solid rgba(139,92,246,0.25)",
                color: "#c4b5fd",
              }}
            >
              <Sparkles className="w-3 h-3" />
              Cenník
            </span>
            <h1
              className="font-black tracking-[-0.03em] leading-[1.08]"
              style={{
                fontSize: "clamp(2rem, 6vw, 4rem)",
                color: "#eef2ff",
              }}
            >
              Vyber si plán,{" "}
              <span
                style={{
                  background: "linear-gradient(90deg, #a78bfa, #67e8f9)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                ktorý ti sedí
              </span>
            </h1>
            <p
              className="text-base leading-relaxed max-w-xl"
              style={{ color: "#94a3b8" }}
            >
              Plať len za to, čo reálne využívaš. Žiadne skryté poplatky,
              zrušenie kedykoľvek jedným klikom.
            </p>
          </div>
        </section>

        <PricingSection />
        <PricingComparisonTable />
      </main>
      <Footer />
    </>
  );
}
