# Plan d'Implémentation — Architecture Offline-First, Fiches Artistes Plein Écran & Interface Icon-First

## 1. Architecture Offline-First (`OfflineStreamTracker` + Serveur Express `/api/sync-metrics`)
- **Tampon Local & File d'Attente (`IndexedDB` + fallback `localStorage`)** :
  - Chaque événement utilisateur (`play`, `complete`, `skip`, `loop`, `like`, `unlike`) génère un objet JSON horodaté muni d'un identifiant unique `eventId: crypto.randomUUID()`, `trackId`, `userId`, `timestamp` et des métadonnées associées (`durationPlayedSeconds`, `loopCount`, `pointsDelta`).
  - Les événements sont immédiatement stockés dans la file locale persistante (`streaming_offline_queue`) afin qu'aucune écoute, boucle ou mention "J'aime" effectuée hors connexion ou en mode avion ne soit perdue.
- **Écouteur Réseau & Simulateur Hors-Ligne / En-Ligne** :
  - Détection automatique des événements navigateur `window.addEventListener('online' / 'offline')`.
  - Ajout d'un **commutateur Simulateur Hors-Ligne (Mode Avion)** dans la barre supérieure et dans l'Admin permettant de couper/rétablir virtuellement le réseau pour observer en temps réel l'accumulation des actions dans la file locale puis leur synchronisation groupée (*Batch Sync*).
- **Serveur API Express (`/api/sync-metrics`) & Idempotence** :
  - Mise en place d'un serveur `server.ts` (Express + middleware Vite sur le port 3000) exposant `POST /api/sync-metrics` et `GET /api/sync-status`.
  - **Traitement côté serveur** :
    1. Tri chronologique strict des événements par `timestamp` (pour respecter la séquence exacte `like` puis `unlike`, ou les séries de boucles).
    2. Vérification d'idempotence via un registre `ProcessedEvents` (`Set<string>` d'`eventId`) garantissant qu'aucun événement ne soit comptabilisé deux fois en cas de micro-coupure réseau.
    3. Suppression sélective côté client uniquement des `eventId` confirmés par le serveur (`200 OK`).

## 2. Fiche Artiste Plein Écran (`Fiche Artiste`) & Épuration des Cartes
- **Cartes Catalogue & Utilisateurs Désengorgées** :
  - Les cartes du Catalogue et de la liste Utilisateurs affichent uniquement l'essentiel visuel (Cover biseauté à reflet, Titre/Artiste cliquable, et compteurs compacts par icônes).
  - Un clic sur le nom d'un artiste ou sur sa carte ouvre sa **Fiche Artiste plein écran**.
- **Contenu de la Fiche Artiste Plein Écran** :
  - **En-tête Artiste** : Avatar/Cover biseauté, catégorie principale, score algorithmique cumulé et indicateurs globaux par icônes (`▶`, `↻`, `♥`, `⏱`, `%`).
  - **Discographie complète & performances algorithmiques** : Liste détaillée de tous les titres de l'artiste avec barre de rétention, Drop configuré, boucles, likes, points générés et lancement direct.
  - **Équipe Studio associée** : Cartographie des collaborateurs récurrents de l'artiste (**Labels**, **Beatmakers**, **Ingénieurs du son**) avec leurs statistiques cumulées.
  - **Top Auditeurs les plus fidèles** : Classement des utilisateurs ayant le plus écouté cet artiste (temps passé, écoutes validées, boucles) avec accès direct en un clic à leur **Fiche Consommateur**.

## 3. Design "Icon-First" (Remplacement des textes par des icônes)
- **Suppression du mot « écoutes » et des libellés répétitifs** :
  - Remplacement systématique de `"écoutes"` par l'icône **Play** (`▶`) accompagnée uniquement de la valeur numérique.
  - Remplacement des libellés textuels secondaires par une signalétique universelle par icônes :
    - `▶` : Écoutes validées (dès `0:01` après clic Play)
    - `↻` : Boucles (`Repeat`)
    - `♥` : Likes comptabilisés
    - `⏱` : Durée totale / Temps d'écoute (`02:42`)
    - `⚡` : Rétention moyenne (`%`)
    - `★` : Points algorithmiques (`pts`)
    - Icônes dédiées pour **Label** (`Disc`), **Beatmaker** (`Sliders`), **Ingé Son** (`Mic2` / `Headphones`) et **Synchronisation Offline** (`Cloud` / `CloudOff`).
