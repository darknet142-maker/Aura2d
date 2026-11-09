import React from 'react';
import { FolderLock, FileText, CheckCircle2, ShieldCheck, Download, ExternalLink } from 'lucide-react';

interface DataRoomDoc {
  id: string;
  category: string;
  title: string;
  format: string;
  status: 'CERTIFIED' | 'READY' | 'LEGAL_REVIEW';
}

const DATA_ROOM_DOCS: DataRoomDoc[] = [
  { id: 'bp-36m', category: 'Finance', title: 'Business Plan Mensuel 36 Mois & Trésorerie', format: 'XLSX / PDF', status: 'CERTIFIED' },
  { id: 'b2b-contract', category: 'Commercial B2B', title: 'Contrat Type de Campagne Sponsorisée Label', format: 'DOCX / PDF', status: 'READY' },
  { id: 'bugada-conv', category: 'Juridique', title: 'Convention Droits d’Auteur BUGADA & Ordonnance 2024', format: 'PDF', status: 'CERTIFIED' },
  { id: 'ip-rights', category: 'Propriété Intellectuelle', title: 'Certificat de Dépôt Propriété Code Source DROP', format: 'PDF', status: 'CERTIFIED' },
  { id: 'cgu-rgpd', category: 'Conformité', title: 'Conditions Générales d’Utilisation & Privacy Policy', format: 'PDF', status: 'READY' },
  { id: 'drm-spec', category: 'Technique', title: 'Spécification Chiffrement DRM AES-256 & QR Offline', format: 'PDF', status: 'CERTIFIED' },
  { id: 'token-ledger', category: 'Tokenomics', title: 'Registre Immuable des Jetons (Modèle A)', format: 'PDF / JSON', status: 'CERTIFIED' },
  { id: 'audit-fraud', category: 'Sécurité', title: 'Rapport d’Audit Antifraude & Télémétrie ECG 30s', format: 'PDF', status: 'READY' },
  { id: 'ohada-statuts', category: 'Gouvernance', title: 'Statuts d’Entreprise Conformes Droit OHADA', format: 'PDF', status: 'LEGAL_REVIEW' },
];

export const DataRoomDocumentIndexCard: React.FC = () => {
  return (
    <div className="p-4 rounded-2xl bg-[#0D1017] border border-white/[0.08] shadow-[0_14px_34px_-12px_rgba(6,8,14,0.88)] space-y-3 font-mono text-xs">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.06] pb-2.5">
        <div className="flex items-center gap-2">
          <FolderLock className="w-4 h-4 text-emerald-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#F8FAFC]">
            Data Room Numérique Sécurisée ({DATA_ROOM_DOCS.length} Documents Indexés)
          </h3>
        </div>
        <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
          Prêt pour Due Diligence
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {DATA_ROOM_DOCS.map((doc) => (
          <div
            key={doc.id}
            className="p-2.5 rounded-xl bg-[#07090E] border border-white/[0.05] hover:border-white/20 transition flex flex-col justify-between space-y-2 group"
          >
            <div>
              <div className="flex items-center justify-between text-[9px]">
                <span className="text-[#A3A9BA] uppercase">{doc.category}</span>
                <span
                  className={`px-1.5 py-0.2 rounded font-bold border ${
                    doc.status === 'CERTIFIED'
                      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                      : doc.status === 'READY'
                      ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
                      : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                  }`}
                >
                  {doc.status === 'CERTIFIED' ? 'Certifié' : doc.status === 'READY' ? 'Prêt' : 'En revue'}
                </span>
              </div>
              <h4 className="text-[11px] font-bold text-[#F8FAFC] mt-1 group-hover:text-emerald-300 transition line-clamp-2">
                {doc.title}
              </h4>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-white/[0.04] text-[9.5px] text-[#A3A9BA]">
              <span>Format : {doc.format}</span>
              <button
                type="button"
                className="text-white hover:text-emerald-400 transition cursor-pointer flex items-center gap-1"
                title="Consulter le document"
              >
                <span>Ouvrir</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
