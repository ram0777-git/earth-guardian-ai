import { Suspense, lazy } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { AppProviders } from "@/components/providers/AppProviders";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { RakshProvider } from "@/components/raksh/RakshContext";
import { RakshAIButton } from "@/components/raksh/RakshAIButton";

const HomePage               = lazy(() => import("@/pages/HomePage"));
const DashboardPage          = lazy(() => import("@/pages/DashboardPage"));
const RiskAnalysisPage       = lazy(() => import("@/pages/RiskAnalysisPage"));
const LiveMapPage            = lazy(() => import("@/pages/LiveMapPage"));
const EmergencyPlannerPage   = lazy(() => import("@/pages/EmergencyPlannerPage"));
const VolunteerNetworkPage   = lazy(() => import("@/pages/VolunteerNetworkPage"));
const AboutPage              = lazy(() => import("@/pages/AboutPage"));
const RakshAIPage            = lazy(() => import("@/pages/RakshAIPage"));
const ImageGalleryPage       = lazy(() => import("@/pages/ImageGalleryPage"));
const DisasterSimulationPage = lazy(() => import("@/pages/DisasterSimulationPage"));
const ReportsPage            = lazy(() => import("@/pages/ReportsPage"));
const NotFound               = lazy(() => import("@/pages/not-found"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime:  30_000,
      gcTime:     5 * 60_000,
      retry: 1,
    },
  },
});

function PageFallback() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 rounded-full border-2 border-cyan-400/30 border-t-cyan-400 animate-spin" />
        <p className="text-sm text-slate-500">Loading…</p>
      </div>
    </div>
  );
}

function Router() {
  return (
    <Suspense fallback={<PageFallback />}>
      <Switch>
        <Route path="/"                   component={HomePage} />
        <Route path="/dashboard"          component={DashboardPage} />
        <Route path="/risk-analysis"      component={RiskAnalysisPage} />
        <Route path="/live-map"           component={LiveMapPage} />
        <Route path="/emergency-planner"  component={EmergencyPlannerPage} />
        <Route path="/volunteer-network"  component={VolunteerNetworkPage} />
        <Route path="/about"              component={AboutPage} />
        <Route path="/raksh"              component={RakshAIPage} />
        <Route path="/image-gallery"      component={ImageGalleryPage} />
        <Route path="/simulation"         component={DisasterSimulationPage} />
        <Route path="/reports"            component={ReportsPage} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <ErrorBoundary>
          <RakshProvider>
            <AppProviders>
              <Navbar />
              <main className="flex-1">
                <ErrorBoundary>
                  <Router />
                </ErrorBoundary>
              </main>
              <Footer />
              <RakshAIButton />
            </AppProviders>
          </RakshProvider>
        </ErrorBoundary>
      </WouterRouter>
    </QueryClientProvider>
  );
}

export default App;
