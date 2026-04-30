/** Nombre público de la aplicación (UI, exportaciones PNG, compartir). */
export const APP_DISPLAY_NAME = 'CHALOSPORTS';

/** Logo PNG con transparencia en `public/`. */
export const APP_LOGO_URL = '/chalosport-logo.png';

/** Host para pies de página en imágenes (sin protocolo). */
export function appSiteHostname() {
  const raw =
    typeof import.meta !== 'undefined' && import.meta.env?.VITE_APP_URL
      ? String(import.meta.env.VITE_APP_URL).trim()
      : '';
  let href = raw;
  if (href && !/^https?:\/\//i.test(href)) href = `https://${href}`;
  try {
    if (href) return new URL(href).host;
  } catch {
    /* VITE_APP_URL inválido */
  }
  if (typeof window !== 'undefined' && window.location?.host) return window.location.host;
  return APP_DISPLAY_NAME.toLowerCase();
}
