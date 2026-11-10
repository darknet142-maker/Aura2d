# DROP — Plateforme de Streaming Studio Haute-Fidélité & Broadcast

> **Écosystème Musical** : Streaming Hi-Res Master (-14.0 LUFS), Carrousel 3D Cover Flow, Moteur de Royalties User-Centric 60/40, Intégration Mobile Money & Économie des Jetons Sponsorisés.

---

## 🎧 Présentation du Produit

**DROP** est la plateforme de streaming musical studio conçue pour l'excellence acoustique :
- **Lecteur Immersif 3D Cover Flow** avec navigation gestuelle fluide, carrousel d'albums matériellement accéléré et détection instantanée du Drop.
- **Mastering Broadcast (-14.0 LUFS)** : Audio HD sans perte, égaliseur paramétrique 5 bandes, spatialisation binaurale et compresseur dynamique.
- **Économie Circulaire & Double Accès** :
  - **Abonnements Directs** : Pass 24H, 7 Jours et Mensuel via Mobile Money Gabon (Airtel Money & Moov Money).
  - **Missions Sponsorisées (Modèle A)** : Les auditeurs accomplissent des missions d'écoute qualifiées ($\ge 30$ secondes) financées par les marques pour gagner des jetons et débloquer leurs pass 100% gratuitement.
- **Tour de Contrôle Admin Studio SaaS 2.0** : Gestion du répertoire, téléversement avec analyse spectrale et forme d'onde 64 bandes, bordereau BUGADA (12% droits d'auteur), paie Master (48% droits voisins) et retenue à la source DGI BNC (9,5%).
- **Cache Hors-Ligne & DRM Éco-Data** : Téléchargement chiffré par ticket QR opaque à usage unique (TTL 120s) et écoute hors-ligne sécurisée.

---

## 🚀 Démarrage Rapide

### Prérequis
- Node.js $\ge 18$
- Base de données Cloud Supabase configurée

### Installation
```bash
npm install
```

### Lancement du Serveur de Développement & Hub Temps Réel
```bash
npm run dev
# Lance le hub central Node Express + Vite sur http://localhost:3000
```

### Build de Production
```bash
npm run build
```

### Tests Automatisés
```bash
npm run test:tokens # Valide les 23 tests du journal comptable et des transactions
npm run lint        # Vérification TypeScript stricte
```

---

## 🏛 Architecture Technique

```
src/
├── components/          # Composants UI réutilisables (Lecteur 3D, CoverFlow, Pochettes SVG)
├── features/
│   ├── audio-dsp/       # Moteur audio Web Audio API, EQ paramétrique & spatialisation
│   ├── backoffice/      # Tour de contrôle Admin Studio, Upload, Répértoire & Sécurité
│   ├── downloads/       # Tickets de téléchargement QR sécurisés & DRM hors-ligne
│   ├── listener/        # Vues auditeurs (Lecteur, Central, Auth, Bibliothèque)
│   ├── payments/        # Intégrations Mobile Money (+241) & Passerelle de paiement
│   ├── royalties/       # Moteur de calcul User-Centric, BUGADA 12% & DGI 9,5%
│   ├── social-feed/     # Fil communautaire, statuts éphémères & avis certifiés
│   └── tokens/          # Journal comptable append-only des jetons & missions sponsors
├── services/            # Services cloud, passerelle Supabase, hub SSE & audio global
└── shared/              # Primitives UI (Motion spring), types de domaine & constantes
```

---

## 🔒 Sécurité & Conformité CEMAC
- **Anti-Hybride Absolu** : Séparation hermétique entre flux Mobile Money et jetons sponsorisés.
- **Idempotence Stricte** : Journal comptable append-only empêchant toute double dépense.
- **Conformité Réglementaire** : Décret BUGADA n°0282/PR/MCJSA et directives fiscales DGI.

