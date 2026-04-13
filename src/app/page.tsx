import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import HeroSection from "@/components/home/HeroSection";
import BentoGrid from "@/components/home/BentoGrid";
import PricingSection from "@/components/home/PricingSection";
import MarqueeSection from "@/components/home/MarqueeSection";
import StatsSection from "@/components/home/StatsSection";
import CtaSection from "@/components/home/CtaSection";
import NeuralBackground from "@/components/ui/NeuralBackground";

export default function Home() {
  return (
    <>
      <NeuralBackground />
      <Navbar />
      <main className="flex-1" style={{ position: "relative", zIndex: 1 }}>
        <HeroSection />
        <div className="section-sep" />
        <MarqueeSection />
        <div className="section-sep" />
        <BentoGrid />
        <StatsSection />
        <div className="section-sep" />
        <PricingSection />
        <div className="section-sep" />
        <CtaSection />
      </main>
      <Footer />
    </>
  );
}
