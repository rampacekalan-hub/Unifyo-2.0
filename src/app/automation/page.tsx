"use client";
import { Zap } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import ComingSoon from "@/components/ui/ComingSoon";

export default function AutomationPage() {
  return (
    <AppLayout title="Automatizácia" subtitle="Automatizácia —">
      <ComingSoon
        title="Automatizácia"
        icon={Zap}
        description="Workflow engine — nechaj AI spúšťať úlohy automaticky podľa pravidiel."
        features={[
          "Triggery: nový kontakt, zmena dealu, deadline úlohy",
          "Akcie: poslať email, vytvoriť úlohu, notifikovať",
          "AI-generované šablóny workflowov",
        ]}
      />
    </AppLayout>
  );
}
