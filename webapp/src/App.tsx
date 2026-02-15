import { Toaster } from "./components/ui/toaster";
import { Toaster as Sonner } from "./components/ui/sonner";
import { TooltipProvider } from "./components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MainLayout } from "./components/layout/MainLayout";
import Index from "./pages/Index";
import Lists from "./pages/Lists";
import Stats from "./pages/Stats";
import Settings from "./pages/Settings";
import CrawlHistory from "./pages/CrawlHistory";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Index />} />
            <Route path="lists" element={<Lists />} />
            <Route path="stats" element={<Stats />} />
            <Route path="stats/crawls" element={<CrawlHistory />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          <Route path
