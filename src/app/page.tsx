import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import HeroSection from "@/components/home/HeroSection";
import BentoGrid from "@/components/home/BentoGrid";
import PricingSection from "@/components/home/PricingSection";
import MarqueeSection from "@/components/home/MarqueeSection";
import StatsSection from "@/components/home/StatsSection";
import CtaSection from "@/components/home/CtaSection";
import MeshBackground from "@/components/ui/MeshBackground";

export default function Home() {
  return (
    <>
      <MeshBackground />
      <Navbar />
      <main className="flex-1">
        <HeroSection />
        <MarqueeSection />
        <BentoGrid />
        <StatsSection />
        <PricingSection />
        <CtaSection />
      </main>
      <Footer />
    </>
  );
}
