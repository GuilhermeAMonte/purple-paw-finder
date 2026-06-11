
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { FavoritesProvider } from "./contexts/FavoritesContext";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { PrivateRoute, ClientRoute, ClinicRoute } from "./components/guards/RouteGuards";
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
import ForgotPassword from "./pages/ForgotPassword";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <FavoritesProvider>
          <BrowserRouter>
            <ErrorBoundary>
            <Routes>
              {/* Públicas */}
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/register" element={<Register />} />
              <Route path="/client-register" element={<ClientRegister />} />

              {/* Compartilhadas (qualquer usuário autenticado) */}
              <Route path="/clinic/:id" element={<PrivateRoute><ClinicDetails /></PrivateRoute>} />
              <Route path="/clinic/:id/chat" element={<PrivateRoute><Chat /></PrivateRoute>} />

              {/* Exclusivas de Cliente */}
              <Route path="/clinic/:id/create-ticket" element={<ClientRoute><CreateTicket /></ClientRoute>} />
              <Route path="/chat/:ticketId" element={<ClientRoute><Chat /></ClientRoute>} />
              <Route path="/profile" element={<ClientRoute><Profile /></ClientRoute>} />
              <Route path="/my-appointments" element={<ClientRoute><MyAppointments /></ClientRoute>} />

              {/* Exclusivas de Clínica */}
              <Route path="/clinic-setup" element={<ClinicRoute><ClinicSetup /></ClinicRoute>} />
              <Route path="/clinic-visual-setup" element={<ClinicRoute><ClinicVisualSetup /></ClinicRoute>} />
              <Route path="/clinic-dashboard" element={<ClinicRoute><ClinicDashboard /></ClinicRoute>} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            </ErrorBoundary>
          </BrowserRouter>
          <Toaster />
          <Sonner />
        </FavoritesProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
