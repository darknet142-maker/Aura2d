# Plan de Travail — Système Officiel de Classement, Certifications et Awards (Marché Gabonais)

## 1. Vue d'ensemble & Objectifs
Ce plan traduit de manière exhaustive les deux documents du **Livre Blanc & Cahier des Charges (Marché Gabonais)** au sein de l'écosystème **DROP**. L'objectif est de remplacer toute logique de volume brut par un modèle d'équité algorithmique adapté aux réalités économiques, techniques et culturelles du Gabon, articulé autour de cinq piliers :

1. **L'Écoute Certifiée Gabonaise (ECG) & Bouclier Anti-Fraude** (Mobile Money, 30s, rejet Mute 0%, cap quotidien, CG-NAT Gabon `+241`, cache Hors-Ligne 14 jours).
2. **Architecture Mathématique des 6 Classements Découplés** (Hebdomadaire 7j, Mensuel 30j, Annuel glissant) pour Chansons, Artistes, Beatmakers, Ingénieurs du Son, Paroliers et Labels.
3. **Système Officiel de Certifications Nationales (Gabon)** (Seuils Singles, Albums/EP avec règle Anti-Locomotive, Certificat d'Œuvre & Disque d'Artisan Carrière, Audit 72h et Registre Public par QR Code infalsifiable).
4. **Architecture des Awards Annuels** (Pondération hybride Grilles A & B, Module « Jury à l'Aveugle » normalisé à `-14 LUFS`, Vote Public In-App vérifié `+241` OTP, et 10 catégories officielles avec prérequis stricts).
5. **Gouvernance des Métadonnées & Protocole d'Intégrité** (Formulaire d'upload granulaire, Double validation *Handshake Protocol*, détection anti-cumul *DAW Audit*, et gestion des litiges avec mise sous séquestre et recalcul rétroactif).

---

