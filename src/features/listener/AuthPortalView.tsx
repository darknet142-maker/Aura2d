import React from 'react';
import { Music, Sliders, Shield } from 'lucide-react';
import { DropOfficialLogo } from '../../components/CoverArtwork';

export interface AuthPortalViewProps {
  authMode: 'LOGIN' | 'REGISTER';
  setAuthMode: React.Dispatch<React.SetStateAction<'LOGIN' | 'REGISTER'>>;
  authName: string;
  setAuthName: React.Dispatch<React.SetStateAction<string>>;
  authEmail: string;
  setAuthEmail: React.Dispatch<React.SetStateAction<string>>;
  setUserPlan: React.Dispatch<React.SetStateAction<'BASIC' | 'PRO'>>;
  onQuickEnter: (targetView: 'PLAYER' | 'ADMIN', role: 'USER' | 'ADMIN') => void;
}

export const AuthPortalView: React.FC<AuthPortalViewProps> = ({
  authMode,
  setAuthMode,
  authName,
  setAuthName,
  authEmail,
  setAuthEmail,
  setUserPlan,
  onQuickEnter,
}) => {
  return (
    <main className="relative z-10 flex-1 w-full flex items-center justify-center p-4 overflow-hidden">
      <div className="w-full max-w-sm bg-[#0E1118] border border-white/[0.08] rounded-2xl p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <DropOfficialLogo className="h-[22px] w-auto max-w-[125px] mb-1.5" />
            <h1 className="text-lg font-bold tracking-tight truncate">
              {authMode === 'LOGIN' ? 'Connexion' : 'Inscription'}
            </h1>
          </div>
          <div className="flex bg-white/[0.04] p-0.5 rounded-lg border border-white/[0.07] text-xs shrink-0">
            <button
              type="button"
              onClick={() => setAuthMode('LOGIN')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                authMode === 'LOGIN'
                  ? 'bg-white/10 text-[#F5F2EB]'
                  : 'text-[#8E93A4]'
              }`}
            >
              Accès
            </button>
            <button
              type="button"
              onClick={() => setAuthMode('REGISTER')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                authMode === 'REGISTER'
                  ? 'bg-white/10 text-[#F5F2EB]'
                  : 'text-[#8E93A4]'
              }`}
            >
              Créer
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {authMode === 'REGISTER' && (
            <div>
              <label className="block text-[11px] text-[#8E93A4] mb-1">
                Nom
              </label>
              <input
                type="text"
                value={authName}
                onChange={(e) => setAuthName(e.target.value)}
                placeholder="Alex Rivera"
                className="w-full bg-[#07080C] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-[#F5F2EB] focus:outline-none focus:border-[#DE1B34]"
              />
            </div>
          )}
          <div>
            <label className="block text-[11px] text-[#8E93A4] mb-1">
              E-mail
            </label>
            <input
              type="email"
              value={authEmail}
              onChange={(e) => setAuthEmail(e.target.value)}
              placeholder="nom@drop.io"
              className="w-full bg-[#07080C] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-[#F5F2EB] focus:outline-none focus:border-[#DE1B34]"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 pt-1">
          <button
            type="button"
            onClick={() => {
              setUserPlan('BASIC');
              onQuickEnter('PLAYER', 'USER');
            }}
            className="flex flex-col items-start justify-between p-3 rounded-xl bg-white/[0.04] border border-white/[0.12] hover:bg-white/[0.08] transition-colors text-left"
          >
            <div className="w-7 h-7 rounded-lg bg-zinc-700 text-white flex items-center justify-center mb-2">
              <Music className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0 w-full">
              <div className="text-xs font-bold text-[#F5F2EB] truncate">
                DROP Basic
              </div>
              <div className="text-[10px] text-[#8E93A4] truncate">
                Fonctions grisées
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              setUserPlan('PRO');
              onQuickEnter('PLAYER', 'USER');
            }}
            className="flex flex-col items-start justify-between p-3 rounded-xl bg-[#DE1B34]/15 border border-[#DE1B34]/40 hover:bg-[#DE1B34]/25 transition-colors text-left"
          >
            <div className="w-7 h-7 rounded-lg bg-[#DE1B34] text-white flex items-center justify-center mb-2">
              <Sliders className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0 w-full">
              <div className="text-xs font-bold text-[#F5F2EB] truncate">
                DROP Pro
              </div>
              <div className="text-[10px] text-[#8E93A4] truncate">
                Accès complet
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              setUserPlan('PRO');
              onQuickEnter('ADMIN', 'ADMIN');
            }}
            className="flex flex-col items-start justify-between p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 transition-colors text-left"
          >
            <div className="w-7 h-7 rounded-lg bg-emerald-500 text-[#07080C] flex items-center justify-center mb-2">
              <Shield className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0 w-full">
              <div className="text-xs font-bold text-[#F5F2EB] truncate">
                Studio Admin
              </div>
              <div className="text-[10px] text-[#8E93A4] truncate">
                Gestion &amp; DRM
              </div>
            </div>
          </button>
        </div>
      </div>
    </main>
  );
};
