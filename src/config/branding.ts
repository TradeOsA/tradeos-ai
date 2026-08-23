/**
 * Global Branding & App Identity Configuration
 * Update this file to change the App Name, Domain, and Copyright across the entire application.
 */
export interface BrandingConfig {
  name: string;
  tagline: string;
  shortName: string;
  domain: string;
  year: string;
  copyrightOwner: string;
  rightsReservedText: string;
  supportEmail: string;
}

export const APP_CONFIG: BrandingConfig = {
  name: 'TradeosAi',
  tagline: 'Institutional AI Trading Terminal & Real-Time Risk Intelligence',
  shortName: 'TradeosAi',
  domain: 'tradeosai.in',
  year: '2026',
  copyrightOwner: 'TradeosAi',
  rightsReservedText: 'All Rights Reserved © 2026 TradeosAi. Built with institutional-grade risk intelligence & high-speed execution.',
  supportEmail: 'tradeos.crypto@gmail.com',
};
