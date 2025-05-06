
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ChatList from "./pages/ChatList";
import ChatDetail from "./pages/ChatDetail";
import Calls from "./pages/Calls";
import Status from "./pages/Status";
import NewChat from "./pages/NewChat";
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
          <Route path="/auth" element={<Auth />} />
          <Route path="/chats" element={<ChatList />} />
          <Route path="/chat/:id" element={<ChatDetail />} />
          <Route path="/calls" element={<Calls />} />
          <Route path="/status" element={<Status />} />
          <Route path="/new-chat" element={<NewChat />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
