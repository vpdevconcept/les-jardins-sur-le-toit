import { useState, useCallback, useRef, lazy, Suspense } from "react";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import GreenBook from "@/components/GreenBook";
import MenuSection from "@/components/MenuSection";
import SpiritSection from "@/components/SpiritSection";
import SocialProofSection from "@/components/SocialProofSection";
const MapSection = lazy(() => import("@/components/MapSection"));
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import SplashScreen from "@/components/SplashScreen";
import ConsultationBanner from "@/components/ConsultationBanner";
import { features } from "@/config/features";

const Index = () => {
  const [cartOpen, setCartOpen] = useState(false);
  // QR Code optimisation : en Pack Croissance, on skippe le splash pour un chargement instantané
  const [splashDone, setSplashDone] = useState(!features.cart);

  const handleSplashComplete = useCallback(() => setSplashDone(true), []);

  const handleStartAudio = useCallback(() => {
    // Trigger the global AudioPlayer by dispatching a custom event
    window.dispatchEvent(new CustomEvent("greenshake-start-audio"));
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {!splashDone && (
        <SplashScreen onComplete={handleSplashComplete} onStartAudio={handleStartAudio} />
      )}
      <Header onCartOpen={() => setCartOpen(true)} />
      <ConsultationBanner />
      <HeroSection />
      <div id="menu-classic">
        <MenuSection />
      </div>
      <SpiritSection />
      <GreenBook />
      <SocialProofSection />
      <Suspense fallback={<div className="h-96 flex items-center justify-center text-muted-foreground">Chargement de la carte…</div>}>
        <MapSection />
      </Suspense>
      <Footer />
      {features.cart && <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />}
    </div>
  );
};

export default Index;
