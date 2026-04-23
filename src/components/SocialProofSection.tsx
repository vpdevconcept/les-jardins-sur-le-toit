import { motion } from "framer-motion";
import { Star, Instagram } from "lucide-react";
import rooftopChill from "@/assets/ambiance-rooftop-chill.jpg";
import neonStands from "@/assets/ambiance-neon-stands.jpg";
import cocktailView from "@/assets/ambiance-cocktail-view.jpg";

const reviews = [
  { name: "Marie L.", text: "Vue rooftop dingue, panuozzo Pazzo Pazzo à tomber 🍕", stars: 5 },
  { name: "Thomas R.", text: "Le burger Cantina signature, une tuerie. Ambiance au top !", stars: 5 },
  { name: "Sarah M.", text: "Cocktails créations à se damner — mention spéciale au Pivoine 🍸", stars: 5 },
  { name: "Nicolas P.", text: "Tapas Ô Little Saigon parfaits, service au taquet. On revient !", stars: 4 },
  { name: "Julie B.", text: "Le concept food court rooftop, c'est exactement ce qui manquait 🌴", stars: 5 },
  { name: "Kevin D.", text: "Coucher de soleil + tapas + DJ set = soirée parfaite 🌶️", stars: 5 },
];

const SocialProofSection = () => {
  // Correction du lien Instagram (VPDEV)
  const INSTAGRAM_URL = "https://www.instagram.com/les.jardins.sur.le.toit";

  return (
    <section className="py-20 px-4 bg-primary/5">
      <div className="container mx-auto">
        {/* Reviews */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <div className="flex items-center justify-center gap-1 mb-3">
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={20} className="text-secondary fill-secondary" />
            ))}
          </div>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">4.7 sur Google</h2>
          <p className="text-muted-foreground">Ce que nos clients disent de nous</p>
        </motion.div>

        <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory -mx-4 px-4 mb-16">
          {reviews.map((r, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="glass-card rounded-2xl p-5 min-w-[260px] max-w-[280px] snap-start flex-shrink-0"
            >
              <div className="flex gap-0.5 mb-2">
                {[...Array(r.stars)].map((_, j) => (
                  <Star key={j} size={12} className="text-secondary fill-secondary" />
                ))}
              </div>
              <p className="text-foreground text-sm mb-3 leading-relaxed">"{r.text}"</p>
              <p className="text-muted-foreground text-xs font-medium">— {r.name}</p>
            </motion.div>
          ))}
        </div>

        {/* "Le Lieu" Gallery */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <a 
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-block"
          >
            <h3 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-2 flex items-center justify-center gap-2 group-hover:text-secondary transition-colors">
              <Instagram size={22} className="text-secondary" />
              @les.jardins.sur.le.toit
            </h3>
          </a>
          <p className="text-muted-foreground text-sm">Le Lieu — transats, néons & couchers de soleil</p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-w-2xl mx-auto">
          {/* Image 1 */}
          <motion.a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            whileHover={{ scale: 1.03 }}
            className="col-span-2 row-span-2 rounded-2xl overflow-hidden shadow-lg cursor-pointer group"
          >
            <img
              src={rooftopChill}
              alt="Rooftop chill"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
          </motion.a>

          {/* Image 2 */}
          <motion.a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            whileHover={{ scale: 1.05 }}
            className="rounded-2xl overflow-hidden shadow-lg cursor-pointer aspect-square group"
          >
            <img
              src={neonStands}
              alt="Néons des stands"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
          </motion.a>

          {/* Image 3 */}
          <motion.a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            whileHover={{ scale: 1.05 }}
            className="rounded-2xl overflow-hidden shadow-lg cursor-pointer aspect-square group"
          >
            <img
              src={cocktailView}
              alt="Cocktails vue mer"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
          </motion.a>
        </div>
      </div>
    </section>
  );
};

export default SocialProofSection;