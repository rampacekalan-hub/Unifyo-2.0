"use client";
import { Mail } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import ComingSoon from "@/components/ui/ComingSoon";

export default function EmailPage() {
  return (
    <AppLayout title="Email" subtitle="Email —">
      <ComingSoon
        title="Email"
        icon={Mail}
        description="Všetky schránky na jednom mieste — s AI triedením, návrhmi odpovedí a prepojením na CRM."
        features={[
          "Automatické triedenie do priorít podľa kontextu",
          "AI-navrhnuté odpovede v tvojom tóne",
          "Priradenie emailu ku kontaktu v CRM a follow-up úlohy",
        ]}
      />
    </AppLayout>
  );
}
