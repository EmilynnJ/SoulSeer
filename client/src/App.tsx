import { Switch, Route, Router } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth";
import Layout from "@/components/Layout";
import Home from "@/pages/Home";
import Readers from "@/pages/Readers";
import ReaderDetail from "@/pages/ReaderDetail";
import About from "@/pages/About";
import Community from "@/pages/Community";
import Dashboard from "@/pages/Dashboard";
import Help from "@/pages/Help";
import NotFound from "@/pages/not-found";

function AppRouter() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/readers" component={Readers} />
        <Route path="/readers/:id" component={ReaderDetail} />
        <Route path="/about" component={About} />
        <Route path="/community" component={Community} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/help" component={Help} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Router hook={useHashLocation}>
            <AppRouter />
          </Router>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
