import React, { useState } from 'react';
import { Presentation, ChevronLeft, ChevronRight, CheckCircle2, TrendingUp, ShieldCheck, DollarSign, Users, Award, Radio } from 'lucide-react';

interface PitchSlide {
  num: number;
  title: string;
  subtitle: string;
  highlight: string;
  bullets: string[];
}

const PITCH_SLIDES: PitchSlide[] = [
  {
    num: 1,
    title: 'Présentation & Vision',
    subtitle: 'DROP (+241) — Plateforme Musicale Numérique Gabonaise',
    highlight: 'L’ambition de référence musicale au Gabon et en Afrique centrale.',
    bullets: [
      'Accès facilité à une offre musicale numérique autorisée.',
      'Nouvel espace de diffusion et de monétisation pour artistes & labels.',
      'Modèle économique hybride B2C (abonnements directs) et B2B (campagnes).',
    ],
  },
  {
    num: 2,
    title: 'Le Problème du Marché',
    subtitle: 'Sous-monétisation & Complexité d’Accès',
    highlight: 'Un public jeune et connecté, mais freiné par le pouvoir d’achat et le paiement.',
    bullets: [
      'Faible pénétration des cartes bancaires traditionnelles (< 5%).',
      'Piratage endémique et absence de distribution locale structurée.',
      'Difficulté pour les artistes gabonais de monétiser leurs catalogues au pays.',
    ],
  },
  {
    num: 3,
    title: 'La Solution DROP',
    subtitle: 'Double Source d’Accès & Économie de Données',
    highlight: 'Payer directement ou débloquer son abonnement par des missions sponsorisées.',
    bullets: [
      'Mode Éco-Data Opus 32 kbps (réduction de 75% du coût forfait Internet).',
      'Paiements adaptés : Airtel Money Gabon, Moov Money et Cartes.',
      'Missions de découverte musicale rémunérées en jetons partenaires.',
    ],
  },
  {
    num: 4,
    title: 'Le Produit & Technologie',
    subtitle: 'Tour de Contrôle Broadcast & Lecteur Immersif',
    highlight: 'Technologie broadcast propriétaire, DRM AES-256 et validation ECG.',
    bullets: [
      'Lecteur Web, Android & iOS avec cache hors-ligne sécurisé.',
      'Transfert hors-ligne protégé par QR code opaque à usage unique.',
      'Validation télémétrique stricte des écoutes qualifiées (seuil 30s ECG).',
    ],
  },
  {
    num: 5,
    title: 'Le Double Modèle Commercial',
    subtitle: 'Deux Voies Hermétiques vers l’Abonnement',
    highlight: 'Règle stricte : 100% Mobile Money OU 100% Jetons (Zéro paiement mixte).',
    bullets: [
      'Mode 1 (B2C direct) : Règlement direct Mobile Money (1 500 FCFA/mois).',
      'Mode 2 (B2B sponsorisé) : Financement 100% par les labels (Modèle A).',
      'Zéro achat de jetons par l’utilisateur, zéro cashout, zéro spéculation.',
    ],
  },
  {
    num: 6,
    title: 'Le Modèle Économique',
    subtitle: 'Revenus B2C & B2B Complémentaires',
    highlight: 'Ne pas dépendre exclusivement de la poche de l’auditeur.',
    bullets: [
      'Revenus B2C : Abonnements payés directement (Airtel/Moov).',
      'Revenus B2B : Vente de campagnes sponsorisées (prestation plateforme).',
      'Prestations B2B annexes : Data analytics, licences broadcast, promotion.',
    ],
  },
  {
    num: 7,
    title: 'Le Marché & Opportunité',
    subtitle: 'Gabon Initial — Expansion Afrique Centrale',
    highlight: '1,87 M d’internautes, 95% de couverture 4G (ARCEP).',
    bullets: [
      'Libreville & Port-Gentil comme zones prioritaires de lancement.',
      'Segments cibles : Étudiants, jeunes adultes, artistes et maisons de production.',
      'Potentiel sous-régional CEMAC (Cameroun, Congo, Guinée Équatoriale).',
    ],
  },
  {
    num: 8,
    title: 'Stratégie de Lancement (6 Phases)',
    subtitle: 'Déploiement Rigoureux par Étapes',
    highlight: 'Sécuriser le juridique et la stabilité avant d’investir en acquisition.',
    bullets: [
      'M1 : Sécurisation juridique (Ordonnance 2024) & contrats types.',
      'M2 : Recrutement des premiers labels pilotes (3 à 5 partenaires).',
      'M3 : Bêta contrôlée (300 à 500 auditeurs tests) & validation paiements.',
      'M4-M6 : Lancement public, acquisition optimisée et consolidation.',
    ],
  },
  {
    num: 9,
    title: 'Traction & Validation Produit',
    subtitle: 'Plateforme Fonctionnelle & Conformité Totale',
    highlight: 'Application opérationnelle, moteur audio calibré, grand livre testé.',
    bullets: [
      '18/18 tests du journal comptable validés avec succès.',
      'Console Studio broadcast (-14 LUFS Target) intégrée.',
      'Base de données entités musicales et algorithme gabonais opérationnels.',
    ],
  },
  {
    num: 10,
    title: 'Prévisions Financières sur 3 Ans',
    subtitle: 'Trajectoire vers la Rentabilité',
    highlight: 'Seuil de rentabilité opérationnel fixé à 87,2 millions FCFA de CA.',
    bullets: [
      'Année 1 : 24,0 M FCFA de CA (500 abonnés directs, 20 campagnes).',
      'Année 2 : 62,6 M FCFA de CA (1 200 abonnés directs, 40 campagnes).',
      'Année 3 : 138,5 M FCFA de CA | EBITDA positif : +32,40 M FCFA.',
    ],
  },
  {
    num: 11,
    title: 'Organisation & Gouvernance',
    subtitle: 'Direction Stratégique & Montée en Capacité',
    highlight: 'Fondateur à la direction produit, montée progressive de l’équipe.',
    bullets: [
      'Compétences clés : Dév/Sécurité, Droits musicaux, Prospection labels.',
      'Cadre légal OHADA et droit d’auteur gabonais (Ordonnance n°0011/PR/2024).',
      'Prestations externalisées sans dilution anarchique du capital.',
    ],
  },
  {
    num: 12,
    title: 'Levée de Fonds : 75 000 €',
    subtitle: '49,2 Millions FCFA pour Accélérer',
    highlight: 'Structure mixte : 66,7% Privé, 20% Institutionnel, 13,3% Avances B2B.',
    bullets: [
      '15k€ Marketing & Acquisition • 18k€ Équipe & Fonctionnement.',
      '12k€ Produit/Sécurité • 10k€ Droits & Juridique • 12k€ Trésorerie.',
      'Retour sur investissement fondé sur la croissance B2C et B2B.',
    ],
  },
];

