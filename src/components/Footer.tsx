import { Link } from "react-router-dom";
import { Instagram, Facebook, MapPin, Phone, Clock } from "lucide-react";
import { useLocation } from "@/contexts/LocationContext";
import discoImg from "@/assets/ambiance-disco-design.jpg";

const Footer = () => {
  const { location } = useLocation();

  return (
    <footer className="bg-foreground text-background py-12 px-4">
      <div className="container mx-auto">
        <div className="grid md:grid-cols-3 gap-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <img
                src="/les-jardins-logo-circle.png"
                alt="Les Jardins Sur Le Toit"
                className="w-9 h-9 rounded-full object-cover ring-1 ring-secondary/40"
              />
              <span className="font-display text-xl font-bold">Les Jardins Sur Le Toit</span>
            </div>
            <p className="text-background/60 text-sm leading-relaxed">
              Le food court rooftop le plus chic de l'île. 4 stands, une seule commande.
            </p>
            <div className="flex gap-3 mt-4">
              <a
                href="https://instagram.com/lesjardinssurletoit"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-background/10 rounded-full hover:bg-secondary/30 transition-colors"
                aria-label="Instagram"
              >
                <Instagram size={18} />
              </a>
              <a
                href="https://facebook.com/lesjardinssurletoit"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-background/10 rounded-full hover:bg-secondary/30 transition-colors"
                aria-label="Facebook"
              >
                <Facebook size={18} />
              </a>
            </div>
          </div>

          {/* Address & hours */}
          <div>
            <h3 className="font-display font-bold text-sm mb-3 flex items-center gap-1.5">
              <MapPin size={14} /> Nous trouver
            </h3>
            <div className="text-background/60 text-sm space-y-1.5">
              <p>Bâtiment Ze Buro</p>
              <p>2 rue Terrain l'avion</p>
              <p>97435 Saint-Paul, La Réunion</p>
              <p className="flex items-center gap-1.5"><Phone size={12} />{location.phone}</p>
              <p className="flex items-start gap-1.5 pt-1">
                <Clock size={12} className="mt-0.5" />
                <span>Mar–Sam : 18h – 00h<br /><span className="text-background/40">Fermé Dim & Lun</span></span>
              </p>
            </div>
          </div>

          {/* Festive vibe */}
          <div>
            <h3 className="font-display font-bold text-sm mb-3">L'Ambiance</h3>
            <a
              href="https://instagram.com/lesjardinssurletoit"
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-2xl overflow-hidden ring-1 ring-secondary/30 hover:ring-secondary/60 transition-all group"
            >
              <img
                src={discoImg}
                alt="Ambiance disco festive — Les Jardins Sur Le Toit"
                className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
            </a>
            <p className="text-background/60 text-xs mt-2 italic">
              Suivez @lesjardinssurletoit pour ne rien manquer 🌴
            </p>
          </div>
        </div>

        <div className="border-t border-background/10 mt-10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-background/40 text-xs">© 2026 Les Jardins Sur Le Toit. Tous droits réservés.</p>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
            <Link to="/mentions-legales" className="text-background/40 text-xs hover:text-background/60 transition-colors">
              Mentions légales
            </Link>
            <Link to="/admin" className="text-background/40 text-xs hover:text-secondary transition-colors">
              Administration
            </Link>
            <a
              href="https://vpdev.fr"
              target="_blank"
              rel="noopener noreferrer"
              className="text-background/40 text-xs hover:text-background/60 transition-colors"
            >
              🌴 Site créé avec 🍹 par vpdev.fr
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
