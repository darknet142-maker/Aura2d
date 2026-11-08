import React, { useState } from 'react';
import { Smartphone, Laptop, ShieldAlert, CheckCircle2, Trash2 } from 'lucide-react';
import type { AppUser } from '../../../../../shared/types/domain.types';

export interface AuditorDevicesTableProps {
  user: AppUser;
  onRevokeDevice?: (deviceId: string) => void;
}

interface UserDevice {
  id: string;
  name: string;
  type: 'MOBILE' | 'DESKTOP';
  os: string;
  ip: string;
  lastSeen: string;
  status: 'AUTHORIZED' | 'REVOKED';
}

export const AuditorDevicesTable: React.FC<AuditorDevicesTableProps> = ({ user, onRevokeDevice }) => {
  const [devices, setDevices] = useState<UserDevice[]>([
    {
      id: `dev-${user.id}-1`,
      name: 'iPhone 15 Pro (App Mobile DROP)',
      type: 'MOBILE',
      os: 'iOS 18.2 • Client Natif',
      ip: '197.214.34.89 (Libreville, GA)',
      lastSeen: 'Il y a 6 min',
      status: 'AUTHORIZED',
    },
    {
      id: `dev-${user.id}-2`,
      name: 'Chrome 131 sur macOS (Web Console)',
      type: 'DESKTOP',
      os: 'macOS Sequoia 15.1',
      ip: '197.214.34.89 (Libreville, GA)',
      lastSeen: 'En ligne maintenant',
      status: 'AUTHORIZED',
    },
  ]);

  const handleRevoke = (devId: string) => {
    setDevices((prev) =>
      prev.map((d) => (d.id === devId ? { ...d, status: 'REVOKED' } : d))
    );
    if (onRevokeDevice) onRevokeDevice(devId);
  };

  return (
    <div className="p-4 rounded-2xl bg-[#0D1017] border border-white/[0.08] shadow-[0_14px_34px_-12px_rgba(6,8,14,0.88)] space-y-3 font-mono">
      <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5">
        <div className="flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#F8FAFC]">
            Parc des Périphériques &amp; Sessions Actives ({devices.length})
          </h3>
        </div>
        <span className="text-[10px] text-emerald-400 font-bold">Pseudonymisation Conforme</span>
      </div>

      <div className="space-y-2">
        {devices.map((dev) => (
          <div
            key={dev.id}
            className="p-3 rounded-xl bg-[#07090E] border border-white/[0.05] flex flex-wrap items-center justify-between gap-3 text-xs"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2 rounded-lg bg-white/[0.04] border border-white/[0.06] shrink-0 text-cyan-400">
                {dev.type === 'MOBILE' ? <Smartphone className="w-4 h-4" /> : <Laptop className="w-4 h-4" />}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[#F8FAFC] truncate">{dev.name}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded text-[9px] font-bold border ${
                      dev.status === 'AUTHORIZED'
                        ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                        : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                    }`}
                  >
                    {dev.status === 'AUTHORIZED' ? 'Autorisé' : 'Révoqué'}
                  </span>
                </div>
                <p className="text-[10px] text-[#A3A9BA] mt-0.5">
                  {dev.os} • IP : {dev.ip} • Vu : {dev.lastSeen}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {dev.status === 'AUTHORIZED' && (
                <button
                  type="button"
                  onClick={() => handleRevoke(dev.id)}
                  className="px-2.5 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition"
                  title="Révoquer l'appareil et invalider la clé DRM locale"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Révoquer session</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

