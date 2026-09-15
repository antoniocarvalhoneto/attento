const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const context = { window: {}, encodeURIComponent };
vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../contact.js'), 'utf8'), context);
const contact = context.window.AttentoContact;

test('normaliza números brasileiros com e sem código do país', () => {
  assert.equal(contact.normalizeWhatsApp('(11) 99999-9999'), '5511999999999');
  assert.equal(contact.normalizeWhatsApp('+55 11 99999-9999'), '5511999999999');
});

test('rejeita contato vazio ou incompleto', () => {
  assert.equal(contact.normalizeWhatsApp(''), '');
  assert.equal(contact.normalizeWhatsApp('9999-9999'), '');
  assert.equal(contact.whatsappUrl('', 'Olá'), '');
});

test('cria link seguro com a mensagem codificada', () => {
  assert.equal(
    contact.whatsappUrl('+55 11 99999-9999', 'Olá! Horário às 14:00.'),
    'https://wa.me/5511999999999?text=Ol%C3%A1!%20Hor%C3%A1rio%20%C3%A0s%2014%3A00.'
  );
});
