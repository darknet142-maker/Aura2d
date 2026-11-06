import React from 'react';
import { Bell, X } from 'lucide-react';
import type { AppNotification } from '../types/domain.types';

export interface NotificationSystemProps {
  activeToast: AppNotification | null;
  onDismissToast: () => void;
  showNotificationsModal: boolean;
  onCloseNotificationsModal: () => void;
  notifications: AppNotification[];
  onClearAllNotifications: () => void;
  onSelectTrackFromNotification: (trackId: string) => void;
}

export const NotificationSystem: React.FC<NotificationSystemProps> = ({
  activeToast,
  onDismissToast,
  showNotificationsModal,
  onCloseNotificationsModal,
  notifications,
  onClearAllNotifications,
  onSelectTrackFromNotification,
}) => {
  return (
    <>
      {activeToast && (
        <div className="fixed top-14 right-4 z-[95] max-w-sm w-[calc(100%-2rem)] bg-[#10131C]/95 backdrop-blur-2xl border border-emerald-500/40 rounded-2xl p-3.5 shadow-2xl flex items-start justify-between gap-3 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-start gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
              <Bell className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-[#F5F2EB] truncate">
                {activeToast.title}
              </div>
              <div className="text-[11px] text-zinc-300 leading-snug mt-0.5">
                {activeToast.message}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onDismissToast}
            className="p-1 text-zinc-400 hover:text-white shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {showNotificationsModal && (
        <div
          className="fixed inset-0 z-[98] bg-black/75 backdrop-blur-md flex items-center justify-center p-4"
          onClick={onCloseNotificationsModal}
        >
          <div
            className="w-full max-w-md bg-[#0E1118] border border-white/15 rounded-3xl p-4 sm:p-5 flex flex-col gap-3.5 max-h-[82dvh] overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-300" />
                <h3 className="text-sm font-bold text-[#F5F2EB]">
                  Notifications ({notifications.length})
                </h3>
              </div>
              <div className="flex items-center gap-2">
                {notifications.length > 0 && (
                  <button
                    type="button"
                    onClick={onClearAllNotifications}
                    className="text-[11px] text-zinc-400 hover:text-white"
                  >
                    Tout effacer
                  </button>
                )}
                <button
                  type="button"
                  onClick={onCloseNotificationsModal}
                  className="w-7 h-7 rounded-full bg-white/[0.06] flex items-center justify-center text-zinc-300 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto flex flex-col gap-2 pr-0.5">
              {notifications.length === 0 ? (
                <div className="py-10 text-center text-xs text-[#8E93A4]">
                  Aucune notification pour le moment.
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => {
                      if (n.trackId) {
                        onSelectTrackFromNotification(n.trackId);
                        onCloseNotificationsModal();
                      }
                    }}
                    className={`p-3 rounded-2xl border transition-colors ${
                      n.trackId
                        ? 'cursor-pointer hover:border-emerald-500/40'
                        : ''
                    } ${
                      n.type === 'PUBLISH'
                        ? 'bg-emerald-500/[0.07] border-emerald-500/25'
                        : n.type === 'DATABASE'
                          ? 'bg-amber-500/[0.07] border-amber-500/25'
                          : 'bg-[#07080C] border-white/[0.07]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-xs font-bold text-[#F5F2EB] truncate">
                        {n.title}
                      </span>
                      <span className="text-[10px] font-mono text-[#8E93A4] shrink-0">
                        {n.createdAt}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-300 leading-relaxed">
                      {n.message}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

