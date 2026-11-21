import { useLocation } from "react-router-dom";
import { Header } from "@/components/Header";
import { BottomNavigation } from "@/components/BottomNavigation";
import { VoiceOrb } from "@/components/VoiceOrb";
import { PageTransition } from "@/components/PageTransition";
import { cn } from "@/lib/utils";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const isDashboard = location.pathname === "/";

  return (
    <div className="min-h-screen font-cairo pb-28 bg-[#F3F6FA] dark:bg-[#0B1120] w-full" dir="rtl">
      <div className="flex flex-col min-h-screen w-full bg-background transition-colors">
        {!isDashboard && <Header />}
        <main className={cn(
          "flex-1 overflow-y-auto w-full",
          isDashboard ? "p-0" : "p-3 sm:p-5 md:p-8"
        )}>
          <PageTransition>
            {children}
          </PageTransition>
        </main>
        <VoiceOrb />
        <BottomNavigation />
      </div>
    </div>
  );
}