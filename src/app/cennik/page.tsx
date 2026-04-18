import type { Metadata } from "next";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import PricingSection from "@/components/home/PricingSection";
import NeuralBackground from "@/components/ui/NeuralBackground";
import { getSiteConfig } from "@/config/site-settings";

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
        <div className="pt-20">
          <PricingSection />
        </div>
      </main>
      <Footer />
    </>
  );
}
