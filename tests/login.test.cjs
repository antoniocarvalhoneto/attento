const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function mountLogin(onSubmit) {
  const nodes = new Map();
  const events = new Map();
  function element(selector) {
    if (!nodes.has(selector)) {
      nodes.set(selector, {
        value: '', textContent: '', disabled: false, hidden: false,
        querySelector: child => element(`${selector} ${child}`),
        addEventListener: (event, handler) => events.set(`${selector}:${event}`, handler)
      });
    }
    return nodes.get(selector);
  }
  const context = { window: {}, console: { error() {} } };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../login.js'), 'utf8'), context);
  context.window.AttentoLogin.mount({
    root: { querySelector: element, querySelectorAll: () => [] },
    onSubmit: (email, password) => onSubmit(email, password, element)
  });
  return { element, submit: () => events.get('#login-form:submit')({ preventDefault() {} }) };
}

function assertReady(element) {
  assert.equal(element('#login-submit').disabled, false);
  assert.equal(element('#login-submit .btn-label').hidden, false);
  assert.equal(element('#login-submit .btn-spinner').hidden, true);
}

test('login envia as credenciais imediatamente e restaura o botão ao concluir', () => {
  let submitted;
  const { element, submit } = mountLogin((email, password, fields) => {
    submitted = { email, password };
    assert.equal(fields('#login-submit').disabled, true);
    return true;
  });
  element('#login-email').value = ' admin@demo.com ';
  element('#login-password').value = '123456';
  submit();
  assert.deepEqual(submitted, { email: 'admin@demo.com', password: '123456' });
  assertReady(element);
});

test('credenciais recusadas exibem erro e permitem uma nova tentativa', () => {
  const { element, submit } = mountLogin(() => false);
  element('#login-email').value = 'admin@demo.com';
  element('#login-password').value = 'errada';
  submit();
  assert.equal(element('#login-general-error').textContent, 'E-mail ou senha inválidos.');
  assertReady(element);
});

test('falha durante o acesso exibe orientação e libera o formulário', () => {
  const { element, submit } = mountLogin(() => { throw new Error('Falha de sessão'); });
  element('#login-email').value = 'admin@demo.com';
  element('#login-password').value = '123456';
  submit();
  assert.match(element('#login-general-error').textContent, /Não foi possível concluir o acesso/);
  assertReady(element);
});

test('campos vazios são validados antes de solicitar autenticação', () => {
  let attempts = 0;
  const { element, submit } = mountLogin(() => { attempts++; });
  submit();
  assert.equal(attempts, 0);
  assert.equal(element('#login-email-error').textContent, 'Informe o e-mail.');
  assert.equal(element('#login-password-error').textContent, 'Informe a senha.');
  assert.equal(element('#login-submit').disabled, false);
});
