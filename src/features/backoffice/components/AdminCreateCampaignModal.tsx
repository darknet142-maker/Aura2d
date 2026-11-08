import React, { useState } from 'react';
import { X, Coins } from 'lucide-react';
import {
  createAndFundCampaign, getOrCreateSponsorWallet, type SponsorAccount, type CampaignMissionType,
} from '../../tokens';
import type { Track } from '../../../shared/types/domain.types';

export interface AdminCreateCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  sponsors: SponsorAccount[];
  allTracksFlat: Track[];
  onCreated: (totalBudget: number) => void;
  onToast: (msg: string, dotColor?: string) => void;
}

export const AdminCreateCampaignModal: React.FC<AdminCreateCampaignModalProps> = ({
  isOpen, onClose, sponsors, allTracksFlat, onCreated, onToast,
}) => {
  const [selectedSponsorId, setSelectedSponsorId] = useState<string>(sponsors[0]?.id || '');
  const [targetTrackId, setTargetTrackId] = useState<string>(allTracksFlat[0]?.id || '');
  const [campaignTitle, setCampaignTitle] = useState('');
  const [missionType, setMissionType] = useState<CampaignMissionType>('LISTEN_1_TRACK');
  const [rewardPerMission, setRewardPerMission] = useState(50);
  const [maxParticipants, setMaxParticipants] = useState(1000);

  if (!isOpen) return null;
  const totalCalculatedBudget = rewardPerMission * maxParticipants;
  const currentSponsorWallet = selectedSponsorId ? getOrCreateSponsorWallet(selectedSponsorId) : null;
  const hasSufficientBudget = (currentSponsorWallet?.remainingAvailableTokens ?? 0) >= totalCalculatedBudget;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const track = allTracksFlat.find((t) => t.id === targetTrackId);
    const res = createAndFundCampaign({
      sponsorId: selectedSponsorId, title: campaignTitle.trim() || `Campagne ${track?.title || 'Titre'}`,
      targetTrackId, targetArtistName: track?.artist || 'Artiste', totalBudgetTokens: totalCalculatedBudget,
      rewardPerMission, maxParticipants, missionType, startDateIso: new Date().toISOString(),
      endDateIso: new Date(Date.now() + 30 * 86400000).toISOString(),
    });
    if (!res.success) { onToast(res.error || 'Erreur lors de la création', 'bg-rose-500'); return; }
    onCreated(totalCalculatedBudget);
    onClose();
  };

  return (
    <div onClick={onClose} className="fixed inset-0 z-[160] bg-[#07090E]/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-lg rounded-2xl bg-[#0D1017] border border-white/15 p-4 sm:p-5 space-y-3.5 shadow-2xl text-xs">
        <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
          <h3 className="font-extrabold text-[#F8FAFC] flex items-center gap-2 text-sm text-amber-300">
            <Coins className="w-4 h-4" /> Créer &amp; Réserver une Campagne Sponsorisée
          </h3>
          <button type="button" onClick={onClose} aria-label="Fermer" className="w-7 h-7 rounded-full bg-white/10 text-white flex items-center justify-center cursor-pointer"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-[#A3A9BA] block mb-1">Partenaire Sponsor</label>
              <select value={selectedSponsorId} onChange={(e) => setSelectedSponsorId(e.target.value)} className="w-full bg-[#131722] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-[#F8FAFC]">
                {sponsors.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.role})</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-[#A3A9BA] block mb-1">Morceau à promouvoir</label>
              <select value={targetTrackId} onChange={(e) => setTargetTrackId(e.target.value)} className="w-full bg-[#131722] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-[#F8FAFC]">
                {allTracksFlat.map((t) => <option key={t.id} value={t.id}>{t.title} — {t.artist}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-[10px] text-[#A3A9BA] block mb-1">Titre de la campagne</label>
            <input type="text" value={campaignTitle} onChange={(e) => setCampaignTitle(e.target.value)} placeholder="Ex: Promotion Album Cassper Nyovest" className="w-full bg-[#131722] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-[#F8FAFC]" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[10px] text-[#A3A9BA] block mb-1">Type de Mission</label>
              <select value={missionType} onChange={(e) => setMissionType(e.target.value as CampaignMissionType)} className="w-full bg-[#131722] border border-white/10 rounded-lg px-2 py-1.5 text-[11px] text-[#F8FAFC]">
                <option value="LISTEN_1_TRACK">Écoute 30s</option>
                <option value="LISTEN_3_TRACKS">Écoute 3 titres</option>
                <option value="DISCOVER_ARTIST">Découverte</option>
                <option value="IN_APP_OPINION">Avis Studio</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] text-[#A3A9BA] block mb-1">Jetons / participant</label>
              <input type="number" min={10} max={500} value={rewardPerMission} onChange={(e) => setRewardPerMission(Number(e.target.value))} className="w-full bg-[#131722] border border-white/10 rounded-lg px-2 py-1.5 text-xs text-[#F8FAFC]" />
            </div>
            <div>
              <label className="text-[10px] text-[#A3A9BA] block mb-1">Participants Max</label>
              <input type="number" min={50} max={100000} value={maxParticipants} onChange={(e) => setMaxParticipants(Number(e.target.value))} className="w-full bg-[#131722] border border-white/10 rounded-lg px-2 py-1.5 text-xs text-[#F8FAFC]" />
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-[#080A0F] border border-white/10 flex items-center justify-between">
            <span className="text-[11px] text-[#A3A9BA]">Budget requis : <strong className="text-amber-400">{totalCalculatedBudget.toLocaleString()} jetons</strong></span>
            <span className={`text-[11px] font-bold ${hasSufficientBudget ? 'text-emerald-400' : 'text-rose-400'}`}>
              Dispo sponsor : {(currentSponsorWallet?.remainingAvailableTokens ?? 0).toLocaleString()} jetons
            </span>
          </div>
          <button type="submit" disabled={!hasSufficientBudget} className="w-full py-2.5 rounded-xl bg-[#DE1B34] hover:bg-[#f02842] disabled:opacity-50 text-white font-bold cursor-pointer transition">
            {hasSufficientBudget ? 'Bloquer & Publier la Campagne' : 'Budget Sponsor Insuffisant'}
          </button>
        </form>
      </div>
    </div>
  );
};

