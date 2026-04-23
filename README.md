# 🍹 Les Jardins Sur Le Toit - Control Tower

Une application PWA (Progressive Web App) haut de gamme conçue pour la gestion interactive des commandes et des tables du rooftop **Les Jardins Sur Le Toit**. Développée par [vpdev.fr](https://vpdev.fr).

## 🚀 Fonctionnalités

### 🖥 Côté Admin (Restaurateur)
- **Plan de Salle Interactif** : Visualisation en temps réel de l'état des tables (Libre / Occupée).
- **Drag & Drop Intelligent** : Réorganisation fluide des tables pour s'adapter à la configuration de la terrasse (Performance 60 FPS).
- **Gestion Personnalisée** : Possibilité de renommer les tables (ex: "VIP", "Vue Mer", "Cocotier") pour une gestion sur-mesure.
- **Génération de QR Codes** : Création instantanée de QR codes uniques liés à chaque table pour un accès direct au menu client.
- **Mode Édition** : Ajout et suppression rapide de tables via une interface intuitive inspirée d'iOS.

### 📱 Côté Client
- **Accès Sans Contact** : Scan du QR Code pour accéder instantanément au menu et passer commande.
- **Immersion** : Affichage personnalisé du nom de la table pour une expérience client premium.

## 🛠 Stack Technique

- **Frontend** : React.js, Vite, Tailwind CSS (Design Native App).
- **Backend & Auth** : Supabase (PostgreSQL).
- **Interactions** : @dnd-kit/core pour un Drag & Drop fluide.
- **Déploiement** : Vercel.

## 📦 Installation & Configuration Locale

1. **Cloner le repository** :
   ```bash
   git clone [https://github.com/votre-compte/les-jardins-sur-le-toit.git](https://github.com/votre-compte/les-jardins-sur-le-toit.git)
   cd les-jardins-sur-le-toit