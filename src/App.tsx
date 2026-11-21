import React, { Suspense, lazy, useEffect, useState } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ActivationWrapper } from "@/components/ActivationWrapper";
import { OnboardingSetup } from "@/components/OnboardingSetup";
import { Loader2 } from "lucide-react";


// Background tab preloader: runs shortly after Dashboard paints to preload all tabs into memory
function IdleTabPreloader() {
  useEffect(() => {
    const timer = setTimeout(() => {
      import("./pages/Revenues");
      import("./pages/Expenses");
      import("./pages/Clients");
      import("./pages/Settings");
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  return null;
}

// Hardware / System Back Button Navigation Handler (Pure navigation, no disk I/O on page changes)
function AndroidBackHandler() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    (window as any).onAndroidBackPressed = () => {
      // 1. If an open modal or dialog exists, close it first!
      const openDialogCloseBtn = document.querySelector(
        '[role="dialog"] button[aria-label="Close"], [data-state="open"] button[aria-label="Close"], [role="dialog"] button.close-button'
      ) as HTMLButtonElement | null;
      if (openDialogCloseBtn) {
        openDialogCloseBtn.click();
        return true;
      }

      // 2. If the user is on any subpage (not root "/"), navigate back one step!
      if (location.pathname !== "/") {
        navigate(-1);
        return true;
      }

      // 3. User is on the root "/" and no dialog is open:
      // Return false so Android MainActivity handles the double-tap to exit confirmation!
      return false;
    };

    return () => {
      delete (window as any).onAndroidBackPressed;
    };
  }, [location.pathname, navigate]);

  return null;
}

// Direct mount for landing page for sub-second startup
import Dashboard from "./pages/Dashboard";

// Lazy-loaded pages (code-split for instant app launch and ultra-smooth performance)
const Revenues = lazy(() => import("./pages/Revenues"));
const Expenses = lazy(() => import("./pages/Expenses"));
const Clients = lazy(() => import("./pages/Clients"));
const Settings = lazy(() => import("./pages/Settings"));
const Invoices = lazy(() => import("./pages/Invoices"));
const Users = lazy(() => import("./pages/Users"));
const Auth = lazy(() => import("./pages/Auth"));
const NotFound = lazy(() => import("./pages/NotFound"));

const PageLoader = () => (
  <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
    <Loader2 className="h-7 w-7 text-primary animate-spin" />
    <span className="text-xs text-muted-foreground font-medium">جاري التحميل...</span>
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes cache
    },
  },
});

// ── Onboarding gate: show if first launch and no farms saved ──────────────────
const OnboardingGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [onboardingDone, setOnboardingDone] = useState<boolean>(() => {
    try {
      // Already completed onboarding
      if (localStorage.getItem('app_onboarding_done') === '1') return true;
      // Existing user who already has farm data — skip onboarding automatically
      const existingFarms = localStorage.getItem('local_farms');
      if (existingFarms) {
        const parsed = JSON.parse(existingFarms);
        if (Array.isArray(parsed) && parsed.length > 0) {
          localStorage.setItem('app_onboarding_done', '1');
          return true;
        }
      }
      return false;
    } catch {
      return false;
    }
  });

  if (!onboardingDone) {
    return (
      <OnboardingSetup
        onComplete={() => {
          setOnboardingDone(true);
          // Force a full page reload so AppContext re-reads the new localStorage data
          window.location.reload();
        }}
      />
    );
  }

  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner position="top-center" duration={1000} />
      <IdleTabPreloader />
      <AndroidBackHandler />
      <ActivationWrapper>
        <OnboardingGate>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/revenues" element={
              <ProtectedRoute>
                <Layout>
                  <Revenues />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/expenses" element={
              <ProtectedRoute>
                <Layout>
                  <Expenses />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/clients" element={
              <ProtectedRoute>
                <Layout>
                  <Clients />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/invoices" element={
              <ProtectedRoute>
                <Layout>
                  <Invoices />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/partners" element={<Navigate to="/settings?tab=partners" replace />} />
            <Route path="/settings" element={
              <ProtectedRoute>
                <Layout>
                  <Settings />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/users" element={
              <ProtectedRoute>
                <Layout>
                  <Users />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
        </OnboardingGate>
      </ActivationWrapper>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