export const InvestorPitchDeckViewer: React.FC = () => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const slide = PITCH_SLIDES[currentIdx];

  const handlePrev = () => setCurrentIdx((i) => Math.max(0, i - 1));
  const handleNext = () => setCurrentIdx((i) => Math.min(PITCH_SLIDES.length - 1, i + 1));

  return (
    <div className="p-4 rounded-2xl bg-[#0D1017] border border-white/[0.08] shadow-[0_14px_34px_-12px_rgba(6,8,14,0.88)] space-y-3 font-mono text-xs">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.06] pb-2.5">
        <div className="flex items-center gap-2">
          <Presentation className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#F8FAFC]">
            Pitch Deck Investisseurs (12 Diapositives Officielles)
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10.5px] text-[#A3A9BA]">
            Slide <span className="font-bold text-white">{slide.num}</span> / 12
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handlePrev}
              disabled={currentIdx === 0}
              className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-white disabled:opacity-30 cursor-pointer transition"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              disabled={currentIdx === PITCH_SLIDES.length - 1}
              className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-white disabled:opacity-30 cursor-pointer transition"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 rounded-xl bg-[#07090E] border border-white/[0.06] space-y-3 min-h-[160px] flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-2">
            <span className="px-2 py-0.5 rounded text-[9.5px] font-black bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
              Diapositive {slide.num}
            </span>
            <span className="text-[10px] text-[#A3A9BA]">{slide.subtitle}</span>
          </div>
          <h4 className="text-sm font-black text-[#F8FAFC] mt-1">{slide.title}</h4>
          <p className="text-[11px] font-bold text-emerald-400 mt-0.5">{slide.highlight}</p>
        </div>

        <ul className="space-y-1.5 pt-2 border-t border-white/[0.04]">
          {slide.bullets.map((b, i) => (
            <li key={i} className="flex items-start gap-2 text-[10.5px] text-[#A3A9BA]">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <span>{b}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Mini Barres de navigation rapide */}
      <div className="flex items-center gap-1 overflow-x-auto pt-1">
        {PITCH_SLIDES.map((s, idx) => (
          <button
            key={s.num}
            type="button"
            onClick={() => setCurrentIdx(idx)}
            className={`flex-1 min-w-[24px] h-1.5 rounded-full transition cursor-pointer ${
              currentIdx === idx ? 'bg-cyan-400' : 'bg-white/10 hover:bg-white/20'
            }`}
            title={`Slide ${s.num}: ${s.title}`}
          />
        ))}
      </div>
    </div>
  );
};
