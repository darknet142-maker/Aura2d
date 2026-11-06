# Architecture Modulaire par Domaine Métier (Feature-Based Architecture)

Cette documentation définit l'architecture modulaire officielle de la plateforme **DROP (Gabon & CEMAC)** afin de garantir une maintenabilité à 100 % à mesure que la plateforme grandit.

---

## 1. Plafonds Stricts par Type de Fichier

| Type de fichier | Plafond maximal | Responsabilité unique |
| :--- | :---: | :--- |
| **Composant d'interface (UI)** | **150 lignes** | Affichage visuel pur, zéro calcul financier ni appel réseau direct |
| **Page ou Écran (`*View.tsx` / `*Page.tsx`)** | **200 lignes** | Assemblage des sous-composants et appel d'un Hook personnalisé |
| **Hook personnalisé (`use*.ts`)** | **120 lignes** | État local, effets de bord et interactions d'une seule fonctionnalité |
| **Service métier ou API (`*.service.ts`)** | **150 lignes** | Fonctions pures (calcul des royalties 60/40, TVA, DGI, requêtes Supabase) |
| **Fichier de types ou constantes (`*.types.ts`)** | **100 lignes** | Interfaces TypeScript et paramètres fixes |

---

## 2. Arborescence selon les 6 Briques Métier

```text
src/
├── App.tsx                         # Chef d'orchestre global & synchronisation Temps Réel
├── main.tsx                        # Point d'entrée React
│
├── shared/                         # Briques réutilisables dans toute l'application
│   ├── ui/                         # Composants atomiques (RankBadge, NotificationSystem)
│   ├── utils/                      # Formatage temporel, monétaire FCFA, helpers binaires/DRM
│   └── types/                      # Contrats de données globaux (Track, AlbumNode, AppUser)
│
├── mocks/                          # Données statiques de démonstration (zéro donnée dans l'UI)
│   ├── catalogue.mock.ts           # Catalogue initial calibré aux seuils ECG Gabon
│   ├── users.mock.ts               # Comptes auditeurs et historiques d'écoute
│   └── community.mock.ts           # Abonnés artistes, recommandations et notifications
│
└── features/                       # 1 dossier autonome par domaine métier (6 Lots)
    ├── listener/                   # Lot 1 : Lecteur 2D/3D, playlists, cache hors ligne, AuthPortalView
    ├── payments/                   # Lot 2 : Airtel Money, Moov Money, Pass 24h/Hebdo/Mensuel, Fan Tipping
    ├── artist-portal/              # Lot 3 : Portail Artistes/Labels/Équipe, Splits, Magazine DROP Trend
    ├── royalties/                  # Lot 4 : Moteur User-Centric 60/40, BUGADA 12%, DGI 9,5%/20%, Modèle 36M
    ├── backoffice/                 # Lot 5 : Administration modulaire, Régie Bannières, BDD Cloud, DRM Sandbox
    └── b2b-horeca/                 # Lot 6 : Licence Publique Bar/Snack/Maquis, Jukebox QR, Anti-dilution
```

---

## 3. Règle des 4 Couches par Fonctionnalité

Chaque fonctionnalité complexe est systématiquement divisée en 4 couches :
1. **Contrat de données (`.types.ts`)** : Structure stricte d'une piste, d'un split ou d'un état d'édition.
2. **Service pur (`.service.ts` / `economics/*.ts`)** : Calculs mathématiques purs hors de React (User-Centric 60/40, TVA 18 % conditionnelle au seuil de 60M FCFA HT, retenue BNC DGI).
3. **Logique d'état (`use*.ts` / `*Store.ts`)** : Gestion des états, persistance locale et synchronisation Supabase.
4. **Vue visuelle (`components/*.tsx`)** : Balisage JSX accessible et symétrique multi-axes (Mobile, Tablette, PC).

---

## 4. Garde-fous Automatiques (ESLint & Assistant IA)

- [`eslint.config.js`](file:///c:/Users/HP%20VICTUS/Documents/Aura2d%20-%20music%20stream%20app/Drop/Aura2d/eslint.config.js) : Règles `max-lines` (250), `max-lines-per-function` (80) et `complexity` (12).
- [`.cursorrules`](file:///c:/Users/HP%20VICTUS/Documents/Aura2d%20-%20music%20stream%20app/Drop/Aura2d/.cursorrules) : Directives permanentes d'architecture modulaire pour tous les assistants IA.

