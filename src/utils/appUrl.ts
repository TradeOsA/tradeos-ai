/**
 * Utility to get the public standalone Cloud Run app URL.
 * Prevents 403 errors caused by internal Google AI Studio sandbox/auth URLs.
 */
export const PUBLIC_STANDALONE_URL = 'https://ais-dev-p7iqsvpfkvlgold72ftw2x-284362164943.asia-southeast1.run.app';

export function getPublicAppUrl(): string {
  if (typeof window === 'undefined') {
    return PUBLIC_STANDALONE_URL;
  }

  try {
    const origin = window.location.origin;
    // If we're already running on the standalone Cloud Run domain (not inside internal aistudio.google.com)
    if (origin && !origin.includes('aistudio.google.com') && origin.includes('.run.app')) {
      return origin;
    }
  } catch {
    // ignore
  }

  return PUBLIC_STANDALONE_URL;
}
