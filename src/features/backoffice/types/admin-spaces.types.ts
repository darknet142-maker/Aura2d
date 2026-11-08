export type AdminSpaceId =
  | '00_OVERVIEW'
  | '01_CATALOGUE'
  | '02_STUDIO'
  | '03_LISTENERS'
  | '04_PARTNERS'
  | '05_FINANCE'
  | '06_ADS'
  | '07_INFRASTRUCTURE'
  | '08_SECURITY';

export interface AdminSpaceDef {
  id: AdminSpaceId;
  code: string;
  name: string;
  subtitle: string;
  iconName: string;
  badge?: string;
}

export const ADMIN_SPACES_REGISTRY: AdminSpaceDef[] = [
  { id: '00_OVERVIEW', code: '00', name: "Vue d'ensemble", subtitle: 'KPIs, santé, alertes & activité', iconName: 'Home' },
  { id: '01_CATALOGUE', code: '01', name: 'Catalogue musical', subtitle: 'Pistes, albums, artistes & CID', iconName: 'Music' },
  { id: '02_STUDIO', code: '02', name: 'Studio & Audio', subtitle: 'Import, LUFS -14 & publication', iconName: 'Sliders' },
  { id: '03_LISTENERS', code: '03', name: 'Auditeurs', subtitle: 'Comptes, pass & historiques', iconName: 'Users' },
  { id: '04_PARTNERS', code: '04', name: 'Labels & Partenaires', subtitle: 'Sponsors, jetons & campagnes', iconName: 'Building2', badge: 'Modèle A' },
  { id: '05_FINANCE', code: '05', name: 'Royalties & Finance', subtitle: 'BUGADA 12%, Master 48%, DGI', iconName: 'Coins' },
  { id: '06_ADS', code: '06', name: 'Publicité', subtitle: 'Bannières Central slideshow', iconName: 'Layers' },
  { id: '07_INFRASTRUCTURE', code: '07', name: 'Infrastructure', subtitle: 'Supabase, SQL & Offline sync', iconName: 'Cpu' },
  { id: '08_SECURITY', code: '08', name: 'Sécurité & DRM', subtitle: 'Chiffrement AES-256 & QR mobile', iconName: 'ShieldCheck' },
];

