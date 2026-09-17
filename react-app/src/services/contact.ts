export function normalizeWhatsApp(value: string) {
  let digits = value.replace(/\D/g, '')
  if (digits.length === 10 || digits.length === 11) digits = '55' + digits
  return digits.length >= 12 && digits.length <= 15 ? digits : ''
}
export function whatsappUrl(number: string, message: string) {
  const normalized = normalizeWhatsApp(number)
  return normalized ? `https://wa.me/${normalized}?text=${encodeURIComponent(message)}` : ''
}
