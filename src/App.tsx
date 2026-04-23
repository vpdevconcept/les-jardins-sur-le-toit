import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LocationProvider } from "@/contexts/LocationContext";
import { CartProvider } from "@/contexts/CartContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { useEffect, useRef } from "react";
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

const App = () => {
  // Création d'une référence audio globale pour les notifications
  const notificationAudio = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Initialisation du son de notification
    notificationAudio.current = new Audio('/audio/notification.mp3');
    
    // On expose l'objet audio sur window pour pouvoir le "débloquer" 
    // facilement depuis n'importe quel composant au clic
    (window as any).unlockNotificationAudio = () => {
      if (notificationAudio.current) {
        notificationAudio.current.play().then(() => {
          notificationAudio.current?.pause();
          if (notificationAudio.current) notificationAudio.current.currentTime = 0;
          console.log("Audio de notification débloqué pour iOS");
        }).catch(err => console.error("Erreur déblocage audio:", err));
      }
    };

    // Fonction globale pour jouer la notification
    (window as any).playNotification = () => {
      if (notificationAudio.current) {
        notificationAudio.current.play().catch(err => console.error("Lecture bloquée:", err));
        if ('vibrate' in navigator) {
          navigator.vibrate([300, 100, 300]);
        }
      }
    };
  }, []);

  return (
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
};

export default App;