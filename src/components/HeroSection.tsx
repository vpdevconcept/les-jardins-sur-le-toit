import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowDown, ShoppingBag } from "lucide-react";
import heroBg from "@/assets/ambiance-cocktail-view.jpg";

const LeafSVG = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 120 180" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M60 10C30 40 10 90 20 160C30 130 50 100 60 80C70 100 90 130 100 160C110 90 90 40 60 10Z" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.2" />
  </svg>
);

const HeroSection = () => {
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16 bg-background"
    >
      {/* Rooftop ambiance backdrop */}
      <div className="absolute inset-0">
        <img
          src={heroBg}
          alt="Cocktails sur le rooftop — vue océan"
          className="w-full h-full object-cover"
          fetchPriority="high"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/70 to-background" />
      </div>

      {/* Decorative leaves */}
      <LeafSVG className="absolute top-20 left-6 w-28 h-40 text-primary rotate-[-20deg]" />
      <LeafSVG className="absolute bottom-24 right-6 w-24 h-32 text-primary rotate-[30deg]" />
      <LeafSVG className="absolute top-1/3 right-10 w-16 h-24 text-secondary/50 rotate-[60deg]" />

      {/* Soft halos */}
      <div className="absolute top-1/4 right-1/4 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-secondary/15 rounded-full blur-3xl" />

      <div className="relative container mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <div className="w-36 h-36 sm:w-44 sm:h-44 mx-auto mb-8 rounded-full backdrop-blur-lg bg-white/5 border border-white/20 shadow-2xl shadow-black/40 flex items-center justify-center overflow-hidden">
            <img
              src="/les-jardins-logo-circle.png"
              alt="Les Jardins Sur Le Toit"
              className="w-full h-full object-contain scale-[1.7] drop-shadow-[0_8px_24px_rgba(0,0,0,0.45)]"
            />
          </div>
          <span className="inline-block bg-white/5 backdrop-blur-md text-foreground/90 text-xs font-medium tracking-[0.2em] uppercase px-4 py-1.5 rounded-full mb-6 border border-white/15">
            🌴 Rooftop · L'Éperon
          </span>
        </motion.div>

        <motion.h1
          className="font-display text-4xl sm:text-5xl md:text-7xl font-light text-foreground leading-[1.05] mb-6 tracking-[0.02em] drop-shadow-[0_4px_20px_rgba(0,0,0,0.5)]"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.15, ease: "easeOut" }}
        >
          Les Jardins
          <br />
          <span className="italic font-extralight text-secondary/90">Sur Le Toit</span>
        </motion.h1>

        <motion.p
          className="text-foreground/90 text-lg md:text-xl max-w-xl mx-auto mb-10"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          4 stands, une seule commande. Cocktails créations, panuozzi, burgers
          & tapas asiatiques — sur le rooftop le plus chic de l'île.
        </motion.p>

        <motion.div
          className="flex flex-col sm:flex-row gap-4 justify-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.45 }}
        >
          <Button
            size="lg"
            onClick={() => scrollTo("menu")}
            className="rounded-full text-base px-8 min-h-[48px] bg-secondary hover:bg-secondary/90 text-secondary-foreground shadow-lg neon-glow-pink"
          >
            <ShoppingBag size={18} />
            Commander aux stands
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => scrollTo("menu")}
            className="rounded-full text-base px-8 min-h-[48px] border-primary text-primary hover:bg-primary/10"
          >
            <ArrowDown size={18} />
            Voir la carte
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
