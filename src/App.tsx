import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import { SymbolDetail } from "./pages/SymbolDetail";
import { SearchResults } from "./pages/SearchResults";
import { Watchlist } from "./pages/Watchlist";
import { Alerts } from "./pages/Alerts";
import { Settings } from "./pages/Settings";
import Portfolio from "./pages/Portfolio";
import { AIAnalysis } from "./pages/AIAnalysis";
import News from "./pages/News";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/search" element={<SearchResults />} />
          <Route path="/watchlist" element={<Watchlist />} />
          <Route path="/alerts" element={<Alerts />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/ai-analysis" element={<AIAnalysis />} />
          <Route path="/news" element={<News />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/markets/:assetType/:symbol" element={<SymbolDetail />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
