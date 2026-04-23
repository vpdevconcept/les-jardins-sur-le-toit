import type { LocationId } from "@/data/locations";

export interface NutritionInfo {
  allergens: string[];
  energy: { label: string; value: number }[];
  kcal?: number;
}

export interface MenuOptionChoice {
  id: string;
  label: string;
  priceExtra: number;
}

export interface MenuOption {
  id: string;
  label: string;
  type: "single" | "multiple";
  required?: boolean;
  choices: MenuOptionChoice[];
}

/**
 * MODE MAQUETTE — Les Jardins Sur Le Toit (Éperon Rooftop)
 *
 * 4 stands : jardins, pazzo, butcher, cantina.
 * `category` est volontairement libre (string) pour rester souple.
 */
export interface MenuItem {
  id: string;
  name: string;
  price: number;
  description: string;
  category: string;
  /** Sous-rubrique optionnelle (ex: "Cocktails Créations", "Vin Rouge - Bordeaux") */
  subcategory?: string;
  /** Contenance affichée (ex: "20cl", "75cl") */
  volume?: string;
  /** Image carrée optionnelle (URL absolue ou /public ou import) */
  image?: string;
  badges: string[];
  nutrition: NutritionInfo;
  upsellIds?: string[];
  availableAt?: LocationId[];
  isVegan?: boolean;
  isGlutenFree?: boolean;
  isPei?: boolean;
  /** Cocktail/plat signature de la maison */
  isSignature?: boolean;
  /** À partager (planches, panuozzi XL, tapas…) */
  isShareable?: boolean;
  /** Incontournable / best-seller */
  isMustTry?: boolean;
  options?: MenuOption[];
  sortOrder?: number;
}

export const getDerivedBadges = (item: MenuItem): string[] => {
  const derived: string[] = [];
  // Badges Les Jardins (concept rooftop)
  if (item.isSignature || item.badges.includes("Signature")) derived.push("Signature 🍹");
  if (item.isShareable) derived.push("À Partager 🍕");
  if (item.isMustTry || item.badges.includes("Best-Seller")) derived.push("Incontournable 🔥");
  if (item.isPei) derived.push("100% Péi");
  // On filtre les anciens badges Green Shake déjà couverts ci-dessus
  const filtered = item.badges.filter(
    (b) => !["Signature", "Best-Seller", "Végan", "Sans Gluten"].includes(b),
  );
  return [...derived, ...filtered];
};

export const hasNutritionData = (item: MenuItem): boolean => {
  return item.nutrition.allergens.length > 0 || item.nutrition.energy.length > 0 || !!item.nutrition.kcal;
};

const emptyNutrition: NutritionInfo = { allergens: [], energy: [] };

