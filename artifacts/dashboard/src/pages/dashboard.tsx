import { useState, useEffect } from "react";
import { useGetOrgProfile } from "@workspace/api-client-react";
import { DashboardControls } from "@/components/dashboard/controls";
import { FundingOverview } from "@/components/dashboard/funding-overview";
import { DonorTrends } from "@/components/dashboard/donor-trends";
import { ProgramOutcomes } from "@/components/dashboard/program-outcomes";
import { OperationalEfficiency } from "@/components/dashboard/operational-efficiency";
import { OrgProfileFormDialog } from "@/components/forms/org-profile-form";

export default function Dashboard() {
  const [isDark, setIsDark] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  
  const orgQuery = useGetOrgProfile();

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  return (
    <div className="min-h-screen bg-background transition-colors duration-200">
      <div className="px-5 py-4 pt-[32px] pb-[48px] pl-[24px] pr-[24px]">
        <div className="max-w-[1400px] mx-auto space-y-10">
          <DashboardControls 
            isDark={isDark} 
            setIsDark={setIsDark} 
            lastRefreshedAt={Date.now()} 
            onOpenSettings={() => setSettingsOpen(true)}
          />

          <FundingOverview isDark={isDark} />
          
          <div className="h-px bg-border/50 my-10" />
          
          <DonorTrends isDark={isDark} />
          
          <div className="h-px bg-border/50 my-10" />
          
          <ProgramOutcomes isDark={isDark} />
          
          <div className="h-px bg-border/50 my-10" />
          
          <OperationalEfficiency isDark={isDark} onEdit={() => setSettingsOpen(true)} />
        </div>
      </div>
      
      <OrgProfileFormDialog 
        open={settingsOpen} 
        onOpenChange={setSettingsOpen} 
        profile={orgQuery.data}
      />
    </div>
  );
}
