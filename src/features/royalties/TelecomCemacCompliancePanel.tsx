import React, { useState } from 'react';
import { formatFcfa } from '../economics/formatters';

interface RoadmapActionItem {
  id: string;
  priority: string;
  domain: string;
  action: string;
  impact: string;
  completed: boolean;
}

const INITIAL_ROADMAP: RoadmapActionItem[] = [
  {
    id: 'p1',
    priority: '1. Immédiat (Phase 1)',
    domain: 'Juridique & BUGADA',
    action:
      'Convention-cadre scindant les 60% de royalties en 48% Droits Voisins/Master (paiement direct DROP) et 12% Droits d’Auteur/Édition (bordereau ISRC BUGADA sous Décret n°0282/PR/MCJSA).',
    impact: 'Élimine tout risque de double taxation BUGADA et sécurise 80% de paiement direct.',
    completed: true,
  },
  {
    id: 'p2',
    priority: '2. Immédiat (Phase 1)',
    domain: 'Fiscalité DGI & Moteur Royalties',
    action:
      'Retenue à la source BNC automatisée (9,5% personnes physiques, 10%/20% non-résidents) + CSS 1% en sus de la TVA 18% au seuil de 60 M FCFA HT.',
    impact: 'Prévient tout redressement fiscal DGI et fiabilise la trésorerie Année 3.',
    completed: true,
  },
  {
    id: 'p3',
    priority: '3. Avant Dév. MVP (Phase 1)',
    domain: 'Tarification & Pass 7 Jours',
    action:
      'Plafonnement du cache hors-ligne du Pass 7 Jours (500 FCFA) à 25 titres simultanés (illimité sur le Mensuel 1 500 FCFA) + palier 1 750 FCFA TTC en Année 3.',
    impact: 'Bloque le Binge-and-Churn et neutralise la falaise fiscale du Mois 25 (+6,4 M EBITDA/an).',
    completed: true,
  },
  {
    id: 'p4',
    priority: '4. Conception MVP (Phase 2)',
    domain: 'Ingénierie Audio & CDN',
    action:
      'Architecture Cloudflare R2 (0 frais d’egress) + GAB-IX Libreville + Opus 32 kbps Éco-Data + Smart Client Caching chiffré des 50 titres favoris.',
    impact: 'Maintient le budget CDN (180k→550k FCFA/mois) et réduit de 75% la data auditeur.',
    completed: true,
  },
  {
    id: 'p5',
    priority: '5. Conception MVP (Phase 2)',
    domain: 'Sécurité User-Centric',
    action:
      'Plafond unitaire par écoute (Cap per Stream = 15 FCFA) vers Fonds Émergents + allocation des abonnés fantômes (0 écoute) au Catalogue National (+241).',
    impact: 'Neutralise le Single-Stream Hijacking et garantit l’équité mathématique.',
    completed: true,
  },
  {
    id: 'p6',
    priority: '6. Intégration Paiement (Phase 2)',
    domain: 'Fintech & Mobile Money',
    action:
      'Comptes Marchands Business KYB Airtel & Moov (plafond 100 M FCFA/mois) ; frais 2% répercutés sur les dons fans ; frais Disbursement 1% déduits au retrait.',
    impact: 'Restaure la marge nette de 10% sur les dons et économise 1,37 M FCFA/an en virements.',
    completed: true,
  },
  {
    id: 'p7',
    priority: '7. Bêta & Lancement (Phases 3–4)',
    domain: 'Partenariats Télécoms',
    action:
      'Packs Data + Musique (« Pass Wami / Moov Streaming » en Zero-Rating partiel) et comptabilisation DCB strictement sur le net reversé après commission 40%.',
    impact: 'Supprime la taxe data et ouvre l’accès aux 3,22 millions de SIM actives au Gabon.',
    completed: false,
  },
  {
    id: 'p8',
    priority: '8. Gouvernance Financière',
    domain: 'Trésorerie & Séquestre',
    action:
      'Levée de 50 M FCFA en 2 tranches (25 M + 25 M sur jalons : conversion ≥ 5% et 3 contrats B2B) + sous-compte séquestre rémunéré (BGFI / UGB / BICIG).',
    impact: 'Sanctuarise le float de royalties (8 à 12 M FCFA) et sécurise les investisseurs.',
    completed: true,
  },
];

