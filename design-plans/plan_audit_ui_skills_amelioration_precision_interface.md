# Improve UI: Audit de Surface DROP Central & Chrome Studio Broadcast

## Design language
- **Audited surface** : DROP Central Hub (`CentralHubWorkspace.tsx`), Dock de Contrôle Bas (`bottomPillMenu.css`), Accès Rapide AssistiveTouch (`AssistiveFloatingMenu.tsx`), et Fond Étoilé Animé (`UserCelestialStarBackground.css`).
- **Design sources** : `src/index.css`, `.agents/rules/taste-emil-impeccable-protocol.md`, `.agent/skills/baseline-ui/SKILL.md`, `.agent/skills/improve-ui/SKILL.md`.
- **Documented decisions** :
  - *Palette Studio Broadcast* : Obsidienne `#080A0F`, `#0D1017`, Rubis `#DE1B34`, Or Broadcast `#F59E0B`, Émeraude `#10B981`.
  - *Typographie & Données* : Sentence case, `tabular-nums` obligatoire pour les nombres et compteurs réactifs, `text-balance` pour les en-têtes et titres de sections.
  - *Viewport & Dimensions* : `h-dvh` ou flex adaptatif au lieu de `h-screen`, respect de `safe-area-inset`.
  - *Échelle z-index ordonnée* : zéro z-index arbitraire démesuré (`z-[9999]`), utilisation de l'échelle contractuelle (`z-40`, `z-50`, `z-[180]`, `z-[190]`).
  - *Performance & Compositor* : Composite-only (`transform`, `opacity`), feedback tactile $\le 200$ms, opacité du fond étoilé divisée par 2 (`0.25`).
- **Governing owners and consumers** :
  - `src/features/listener/central/CentralHubWorkspace.tsx`
  - `src/features/listener/components/UserCelestialStarBackground.css`
  - `src/features/listener/components/AssistiveFloatingMenu.tsx`
  - `src/features/backoffice/components/layout/AdminStudio2Layout.tsx`
- **Explicit exceptions** : None documented

---

## Findings

| # | Problem | Evidence | Proposed change | Scope | Confidence |
|---|---|---|---|---|---|
| 1 | Sauts de largeur au changement de chiffres (Compteur de jetons, badges de notifications et dock) faute de chiffres tabulaires (`tabular-nums`). | `CentralHubWorkspace.tsx:176, 194, 514` utilisent `font-mono` sans `tabular-nums`, provoquant un micro-déplacement horizontal (layout jitter) lors de l'incrémentation du solde ou du chargement des badges. | Ajouter `tabular-nums` aux spans de données numériques dans `CentralHubWorkspace.tsx` et `RecurringRewardTriggerBadge.tsx`. | `src/features/listener/central/CentralHubWorkspace.tsx`, `src/features/tokens/components/RecurringRewardTriggerBadge.tsx` | High |
| 2 | En-têtes de rails musicaux sans équilibrage typographique (`text-balance`), risquant des retours à la ligne inélégants ou des orphelins sur écrans étroits. | `CentralHubWorkspace.tsx:287, 340, 390` affichent des titres de section `h2` ("Catégories & Métiers", "Drops en Vedette", "Beats & Instrumentales") sans `text-balance`. | Ajouter la classe utilitaire `text-balance` sur tous les titres de section de `CentralHubWorkspace.tsx`. | `src/features/listener/central/CentralHubWorkspace.tsx` | High |
| 3 | Débordement d'échelle z-index arbitraire (`z-[9999]`) sur le bouton AssistiveTouch iPhone, rompant l'échelle ordonnée du système. | `AssistiveFloatingMenu.tsx:187` déclare `className="fixed z-[9999] ..."` ce qui viole la règle Baseline UI "fixed z-index scale (no arbitrary z-*)". | Harmoniser à `z-[190]`, garantissant la superposition au-dessus du dock (`z-50`) et de Central (`z-40`) tout en restant sous les dialogues critiques (`z-[200]`). | `src/features/listener/components/AssistiveFloatingMenu.tsx` | High |

---

## Improve first
**Finding #1 (Chiffres Tabulaires `tabular-nums` sur les flux réactifs de jetons et badges)** : 
Le compteur de jetons est le centre d'attention immédiat de l'auditeur et du système de récompense. Sans `tabular-nums`, chaque variation de chiffre provoque une micro-oscillation visuelle de la pilule d'en-tête, dégradant la sensation de fluidité native broadcast.

---

# Plan de Travail Détaillé (Mise en Œuvre Immédiate)

### Phase 1 : Opacité du Fond Étoilé (Exécutée)
- [x] Réduction de moitié de l'opacité du fond étoilé animé (`opacity: 0.25` dans `UserCelestialStarBackground.css`).
- [x] Vérification de la lisibilité des cartes et du chrome au premier plan.

### Phase 2 : Intégration du Skill UI Skills au Protocole (Exécutée)
- [x] Décompression et installation des 9 skills UI Skills dans `.agents/skills` et `.agent/skills`.
- [x] Mise à niveau de la règle permanente `.agents/rules/taste-emil-impeccable-protocol.md` pour officialiser le protocole des **6 compétences**.

### Phase 3 : Application des Recommandations de l'Audit UI Skills (En cours)
1. **Stabilisation Typographique Tabulaire (`tabular-nums`)** :
   - Mettre à jour `CentralHubWorkspace.tsx` (solde jetons, badges notifications et dock).
   - Mettre à jour `RecurringRewardTriggerBadge.tsx` (indicateur +X).
2. **Équilibrage des Titres de Section (`text-balance`)** :
   - Mettre à jour les titres de rails dans `CentralHubWorkspace.tsx`.
3. **Harmonisation de l'Échelle Z-Index** :
   - Remplacer `z-[9999]` par `z-[190]` dans `AssistiveFloatingMenu.tsx`.
4. **Validation de Rendu Mobile** :
   - Remplacer `h-screen` par `h-dvh` dans `AdminStudio2Layout.tsx`.

### Phase 4 : Assurance Qualité & Déploiement
- [ ] Exécuter `node ./node_modules/typescript/bin/tsc --noEmit`.
- [ ] Exécuter `node scripts/verify-taste-emil-impeccable.mjs`.
- [ ] Exécuter `node ./node_modules/vite/bin/vite.js build`.
- [ ] Commit Git & Push sur `origin/main`.
