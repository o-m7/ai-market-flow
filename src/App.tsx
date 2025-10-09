import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Dashboard } from "./components/Dashboard";
import Index from "./pages/Index";
import { SymbolDetail } from "./pages/SymbolDetail";
import { SearchResults } from "./pages/SearchResults";
import { Alerts } from "./pages/Alerts";
import { Settings } from "./pages/Settings";
import Portfolio from "./pages/Portfolio";
import AIAnalysis from "./pages/AIAnalysis";
import QuantTrading from "./pages/QuantTrading";
import QuantDemo from "./pages/QuantDemo";
import TradeAccuracy from "./pages/TradeAccuracy";
import News from "./pages/News";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import Pricing from "./pages/Pricing";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentCanceled from "./pages/PaymentCanceled";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { DisclaimerFooter } from "./components/DisclaimerFooter";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/payment-success" element={<PaymentSuccess />} />
            <Route path="/payment-canceled" element={<PaymentCanceled />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/search" element={<SearchResults />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/portfolio" element={<Portfolio />} />
            <Route path="/ai-analysis" element={
              <ProtectedRoute>
                <AIAnalysis />
              </ProtectedRoute>
            } />
            <Route path="/quant" element={
              <ProtectedRoute>
                <QuantTrading />
              </ProtectedRoute>
            } />
            <Route path="/quant-demo" element={<QuantDemo />} />
            <Route path="/trade-accuracy" element={
              <ProtectedRoute>
                <TradeAccuracy />
              </ProtectedRoute>
            } />
            <Route path="/news" element={<News />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/markets/:assetType/:symbol" element={<SymbolDetail />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <DisclaimerFooter />
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