## 2. Catalogue & Identité Musicale Gabonaise Calibrée aux Seuils ECG
Mise à jour et enrichissement du catalogue de démonstration (`/src/App.tsx` & `/src/utils/rankingEngine.ts`) pour refléter fidèlement l'industrie musicale gabonaise et permettre de tester immédiatement tous les seuils et cas limites des deux documents :
- **Genres officiels** : *Ntcham*, *Rap Gabonais*, *Afrobeats / Afro-Pop*, *Rumba Gabonaise*, *Gospel*, *Tradimoderne*.
- **Artistes, Artisans & Écuries Gabonaises** :
  - Projets et singles calibrés entre **18 000 ECG** (seuil Révélation à 20 000 ECG/mois) et **620 000+ ECG** (Single d'Or à 100 000 ECG, Platine à 250 000 ECG, Diamant à 500 000 ECG ; Albums Or à 300 000 ECG, Platine à 750 000 ECG, Diamant à 1 500 000 ECG).
  - Artisans crédités sur 10+ titres et 3+ artistes différents pour illustrer le **Disque d'Artisan (Carrière)** (Or 500 000 ECG, Platine 1 250 000 ECG, Diamant 2 500 000 ECG) ainsi que des cas d'artisans bloqués par la règle anti-tube unique (> 15 % sur un titre) ou la règle d'exclusivité (> 40 % sur un seul artiste).
  - Labels avec $\ge 3$ artistes actifs (Division Officielle Labels) vs structures avec $< 3$ artistes (classées en division *« Écuries Indépendantes / Auto-production »*).

---

## 3. Pilier I — Unité de Mesure (ECG) & Bouclier Anti-Fraude (`/src/services/offlineStreamTracker.ts` & `/src/utils/rankingEngine.ts`)

### 3.1 Validation Technique d'une Écoute
- **Seuil des 30 secondes consécutives** : Une écoute n'est validée que si l'auditeur écoute au moins **30 secondes consécutives** sans zapper ni déplacer manuellement le curseur (*scrubbing*).
- **Exception formats courts / interludes (< 60s)** : Validation à **75 %** de la durée totale du titre.
- **Exclusion du « Mute Streaming »** : Vérification en temps réel du niveau sonore (`masterVolume > 0`). Toute écoute effectuée avec le volume à `0 %` est marquée comme *Rejetée (Mute 0%)* et exclue du calcul ECG.
- **Synchronisation Hors-Ligne (Offline Cache)** : Stockage local chiffré/signé avec horodatage, synchronisé automatiquement à la reconnexion réseau dans une fenêtre maximale de **14 jours**.

### 3.2 Pondération Économique (Mobile Money & Freemium)
Intégration d'un sélecteur et simulateur en direct du profil d'abonnement gabonais :
| Formule d'accès | Mode de paiement | Valeur unitaire ECG | Plafond quotidien (Cap / 24h) |
| :--- | :--- | :---: | :---: |
| **Pass Mensuel ou Hebdomadaire** | Airtel Money, Moov Money, Carte | **1,0 ECG** | **5 écoutes / titre / 24h** |
| **Pass Journalier payant** | Airtel Money, Moov Money | **0,8 ECG** | **5 écoutes / titre / 24h** |
| **Compte Freemium Actif** | Gratuit avec publicité complétée | **0,5 ECG** | **3 écoutes / titre / 24h** |
| **Période d'essai gratuit** | Offre découverte | **0,5 ECG** | **3 écoutes / titre / 24h** |

### 3.3 Protocole Anti-Fraude & Adaptation Réseau Gabon (CG-NAT)
- **Plafonnement quotidien (Cap Utilisateur)** : Au-delà de 5 écoutes/24h (compte payant) ou 3 écoutes/24h (Freemium/Essai) d'un même titre par un même utilisateur, l'écoute reste visible dans l'historique personnel de l'auditeur mais n'incrémente plus les compteurs ECG des classements et certifications.
- **Tolérance CG-NAT Opérateurs Gabonais** : Identification par empreinte matérielle (`Device ID`) couplée à un numéro gabonais vérifié (`+241` Airtel, Moov Africa, Gabon Telecom) afin de ne jamais pénaliser des milliers d'auditeurs partageant la même IP publique mobile, tout en filtrant les fermes d'appareils sur IP Wi-Fi domestique.
- **Exclusion des boucles robotiques** : Détection et gel automatique de la session pour les classements lorsqu'une playlist de moins de 5 titres tourne en boucle pendant plus de 4 heures sans aucune interaction humaine.

---

## 4. Pilier II — Architecture Mathématique des 6 Classements (`/src/utils/rankingEngine.ts`)
Sélecteur de fenêtre temporelle sur tous les classements : **Hebdomadaire (7 jours)**, **Mensuel (30 jours)** et **Annuel glissant (12 mois)**.

1. **Classement 1 — Top Chansons / Titres (Puissance Virale)**
   $$\text{Score Titre} = (0,60 \times V_{\text{ECG}}) + (0,25 \times C_{\text{vélocité}}) + (0,15 \times E_{\text{social}})$$
   - **Loi d'amortissement (Usure naturelle)** : Après **10 semaines** de présence dans le Top 10, application d'un abattement de **-5 % par semaine supplémentaire** sur le score de classement uniquement (les ECG réelles continuent de s'accumuler à 100 % pour les certifications).

2. **Classement 2 — Top Artistes (Puissance & Fidélité Communautaire)**
   - **40 %** Volume Global ECG du catalogue actif + **30 %** Profondeur de Catalogue (répartition sur $\ge 3$ titres, pénalité anti-one-hit-wonder si 1 titre génère $> 95\%$ du trafic) + **30 %** Fidélisation & Conversion (auditeurs récurrents $\ge 3$ fois/mois, conversion en abonnés « Suivre », écoute intégrale).
   - **Règle de partage en Featuring** : **70 %** Artiste Principal / **30 %** Artiste Invité (ou **50 % / 50 %** lorsque le titre est déclaré en single co-produit à parts égales).

3. **Classement 3 — Top Beatmakers / Compositeurs (Valeur Ajoutée Musicale)**
   $$\text{Score Beatmaker} = \left[(0,35 \times V_{\text{plafonné 25\%}}) + (0,35 \times \Delta_{\text{impact}}) + (0,30 \times R_{\text{accroche 45s + loop}})\right] \times M_{\text{polyvalence}}$$
   - **Plafond Anti-Locomotive (25 % max par titre)** : Un seul hit ne peut jamais représenter plus de 25 % du score total (obligeant à performer sur au moins 4 titres).
   - **Delta d'Impact ($\Delta_{\text{impact}}$)** : Ratio entre les ECG générées par le titre sur ses 30 premiers jours et la moyenne habituelle des 3 sorties précédentes de l'interprète.
   - **Qualité d'Accroche ($R_{\text{accroche}}$)** : Taux de rétention à **45 secondes** + Taux de réécoute immédiate (*Loop Rate*).
   - **Multiplicateur de Polyvalence ($M_{\text{polyvalence}}$ sur 90 jours)** :
     - `1 seul artiste` produit : **$\times 0,70$** (pénalité d'exclusivité)
     - `2 artistes distincts` : **$\times 1,00$** (neutre)
     - `3 à 4 artistes distincts` : **$\times 1,20$** (bonus de diversité)
     - `5 artistes distincts et +` : **$\times 1,40$** (bonus d'excellence)

4. **Classement 4 — Top Ingénieurs du Son (Excellence Technique & Confort d'Écoute)**
   - **Ventilation des sous-rôles techniques** :
     - **Prise de voix (Recording)** : **20 %** des points techniques du titre
     - **Mixage (Mixing)** : **50 %** des points techniques du titre
     - **Mastering** : **30 %** des points techniques du titre
     *(Cumulable à 100 % si l'ingénieur assure l'intégralité de la chaîne et que les crédits sont validés).*
   - **Formule de notation** : **35 %** Taux de complétion audio ($> 85\%$ de la durée du morceau sans zapping lié à la fatigue auditive) + **25 %** Conformité acoustique (`-14 LUFS`, absence d'écrêtage/clipping, intégration playlists éditoriales) + **25 %** Volume plafonné strictement à **20 % maximum par titre** + **15 %** Diversité d'artistes et studios sur 90 jours.

5. **Classement 5 — Top Paroliers / Auteurs (Force du Texte & Intemporalité)**
   - **Condition obligatoire d'éligibilité** : Présence des paroles complètes et synchronisées dans l'application.
   - **Formule de notation** : **35 %** Engagement lyrique in-app (ouvertures du panneau Paroles, temps de lecture, partages d'extraits/punchlines) + **30 %** Indice de longévité / demi-vie (maintien des écoutes à J+30, J+60, J+90) + **20 %** Volume plafonné à **25 % par titre** & $\Delta_{\text{impact}}$ + **15 %** **Bonus de Plume Externe ($\times 1,25$)** lorsque l'auteur écrit pour d'autres interprètes.

6. **Classement 6 — Top Labels / Maisons de Production (Force Collective)**
   - **Condition d'éligibilité** : Minimum **3 artistes actifs** ayant sorti au moins un titre dans les 12 derniers mois (les structures de 1 ou 2 artistes sont automatiquement basculées dans la division *« Écuries Indépendantes / Auto-production »*).
   - **Formule de notation** : **40 %** Médiane de performance du catalogue (et moyenne tronquée réduisant de 50 % le titre locomotive) + **25 %** Indice d'équilibre du roster (pénalité progressive si 1 seul artiste génère $> 80\%$ des écoutes du label) + **20 %** Développement de nouvelles signatures + **15 %** Régularité & conformité à 100 % des métadonnées.

---

## 5. Pilier III — Système Officiel de Certifications Nationales (`/src/components/ReusableAnalyticsSheets.tsx` & `/src/utils/rankingEngine.ts`)

### 5.1 Condition Géographique & Territoriale
- Vérification d'éligibilité : Œuvre produite par un artiste/label gabonais ou enregistrée au Gabon + **minimum 70 % des ECG issues du territoire gabonais** (plafond de 30 % pour la diaspora/international).

### 5.2 Seuils Officiels de Certification (en ECG)
- **Catégorie SINGLE** :
  - **Single d'Or** : `100 000 ECG`
  - **Single de Platine** : `250 000 ECG`
  - **Single de Diamant** : `500 000 ECG`
- **Catégorie ALBUM / EP (5 titres minimum)** :
  - **Album d'Or** : `300 000 ECG pondérées`
  - **Album de Platine** : `750 000 ECG pondérées`
  - **Album de Diamant** : `1 500 000 ECG pondérées`
  - **Règle Anti-Locomotive pour les Albums** :
    1. Les **2 titres les plus écoutés** du projet voient leur volume **divisé par 2 (50 %)** dans le calcul d'éligibilité de l'album.
    2. Aucun titre isolé ne peut contribuer pour plus de **20 %** du seuil requis.
    3. Les singles sortis plus de 6 mois avant l'album sont comptabilisés à **50 %** de leur volume antérieur (et 100 % après la sortie de l'album).

### 5.3 Double Certification des Métiers de l'Ombre (Producteurs & Techniciens)
- **Niveau 1 — Certificat Officiel d'Œuvre** : Délivré automatiquement et nominativement à chaque artisan crédité et validé (*Beatmaker, Ingénieur Prise/Mix/Master, Parolier*) dès qu'un Single ou Album franchit un seuil Or, Platine ou Diamant.
- **Niveau 2 — « Disque d'Artisan » (Certification de Carrière / Catalogue)** :
  - **Artisan d'Or** : `500 000 ECG cumulées`
  - **Artisan de Platine** : `1 250 000 ECG cumulées`
  - **Artisan de Diamant** : `2 500 000 ECG cumulées`
  - **3 Conditions d'Intégrité cumulatives** :
    1. Écoutes réparties sur **au moins 10 titres différents**.
    2. Collaboration avec **au moins 3 artistes différents**.
    3. **Aucun titre unique $> 15\%$** du volume total et **aucun interprète unique $> 40\%$** du volume global de l'artisan.

### 5.4 Procédure d'Audit 72h & Registre Public par QR Code
- **Audit automatisé de 72 heures** : Statut de vérification anti-fraude affiché sur les titres approchant ou venant de franchir un seuil.
- **Certificat Officiel avec QR Code Infalsifiable** : Modale de certificat haute précision affichant le QR Code dynamique, l'identifiant cryptographique (`SHA-256`), la ventilation territoriale Gabon vs Diaspora ($\ge 70\%$), la liste complète des artisans co-certifiés et l'horodatage officiel.

---

## 6. Pilier IV — Architecture des Awards Annuels (`/src/App.tsx` & `/src/components/ReusableAnalyticsSheets.tsx`)

### 6.1 Période d'Éligibilité & Pondération Hybride (Grilles A & B)
- Période officielle affichée : **1er Novembre (N-1) au 31 Octobre (N)**.
- **Grille A — Catégories Artistiques & Grand Public** (*Artiste, Chanson, Album, Révélation, Collaboration, Genres*) :
  - **50 %** Score Algorithmique Annuel + **25 %** Vote du Jury Professionnel + **25 %** Vote du Public In-App.
- **Grille B — Catégories Techniques & Métiers de l'Ombre** (*Beatmaker, Ingénieur du Son, Parolier*) :
  - **50 %** Score Algorithmique Annuel + **35 %** **Jury à l'Aveugle (Blind Test)** + **15 %** Vote du Public & Pairs.

### 6.2 Module Interactif « Jury à l'Aveugle » (Blind Test `-14 LUFS`)
Interface dédiée aux jurés dans l'onglet **DROP Awards** :
- Sélection d'une catégorie technique (*Beatmaker, Ingénieur du Son, Parolier*).
- Présentation de dossiers totalement anonymisés : **« Dossier A — Piste 1, 2, 3 »**, **« Dossier B — Piste 1, 2, 3 »** (pack de 3 titres sur $\ge 2$ artistes différents par nommé, sans nom d'artiste, ni pochette, ni studio).
- Indicateur actif de **Normalisation Sonore à `-14 LUFS`** et **Filtre de Conflit d'Intérêts** (blocage automatique si le juré a collaboré avec le dossier).
- Grille de notation interactive sur **20 points** selon les critères officiels du métier (ex. *Clarté fréquentielle /5, Dynamique & Punch /5, Placement vocal /5, Cohérence spatiale /5*), recalculant en temps réel la composante 35 % de la Grille B.

### 6.3 Module de Vote Public Sécurisé (`+241` OTP & Quotas)
- Vérification d'éligibilité de l'électeur : Numéro gabonais vérifié (`+241` OTP) + $\ge 30$ minutes d'écoute active dans le mois.
- Gestion stricte du quota quotidien par catégorie :
  - **Compte Freemium** : `1 vote / jour / catégorie`
  - **Compte Abonné (Pass Mobile Money / Carte)** : `3 votes / jour / catégorie`

### 6.4 Les 10 Catégories Officielles & Contrôle des Prérequis
Implémentation des 10 catégories officielles avec affichage explicite des prérequis d'éligibilité :
1. **Artiste de l'Année** ($\ge 3$ singles ou 1 projet sorti dans l'année)
2. **Chanson de l'Année** (Score Titre annuel)
3. **Album / Projet de l'Année** ($\ge 6$ titres, jugé sur l'écoute globale et le maintien des deep cuts)
4. **Révélation de l'Année** (Franchissement pour la 1re fois du cap des `20 000 ECG/mois` + meilleur taux de conversion en abonnés)
5. **Beatmaker de l'Année** ($\ge 5$ titres produits pour $\ge 3$ artistes différents — Grille B Blind Test)
6. **Ingénieur du Son de l'Année** ($\ge 8$ titres mixés/masterisés pour $\ge 3$ artistes différents — Grille B Blind Test)
7. **Parolier / Plume de l'Année** ($\ge 4$ titres avec paroles synchronisées — Grille B Blind Test)
8. **Label de l'Année** ($\ge 3$ artistes actifs ayant sorti un projet ou 2 singles dans l'année)
9. **Meilleure Collaboration (Featuring)** ($\ge 2$ artistes d'écuries différentes, maintien d'écoute $> 60$ jours)
10. **Trophées de Genres** (*Meilleur Titre Ntcham, Rap Gabonais, Afrobeats, Rumba, Gospel, Tradimoderne*)

---

## 7. Pilier V — Gouvernance des Métadonnées, Handshake Protocol & Litiges (`/src/App.tsx` & `/src/components/ReusableAnalyticsSheets.tsx`)

### 7.1 Formulaire d'Upload Granulaire & Anti-Cumul (DAW Audit)
- Dans l'espace Studio/Admin, enrichissement du formulaire de publication et d'édition des titres :
  - **Artiste Principal** & **Featurings** avec choix du partage (`70% / 30%` standard ou `50% / 50%` co-production).
  - **Beatmakers / Compositeurs**.
  - **Ingénieurs du Son** ventilés en 3 sous-rôles : **Prise de voix (20 %)**, **Mixage (50 %)**, **Mastering (30 %)**.
  - **Paroliers / Auteurs** avec distinction **Interprète-Auteur** vs **Plume Externe (Bonus $\times 1,25$)**.
  - **Label** ou **Auto-production / Indépendant**.
- **Alerte Anti-Cumul Abusif (DAW Audit)** : Si un même profil est renseigné simultanément comme Interprète + Beatmaker + Ingénieur Mix + Mastering, déclenchement automatique du badge *« Audit DAW requis (Session multipiste à fournir) »* avant déblocage des points techniques.

### 7.2 Protocole de Double Validation (*Handshake Protocol*)
- Statut de validation par crédit : `Validé (Handshake OK)`, `En attente de confirmation artisan`, ou `Sous séquestre (Litige actif)`.
- Interface permettant aux artisans de **Confirmer** leur participation en 1 clic pour activer le versement de leurs points au classement.

### 7.3 Gestion des Litiges (« Revendiquer un crédit ») & Recalcul Rétroactif
- Bouton **« Revendiquer un crédit / Signaler une omission »** accessible sur chaque fiche de titre :
  - **Mise sous séquestre immédiate** : Lorsqu'un litige est ouvert sur un rôle technique, les points correspondants de ce titre sont temporairement gelés (sans bloquer l'écoute du morceau pour le public).
  - **Résolution & Recalcul Rétroactif** : Dès que le litige est résolu et validé par les deux parties, le moteur recalcule instantanément et rétroactivement l'intégralité des ECG et des points de classement depuis le premier jour de sortie du titre.
