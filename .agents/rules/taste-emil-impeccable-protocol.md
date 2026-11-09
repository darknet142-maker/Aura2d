---
trigger: always_on
description: Protocole Permanent Combiné des 5 Compétences (Taste Skill + Emil Kowalski + Impeccable + Staff-Frontend + Unslop) & Obligation de Planification Avant Code.
---

# PROTOCOLE PERMANENT OBLIGATOIRE DES 5 COMPÉTENCES : TASTE SKILL + EMIL KOWALSKI + IMPECCABLE + STAFF-FRONTEND + UNSLOP

Pour chaque composant, écran, audit ou modification de l'application **DROP (+241)**, tu dois systématiquement et simultanément appliquer ces **5 compétences** ET **toujours élaborer un plan structuré avant de coder quoi que ce soit** :

## 0. RÈGLE ABSOLUE : PLANIFICATION AVANT CODE (`Plan-First`)
- **Interdiction de coder à l'aveugle** : Avant d'écrire ou modifier la moindre ligne de code applicatif, tu dois toujours formuler un plan d'ingénierie et de design explicite (diagnostic, architecture cible, matrice d'états, contrat visuel et étapes de vérification).

## 1. ARCHITECTURE & MATRICE D'ÉTATS (`staff-frontend`)
- **Processus Phases A → F** : Inspection (`read_file`) $\rightarrow$ Conception & Plan $\rightarrow$ Implémentation modulaire $\rightarrow$ Validation technique & visuelle (`tsc --noEmit`, `vite build`, navigateur) $\rightarrow$ Correction $\rightarrow$ Livraison structurée.
- **Matrice complète des états d'interface** : Chargement initial (Skeletons à dimensions fixes, CLS = 0), rafraîchissement non bloquant, état vide explicite avec action directe, aucun résultat de filtre/recherche avec bouton de réinitialisation, erreur récupérable, verrouillage contre la double soumission.
- **Zéro Monolithe** : Séparation stricte entre écrans/pages ($\le 200$ lignes), composants UI ($\le 150$ lignes), hooks personnalisés ($\le 120$ lignes) et services métier ($\le 150$ lignes).

## 2. DIRECTION ARTISTIQUE (`design-taste-frontend` / Taste Skill v2.5)
- **Identité « App Native de Streaming Studio Broadcast »** : Surfaces obsidienne teintées (`#080A0F`, `#0D1017`, `#131722`), accents identitaires Rubis DROP (`#DE1B34`), Or Broadcast (`#F59E0B`) et Émeraude ECG (`#10B981`).
- **Retenue visuelle & Anti-Slop** : Zéro violet/lavande générique IA (`violet-*`, `purple-*`, `indigo-*`), zéro empilement de badges multicolores (« badge soup »), zéro bordure néon contradictoire sur un même écran, maximum 3 points de données par carte en vue liste/grille.
- **Placeholders visuels textuels et SVG locaux** : Si une pochette (`coverUrl`) est absente ou en erreur, afficher un placeholder vectoriel local haute fidélité (disque vinyle gravé SVG + monogramme + titre/artiste + badge `-14.0 LUFS`).

## 3. INGÉNIERIE DU MOUVEMENT (`emil-design-eng` / Emil Kowalski)
- **Physique de ressort (`spring`) réaliste** via `motion/react` ou courbes cubiques fortes (`--ease-out: cubic-bezier(0.23, 1, 0.32, 1)`). Jamais de `ease-in` ni de `transition: all`.
- **Durée strictement inférieure à 300ms** (`120ms–240ms`) pour toutes les interactions UI courantes.
- **Animation d'entrée subtile au montage** : `initial={{ opacity: 0, scale: 0.97, y: 6 }}` vers `animate={{ opacity: 1, scale: 1, y: 0 }}` (jamais `scale(0)`).
- **Continuité spatiale** : Les tiroirs et feuilles (`Central`, `Lyrics`, `Queue`, `Analytics Sheets`) doivent glisser physiquement avec inertie (`y: '100%' -> 0` ou `scale: 0.96 -> 1`), jamais apparaître/disparaître brutalement.

## 4. CONTRÔLE QUALITÉ & ROBUSTESSE (`impeccable` & `break-ui`)
- **Zéro noir pur (`#000000` / `bg-black`)** : Utiliser uniquement des noirs obsidienne teintés (`#07090E`, `#080A0F`, `#0D1017`) et des ombres teintées avec décalage vertical (`0 14px 34px -12px rgba(6, 8, 14, 0.88)`).
- **Contraste WCAG 2.2 AA strict** : Texte principal `#F8FAFC`, texte secondaire teinté `#A3A9BA` ($\ge 4.8:1$), jamais de gris terne illisible.
- **Résilience `break-ui` (80+ caractères & média manquant)** : Tout conteneur flex/grid texte doit posséder `min-w-0` + `truncate` ou `line-clamp-2 break-words`, les icônes/avatars/boutons d'action doivent posséder `shrink-0`, et chaque composant doit résister à un titre de 80+ caractères et une image manquante sans décalage d'axe.

## 5. DÉSLOPAGE CHIRURGICAL & CRAFT SÉQUENTIEL (`unslop` / Damir Sokolovsky)
- **Les 9 passes séquentielles obligatoires** : 
  1. *Espacements* : Grille 4px stricte, alignements de colonnes rigides, suppressions des valeurs arbitraires (`mt-[13px]`).
  2. *Couleurs* : Surfaces calmes teintées graphite/obsidienne, zéro dégradé de teinte, un seul accent actif dans le chrome.
  3. *Icônes* : Éradication totale des emojis fonctionnels (remplacés par des icônes au trait homogènes 16/18px stroke 1.5).
  4. *Copywriting* : Zéro superlatif IA (« supercharge », « seamless », « magic »), suppression des points finaux sur les libellés courts, suppression des points d'exclamation (`!`/`!!`).
  5. *Typographie* : Graisses 400 et 500 (600 max), sentence case (zéro majuscules étirées), chiffres tabulaires (`tabular-nums`).
  6. *Mise en page* : Un seul élément vedette par écran (*One bright element*), chrome discret et au service du contenu audio.
  7. *Détails* : Rayons de courbure emboîtés mathématiquement (`r_inner = r_outer - padding`), keycaps sobres au lieu de pilules saturées.
  8. *Visuels & Matériaux* : Matières tangibles de studio (vinyle physique, galvanomètre analogique, bandes magnétiques, crête-mètres) ; rejet absolu des blobs et orbes abstraits IA.
  9. *Mouvement sobre* : Suppression des pulsations en boucle (`animate-pulse`/`animate-ping` non justifiées), micro-transitions ciblées sur propriétés compositées.
- **Le « Template Check »** : Si en remplaçant la marque 'DROP' par un autre produit ou gabarit générique, l'interface semblait encore fonctionner, l'écran a échoué. Chaque écran doit respirer intimement l'identité studio broadcast de DROP.
