/** Nombre público de la aplicación (UI, exportaciones PNG, compartir). */
export const APP_DISPLAY_NAME = 'CHALOSPORTS';

/** Logo en `public/` (nombre con espacio → codificado para URL). */
export const APP_LOGO_URL = '/' + encodeURIComponent('chalosport logo.jpeg');

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
