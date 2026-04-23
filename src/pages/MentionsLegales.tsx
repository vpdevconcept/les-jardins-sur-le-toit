import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const MentionsLegales = () => {
  return (
    <div className="min-h-screen bg-background py-16 px-4">
      <div className="container mx-auto max-w-3xl">
        <Link to="/">
          <Button variant="ghost" className="mb-8">
            <ArrowLeft size={18} />
            Retour à l'accueil
          </Button>
        </Link>

        <h1 className="font-display text-3xl md:text-4xl font-bold mb-10 text-foreground">
          Mentions Légales &amp; Politique de Confidentialité
        </h1>

        <div className="space-y-8 text-foreground/80 text-sm leading-relaxed">
          <section>
            <h2 className="font-display text-xl font-bold mb-3 text-foreground">1. Éditeur du site</h2>
            <p>
              <strong>Les Jardins Sur Le Toit</strong><br />
              Food Court Rooftop<br />
              Adresse : 98 avenue de Bourbon, 97434 Saint-Gilles les Bains, Saint-Paul, La Réunion<br />
              Contact : <a href="mailto:conception.vpdev@gmail.com" className="underline text-primary">conception.vpdev@gmail.com</a>
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold mb-3 text-foreground">2. Développement &amp; Conception</h2>
            <p>
              Ce site a été conçu et développé par <strong>VP DEV</strong> (Valentin Parage).<br />
              Site web : <a href="https://vpdev.fr" target="_blank" rel="noopener noreferrer" className="underline text-primary">vpdev.fr</a><br />
              Contact : <a href="mailto:conception.vpdev@gmail.com" className="underline text-primary">conception.vpdev@gmail.com</a>
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold mb-3 text-foreground">3. Hébergement</h2>
            <p>L'infrastructure technique est assurée par&nbsp;:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong>Hébergement Front-end</strong> : Vercel Inc. (San Francisco, CA, États-Unis)</li>
              <li><strong>Base de données &amp; Authentification</strong> : Supabase Inc. (San Francisco, CA, États-Unis)</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold mb-3 text-foreground">4. Propriété intellectuelle</h2>
            <p>
              L'ensemble des contenus présents sur le site (textes, images, logos, graphismes, icônes) sont la propriété
              exclusive de Les Jardins Sur Le Toit, sauf mention contraire. Toute reproduction, représentation, modification
              ou adaptation, totale ou partielle, est interdite sans autorisation écrite préalable.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold mb-3 text-foreground">5. Politique de confidentialité (RGPD)</h2>
            <p>Conformément au RGPD (UE 2016/679) et à la loi Informatique et Libertés&nbsp;:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Aucune donnée personnelle n'est collectée à votre insu.</li>
              <li>La commande au stand fonctionne sans création de compte ni transmission de données bancaires.</li>
              <li>L'espace administration est protégé et réservé à l'éditeur pour la mise à jour des cartes et des prix.</li>
              <li>Vous disposez d'un droit d'accès, de rectification et de suppression de vos données en écrivant à&nbsp;: <a href="mailto:conception.vpdev@gmail.com" className="underline text-primary">conception.vpdev@gmail.com</a>.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold mb-3 text-foreground">6. Cookies</h2>
            <p>
              Ce site n'utilise aucun cookie de suivi publicitaire. Seuls des cookies techniques strictement nécessaires
              au fonctionnement de l'interface (panier, préférences d'affichage, administration) sont utilisés.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold mb-3 text-foreground">7. Droit applicable</h2>
            <p>
              Les présentes mentions légales sont régies par le droit français. En cas de litige, les tribunaux compétents
              seront ceux de Saint-Denis de La Réunion.
            </p>
          </section>
        </div>

        <p className="text-foreground/40 text-xs mt-12">
          Dernière mise à jour : 23 avril 2026
        </p>
      </div>
    </div>
  );
};

export default MentionsLegales;
