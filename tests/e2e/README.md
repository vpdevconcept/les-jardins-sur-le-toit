# 🧪 Tests E2E — Les Jardins Sur Le Toit

Suite de tests Playwright couvrant le flux complet : **scan QR client → commande → workflow admin → encaissement**.

## 🏗 Structure

tests/e2e/
├── helpers/
│   ├── seed.ts             # Initialise l'admin de test + table #99
│   ├── orders.ts           # Helpers pour la gestion des commandes
│   ├── admin-auth.ts       # Procédure de login admin réutilisable
│   └── browser-state.ts    # Injection localStorage (session guest)
├── global-setup.ts         # Initialisation des données avant les tests
├── global-teardown.ts      # Nettoyage de la base après les tests
├── 01-happy-path.spec.ts   # Cycle complet : Nouveau → Encaissé
├── 02-payment-lock.spec.ts # Test des verrous de paiement
├── 03-guest-persistence.spec.ts # Session 12h + bannière offline
└── 04-admin-workflow.spec.ts    # Plan de salle + Drag & Drop


## 📊 Données de test

Le script de seed configure automatiquement :
- **Compte Admin Test** : `e2e-admin@jardins-test.local` / `E2E-Admin-Test-2026!`
- **Table de test** : Numéro **99** avec un token QR unique.

*Toutes les commandes créées avec un `guest_id` préfixé `e2e-` sont supprimées au début et à la fin de chaque run pour garder la base de données Supabase propre.*

## 🔑 Variables d'environnement requises

Ces variables doivent être présentes dans votre fichier `.env` local ou configurées dans les secrets de votre projet (Vercel/GitHub) :

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (Obligatoire pour les opérations de seed et de nettoyage)

## 🚀 Exécution des tests

Assurez-vous d'avoir installé les navigateurs nécessaires avant la première exécution :
```bash
npx playwright install