
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ChatList from "./pages/ChatList";
import ChatDetail from "./pages/ChatDetail";
import Calls from "./pages/Calls";
import Status from "./pages/Status";
import NewChat from "./pages/NewChat";
import Friends from "./pages/Friends";
import Profile from "./pages/Profile";
import ArchivedChats from "./pages/ArchivedChats";
import NotFound from "./pages/NotFound";
import CallInterface from "./components/CallInterface"; // Import the call screen component

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              
              {/* Protected Routes */}
              <Route element={<ProtectedRoute />}>
                <Route path="/chats" element={<ChatList />} />
                <Route path="/chat/:id" element={<ChatDetail />} />
                <Route path="/calls" element={<Calls />} />
                <Route path="/call/:id" element={<CallInterface />} /> {/* Add call screen route */}
                <Route path="/status" element={<Status />} />
                <Route path="/new-chat" element={<NewChat />} />
                <Route path="/friends" element={<Friends />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/archived-chats" element={<ArchivedChats />} />
              </Route>
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
