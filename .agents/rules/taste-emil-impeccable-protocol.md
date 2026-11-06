---
trigger: always_on
description: Protocole obligatoire combinant simultanément Taste Skill, Emil Kowalski Skills et Impeccable (avec break-ui) sur toute création ou modification UI/UX.
---

# PROTOCOLE COMBINÉ OBLIGATOIRE : TASTE SKILL + EMIL KOWALSKI + IMPECCABLE

Pour chaque composant, écran ou amélioration UI/UX de l'application **DROP (+241)**, tu dois systématiquement appliquer simultanément ces 3 compétences :

## 1. DIRECTION ARTISTIQUE (Taste Skill v2.5)
- **Identité « App Native de Streaming Studio Broadcast »** : Surfaces obsidienne teintées (`#080A0F`, `#0D1017`, `#121621`), accents identitaires Rubis DROP (`#DE1B34`), Or Broadcast (`#F59E0B`) et Émeraude ECG (`#10B981`).
- **Interdiction absolue du violet/lavande générique IA** (`violet-*`, `purple-*`, `indigo-*`) et des illustrations génériques.
- **Placeholders visuels textuels et SVG locaux** : Si une pochette (`coverUrl`) est absente ou en erreur, afficher un placeholder vectoriel local haute fidélité (disque vinyle gravé SVG + monogramme + titre/artiste + badge `-14.0 LUFS`).
- **Égalité des marges et zéro espace mort (`blank gaps`)** : Bords gauche/droit symétriques et grilles auto-adaptatives sans débordement.

## 2. INGÉNIERIE DU MOUVEMENT (Emil Kowalski)
- **Physique de ressort (`spring`) réaliste** via `motion/react` ou courbes cubiques fortes (`--ease-out: cubic-bezier(0.23, 1, 0.32, 1)`). Jamais de `ease-in` ni de `transition: all`.
- **Durée strictement inférieure à 300ms** (`120ms–240ms`) pour toutes les interactions UI courantes.
- **Animation d'entrée subtile au montage** : `initial={{ opacity: 0, scale: 0.97, y: 6 }}` vers `animate={{ opacity: 1, scale: 1, y: 0 }}` (jamais `scale(0)`).
- **Gating matériel et accessibilité** : `@media (hover: hover) and (pointer: fine)` pour le survol et respect de `prefers-reduced-motion`.

## 3. CONTRÔLE QUALITÉ & ROBUSTESSE (Impeccable & `break-ui`)
- **Zéro noir pur (`#000000` / `bg-black`)** : Utiliser uniquement des noirs obsidienne teintés (`#07090E`, `#0B0E16`) et des ombres teintées avec décalage vertical (`0 10px 28px -6px rgba(6, 8, 14, 0.85)`).
- **Contraste WCAG 2.2 AA strict** : Texte principal `#F5F2EB`, texte secondaire teinté `#A3A9BA` ($\ge 4.8:1$), jamais de gris terne illisible.
- **Résilience `break-ui` (80+ caractères & média manquant)** : Tout conteneur flex/grid texte doit posséder `min-w-0` + `truncate` ou `line-clamp-2 break-words`, les icônes/avatars/boutons d'action doivent posséder `shrink-0`, et chaque composant doit résister à un titre de 80+ caractères et une image manquante sans décalage d'axe.
