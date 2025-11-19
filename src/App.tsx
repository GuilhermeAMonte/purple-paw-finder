
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { FavoritesProvider } from "./contexts/FavoritesContext";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ClientRegister from "./pages/ClientRegister";
import ClinicDetails from "./pages/ClinicDetails";
import CreateTicket from "./pages/CreateTicket";
import Chat from "./pages/Chat";
import Profile from "./pages/Profile";
import MyAppointments from "./pages/MyAppointments";
import ClinicSetup from "./pages/ClinicSetup";
import ClinicVisualSetup from "./pages/ClinicVisualSetup";
import ClinicDashboard from "./pages/ClinicDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <FavoritesProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/client-register" element={<ClientRegister />} />
              <Route path="/clinic/:id" element={<ClinicDetails />} />
              <Route path="/clinic/:id/create-ticket" element={<CreateTicket />} />
              <Route path="/clinic/:id/chat" element={<Chat />} />
              <Route path="/chat/:ticketId" element={<Chat />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/my-appointments" element={<MyAppointments />} />
              <Route path="/clinic-setup" element={<ClinicSetup />} />
              <Route path="/clinic-visual-setup" element={<ClinicVisualSetup />} />
              <Route path="/clinic-dashboard" element={<ClinicDashboard />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
          <Toaster />
          <Sonner />
        </FavoritesProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