export const TelecomCemacCompliancePanel: React.FC = () => {
  const [roadmap, setRoadmap] = useState<RoadmapActionItem[]>(INITIAL_ROADMAP);
  const [stkPhone, setStkPhone] = useState<string>('+241 074 82 91 04');
  const [stkOperator, setStkOperator] = useState<'AIRTEL' | 'MOOV'>('AIRTEL');
  const [stkState, setStkState] = useState<'IDLE' | 'POLLING' | 'CONFIRMED'>('IDLE');
  const [dunningSimDay, setDunningSimDay] = useState<'J_MINUS_2' | 'J_EVENING' | 'J_PLUS_3'>('J_MINUS_2');

  const toggleRoadmapItem = (id: string) => {
    setRoadmap((prev) =>
      prev.map((item) => (item.id === id ? { ...item, completed: !item.completed } : item))
    );
  };

  const triggerStkSimulation = () => {
    setStkState('POLLING');
    window.setTimeout(() => {
      setStkState('CONFIRMED');
    }, 900);
  };

  return (
    <div className="space-y-3.5">
      {/* 1. INFRASTRUCTURE MOBILE MONEY : PUSH STK, IDEMPOTENCE & SMART DUNNING */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="bg-[#07080C] border border-emerald-500/30 rounded-2xl p-3.5 sm:p-4 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 block">
                Orchestration API Airtel (*150#) &amp; Moov (*555#)
              </span>
              <h4 className="text-xs sm:text-sm font-bold text-[#F5F2EB]">
                Testeur Push STK Asynchrone &amp; Boucle Webhook Signée
              </h4>
            </div>
            <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 font-mono text-[10px]">
              Settlement J+1 (T+1)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            <input
              type="text"
              value={stkPhone}
              onChange={(e) => setStkPhone(e.target.value)}
              className="bg-[#0D1017] border border-white/15 rounded-xl px-2.5 py-1.5 text-white font-mono text-xs"
              aria-label="Numéro Mobile Money (+241)"
            />
            <select
              value={stkOperator}
              onChange={(e) => setStkOperator(e.target.value as 'AIRTEL' | 'MOOV')}
              className="bg-[#0D1017] border border-white/15 rounded-xl px-2.5 py-1.5 text-white font-mono text-xs"
              aria-label="Opérateur Mobile Money"
            >
              <option value="AIRTEL">Airtel Money (65% part M-Money)</option>
              <option value="MOOV">Moov Money Online (30% part)</option>
            </select>
            <button
              type="button"
              onClick={triggerStkSimulation}
              className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#07080C] font-bold text-xs transition"
            >
              {stkState === 'POLLING' ? 'Polling GET /tx (15s)...' : 'Simuler Push STK 1 500 FCFA'}
            </button>
          </div>

          {stkState !== 'IDLE' && (
            <div className="p-2.5 rounded-xl bg-[#0D1017] border border-emerald-500/35 text-[11px] font-mono text-emerald-200">
              {stkState === 'POLLING'
                ? `En attente de saisie PIN sur ${stkPhone} (fenêtre 90s) • Vérification active idempotente...`
                : `✓ Webhook HMAC-SHA256 reçu (${stkOperator}) : 1 500 FCFA encaissés (frais 30 FCFA • net 1 470 FCFA).`}
            </div>
          )}

          <div className="grid grid-cols-3 gap-2 pt-1 text-[10.5px] font-mono">
            <div className="p-2 rounded-lg bg-[#0D1017] border border-white/[0.05]">
              <span className="text-zinc-400 block">Collection M-Money</span>
              <strong className="text-white">1,5% à 2,0%</strong>
            </div>
            <div className="p-2 rounded-lg bg-[#0D1017] border border-white/[0.05]">
              <span className="text-zinc-400 block">Batch Payout Artistes</span>
              <strong className="text-amber-300">0,5% à 1,0% (déduit)</strong>
            </div>
            <div className="p-2 rounded-lg bg-[#0D1017] border border-white/[0.05]">
              <span className="text-zinc-400 block">Crédit d&apos;appel (DCB)</span>
              <strong className="text-rose-300">30% à 50% (sur net)</strong>
            </div>
          </div>
        </div>

        {/* MOTEUR DE RELANCE INTELLIGENTE (SMART DUNNING) */}
        <div className="bg-[#07080C] border border-amber-400/30 rounded-2xl p-3.5 sm:p-4 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-amber-300 block">
                Anti-Churn Prépayé (98,18 % de SIM prépayées au Gabon)
              </span>
              <h4 className="text-xs sm:text-sm font-bold text-[#F5F2EB]">
                Séquence Smart Dunning &amp; Période de Grâce Hors-Ligne (48h)
              </h4>
            </div>
            <div className="flex gap-1">
              {(
                [
                  { id: 'J_MINUS_2', label: 'J-2' },
                  { id: 'J_EVENING', label: 'Jour J (20h)' },
                  { id: 'J_PLUS_3', label: 'J+3 (Grâce 48h)' },
                ] as const
              ).map((step) => (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => setDunningSimDay(step.id)}
                  className={`px-2 py-1 rounded-lg font-mono text-[10px] font-bold border ${
                    dunningSimDay === step.id
                      ? 'bg-amber-400 text-[#07080C] border-amber-300'
                      : 'bg-[#0D1017] text-zinc-400 border-white/10'
                  }`}
                >
                  {step.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#0D1017] border border-white/[0.07] text-xs text-zinc-200 space-y-1">
            {dunningSimDay === 'J_MINUS_2' && (
              <p>
                <strong>Notification Push + WhatsApp (J-2) :</strong> « Ton Pass Premium DROP expire dans 48h.
                Renouvelle en 1 clic (1 500 FCFA Airtel/Moov) pour conserver tes playlists hors-ligne intactes ! »
              </p>
            )}
            {dunningSimDay === 'J_EVENING' && (
              <p>
                <strong>Relance Soirée (Jour J à 20h00 — heure de pointe recharge) :</strong> Déclenchement Push
                STK hors appel téléphonique. En cas de solde insuffisant, activation automatique de la{' '}
                <strong className="text-emerald-300">période de grâce de 48 heures</strong> maintenant le cache hors-ligne.
              </p>
            )}
            {dunningSimDay === 'J_PLUS_3' && (
              <p>
                <strong>Filet de sécurité (J+3) :</strong> Proposition de bascule temporaire sur un{' '}
                <strong className="text-amber-300">Pass 7 Jours à 500 FCFA</strong> (25 titres hors-ligne conservés)
                pour éviter la perte sèche de l&apos;abonné.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 2. CONFORMITÉ CEMAC (BEAC / CENTIF-GABON / CNPDCP) & ARCHITECTURE CDN */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="bg-[#07080C] border border-white/[0.08] rounded-2xl p-3.5 sm:p-4 space-y-2">
          <span className="text-[10px] font-mono uppercase tracking-wider text-sky-400 block">
            Conformité Réglementaire CEMAC (BEAC R-2018/02, CENTIF-Gabon &amp; CNPDCP)
          </span>
          <div className="space-y-1.5 text-xs text-zinc-300">
            <div className="p-2 rounded-xl bg-[#0D1017] border border-white/[0.05] flex justify-between">
              <span>Compte Marchand Business KYB (RCCM + NIF)</span>
              <span className="font-mono text-emerald-300 font-bold">Plafond 100 M FCFA/mois (Anti-Smurfing)</span>
            </div>
            <div className="p-2 rounded-xl bg-[#0D1017] border border-white/[0.05] flex justify-between">
              <span>Plafonds KYC Particuliers BEAC (Niv. 1 / 2 / 3)</span>
              <span className="font-mono text-zinc-400">1 M / 5 M / 20 M FCFA cumul mensuel</span>
            </div>
            <div className="p-2 rounded-xl bg-[#0D1017] border border-white/[0.05] flex justify-between">
              <span>Protection Données CNPDCP Gabon</span>
              <span className="font-mono text-amber-300">Consentement explicite &amp; Notification 72h</span>
            </div>
          </div>
        </div>

        <div className="bg-[#07080C] border border-white/[0.08] rounded-2xl p-3.5 sm:p-4 space-y-2">
          <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 block">
            Maîtrise du Budget CDN ({formatFcfa(550000)}/mois pour 127 000 auditeurs en An 3)
          </span>
          <div className="space-y-1.5 text-xs text-zinc-300">
            <div className="p-2 rounded-xl bg-[#0D1017] border border-white/[0.05] flex justify-between">
              <span>Cloud public classique (110 To @ 51 FCFA/Go)</span>
              <span className="font-mono text-rose-400 line-through">5 610 000 FCFA / mois</span>
            </div>
            <div className="p-2 rounded-xl bg-[#0D1017] border border-white/[0.05] flex justify-between">
              <span>Cloudflare R2 (0 Egress) + Peering GAB-IX Libreville</span>
              <span className="font-mono text-emerald-300 font-bold">180 000 à 550 000 FCFA / mois</span>
            </div>
            <div className="p-2 rounded-xl bg-[#0D1017] border border-white/[0.05] flex justify-between">
              <span>Smart Client Caching (50 titres favoris en mémoire)</span>
              <span className="font-mono text-amber-300">-65% à -80% de bande passante</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. FEUILLE DE ROUTE EXÉCUTIVE EN 8 PRIORITÉS (SECTION 7 DE L'AUDIT) */}
      <div className="bg-[#07080C] border border-white/[0.08] rounded-2xl p-3.5 sm:p-4 space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-[10px] font-mono uppercase tracking-wider text-amber-300">
            Feuille de Route Stratégique &amp; Recommandations Actionnables (8 Piliers)
          </span>
          <span className="text-[11px] font-mono text-emerald-300">
            {roadmap.filter((r) => r.completed).length} / {roadmap.length} verrous actifs
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {roadmap.map((item) => (
            <div
              key={item.id}
              onClick={() => toggleRoadmapItem(item.id)}
              className={`p-2.5 rounded-xl border cursor-pointer transition flex flex-col justify-between gap-1.5 ${
                item.completed
                  ? 'bg-emerald-500/[0.07] border-emerald-500/35'
                  : 'bg-[#0D1017] border-white/[0.07]'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-[10px] text-amber-300 font-bold">
                  {item.priority} • {item.domain}
                </span>
                <span
                  className={`px-2 py-0.5 rounded font-mono text-[9.5px] font-bold ${
                    item.completed
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'bg-white/10 text-zinc-400'
                  }`}
                >
                  {item.completed ? '✓ ACTIF' : 'À PLANIFIER'}
                </span>
              </div>
              <p className="text-[11px] text-zinc-200 leading-snug">{item.action}</p>
              <p className="text-[10px] text-emerald-300/90 font-mono">{item.impact}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
