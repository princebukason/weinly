export const WHATSAPP_NUMBER = "2348130630046";
export const SUPPORT_EMAIL = "support@weinly.com";

export function buildWhatsappLink(message: string) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}