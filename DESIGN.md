# DESIGN.md — Système de Design DROP (+241) • Protocole Taste + Emil Kowalski + Impeccable

## 1. Justification de la Direction Artistique (En une phrase)
> **Direction artistique « Studio Broadcast Obsidienne & Rubis Gabon (+241) »** : Conçue comme une application native de streaming musical et console de mastering `-14.0 LUFS`, l'interface associe des surfaces obsidienne profondes teintées (`#080A0F` / `#0D1017`), des accents identitaires Rubis (`#DE1B34`) et Or Broadcast (`#F59E0B`), une typographie à chasse optique précise et une physique de ressort (`< 240ms`) sans aucun violet générique ni noir pur `#000`.

## 2. Tokens de Couleurs & Contrastes (Impeccable Craft Floor)
- **Surfaces Obsidienne (Zéro `#000000`)** :
  - Fond racine : `#080A0F`
  - Panneau primaire : `#0D1017`
  - Carte / Console : `#07090E`
  - Surface élevée : `#131824`
- **Typographie & Contrastes ($\ge 4.8:1$ WCAG AA)** :
  - Texte primaire : `#F5F2EB` (Ivoire chaud)
  - Texte secondaire teinté : `#A3A9BA` (Ardoise claire teintée — jamais de gris illisible)
- **Accents Sémantiques (Zéro Violet/Lavande)** :
  - Action primaire & Marque DROP : `#DE1B34` (Rubis Gabon)
  - Zone Drop & Audio `-14.0 LUFS` : `#F59E0B` (Or Broadcast)
  - Validation ECG & Cloud Sync : `#10B981` (Émeraude Studio)
  - Télémétrie & Content ID : `#38BDF8` (Cyan Acoustique)

## 3. Ingénierie du Mouvement (Emil Kowalski)
- **Courbes CSS** :
  - `--ease-out: cubic-bezier(0.23, 1, 0.32, 1)`
  - `--ease-in-out: cubic-bezier(0.77, 0, 0.175, 1)`
  - `--ease-drawer: cubic-bezier(0.32, 0.72, 0, 1)`
- **Physique de Ressort (`motion/react`)** :
  - Entrée de vue/carte : `{ type: 'spring', duration: 0.24, bounce: 0.08 }` depuis `{ opacity: 0, scale: 0.97, y: 6 }`
  - Micro-interaction clic/hover : `{ type: 'spring', duration: 0.16, bounce: 0.12 }` (`< 300ms`)

## 4. Résilience & Crash-Test (`break-ui`)
- Titres de 80+ caractères contenus via `min-w-0`, `truncate` ou `line-clamp-2` sans jamais pousser les boutons d'action (`shrink-0`) hors de l'écran.
- Fallback vectoriel et typographique local automatique dans `CoverArtwork` lorsque `coverUrl` est vide ou inaccessible.