/* ─────────── 4 stands en mock data ─────────── */
export const menuItems: MenuItem[] = [
  /* ═══════════════ 🍹 LES JARDINS — Carte Boissons complète ═══════════════
     Données extraites des photos officielles de la carte (Avril). */

  /* ── COCKTAILS CRÉATIONS ── */
  {
    id: "cocktail-pivoine",
    name: "Pivoine",
    price: 12,
    volume: "20cl",
    description: "Gin, Aperol, citronnade, jus d'ananas.",
    category: "jardins",
    subcategory: "Cocktails Créations",
    badges: ["Signature"],
    image: "https://images.unsplash.com/photo-1551538827-9c037cb4f32a?w=600&h=600&fit=crop",
    nutrition: emptyNutrition,
    sortOrder: 1,
  },
  {
    id: "cocktail-dahlia",
    name: "Dahlia",
    price: 12,
    volume: "20cl",
    description: "Rhum, purée de framboise, jus d'ananas, citron.",
    category: "jardins",
    subcategory: "Cocktails Créations",
    badges: ["Signature"],
    image: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=600&h=600&fit=crop",
    nutrition: emptyNutrition,
    sortOrder: 2,
  },
  {
    id: "cocktail-bouton-or",
    name: "Bouton d'Or",
    price: 12,
    volume: "16cl",
    description: "Vodka, prosecco, citron, sucre, basilic.",
    category: "jardins",
    subcategory: "Cocktails Créations",
    badges: [],
    image: "https://images.unsplash.com/photo-1587223962930-cb7f31384c19?w=600&h=600&fit=crop",
    nutrition: emptyNutrition,
    sortOrder: 3,
  },
  {
    id: "cocktail-fleur-lys",
    name: "Fleur de Lys",
    price: 12,
    volume: "16cl",
    description: "Whisky, sirop de gingembre, ginger beer, citron.",
    category: "jardins",
    subcategory: "Cocktails Créations",
    badges: [],
    image: "https://images.unsplash.com/photo-1536935338788-846bb9981813?w=600&h=600&fit=crop",
    nutrition: emptyNutrition,
    sortOrder: 4,
  },
  {
    id: "cocktail-le-two",
    name: "Le Two — Cocktail du Moment",
    price: 13,
    volume: "14cl",
    description: "Gin, purée de fraise, sucre, citron. La création du moment 🍓",
    category: "jardins",
    subcategory: "Cocktails Créations",
    badges: ["Best-Seller"],
    image: "https://images.unsplash.com/photo-1560512823-829485b8bf24?w=600&h=600&fit=crop",
    nutrition: emptyNutrition,
    sortOrder: 5,
  },

  /* ── COCKTAILS CLASSIQUES ── */
  { id: "classic-bellini", name: "Bellini", price: 8.5, volume: "14cl", description: "Prosecco & purée de pêche blanche.", category: "jardins", subcategory: "Cocktails Classiques", badges: [], nutrition: emptyNutrition, sortOrder: 10 },
  { id: "classic-rossini", name: "Rossini", price: 8.5, volume: "14cl", description: "Prosecco & purée de fraise fraîche.", category: "jardins", subcategory: "Cocktails Classiques", badges: [], nutrition: emptyNutrition, sortOrder: 11 },
  { id: "classic-cuba-libre", name: "Cuba Libre", price: 8.5, volume: "20cl", description: "Rhum, coca, citron vert.", category: "jardins", subcategory: "Cocktails Classiques", badges: [], nutrition: emptyNutrition, sortOrder: 12 },
  { id: "classic-negroni", name: "Negroni", price: 8.5, volume: "9cl", description: "Gin, Campari, vermouth rouge.", category: "jardins", subcategory: "Cocktails Classiques", badges: [], nutrition: emptyNutrition, sortOrder: 13 },
  { id: "classic-expresso-martini", name: "Expresso Martini", price: 11, volume: "16cl", description: "Vodka, liqueur de café, expresso frais.", category: "jardins", subcategory: "Cocktails Classiques", badges: [], nutrition: emptyNutrition, sortOrder: 14 },
  { id: "classic-margarita", name: "Margarita", price: 10, volume: "16cl", description: "Tequila, triple sec, citron vert, sel.", category: "jardins", subcategory: "Cocktails Classiques", badges: [], nutrition: emptyNutrition, sortOrder: 15 },
  { id: "classic-gin-tonic", name: "Gin Tonic", price: 10, volume: "16cl", description: "Gin premium & tonic water.", category: "jardins", subcategory: "Cocktails Classiques", badges: [], nutrition: emptyNutrition, sortOrder: 16 },
  { id: "classic-aperol-spritz", name: "Aperol Spritz", price: 10, volume: "16cl", description: "Aperol, prosecco, eau pétillante, orange.", category: "jardins", subcategory: "Cocktails Classiques", badges: ["Best-Seller"], nutrition: emptyNutrition, sortOrder: 17 },
  { id: "classic-stgermain-spritz", name: "St Germain Spritz", price: 12, volume: "16cl", description: "St Germain, prosecco, eau pétillante.", category: "jardins", subcategory: "Cocktails Classiques", badges: [], nutrition: emptyNutrition, sortOrder: 18 },
  { id: "classic-jamaican-mule", name: "Jamaican Mule", price: 11, volume: "12cl", description: "Rhum, ginger beer, citron vert.", category: "jardins", subcategory: "Cocktails Classiques", badges: [], nutrition: emptyNutrition, sortOrder: 19 },

  /* ── MOCKTAILS DE AVRIL ── */
  { id: "mock-virgin-gin-tonic", name: "Virgin Gin Tonic", price: 7.5, volume: "16cl", description: "Sans alcool. Tonic, citron, herbes fraîches.", category: "jardins", subcategory: "Mocktails", badges: ["Sans Alcool"], isVegan: true, nutrition: emptyNutrition, sortOrder: 30 },
  { id: "mock-sakura", name: "Sakura", price: 7.5, volume: "12cl", description: "Sirop de cerise, pamplemousse, jus de pomme, citron.", category: "jardins", subcategory: "Mocktails", badges: ["Sans Alcool"], isVegan: true, nutrition: emptyNutrition, sortOrder: 31 },
  { id: "mock-virgin-jamaican", name: "Virgin Jamaican Mule", price: 7.5, volume: "12cl", description: "Rhum zéro, ginger beer, citron, sucre.", category: "jardins", subcategory: "Mocktails", badges: ["Sans Alcool"], isVegan: true, nutrition: emptyNutrition, sortOrder: 32 },
  { id: "mock-multi-jardins", name: "Multi Jardins", price: 7.5, volume: "16cl", description: "Jus de pomme, fruits rouges, mangue, citron.", category: "jardins", subcategory: "Mocktails", badges: ["Sans Alcool"], isVegan: true, nutrition: emptyNutrition, sortOrder: 33 },
  { id: "mock-wonka", name: "Wonka", price: 7.5, volume: "17cl", description: "Purée de fraises, sirop de chocolat maison, jus de pomme. 🎫", category: "jardins", subcategory: "Mocktails", badges: ["Sans Alcool"], isVegan: true, nutrition: emptyNutrition, sortOrder: 34 },

  /* ── SOFTS ── */
  { id: "soft-coca", name: "Coca-Cola", price: 3.5, volume: "50cl", description: "Coca-Cola classique bien frais.", category: "jardins", subcategory: "Softs", badges: [], nutrition: emptyNutrition, sortOrder: 50 },
  { id: "soft-orangina", name: "Orangina", price: 4, volume: "25cl", description: "L'incontournable secouez-moi !", category: "jardins", subcategory: "Softs", badges: [], nutrition: emptyNutrition, sortOrder: 51 },
  { id: "soft-sprite", name: "Sprite", price: 3.5, volume: "50cl", description: "Limonade citron-citron vert.", category: "jardins", subcategory: "Softs", badges: [], nutrition: emptyNutrition, sortOrder: 52 },
  { id: "soft-sirop", name: "Sirop à l'eau", price: 2, volume: "33cl", description: "Au choix : grenadine, menthe, fraise.", category: "jardins", subcategory: "Softs", badges: [], nutrition: emptyNutrition, sortOrder: 53 },
  { id: "soft-the-glace", name: "Thé Glacé Maison", price: 3.5, volume: "20cl", description: "Infusion fraîche, citron & menthe du jardin.", category: "jardins", subcategory: "Softs", badges: ["Maison"], nutrition: emptyNutrition, sortOrder: 54 },
  { id: "soft-citronnade", name: "Citronnade Maison", price: 4, volume: "20cl", description: "Citrons pressés, eau, sucre de canne.", category: "jardins", subcategory: "Softs", badges: ["Maison"], isVegan: true, nutrition: emptyNutrition, sortOrder: 55 },
  { id: "soft-ginger-beer", name: "Ginger Beer", price: 4, volume: "20cl", description: "Boisson au gingembre piquante.", category: "jardins", subcategory: "Softs", badges: [], nutrition: emptyNutrition, sortOrder: 56 },
  { id: "soft-perrier", name: "Perrier", price: 4, volume: "33cl", description: "Eau gazeuse minérale.", category: "jardins", subcategory: "Softs", badges: [], nutrition: emptyNutrition, sortOrder: 57 },
  { id: "soft-san-pellegrino", name: "San Pellegrino", price: 4, volume: "75cl", description: "Eau gazeuse italienne, finement pétillante.", category: "jardins", subcategory: "Softs", badges: [], nutrition: emptyNutrition, sortOrder: 58 },
  { id: "soft-edena", name: "Edena Plate", price: 3, volume: "1L", description: "Eau plate de La Réunion 🏝️", category: "jardins", subcategory: "Softs", badges: ["100% Péi"], isPei: true, nutrition: emptyNutrition, sortOrder: 59 },

  /* ── BIÈRES PRESSION ── */
  { id: "biere-heineken-25", name: "Heineken (25cl)", price: 3.5, volume: "25cl", description: "Pression Heineken, mousse onctueuse.", category: "jardins", subcategory: "Bières Pression", badges: [], nutrition: emptyNutrition, sortOrder: 70 },
  { id: "biere-heineken-50", name: "Heineken (50cl)", price: 6, volume: "50cl", description: "Pression Heineken format pinte.", category: "jardins", subcategory: "Bières Pression", badges: [], nutrition: emptyNutrition, sortOrder: 71 },
  { id: "biere-heineken-3l", name: "Heineken Tour 3L", price: 30, volume: "3L", description: "Tour de bière Heineken — pour la table 🍻", category: "jardins", subcategory: "Bières Pression", badges: ["À partager"], nutrition: emptyNutrition, sortOrder: 72 },
  { id: "biere-affligem-25", name: "Affligem Blonde (25cl)", price: 4.5, volume: "25cl", description: "Bière d'abbaye blonde, ronde et fruitée.", category: "jardins", subcategory: "Bières Pression", badges: [], nutrition: emptyNutrition, sortOrder: 73 },
  { id: "biere-affligem-50", name: "Affligem Blonde (50cl)", price: 8.5, volume: "50cl", description: "Pinte Affligem Blonde.", category: "jardins", subcategory: "Bières Pression", badges: [], nutrition: emptyNutrition, sortOrder: 74 },
  { id: "biere-kewes-rouge-25", name: "Kewes Rouge (25cl)", price: 4, volume: "25cl", description: "Bière artisanale péi, malts torréfiés. 🏝️", category: "jardins", subcategory: "Bières Pression", badges: ["100% Péi"], isPei: true, nutrition: emptyNutrition, sortOrder: 75 },
  { id: "biere-kewes-rouge-50", name: "Kewes Rouge (50cl)", price: 8, volume: "50cl", description: "Pinte Kewes Rouge artisanale.", category: "jardins", subcategory: "Bières Pression", badges: ["100% Péi"], isPei: true, nutrition: emptyNutrition, sortOrder: 76 },
  { id: "biere-kewes-blanche-25", name: "Kewes Blanche (25cl)", price: 4, volume: "25cl", description: "Blanche péi, légère et désaltérante.", category: "jardins", subcategory: "Bières Pression", badges: ["100% Péi"], isPei: true, nutrition: emptyNutrition, sortOrder: 77 },
  { id: "biere-kewes-blanche-50", name: "Kewes Blanche (50cl)", price: 8, volume: "50cl", description: "Pinte Kewes Blanche péi.", category: "jardins", subcategory: "Bières Pression", badges: ["100% Péi"], isPei: true, nutrition: emptyNutrition, sortOrder: 78 },

  /* ── BIÈRES BOUTEILLE ── */
  { id: "biere-btl-heineken", name: "Heineken Bouteille", price: 4, volume: "25cl", description: "Bouteille Heineken servie fraîche.", category: "jardins", subcategory: "Bières Bouteille", badges: [], nutrition: emptyNutrition, sortOrder: 90 },
  { id: "biere-btl-heineken-0", name: "Heineken 0%", price: 4, volume: "25cl", description: "Sans alcool, même goût.", category: "jardins", subcategory: "Bières Bouteille", badges: ["Sans Alcool"], nutrition: emptyNutrition, sortOrder: 91 },

  /* ── BOISSONS CHAUDES ── */
  { id: "hot-expresso", name: "Expresso", price: 2, description: "Café serré 100% arabica.", category: "jardins", subcategory: "Boissons Chaudes", badges: [], nutrition: emptyNutrition, sortOrder: 100 },
  { id: "hot-decafeine", name: "Décaféiné", price: 2, description: "Expresso sans caféine.", category: "jardins", subcategory: "Boissons Chaudes", badges: [], nutrition: emptyNutrition, sortOrder: 101 },
  { id: "hot-noisette", name: "Noisette", price: 2.2, description: "Expresso avec une touche de lait.", category: "jardins", subcategory: "Boissons Chaudes", badges: [], nutrition: emptyNutrition, sortOrder: 102 },
  { id: "hot-cappuccino", name: "Cappuccino", price: 3.8, description: "Expresso, lait moussé, cacao.", category: "jardins", subcategory: "Boissons Chaudes", badges: [], nutrition: emptyNutrition, sortOrder: 103 },
  { id: "hot-the", name: "Thé", price: 3, description: "Sélection de thés et infusions.", category: "jardins", subcategory: "Boissons Chaudes", badges: [], nutrition: emptyNutrition, sortOrder: 104 },

  /* ── ALCOOLS au verre ── */
  { id: "alc-ricard", name: "Ricard", price: 4, volume: "4cl", description: "Pastis de Marseille, à allonger d'eau fraîche.", category: "jardins", subcategory: "Alcools", badges: [], nutrition: emptyNutrition, sortOrder: 120 },
  { id: "alc-martini", name: "Martini Blanc / Rouge", price: 5, volume: "6cl", description: "Vermouth italien, blanc ou rouge au choix.", category: "jardins", subcategory: "Alcools", badges: [], nutrition: emptyNutrition, sortOrder: 121 },
  { id: "alc-vodka-ketel", name: "Vodka Ketel One", price: 10, volume: "6cl", description: "Vodka premium hollandaise.", category: "jardins", subcategory: "Alcools", badges: [], nutrition: emptyNutrition, sortOrder: 122 },
  { id: "alc-tequila-don-julio", name: "Tequila Don Julio", price: 14, volume: "6cl", description: "Tequila 100% agave, méthode artisanale.", category: "jardins", subcategory: "Alcools", badges: ["Premium"], nutrition: emptyNutrition, sortOrder: 123 },
  { id: "alc-rhum-zacapa", name: "Rhum Zacapa", price: 10, volume: "6cl", description: "Rhum guatémaltèque vieilli en altitude.", category: "jardins", subcategory: "Alcools", badges: ["Premium"], nutrition: emptyNutrition, sortOrder: 124 },
  { id: "alc-get-27", name: "Get 27", price: 8, volume: "6cl", description: "Liqueur de menthe glaciale.", category: "jardins", subcategory: "Alcools", badges: [], nutrition: emptyNutrition, sortOrder: 125 },

  /* ── WHISKY ── */
  { id: "whisky-jb", name: "JB", price: 7, volume: "4cl", description: "Blended scotch whisky, doux et accessible.", category: "jardins", subcategory: "Whisky", badges: [], nutrition: emptyNutrition, sortOrder: 140 },
  { id: "whisky-johnny", name: "Johnny Walker", price: 7, volume: "4cl", description: "Red Label, blend mondialement reconnu.", category: "jardins", subcategory: "Whisky", badges: [], nutrition: emptyNutrition, sortOrder: 141 },
  { id: "whisky-talisker", name: "Talisker", price: 10, volume: "4cl", description: "Single malt de l'île de Skye, tourbé & marin.", category: "jardins", subcategory: "Whisky", badges: ["Premium"], nutrition: emptyNutrition, sortOrder: 142 },
  { id: "whisky-bulleit", name: "Bulleit Bourbon", price: 12, volume: "4cl", description: "Bourbon du Kentucky, notes épicées.", category: "jardins", subcategory: "Whisky", badges: ["Premium"], nutrition: emptyNutrition, sortOrder: 143 },
  { id: "whisky-clynelish", name: "Clynelish", price: 13, volume: "4cl", description: "Single malt des Highlands, cireux et complexe.", category: "jardins", subcategory: "Whisky", badges: ["Premium"], nutrition: emptyNutrition, sortOrder: 144 },
  { id: "whisky-lagavulin", name: "Lagavulin", price: 13, volume: "4cl", description: "Single malt d'Islay, intensément tourbé.", category: "jardins", subcategory: "Whisky", badges: ["Premium"], nutrition: emptyNutrition, sortOrder: 145 },
  { id: "whisky-shooters", name: "Shooters", price: 3, volume: "3cl", description: "Shooter au choix selon arrivage.", category: "jardins", subcategory: "Whisky", badges: [], nutrition: emptyNutrition, sortOrder: 146 },

  /* ── ALCOOLS BOUTEILLES ── */
  { id: "btl-vodka-smirnoff", name: "Vodka Smirnoff", price: 90, volume: "70cl", description: "Bouteille entière pour la table.", category: "jardins", subcategory: "Bouteilles", badges: ["À partager"], nutrition: emptyNutrition, sortOrder: 160 },
  { id: "btl-get-27", name: "Get 27", price: 90, volume: "70cl", description: "Bouteille de Get 27 menthe glaciale.", category: "jardins", subcategory: "Bouteilles", badges: ["À partager"], nutrition: emptyNutrition, sortOrder: 161 },
  { id: "btl-rhum-captain", name: "Rhum Captain Morgan", price: 90, volume: "70cl", description: "Bouteille de rhum épicé.", category: "jardins", subcategory: "Bouteilles", badges: ["À partager"], nutrition: emptyNutrition, sortOrder: 162 },
  { id: "btl-gin-tanqueray", name: "Gin Tanqueray", price: 120, volume: "70cl", description: "Gin London Dry premium.", category: "jardins", subcategory: "Bouteilles", badges: ["Premium", "À partager"], nutrition: emptyNutrition, sortOrder: 163 },
  { id: "btl-jb", name: "JB Whisky", price: 90, volume: "70cl", description: "Bouteille de blended scotch JB.", category: "jardins", subcategory: "Bouteilles", badges: ["À partager"], nutrition: emptyNutrition, sortOrder: 164 },
  { id: "btl-johnny", name: "Johnny Walker", price: 90, volume: "70cl", description: "Bouteille de Johnny Walker Red.", category: "jardins", subcategory: "Bouteilles", badges: ["À partager"], nutrition: emptyNutrition, sortOrder: 165 },

  /* ── CHAMPAGNES ── */
  { id: "champ-gobillard-coupe", name: "JM Gobillard & Fils Brut — Coupe", price: 10, volume: "12cl", description: "Champagne Brut, fines bulles, fraîcheur florale.", category: "jardins", subcategory: "Champagnes", badges: [], nutrition: emptyNutrition, sortOrder: 180 },
  { id: "champ-gobillard-btl", name: "JM Gobillard & Fils Brut — Bouteille", price: 90, volume: "75cl", description: "Bouteille de champagne JM Gobillard Brut.", category: "jardins", subcategory: "Champagnes", badges: [], nutrition: emptyNutrition, sortOrder: 181 },
  { id: "champ-epc-coupe", name: "EPC Brut — Coupe", price: 14, volume: "12cl", description: "Champagne EPC Brut, élégant et vif.", category: "jardins", subcategory: "Champagnes", badges: [], nutrition: emptyNutrition, sortOrder: 182 },
  { id: "champ-epc-btl", name: "EPC Brut — Bouteille", price: 120, volume: "75cl", description: "Bouteille EPC Brut.", category: "jardins", subcategory: "Champagnes", badges: ["Premium"], nutrition: emptyNutrition, sortOrder: 183 },
  { id: "champ-epc-bdn", name: "EPC Blanc de Noir", price: 130, volume: "75cl", description: "Bouteille EPC Blanc de Noir, vineux et structuré.", category: "jardins", subcategory: "Champagnes", badges: ["Premium"], nutrition: emptyNutrition, sortOrder: 184 },
  { id: "champ-epc-bdb", name: "EPC Blanc de Blancs", price: 140, volume: "75cl", description: "Bouteille EPC Blanc de Blancs, 100% chardonnay.", category: "jardins", subcategory: "Champagnes", badges: ["Premium"], nutrition: emptyNutrition, sortOrder: 185 },
  { id: "champ-jeeper-coupe", name: "Jeeper Blanc de Blancs — Coupe", price: 13, volume: "12cl", description: "Champagne Jeeper, chardonnay pur, minéralité fine.", category: "jardins", subcategory: "Champagnes", badges: [], nutrition: emptyNutrition, sortOrder: 186 },
  { id: "champ-jeeper-btl", name: "Jeeper Blanc de Blancs — Bouteille", price: 110, volume: "75cl", description: "Bouteille Jeeper Blanc de Blancs.", category: "jardins", subcategory: "Champagnes", badges: [], nutrition: emptyNutrition, sortOrder: 187 },
  { id: "champ-jeeper-magnum", name: "Jeeper Blanc de Blancs — Magnum", price: 160, volume: "1.5L", description: "Magnum Jeeper Blanc de Blancs, pour les grandes tablées.", category: "jardins", subcategory: "Champagnes", badges: ["Premium", "À partager"], nutrition: emptyNutrition, sortOrder: 188 },

  /* ── VIN ROUGE ── */
  { id: "vin-rouge-vdf-souvenir-verre", name: "VDF Souvenir Pinot Noir Dom Paquet — Verre", price: 5, volume: "12cl", description: "Vin de France, pinot noir souple et fruité.", category: "jardins", subcategory: "Vin Rouge", badges: [], nutrition: emptyNutrition, sortOrder: 200 },
  { id: "vin-rouge-vdf-souvenir-btl", name: "VDF Souvenir Pinot Noir Dom Paquet — Bouteille", price: 20, volume: "75cl", description: "Bouteille du même pinot noir.", category: "jardins", subcategory: "Vin Rouge", badges: [], nutrition: emptyNutrition, sortOrder: 201 },
  { id: "vin-rouge-macon-verre", name: "Bourgogne — Mâcon Perraud (Verre)", price: 8, volume: "12cl", description: "Bourgogne Mâcon, gourmand et équilibré.", category: "jardins", subcategory: "Vin Rouge", badges: [], nutrition: emptyNutrition, sortOrder: 202 },
  { id: "vin-rouge-macon-btl", name: "Bourgogne — Mâcon Perraud (Bouteille)", price: 39, volume: "75cl", description: "Bouteille Mâcon Perraud.", category: "jardins", subcategory: "Vin Rouge", badges: [], nutrition: emptyNutrition, sortOrder: 203 },
  { id: "vin-rouge-mercurey-btl", name: "Bourgogne — Mercurey Vieilles Vignes Dom Theulot 2023", price: 65, volume: "75cl", description: "Mercurey, vieilles vignes, structure noble.", category: "jardins", subcategory: "Vin Rouge", badges: ["Premium"], nutrition: emptyNutrition, sortOrder: 204 },
  { id: "vin-rouge-sancerre-btl", name: "Loire — Sancerre Classic Pinot Noir BIO Dom Berthier", price: 60, volume: "75cl", description: "Sancerre BIO, pinot noir tendu et précis.", category: "jardins", subcategory: "Vin Rouge", badges: ["BIO"], nutrition: emptyNutrition, sortOrder: 205 },
  { id: "vin-rouge-chantecotes-verre", name: "Vallée du Rhône — Les Terres Vierges Chantecôtes BIO (Verre)", price: 6, volume: "12cl", description: "Côtes du Rhône BIO, fruits noirs et garrigue.", category: "jardins", subcategory: "Vin Rouge", badges: ["BIO"], nutrition: emptyNutrition, sortOrder: 206 },
  { id: "vin-rouge-chantecotes-btl", name: "Vallée du Rhône — Les Terres Vierges Chantecôtes BIO (Btl)", price: 30, volume: "75cl", description: "Bouteille Chantecôtes BIO.", category: "jardins", subcategory: "Vin Rouge", badges: ["BIO"], nutrition: emptyNutrition, sortOrder: 207 },
  { id: "vin-rouge-cairanne-verre", name: "Vallée du Rhône — Cru Cairanne Dom Chantecôtes (Verre)", price: 7, volume: "12cl", description: "Cairanne, cru du Rhône puissant et épicé.", category: "jardins", subcategory: "Vin Rouge", badges: [], nutrition: emptyNutrition, sortOrder: 208 },
  { id: "vin-rouge-cairanne-btl", name: "Vallée du Rhône — Cru Cairanne Dom Chantecôtes (Btl)", price: 35, volume: "75cl", description: "Bouteille Cru Cairanne.", category: "jardins", subcategory: "Vin Rouge", badges: [], nutrition: emptyNutrition, sortOrder: 209 },
  { id: "vin-rouge-stjoseph-btl", name: "Vallée du Rhône — St Joseph Amphore Or l'Arzelle Vins de Vienne", price: 65, volume: "75cl", description: "St Joseph en amphore, Syrah pure et minérale.", category: "jardins", subcategory: "Vin Rouge", badges: ["Premium"], nutrition: emptyNutrition, sortOrder: 210 },
  { id: "vin-rouge-haut-medoc-btl", name: "Bordeaux — Haut Médoc Closerie de Camensac 2016", price: 49, volume: "75cl", description: "Haut Médoc 2016, mature et élégant.", category: "jardins", subcategory: "Vin Rouge", badges: [], nutrition: emptyNutrition, sortOrder: 211 },
  { id: "vin-rouge-stemilion-btl", name: "Bordeaux — St Émilion Grand Cru Tauzinat Hermitage 2020", price: 55, volume: "75cl", description: "St Émilion Grand Cru, rond et soyeux.", category: "jardins", subcategory: "Vin Rouge", badges: ["Premium"], nutrition: emptyNutrition, sortOrder: 212 },
  { id: "vin-rouge-stjulien-btl", name: "Bordeaux — St Julien Fief de Lagrange 2021", price: 75, volume: "75cl", description: "St Julien 2021, second vin du Château Lagrange.", category: "jardins", subcategory: "Vin Rouge", badges: ["Premium"], nutrition: emptyNutrition, sortOrder: 213 },

  /* ── VIN BLANC ── */
  { id: "vin-blanc-igp-pontons-verre", name: "Atlantique — IGP Pontons du Ferret Sauvignon ADVINI (Verre)", price: 5, volume: "12cl", description: "Sauvignon vif et aromatique.", category: "jardins", subcategory: "Vin Blanc", badges: [], nutrition: emptyNutrition, sortOrder: 230 },
  { id: "vin-blanc-igp-pontons-btl", name: "Atlantique — IGP Pontons du Ferret Sauvignon (Btl)", price: 20, volume: "75cl", description: "Bouteille du même sauvignon.", category: "jardins", subcategory: "Vin Blanc", badges: [], nutrition: emptyNutrition, sortOrder: 231 },
  { id: "vin-blanc-igp-stguilhem-verre", name: "Languedoc — IGP St Guilhem Viognier Terroir Tradition (Verre)", price: 6, volume: "12cl", description: "Viognier, fruits blancs et fleurs.", category: "jardins", subcategory: "Vin Blanc", badges: [], nutrition: emptyNutrition, sortOrder: 232 },
  { id: "vin-blanc-igp-stguilhem-btl", name: "Languedoc — IGP St Guilhem Viognier (Btl)", price: 30, volume: "75cl", description: "Bouteille du Viognier St Guilhem.", category: "jardins", subcategory: "Vin Blanc", badges: [], nutrition: emptyNutrition, sortOrder: 233 },
  { id: "vin-blanc-chardonnay-verre", name: "Loire — L'Instant Chardonnay Dom Berthier (Verre)", price: 7, volume: "12cl", description: "Chardonnay de Loire, rond et tendu.", category: "jardins", subcategory: "Vin Blanc", badges: [], nutrition: emptyNutrition, sortOrder: 234 },
  { id: "vin-blanc-chardonnay-btl", name: "Loire — L'Instant Chardonnay Dom Berthier (Btl)", price: 35, volume: "75cl", description: "Bouteille L'Instant Chardonnay.", category: "jardins", subcategory: "Vin Blanc", badges: [], nutrition: emptyNutrition, sortOrder: 235 },

  /* ── VIN ROSÉ ── */
  { id: "vin-rose-pontons-verre", name: "Atlantique — IGP Pontons du Ferret Rosé (Verre)", price: 5, volume: "12cl", description: "Rosé léger, fruits rouges frais.", category: "jardins", subcategory: "Vin Rosé", badges: [], nutrition: emptyNutrition, sortOrder: 250 },
  { id: "vin-rose-pontons-btl", name: "Atlantique — IGP Pontons du Ferret Rosé (Btl)", price: 20, volume: "75cl", description: "Bouteille du même rosé.", category: "jardins", subcategory: "Vin Rosé", badges: [], nutrition: emptyNutrition, sortOrder: 251 },
  { id: "vin-rose-oh-lala-verre", name: "Languedoc — IGP Oc Oh La La (Verre)", price: 6, volume: "12cl", description: "Rosé fruité du Languedoc.", category: "jardins", subcategory: "Vin Rosé", badges: [], nutrition: emptyNutrition, sortOrder: 252 },
  { id: "vin-rose-oh-lala-btl", name: "Languedoc — IGP Oc Oh La La (Btl)", price: 30, volume: "75cl", description: "Bouteille IGP Oc Oh La La.", category: "jardins", subcategory: "Vin Rosé", badges: [], nutrition: emptyNutrition, sortOrder: 253 },
  { id: "vin-rose-stroch-verre", name: "Provence — AOP Provence St Roch (Verre)", price: 7, volume: "12cl", description: "Rosé de Provence, élégant et sec.", category: "jardins", subcategory: "Vin Rosé", badges: [], nutrition: emptyNutrition, sortOrder: 254 },
  { id: "vin-rose-stroch-btl", name: "Provence — AOP Provence St Roch (Btl)", price: 35, volume: "75cl", description: "Bouteille St Roch.", category: "jardins", subcategory: "Vin Rosé", badges: [], nutrition: emptyNutrition, sortOrder: 255 },

  /* ═══════════════ 🍕 PAZZO PAZZO — Italian Panuozzo da Fostin ═══════════════ */
  { id: "pazzo-bambino", name: "Bambino", price: 6, description: "Demi Panuozzo Marguerita.", category: "pazzo", subcategory: "Menu Enfant", badges: ["Kids -12 ans"], image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&h=600&fit=crop", nutrition: emptyNutrition, sortOrder: 1 },

  /* Antipasti */
  { id: "pazzo-charcuterie", name: "Assiette Charcuterie", price: 10, description: "Assortiments de charcuterie italienne.", category: "pazzo", subcategory: "Antipasti", badges: ["À partager"], image: "https://images.unsplash.com/photo-1626200419199-391ae4be7a41?w=600&h=600&fit=crop", nutrition: emptyNutrition, sortOrder: 10 },
  { id: "pazzo-complete", name: "Assiette Complète", price: 19.5, description: "Assortiments de charcuterie et fromage.", category: "pazzo", subcategory: "Antipasti", badges: ["À partager"], image: "https://images.unsplash.com/photo-1626200419199-391ae4be7a41?w=600&h=600&fit=crop", nutrition: emptyNutrition, sortOrder: 11 },
  { id: "pazzo-stracciatella", name: "Stracciatella di Burrata", price: 13.9, description: "Cœur de Burrata servi avec foccacia.", category: "pazzo", subcategory: "Antipasti", badges: ["Signature"], image: "https://images.unsplash.com/photo-1633436374961-09b92742047b?w=600&h=600&fit=crop", nutrition: emptyNutrition, sortOrder: 12,
    options: [{ id: "stracc-saveur", label: "Saveur", type: "single", required: true, choices: [
      { id: "nature", label: "Nature", priceExtra: 0 },
      { id: "pistache", label: "Pistache", priceExtra: 1 },
    ] }] },
  { id: "pazzo-apero-foccacia", name: "Apéro Foccacia", price: 8.9, description: "Concassé de tomates à l'ail, basilic et parmesan, légumes grillés ou jambon de Parme.", category: "pazzo", subcategory: "Antipasti", badges: [], image: "https://images.unsplash.com/photo-1620577375080-e0517dabd76e?w=600&h=600&fit=crop", nutrition: emptyNutrition, sortOrder: 13,
    options: [{ id: "foccacia-garn", label: "Garniture", type: "single", required: true, choices: [
      { id: "legumes", label: "Légumes grillés", priceExtra: 0 },
      { id: "jambon", label: "Jambon de Parme", priceExtra: 0 },
    ] }] },

  /* Salades */
  { id: "pazzo-salade-little-italy", name: "Salade Little Italy", price: 15.9, description: "Roquette, riz venere, jambon de parme, légumes grillés, tomates cerises, stracciatella di Burrata.", category: "pazzo", subcategory: "Salades", badges: [], image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&h=600&fit=crop", nutrition: emptyNutrition, sortOrder: 20 },
  { id: "pazzo-salade-rosmarino", name: "Salade Rosmarino", price: 15.9, description: "Roquette, riz venere, légumes grillés, tomates cerises, chèvre, miel, romarin.", category: "pazzo", subcategory: "Salades", badges: ["Végé ✨"], isVegan: false, image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&h=600&fit=crop", nutrition: emptyNutrition, sortOrder: 21,
    options: [{ id: "rosma-poulet", label: "Ajouter du poulet ?", type: "single", required: false, choices: [
      { id: "sans", label: "Sans poulet", priceExtra: 0 },
      { id: "avec", label: "Avec poulet", priceExtra: 0.6 },
    ] }] },

  /* Panuozzo */
  { id: "pazzo-marguerita", name: "Marguerita", price: 9.9, description: "Sauce tomate, mozzarella, basilic, légumes grillés.", category: "pazzo", subcategory: "Panuozzo", badges: ["Best-Seller 🔥"], image: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=600&h=600&fit=crop", nutrition: { allergens: ["Gluten", "Lactose"], energy: [], kcal: 720 }, sortOrder: 30 },
  { id: "pazzo-regina", name: "Regina", price: 13.5, description: "Sauce tomate, mozzarella, basilic, champignons, jambon blanc, légumes grillés.", category: "pazzo", subcategory: "Panuozzo", badges: [], image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600&h=600&fit=crop", nutrition: { allergens: ["Gluten", "Lactose"], energy: [], kcal: 780 }, sortOrder: 31,
    options: [{ id: "regina-variant", label: "Variante", type: "single", required: false, choices: [
      { id: "classic", label: "Classique", priceExtra: 0 },
      { id: "picante", label: "Picante", priceExtra: 0 },
      { id: "poulet", label: "Poulet", priceExtra: 0 },
    ] }] },
  { id: "pazzo-pistacchio", name: "Pistacchio", price: 16.9, description: "Mayonnaise à la pistache, jambon blanc, stracciatella di Burrata, légumes grillés.", category: "pazzo", subcategory: "Panuozzo", badges: ["Signature"], image: "https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=600&h=600&fit=crop", nutrition: { allergens: ["Gluten", "Lactose", "Fruits à coque"], energy: [], kcal: 880 }, sortOrder: 32,
    options: [{ id: "pist-poulet", label: "Avec poulet ?", type: "single", required: false, choices: [
      { id: "sans", label: "Sans poulet", priceExtra: 0 },
      { id: "avec", label: "Avec poulet", priceExtra: 0 },
    ] }] },
  { id: "pazzo-trufolino", name: "Trufolino", price: 17.5, description: "Mayonnaise à la truffe, crème de truffe, jambon blanc, stracciatella di Burrata, légumes grillés.", category: "pazzo", subcategory: "Panuozzo", badges: ["Signature", "Premium"], image: "https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?w=600&h=600&fit=crop", nutrition: { allergens: ["Gluten", "Lactose"], energy: [], kcal: 920 }, sortOrder: 33,
    options: [{ id: "truf-poulet", label: "Avec poulet ?", type: "single", required: false, choices: [
      { id: "sans", label: "Sans poulet", priceExtra: 0 },
      { id: "avec", label: "Avec poulet", priceExtra: 0 },
    ] }] },

  /* Desserts */
  { id: "pazzo-nutella", name: "Nutella", price: 12.9, description: "Nutella, Speculoos et noisettes torréfiées.", category: "pazzo", subcategory: "Desserts", badges: ["Best-Seller 🔥"], image: "https://images.unsplash.com/photo-1519915028121-7d3463d20b13?w=600&h=600&fit=crop", nutrition: emptyNutrition, sortOrder: 40 },
  { id: "pazzo-tiramisu", name: "Tiramisu", price: 6.5, description: "Tiramisu maison, saveur au choix.", category: "pazzo", subcategory: "Desserts", badges: ["Maison"], image: "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=600&h=600&fit=crop", nutrition: emptyNutrition, sortOrder: 41 },

  /* ═══════════════ 🍔 CANTINA AMERICA — Burgers, Wraps & Finger Food ═══════════════ */
  { id: "cantina-kids", name: "Kids", price: 6, description: "2 minis chicken cheese servi avec frites.", category: "cantina", subcategory: "Menu Enfant", badges: ["Kids -12 ans"], image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&h=600&fit=crop", nutrition: emptyNutrition, sortOrder: 1 },

  /* Finger Food */
  { id: "cantina-wings", name: "Chicken Wings x5", price: 7, description: "5 ailes de poulet, sauce au choix.", category: "cantina", subcategory: "Finger Food", badges: ["Best-Seller 🔥"], image: "https://images.unsplash.com/photo-1608039755401-742074f0548d?w=600&h=600&fit=crop", nutrition: emptyNutrition, sortOrder: 10 },
  { id: "cantina-planche", name: "Planche Cantina", price: 14.9, description: "Chicken wings, mozza sticks, onion rings, frites maison.", category: "cantina", subcategory: "Finger Food", badges: ["À partager"], image: "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f9c?w=600&h=600&fit=crop", nutrition: emptyNutrition, sortOrder: 11 },
  { id: "cantina-trilogie", name: "Trilogie de Mini Burger", price: 20, description: "Viande au choix, Cheese Classic, Cheese Bacon, Honey Brooklyn.", category: "cantina", subcategory: "Finger Food", badges: ["Signature", "À partager"], image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&h=600&fit=crop", nutrition: emptyNutrition, sortOrder: 12 },

  /* Burgers */
  { id: "cantina-cheese-classic", name: "Cheese Classic", price: 14.9, description: "Viande au choix, sauce california burger, pickles, salade, tomates, oignons, slice de cheddar.", category: "cantina", subcategory: "Burgers", badges: ["Best-Seller 🔥"], image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&h=600&fit=crop", nutrition: { allergens: ["Gluten", "Lactose"], energy: [], kcal: 780 }, sortOrder: 20,
    options: [
      { id: "cc-viande", label: "Viande", type: "single", required: true, choices: [
        { id: "boeuf", label: "Bœuf", priceExtra: 0 },
        { id: "pulled-pork", label: "Pulled Pork", priceExtra: 0 },
        { id: "poulet", label: "Poulet frit", priceExtra: 0 },
      ] },
      { id: "cc-side", label: "Accompagnement", type: "single", required: true, choices: [
        { id: "frites", label: "Frites maison", priceExtra: 0 },
        { id: "coleslaw", label: "Coleslaw", priceExtra: 0 },
      ] },
    ] },
  { id: "cantina-cheese-bacon", name: "Cheese Bacon", price: 16, description: "Viande au choix, sauce california burger, pickles, salade, tomates, oignons, slice de cheddar, bacon.", category: "cantina", subcategory: "Burgers", badges: [], image: "https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?w=600&h=600&fit=crop", nutrition: { allergens: ["Gluten", "Lactose"], energy: [], kcal: 870 }, sortOrder: 21,
    options: [
      { id: "cb-viande", label: "Viande", type: "single", required: true, choices: [
        { id: "boeuf", label: "Bœuf", priceExtra: 0 },
        { id: "pulled-pork", label: "Pulled Pork", priceExtra: 0 },
        { id: "poulet", label: "Poulet frit", priceExtra: 0 },
      ] },
      { id: "cb-side", label: "Accompagnement", type: "single", required: true, choices: [
        { id: "frites", label: "Frites maison", priceExtra: 0 },
        { id: "coleslaw", label: "Coleslaw", priceExtra: 0 },
      ] },
    ] },
  { id: "cantina-honey-brooklyn", name: "Honey Brooklyn", price: 16.9, description: "Viande au choix, mayo aïl et herbes, salade, tomates, fromage de chèvre, thym et miel.", category: "cantina", subcategory: "Burgers", badges: ["Signature"], image: "https://images.unsplash.com/photo-1561758033-d89a9ad46330?w=600&h=600&fit=crop", nutrition: { allergens: ["Gluten", "Lactose"], energy: [], kcal: 890 }, sortOrder: 22,
    options: [
      { id: "hb-viande", label: "Viande", type: "single", required: true, choices: [
        { id: "boeuf", label: "Bœuf", priceExtra: 0 },
        { id: "pulled-pork", label: "Pulled Pork", priceExtra: 0 },
        { id: "poulet", label: "Poulet frit", priceExtra: 0 },
      ] },
      { id: "hb-side", label: "Accompagnement", type: "single", required: true, choices: [
        { id: "frites", label: "Frites maison", priceExtra: 0 },
        { id: "coleslaw", label: "Coleslaw", priceExtra: 0 },
      ] },
    ] },

  /* Wraps */
  { id: "cantina-wrap-honey", name: "Wrap Honey Brooklyn", price: 14.9, description: "Poulet frit, mélange de crudités, mayo aïl et herbes, fromage de chèvre, thym et miel. Servi avec frites.", category: "cantina", subcategory: "Wraps", badges: [], image: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=600&h=600&fit=crop", nutrition: emptyNutrition, sortOrder: 30 },
  { id: "cantina-wrap-bacon", name: "Wrap Chicken Bacon", price: 13, description: "Poulet frit, mélange de crudités, sauce california burger, cheddar, bacon et oignons frits. Servi avec frites.", category: "cantina", subcategory: "Wraps", badges: [], image: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=600&h=600&fit=crop", nutrition: emptyNutrition, sortOrder: 31 },

  /* Plats */
  { id: "cantina-cesar", name: "Salade César", price: 14.9, description: "Salade iceberg, poulet croustillant, tomates cerises, parmesan, œuf, croûtons, sauce césar.", category: "cantina", subcategory: "Salades & Plats", badges: [], image: "https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=600&h=600&fit=crop", nutrition: emptyNutrition, sortOrder: 40 },
  { id: "cantina-fish-chips", name: "Fish'n'Chips", price: 16, description: "Pavé de cabillaud pané servi avec frites et sauce tartare.", category: "cantina", subcategory: "Salades & Plats", badges: [], image: "https://images.unsplash.com/photo-1579208030886-b937da0925dc?w=600&h=600&fit=crop", nutrition: { allergens: ["Gluten", "Poisson"], energy: [], kcal: 820 }, sortOrder: 41 },

  /* Sides & Desserts */
  { id: "cantina-frites", name: "Frites Maison", price: 5, description: "Frites maison croustillantes (supplément cheddar +1,5€).", category: "cantina", subcategory: "Sides & Desserts", badges: [], image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=600&h=600&fit=crop", nutrition: emptyNutrition, sortOrder: 50,
    options: [{ id: "frites-cheddar", label: "Cheddar fondu ?", type: "single", required: false, choices: [
      { id: "non", label: "Sans", priceExtra: 0 },
      { id: "oui", label: "Avec cheddar", priceExtra: 1.5 },
    ] }] },
  { id: "cantina-pancakes", name: "Pancakes", price: 6.5, description: "Pancakes moelleux, Nutella ou sirop d'érable au choix.", category: "cantina", subcategory: "Sides & Desserts", badges: [], image: "https://images.unsplash.com/photo-1528207776546-365bb710ee93?w=600&h=600&fit=crop", nutrition: emptyNutrition, sortOrder: 51,
    options: [{ id: "pancakes-saveur", label: "Garniture", type: "single", required: true, choices: [
      { id: "nutella", label: "Nutella", priceExtra: 0 },
      { id: "erable", label: "Sirop d'érable", priceExtra: 0 },
    ] }] },

  /* ═══════════════ 🌶️ Ô LITTLE SAIGON — Tapas vietnamiens ═══════════════ */
  { id: "saigon-kids", name: "Kids — Poulet frit & Riz", price: 6, description: "Poulet frit servi avec riz blanc.", category: "saigon", subcategory: "Menu Enfant", badges: ["Kids -12 ans"], image: "https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?w=600&h=600&fit=crop", nutrition: emptyNutrition, sortOrder: 1 },

  /* Tapas */
  { id: "saigon-nems-poulet", name: "Nems Poulet x3", price: 6.5, description: "3 nems croustillants au poulet et légumes.", category: "saigon", subcategory: "Tapas", badges: ["Best-Seller 🔥"], image: "https://images.unsplash.com/photo-1606755962773-d324e2dabd62?w=600&h=600&fit=crop", nutrition: { allergens: ["Gluten"], energy: [], kcal: 380 }, sortOrder: 10 },
  { id: "saigon-beignets-legumes", name: "Beignets de Légumes x6", price: 5, description: "6 beignets de légumes frits, croustillants à souhait.", category: "saigon", subcategory: "Tapas", badges: ["Végé ✨"], isVegan: true, image: "https://images.unsplash.com/photo-1625938144723-13591c2c61f3?w=600&h=600&fit=crop", nutrition: emptyNutrition, sortOrder: 11 },
  { id: "saigon-beignets-crevettes", name: "Beignets de Crevettes x3", price: 6.5, description: "3 beignets de crevettes en pâte tempura.", category: "saigon", subcategory: "Tapas", badges: [], image: "https://images.unsplash.com/photo-1625944525200-0e85aa31de14?w=600&h=600&fit=crop", nutrition: { allergens: ["Crustacés", "Gluten"], energy: [], kcal: 320 }, sortOrder: 12 },
  { id: "saigon-poulet-frit", name: "Poulet Frit 100g", price: 7, description: "100g de poulet frit mariné, croustillant et juteux.", category: "saigon", subcategory: "Tapas", badges: [], image: "https://images.unsplash.com/photo-1562967914-608f82629710?w=600&h=600&fit=crop", nutrition: emptyNutrition, sortOrder: 13 },
  { id: "saigon-planche", name: "Planche Ô Saigon", price: 15, description: "Nems poulet, beignets de légumes, beignets de crevettes, poulet frit.", category: "saigon", subcategory: "Tapas", badges: ["À partager", "Signature"], image: "https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?w=600&h=600&fit=crop", nutrition: emptyNutrition, sortOrder: 14 },

  /* Plats */
  { id: "saigon-salade-viet", name: "Salade Viet", price: 12, description: "Salade vietnamienne fraîche, herbes, vermicelles et sauce nuoc-mâm.", category: "saigon", subcategory: "Plats", badges: ["Végé ✨"], isVegan: false, image: "https://images.unsplash.com/photo-1547592180-85f173990554?w=600&h=600&fit=crop", nutrition: emptyNutrition, sortOrder: 20 },
  { id: "saigon-bobun", name: "Bobun", price: 14, description: "Bol de vermicelles, herbes fraîches, légumes croquants, viande au choix.", category: "saigon", subcategory: "Plats", badges: ["Best-Seller 🔥"], image: "https://images.unsplash.com/photo-1583224994076-ae7e1ae0c1bd?w=600&h=600&fit=crop", nutrition: emptyNutrition, sortOrder: 21,
    options: [{ id: "bobun-viande", label: "Garniture", type: "single", required: true, choices: [
      { id: "boeuf", label: "Bœuf", priceExtra: 0 },
      { id: "poulet", label: "Poulet", priceExtra: 0 },
      { id: "vege", label: "Végétarien", priceExtra: 0 },
    ] }] },
  { id: "saigon-bobun-crevettes", name: "Bobun Crevettes", price: 16, description: "Bol de vermicelles, herbes fraîches, légumes croquants et crevettes sautées.", category: "saigon", subcategory: "Plats", badges: [], image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&h=600&fit=crop", nutrition: { allergens: ["Crustacés"], energy: [], kcal: 520 }, sortOrder: 22 },
  { id: "saigon-porc-caramel", name: "Porc au Caramel", price: 15, description: "Émincés de porc mijotés au caramel sucré-salé, riz parfumé.", category: "saigon", subcategory: "Plats", badges: ["Signature"], image: "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=600&h=600&fit=crop", nutrition: emptyNutrition, sortOrder: 23 },

  /* Desserts */
  { id: "saigon-fruits-exotiques", name: "Salade de Fruits Exotiques", price: 6, description: "Mangue, ananas, fruits de la passion, citron vert.", category: "saigon", subcategory: "Desserts", badges: ["Végé ✨"], isVegan: true, image: "https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?w=600&h=600&fit=crop", nutrition: emptyNutrition, sortOrder: 30 },
  { id: "saigon-nem-banane", name: "Nem Banane Nutella x2", price: 8, description: "2 nems frits banane et Nutella, dessert gourmand.", category: "saigon", subcategory: "Desserts", badges: ["Best-Seller 🔥"], image: "https://images.unsplash.com/photo-1519676867240-f03562e64548?w=600&h=600&fit=crop", nutrition: { allergens: ["Gluten", "Fruits à coque"], energy: [], kcal: 420 }, sortOrder: 31 },
];

export const categories = [
  { id: "jardins", label: "🍹 Les Jardins", description: "Cocktails signature & boissons du rooftop" },
  { id: "pazzo", label: "🍕 Pazzo Pazzo", description: "Italian Panuozzo da Fostin" },
  { id: "cantina", label: "🍔 The Butcher / Cantina", description: "Burgers, wraps & finger food" },
  { id: "saigon", label: "🌶️ Ô Little Saigon", description: "Tapas et plats vietnamiens" },
];
