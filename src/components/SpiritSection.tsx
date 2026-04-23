import { motion } from "framer-motion";
import rooftopChill from "@/assets/ambiance-rooftop-chill.jpg";
import neonStands from "@/assets/ambiance-neon-stands.jpg";

/**
 * L'Esprit des Jardins — Section ambiance double image (rooftop chill + néons stands).
 * Remplace les anciennes sections "Nos Producteurs" et "Le Geste Frais" héritées de Green Shake.
 */
const SpiritSection = () => {
  return (
    <section id="esprit" className="py-20 px-4 overflow-hidden">
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <span className="text-muted-foreground text-xs tracking-[0.3em] uppercase mb-3 block">
            Le Lieu
          </span>
          <h2 className="font-display text-3xl md:text-5xl font-bold text-foreground mb-3">
            L'Esprit des <span className="italic text-secondary">Jardins</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Coucher de soleil sur l'océan, néons des stands à la nuit tombée — une ambiance rooftop unique sur l'île.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-5 md:gap-6">
          {/* Carte 1 — Rooftop chill */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6 }}
            className="group relative overflow-hidden rounded-3xl aspect-[4/5] md:aspect-[3/4] shadow-xl"
          >
            <img
              src={rooftopChill}
              alt="Rooftop chill au coucher du soleil — Les Jardins Sur Le Toit"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-foreground/85 via-foreground/30 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-7">
              <span className="inline-block text-background/70 text-[11px] tracking-[0.3em] uppercase mb-2">
                Sunset Vibes
              </span>
              <h3 className="font-display text-2xl md:text-3xl font-bold text-background mb-2">
                Apéro face à l'océan
              </h3>
              <p className="text-background/80 text-sm leading-relaxed max-w-sm">
                Transats, palmiers et cocktails signature : l'instant idéal pour décrocher en regardant le soleil plonger dans l'océan Indien.
              </p>
            </div>
          </motion.div>

          {/* Carte 2 — Néons des stands */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="group relative overflow-hidden rounded-3xl aspect-[4/5] md:aspect-[3/4] shadow-xl"
          >
            <img
              src={neonStands}
              alt="Néons des 4 stands à la nuit tombée — Pazzo Pazzo, The Butcher, Saigon"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-foreground/85 via-foreground/30 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-7">
              <span className="inline-block text-background/70 text-[11px] tracking-[0.3em] uppercase mb-2">
                Night Mode
              </span>
              <h3 className="font-display text-2xl md:text-3xl font-bold text-background mb-2">
                4 stands, 1 ambiance néon
              </h3>
              <p className="text-background/80 text-sm leading-relaxed max-w-sm">
                Quand la nuit tombe, les enseignes s'illuminent : pizza italienne, burgers américains, tapas asiatiques — un food court rooftop comme nulle part ailleurs.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default SpiritSection;
