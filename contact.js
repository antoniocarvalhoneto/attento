/* Formatação e criação de links de contato, sem dependência das telas. */
(function () {
  'use strict';

  function normalizeWhatsApp(value) {
    let digits = String(value || '').replace(/\D/g, '');
    if (digits.length === 10 || digits.length === 11) digits = '55' + digits;
    return digits.length >= 12 && digits.length <= 15 ? digits : '';
  }

  function whatsappUrl(number, message) {
    const normalized = normalizeWhatsApp(number);
    return normalized ? `https://wa.me/${normalized}?text=${encodeURIComponent(message)}` : '';
  }

  window.AttentoContact = { normalizeWhatsApp, whatsappUrl };
})();
