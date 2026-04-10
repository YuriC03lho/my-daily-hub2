import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index";
import DiaryPage from "./pages/DiaryPage";
import ShoppingPage from "./pages/ShoppingPage";
import AgendaPage from "./pages/AgendaPage";
import HistoryPage from "./pages/HistoryPage";
import SecretHealthPage from "./pages/SecretHealthPage";
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
          <Route path="/diary" element={<DiaryPage />} />
          <Route path="/shopping" element={<ShoppingPage />} />
          <Route path="/agenda" element={<AgendaPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/s-area" element={<SecretHealthPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
