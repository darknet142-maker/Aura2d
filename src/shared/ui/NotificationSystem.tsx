import React, { useEffect, useState } from 'react';
import { Bell, BellOff, SlidersHorizontal, Trash2, X } from 'lucide-react';
import { motion } from 'motion/react';
import type { AppNotification } from '../types/domain.types';
import {
  DEFAULT_NOTIFICATION_PREFS,
  type NotificationPrefs,
} from '../../features/notifications/notificationGovernance';
import { NotificationPrefsPanel } from '../../features/notifications/NotificationPrefsPanel';
import { SPRING_SNAPPY, SUBTLE_ENTRANCE_VARIANTS } from './springMotion';

export interface NotificationSystemProps {
  activeToast: AppNotification | null;
  onDismissToast: () => void;
  showNotificationsModal: boolean;
  onCloseNotificationsModal: () => void;
  notifications: AppNotification[];
  onClearAllNotifications: () => void;
  onSelectTrackFromNotification: (trackId: string) => void;
  isAdminViewer?: boolean;
  notificationPrefs?: NotificationPrefs;
  onChangeNotificationPrefs?: (next: NotificationPrefs) => void;
}

export const NotificationSystem: React.FC<NotificationSystemProps> = ({
  activeToast,
  onDismissToast,
  showNotificationsModal,
  onCloseNotificationsModal,
  notifications,
  onClearAllNotifications,
  onSelectTrackFromNotification,
  isAdminViewer = false,
  notificationPrefs = DEFAULT_NOTIFICATION_PREFS,
  onChangeNotificationPrefs,
}) => {
  const [showPrefs, setShowPrefs] = useState(false);

  useEffect(() => {
    if (!showNotificationsModal) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseNotificationsModal();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showNotificationsModal, onCloseNotificationsModal]);

  return (
    <>
      {activeToast && !notificationPrefs.dndMutePopups && (
        <motion.div
          role="status"
          aria-live="polite"
          variants={SUBTLE_ENTRANCE_VARIANTS}
          initial="initial"
          animate="animate"
          className="fixed top-14 right-4 z-[95] max-w-sm w-[calc(100%-2rem)] bg-[#0D1017]/96 backdrop-blur-2xl border border-emerald-500/40 rounded-2xl p-3.5 shadow-[0_16px_40px_-10px_rgba(6,8,14,0.92)] flex items-start justify-between gap-3"
        >
          <div className="flex items-start gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
              <Bell className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-[#F8FAFC] truncate">{activeToast.title}</div>
              <div className="text-[11px] text-[#A3A9BA] leading-snug mt-0.5 line-clamp-2 break-words">
                {activeToast.message}
              </div>
            </div>
          </div>
          <button type="button" onClick={onDismissToast} aria-label="Fermer l'alerte" className="p-1 text-[#A3A9BA] hover:text-[#F8FAFC] shrink-0">
            <X className="w-3.5 h-3.5" />
          </button>
        </motion.div>
      )}

      {showNotificationsModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Centre de notifications DROP"
          className="fixed inset-0 z-[98] bg-[#07090E]/82 backdrop-blur-md flex items-center justify-center p-4"
          onClick={onCloseNotificationsModal}
        >
          <motion.div
            variants={SUBTLE_ENTRANCE_VARIANTS}
            initial="initial"
            animate="animate"
            transition={SPRING_SNAPPY}
            className="w-full max-w-md bg-[#0D1017] border border-white/[0.12] rounded-3xl p-4 sm:p-5 flex flex-col gap-3 max-h-[85dvh] overflow-hidden shadow-[0_24px_64px_-12px_rgba(6,8,14,0.95)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-2 border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-2 min-w-0">
                {notificationPrefs.dndMutePopups ? <BellOff className="w-4 h-4 text-amber-300 shrink-0" /> : <Bell className="w-4 h-4 text-amber-300 shrink-0" />}
                <h3 className="text-sm font-extrabold text-[#F8FAFC] truncate">Notifications ({notifications.length})</h3>
                <span className="px-2 py-0.5 rounded-md bg-white/[0.06] text-[9.5px] font-mono text-emerald-300 shrink-0">
                  {isAdminViewer ? 'Admin' : 'Auditeur'}
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowPrefs((p) => !p)}
                  className={`px-2.5 py-1 rounded-xl border text-[10.5px] font-bold flex items-center gap-1 ${showPrefs ? 'bg-amber-400/20 border-amber-400/50 text-amber-300' : 'bg-white/[0.05] border-white/10 text-[#A3A9BA] hover:text-[#F8FAFC]'}`}
                >
                  <SlidersHorizontal className="w-3 h-3" /><span>Réglages</span>
                </button>
                {notifications.length > 0 && (
                  <button type="button" onClick={onClearAllNotifications} aria-label="Effacer toutes les notifications" className="p-1.5 rounded-xl bg-white/[0.05] text-[#A3A9BA] hover:text-[#F8FAFC]">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
                <button type="button" onClick={onCloseNotificationsModal} aria-label="Fermer" className="w-7 h-7 rounded-full bg-white/[0.08] flex items-center justify-center text-[#F8FAFC]">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {showPrefs && onChangeNotificationPrefs && (
              <NotificationPrefsPanel prefs={notificationPrefs} isAdminViewer={isAdminViewer} onChangePrefs={onChangeNotificationPrefs} />
            )}

            <div className="flex-1 overflow-y-auto flex flex-col gap-2 pr-0.5">
              {notifications.length === 0 ? (
                <div className="py-10 text-center text-xs text-[#A3A9BA]">
                  Aucune notification pertinente pour votre profil ({isAdminViewer ? 'Studio Admin' : 'Écoute Auditeur'}).
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => { if (n.trackId) { onSelectTrackFromNotification(n.trackId); onCloseNotificationsModal(); } }}
                    className={`p-3 rounded-2xl border ${n.trackId ? 'cursor-pointer hover:border-emerald-500/45' : ''} ${n.type === 'DATABASE' ? 'bg-amber-500/[0.06] border-amber-500/25' : 'bg-[#080A0F] border-white/[0.08]'}`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-xs font-bold text-[#F8FAFC] truncate">{n.title}</span>
                      <span className="text-[10px] font-mono text-[#A3A9BA] shrink-0">{n.createdAt}</span>
                    </div>
                    <p className="text-[11px] text-[#A3A9BA] leading-relaxed break-words">{n.message}</p>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
};
