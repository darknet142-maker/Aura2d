# Plan d'Implémentation — Expérience Trend 30s 100% Plein Écran & Aperçu Instantané

## 1. Objectif & Parcours Utilisateur
Simplifier et épurer intégralement l'interface de création de vidéo Trend (`DropTrendMagazineStudio.tsx`) pour offrir une expérience **100% plein écran (`fixed inset-0`)**, sans aucun panneau latéral, formulaire ou saisie de texte, structurée en **2 écrans directs** fidèles aux captures de référence :

---

## 2. Étape 1 — Caméra en Plein Écran & Enregistrement Direct
Dès le clic sur le bouton **Trend (`30s`)** depuis le lecteur principal :
- **Ouverture plein écran immédiate** de la caméra en direct (`100vw × 100vh`, fond noir, grille de cadrage discrète 3×3 type appareil photo natif).
- **Contrôles épurés (zéro texte superflu)** :
  - **Bouton d'enregistrement rouge central** en bas de l'écran :
    - **1er clic** : lance immédiatement l'enregistrement vidéo synchronisé sur le Drop de 30s max de la chanson.
    - **2e clic (à tout moment avant 30s)** : coupe immédiatement l'enregistrement (ou arrêt automatique à 30,0s).
  - Bascule caméra avant/arrière en bas à droite et bouton de fermeture discret en haut.
- **Incrustation temps réel en tâche de fond** : pendant la prise de vue, un canvas haute définition (`1080×1920`) capture en parallèle le flux caméra combiné au filigrane officiel **DROP** et à l'audio du Drop afin que la vidéo finale soit prête à la milliseconde où l'enregistrement s'arrête.

---

## 3. Étape 2 — Prévisualisation Automatique Plein Écran avec Filigrane DROP & Actions Rapides
À l'instant précis où l'enregistrement s'arrête (manuellement ou à 30s) :
- **Bascule automatique et instantanée** vers la **prévisualisation plein écran** de la vidéo enregistrée, jouée en boucle avec le son du Drop.
- **Filigrane obligatoire DROP posé automatiquement et instantanément sur la vidéo** (à la fois visible sur l'aperçu plein écran et gravé dans le fichier vidéo) :
  - Cadre rectangulaire blanc fin avec ouvertures calibrées en haut et en bas.
  - Logo officiel **DROP** en haut au centre.
  - **Titre de la chanson** et **Nom de l'artiste** dynamiques en majuscules Serif dans le tiers inférieur.
  - **QR Code dynamique** scannable en bas au centre (redirigeant directement vers la chanson dans l'application DROP).
  - **Icône rouge « D » dynamique** : visible 4 secondes, disparaît 1 seconde, puis réapparaît aléatoirement ailleurs toutes les 4s sans jamais chevaucher le logo DROP, le titre, l'artiste ni le QR code.
- **Tiroir inférieur d'actions rapides (en bas de l'écran, en surimpression plein écran)** :
  - **Ligne de partage rapide Réseaux Sociaux** (icônes rondes : *WhatsApp*, *Facebook*, *Instagram*, *TikTok / Stories*, *Autre* via partage direct du fichier vidéo).
  - **Ligne « Actions rapides »** (boutons carrés arrondis) :
    1. **Sauvegarder dans la galerie** (téléchargement direct du fichier vidéo avec filigrane DROP).
    2. **Recommencer la Trend** (retour immédiat à la caméra plein écran pour refaire une prise).
- **Zéro champ de texte ou panneau non demandé** : aucune saisie de légende, aucun panneau latéral, tout demeure 100% en plein écran.

---

## 4. Fichier Modifié
- `src/components/DropTrendMagazineStudio.tsx` : Refonte complète en vue plein écran 2 étapes (Caméra directe $\rightarrow$ Prévisualisation plein écran instantanée avec filigrane DROP + barre inférieure de partage et d'actions rapides).
