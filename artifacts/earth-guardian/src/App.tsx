import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { AppProviders } from "@/components/providers/AppProviders";
import HomePage from "@/pages/HomePage";
import DashboardPage from "@/pages/DashboardPage";
import RiskAnalysisPage from "@/pages/RiskAnalysisPage";
import LiveMapPage from "@/pages/LiveMapPage";
import EmergencyPlannerPage from "@/pages/EmergencyPlannerPage";
import VolunteerNetworkPage from "@/pages/VolunteerNetworkPage";
import AboutPage from "@/pages/AboutPage";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/dashboard" component={DashboardPage} />
      <Route path="/risk-analysis" component={RiskAnalysisPage} />
      <Route path="/live-map" component={LiveMapPage} />
      <Route path="/emergency-planner" component={EmergencyPlannerPage} />
      <Route path="/volunteer-network" component={VolunteerNetworkPage} />
      <Route path="/about" component={AboutPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <AppProviders>
          <Navbar />
          <main className="flex-1">
            <Router />
          </main>
          <Footer />
        </AppProviders>
      </WouterRouter>
    </QueryClientProvider>
  );
}

export default App;
