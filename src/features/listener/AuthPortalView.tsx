import React from 'react';
import { Music, Sliders, Shield } from 'lucide-react';
import { motion } from 'motion/react';
import { DropOfficialLogo } from '../../components/CoverArtwork';
import { SPRING_SNAPPY, SUBTLE_ENTRANCE_VARIANTS } from '../../shared/ui/springMotion';

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
      <motion.div
        variants={SUBTLE_ENTRANCE_VARIANTS}
        initial="initial"
        animate="animate"
        className="w-full max-w-sm bg-[#0D1017] border border-white/[0.08] rounded-2xl p-5 flex flex-col gap-4 shadow-[0_14px_34px_-12px_rgba(6,8,14,0.88)]"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <DropOfficialLogo className="h-[22px] w-auto max-w-[125px] mb-1.5" />
            <h1 className="text-lg font-bold tracking-tight text-[#F8FAFC] truncate">
              {authMode === 'LOGIN' ? 'Connexion Studio' : 'Inscription Studio'}
            </h1>
          </div>
          <div className="flex bg-[#07090E] p-0.5 rounded-lg border border-white/[0.08] text-xs shrink-0">
            <motion.button
              type="button"
              whileTap={{ scale: 0.96 }}
              transition={SPRING_SNAPPY}
              onClick={() => setAuthMode('LOGIN')}
              className={`px-2.5 py-1 rounded-md font-semibold ${
                authMode === 'LOGIN'
                  ? 'bg-white/15 text-[#F8FAFC]'
                  : 'text-[#A3A9BA] hover:text-[#F8FAFC]'
              }`}
            >
              Accès
            </motion.button>
            <motion.button
              type="button"
              whileTap={{ scale: 0.96 }}
              transition={SPRING_SNAPPY}
              onClick={() => setAuthMode('REGISTER')}
              className={`px-2.5 py-1 rounded-md font-semibold ${
                authMode === 'REGISTER'
                  ? 'bg-white/15 text-[#F8FAFC]'
                  : 'text-[#A3A9BA] hover:text-[#F8FAFC]'
              }`}
            >
              Créer
            </motion.button>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {authMode === 'REGISTER' && (
            <div>
              <label className="block text-[11px] font-semibold text-[#A3A9BA] mb-1">
                Nom d&apos;artiste ou d&apos;auditeur
              </label>
              <input
                type="text"
                value={authName}
                onChange={(e) => setAuthName(e.target.value)}
                placeholder="Alex Rivera"
                className="w-full bg-[#07090E] border border-white/[0.1] rounded-xl px-3 py-2 text-sm text-[#F8FAFC] focus:outline-none focus:border-[#DE1B34]"
              />
            </div>
          )}
          <div>
            <label className="block text-[11px] font-semibold text-[#A3A9BA] mb-1">
              Adresse e-mail
            </label>
            <input
              type="email"
              value={authEmail}
              onChange={(e) => setAuthEmail(e.target.value)}
              placeholder="nom@drop.io"
              className="w-full bg-[#07090E] border border-white/[0.1] rounded-xl px-3 py-2 text-sm text-[#F8FAFC] focus:outline-none focus:border-[#DE1B34]"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 pt-1">
          <motion.button
            type="button"
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.97 }}
            transition={SPRING_SNAPPY}
            onClick={() => {
              setUserPlan('BASIC');
              onQuickEnter('PLAYER', 'USER');
            }}
            className="flex flex-col items-start justify-between p-3 rounded-xl bg-[#07090E] border border-white/[0.12] hover:border-white/25 text-left"
          >
            <div className="w-7 h-7 rounded-lg bg-[#1B202E] text-[#F8FAFC] flex items-center justify-center mb-2">
              <Music className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0 w-full">
              <div className="text-xs font-bold text-[#F8FAFC] truncate">
                DROP Basic
              </div>
              <div className="text-[10px] text-[#A3A9BA] truncate">
                Accès découverte
              </div>
            </div>
          </motion.button>

          <motion.button
            type="button"
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.97 }}
            transition={SPRING_SNAPPY}
            onClick={() => {
              setUserPlan('PRO');
              onQuickEnter('PLAYER', 'USER');
            }}
            className="flex flex-col items-start justify-between p-3 rounded-xl bg-[#DE1B34]/15 border border-[#DE1B34]/45 hover:bg-[#DE1B34]/25 text-left"
          >
            <div className="w-7 h-7 rounded-lg bg-[#DE1B34] text-white flex items-center justify-center mb-2">
              <Sliders className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0 w-full">
              <div className="text-xs font-bold text-[#F8FAFC] truncate">
                DROP Pro
              </div>
              <div className="text-[10px] text-[#CBD5E1] truncate">
                Accès complet
              </div>
            </div>
          </motion.button>

          <motion.button
            type="button"
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.97 }}
            transition={SPRING_SNAPPY}
            onClick={() => {
              setUserPlan('PRO');
              onQuickEnter('ADMIN', 'ADMIN');
            }}
            className="flex flex-col items-start justify-between p-3 rounded-xl bg-emerald-500/12 border border-emerald-500/35 hover:bg-emerald-500/20 text-left"
          >
            <div className="w-7 h-7 rounded-lg bg-emerald-500 text-[#080A0F] flex items-center justify-center mb-2">
              <Shield className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0 w-full">
              <div className="text-xs font-bold text-[#F8FAFC] truncate">
                Studio Admin
              </div>
              <div className="text-[10px] text-emerald-300 truncate">
                Gestion &amp; DRM
              </div>
            </div>
          </motion.button>
        </div>
      </motion.div>
    </main>
  );
};
