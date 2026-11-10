import React, { useState } from 'react';
import { SquaredUpObservabilityCard } from './SquaredUpObservabilityCard';
import { AdminDatabaseManager } from '../../AdminDatabaseManager';
import type { ReturnTypeUseDropPlatformController } from '../../../../listener/hooks/useDropPlatformController';

export interface AdminInfrastructureWorkspaceProps {
  ctrl: ReturnTypeUseDropPlatformController;
}

export const AdminInfrastructureWorkspace: React.FC<AdminInfrastructureWorkspaceProps> = ({ ctrl }) => {
  const [subTab, setSubTab] = useState<'METRICS' | 'ENTITIES'>('METRICS');

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex items-center gap-2 p-1 rounded-xl bg-[#0D1017] border border-white/10 w-fit text-xs">
        <button
          type="button"
          onClick={() => setSubTab('METRICS')}
          className={`px-3.5 py-1.5 rounded-lg font-bold cursor-pointer transition ${
            subTab === 'METRICS' ? 'bg-[#DE1B34] text-white shadow-sm' : 'text-[#A3A9BA] hover:text-white'
          }`}
        >
          Observabilité &amp; Disponibilité (100.00%)
        </button>
        <button
          type="button"
          onClick={() => setSubTab('ENTITIES')}
          className={`px-3.5 py-1.5 rounded-lg font-bold cursor-pointer transition ${
            subTab === 'ENTITIES' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'text-[#A3A9BA] hover:text-white'
          }`}
        >
          Base de Données Métiers &amp; Entités SQL
        </button>
      </div>

      <SquaredUpObservabilityCard
        supabaseHealthMsg={ctrl.supabaseHealthMsg}
        queueLength={ctrl.syncSnapshot.queue.length}
        onForceClearCache={() => {
          ctrl.refreshAllCloudData();
          ctrl.pushNotification(
            'Cache purgé avec succès',
            'Toutes les pistes et métadonnées ont été rechargées depuis le serveur central et Supabase.',
            'DATABASE'
          );
        }}
      />

      {subTab === 'ENTITIES' && (
        <AdminDatabaseManager
          supabaseHealthMsg={ctrl.supabaseHealthMsg}
          entityDb={ctrl.entityDb}
          onRegisterEntity={ctrl.handleRegisterEntityInDb}
          onDeleteEntity={ctrl.handleDeleteEntityFromDb}
          onSaveAndSyncAll={ctrl.handleSaveAndSyncAllAdmin}
          pushNotification={ctrl.pushNotification}
        />
      )}
    </div>
  );
};
