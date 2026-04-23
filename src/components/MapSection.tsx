import { motion } from "framer-motion";
import { MapPin, Navigation, ExternalLink, Clock, Phone } from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { isOpenNow, dayLabels, DayId } from "@/data/locations";
import { useLocation } from "@/contexts/LocationContext";

const customIcon = new L.DivIcon({
  html: `<div style="font-size:30px;filter:drop-shadow(0 2px 6px rgba(0,0,0,0.35))">🌴</div>`,
  className: "custom-marker",
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -36],
});

const OpenBadge = ({ open }: { open: boolean }) => (
  <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full ${
    open ? "bg-primary/20 text-primary" : "bg-destructive/10 text-destructive"
  }`}>
    <span className={`w-1.5 h-1.5 rounded-full ${open ? "bg-primary animate-pulse" : "bg-destructive"}`} />
    {open ? "Ouvert maintenant" : "Fermé"}
  </span>
);

const dayOrder: DayId[] = ["lun", "mar", "mer", "jeu", "ven", "sam", "dim"];

const MapSection = () => {
  const { location } = useLocation();
  const center: [number, number] = [location.coordinates.lat, location.coordinates.lng];
  const open = isOpenNow(location);

  return (
    <section id="map" className="py-20 px-4 bg-primary/5">
      <div className="container mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center justify-center w-14 h-14 bg-secondary/20 rounded-2xl mb-4">
            <Navigation className="text-secondary" size={24} />
          </div>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">Nous Trouver</h2>
          <p className="text-muted-foreground text-lg">Le rooftop le plus chic de l'Éperon</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="rounded-3xl overflow-hidden shadow-xl border border-border/50 h-[350px] md:h-[450px]"
        >
          <MapContainer
            center={center}
            zoom={16}
            scrollWheelZoom={false}
            className="h-full w-full"
            style={{ background: "hsl(var(--muted))" }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={center} icon={customIcon}>
              <Popup>
                <div className="font-sans text-sm">
                  <strong className="font-display">Les Jardins sur le Toit</strong>
                  <br />
                  Bâtiment Ze Buro
                  <br />
                  2 rue Terrain l'avion
                  <br />
                  97435 Saint-Paul, La Réunion
                </div>
              </Popup>
            </Marker>
          </MapContainer>
        </motion.div>

        {/* Address & Hours card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="glass-card rounded-3xl p-6 md:p-8 mt-6 grid md:grid-cols-2 gap-6"
        >
          {/* Address */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="bg-secondary/20 rounded-xl p-2">
                <MapPin size={18} className="text-secondary" />
              </div>
              <h3 className="font-display font-bold text-foreground text-lg">Adresse</h3>
              <OpenBadge open={open} />
            </div>
            <p className="text-foreground font-medium">{location.address}</p>
            <p className="text-muted-foreground">{location.postalCode} {location.city}</p>
            <p className="text-muted-foreground text-sm">La Réunion</p>
            <a
              href={`tel:${location.phone.replace(/\s/g, "")}`}
              className="mt-3 inline-flex items-center gap-1.5 text-primary text-sm font-medium hover:underline"
            >
              <Phone size={14} /> {location.phone}
            </a>
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${location.coordinates.lat},${location.coordinates.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-secondary text-secondary-foreground font-display font-bold text-sm shadow-lg hover:bg-secondary/90 transition-all neon-glow-pink"
            >
              <ExternalLink size={14} /> Itinéraire
            </a>
          </div>

          {/* Hours */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="bg-primary/20 rounded-xl p-2">
                <Clock size={18} className="text-primary" />
              </div>
              <h3 className="font-display font-bold text-foreground text-lg">Horaires</h3>
            </div>
            <ul className="space-y-1.5">
              {dayOrder.map((d) => {
                const h = location.hours[d];
                const isClosed = h === "fermé";
                return (
                  <li key={d} className="flex justify-between text-sm">
                    <span className="text-foreground/80 capitalize">{dayLabels[d]}</span>
                    <span className={isClosed ? "text-destructive/80 italic" : "text-primary font-semibold"}>
                      {isClosed ? "Fermé" : h.replace(":", "h").replace("-", " – ").replace(/h00 /g, "h ")}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default MapSection;
