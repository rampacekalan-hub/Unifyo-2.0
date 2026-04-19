"use client";
import { BarChart3 } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import ComingSoon from "@/components/ui/ComingSoon";

export default function AnalyticsPage() {
  return (
    <AppLayout title="Analytika" subtitle="Analytika —">
      <ComingSoon
        title="Analytika"
        icon={BarChart3}
        feature="analytics"
        eta="Q3 2026"
        progress={25}
        description="Prehľad nad tvojim biznisom — kontakty, úlohy, AI spotreba, konverzie."
        features={[
          "Týždenné a mesačné reporty",
          "Trend kontaktov a deal pipeline",
          "AI usage a cost tracking",
        ]}
      />
    </AppLayout>
  );
}
