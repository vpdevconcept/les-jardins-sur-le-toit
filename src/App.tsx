import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LocationProvider } from "@/contexts/LocationContext";
import { CartProvider } from "@/contexts/CartContext";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index.tsx";
import MentionsLegales from "./pages/MentionsLegales.tsx";
import Login from "./pages/Login.tsx";
import Admin from "./pages/Admin.tsx";
import QRCodePage from "./pages/QRCode.tsx";
import QRTable from "./pages/QRTable.tsx";
import MesCommandes from "./pages/MesCommandes.tsx";
import MonSolde from "./pages/MonSolde.tsx";
import AudioPlayer from "./components/AudioPlayer.tsx";
import ConnectionStatus from "./components/ConnectionStatus.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <LocationProvider>
          <CartProvider>
            <Toaster />
            <Sonner />
            <ConnectionStatus />
            <AudioPlayer />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/mentions-legales" element={<MentionsLegales />} />
                <Route path="/login" element={<Login />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/qrcode" element={<QRCodePage />} />
                <Route path="/qr/:token" element={<QRTable />} />
                <Route path="/mes-commandes" element={<MesCommandes />} />
                <Route path="/mon-solde" element={<MonSolde />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </CartProvider>
        </LocationProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
