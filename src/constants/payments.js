/**
 * Pagos a tu cuenta (Nequi, llave Bre-B u otra).
 *
 * En `.env` (no subas llaves reales al repositorio público):
 *   VITE_PAYMENT_LLAVE=3001234567
 *   VITE_PAYMENT_RECIPIENT_NAME=Tu nombre o club
 *   VITE_PAYMENT_CHECKOUT_URL=https://...
 *
 * Si Nequi/Banco te da un enlace de pago (comercio), ponlo en VITE_PAYMENT_CHECKOUT_URL;
 * el botón "Ir a pagar" lo abrirá en una pestaña nueva.
 */

export const PAYMENT_LLAVE = String(import.meta.env.VITE_PAYMENT_LLAVE || '').trim();

export const PAYMENT_RECIPIENT_NAME = String(import.meta.env.VITE_PAYMENT_RECIPIENT_NAME || '').trim();

/** Enlace opcional: página de pago Nequi/comercio o app web. */
export const PAYMENT_CHECKOUT_URL = String(import.meta.env.VITE_PAYMENT_CHECKOUT_URL || '').trim();

const FALLBACK_NEQUI_SITE = 'https://www.nequi.com.co/';

export function paymentReceivingConfigured() {
  return Boolean(PAYMENT_LLAVE || PAYMENT_CHECKOUT_URL);
}

/** URL que abre el botón principal de pago (checkout propio o sitio Nequi). */
export function getPaymentOpenUrl() {
  if (PAYMENT_CHECKOUT_URL && /^https?:\/\//i.test(PAYMENT_CHECKOUT_URL)) {
    return PAYMENT_CHECKOUT_URL;
  }
  return FALLBACK_NEQUI_SITE;
}
