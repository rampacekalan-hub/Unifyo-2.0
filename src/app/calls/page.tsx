"use client";
import { Phone } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import ComingSoon from "@/components/ui/ComingSoon";

export default function CallsPage() {
  return (
    <AppLayout title="Hovory" subtitle="Hovory —">
      <ComingSoon
        title="Hovory"
        icon={Phone}
        feature="calls"
        eta="Q4 2026"
        progress={15}
        description="Prichádzajúce a odchádzajúce hovory na jednom mieste, so záznamom do CRM."
        features={[
          "Automatický prepis a sumarizácia rozhovoru",
          "Priradenie hovoru ku kontaktu v CRM",
          "AI návrh follow-up úlohy po hovore",
        ]}
      />
    </AppLayout>
  );
}
