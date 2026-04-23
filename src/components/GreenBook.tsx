import { motion } from "framer-motion";
import { ImageCarousel } from "@/components/ImageCarousel";

const pages = [
  { src: "/images/menu-cover-tropical.jpg", alt: "Couverture menu — Les Jardins Sur Le Toit" },
  { src: "/images/menu-cocktails-creations.jpg", alt: "Cocktails Créations" },
  { src: "/images/menu-mocktails-april.jpg", alt: "Mocktails April — sans alcool" },
  { src: "/images/menu-wine-white-rose.jpg", alt: "Vins Blancs & Rosés — Apéro Rooftop" },
  { src: "/images/menu-pazzo-pazzo-food.jpg", alt: "Pazzo Pazzo — Panuozzi à partager" },
  { src: "/images/menu-cantina-burgers.jpg", alt: "Cantina America — Burgers" },
  { src: "/images/menu-little-saigon-tapas.jpg", alt: "Ô Little Saigon — Tapas asiatiques" },
  { src: "/images/menu-bottles-shooters.jpg", alt: "Bouteilles & Shooters — Mode Soirée" },
];

const GreenBook = () => {
  return (
    <section id="menu" className="py-20 px-4">
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-8"
        >
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
            Notre Carte 🌴
          </h2>
          <p className="text-muted-foreground">
            Feuilletez notre menu — 8 univers, du cocktail signature au tapas asiatique
          </p>
        </motion.div>

        <ImageCarousel pages={pages} />

        <p className="text-center text-muted-foreground text-xs mt-3">
          <button
            onClick={() => document.getElementById("menu-classic")?.scrollIntoView({ behavior: "smooth" })}
            className="underline hover:text-foreground transition-colors"
          >
            Voir le menu interactif ↓
          </button>
        </p>
      </div>
    </section>
  );
};

export default GreenBook;
