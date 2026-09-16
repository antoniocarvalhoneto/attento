const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function setup() {
  const stored = new Map();
  const nodes = new Map();
  const messages = [];
  let failing = true;
  let closed = 0;
  let rendered = 0;
  function element(selector) {
    if (!nodes.has(selector)) nodes.set(selector, {
      value: '', events: {}, innerHTML: '', hidden: true,
      addEventListener(event, handler) { this.events[event] = handler; },
      querySelector: element
    });
    return nodes.get(selector);
  }
  const context = vm.createContext({
    console, Date, Intl,
    localStorage: {
      getItem: key => stored.get(key) ?? null,
      setItem(key, value) { if (failing) throw new Error('QuotaExceededError'); stored.set(key, value); }
    },
    document: { querySelector: element, addEventListener() {}, documentElement: { setAttribute() {} } },
    location: { hash: '', reload() {} },
    window: { addEventListener() {}, AttentoAuth: { create: () => ({ restoreSession: () => ({ id: 'admin', role: 'admin' }) }) } },
    captureToast: (message, type) => messages.push({ message, type }),
    captureClose: () => closed++, captureRender: () => rendered++,
    captureModal: options => options.onMount({ querySelector: element })
  });
  for (const file of ['data-utils.js', 'contact.js']) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), context);
  }
  const source = fs.readFileSync(path.join(__dirname, '..', 'script.js'), 'utf8');
  const hook = `
    showToast = captureToast; closeModal = captureClose; rerender = captureRender; openModal = captureModal;
    window.testing = { STATE, KEYS, persist, saveRecord, markPaid, applyTheme, init, bindViewEvents,
      openRoomModal, openProfModal, openFinModal, openInsModal, openAllocateModal, checkSlot, canDelete, loadAllIntoState };
  `;
  vm.runInContext(source.replace(/\}\)\(\);\s*$/, hook + '\n})();'), context);
  const api = context.window.testing;
  api.STATE.units = [{ id: 'u' }];
  api.STATE.rooms = [{ id: 'r', name: 'Sala', unitId: 'u', status: 'disponivel' }];
  api.STATE.professionals = [{ id: 'p', name: 'Profissional', roomId: 'r', status: 'ativo' }];
  api.STATE.currentUser = { id: 'admin', role: 'admin' };
  return { api, element, messages, stored, allowSave: () => { failing = false; }, closed: () => closed, rendered: () => rendered };
}

for (const [method, field, key, selector, values] of [
  ['openRoomModal', 'rooms', 'rooms', '#rf-save', { '#r-name': 'Nova sala', '#r-unit': 'u', '#r-cap': '6', '#r-status': 'disponivel' }],
  ['openProfModal', 'professionals', 'professionals', '#pf-save', { '#p-name': 'Novo profissional', '#p-unit': 'u', '#p-room': 'r', '#p-value': '10,00' }],
  ['openFinModal', 'financialAccounts', 'financial', '#ff-save', { '#fn-desc': 'Nova conta', '#fn-prof': 'p', '#fn-value': '10,00', '#fn-status': 'pendente' }],
  ['openInsModal', 'insuranceRecords', 'insurance', '#if-save', { '#in-prof': 'p', '#in-qty': '1', '#in-value': '10,00', '#in-status': 'pendente' }]
]) {
  test(`${method}: falha mantém formulário e estado; nova tentativa salva uma única vez`, () => {
    const page = setup();
    const before = JSON.stringify(page.api.STATE[field]);
    page.api[method](null);
    for (const [name, value] of Object.entries(values)) page.element(name).value = value;
    page.element(selector).events.click();
    assert.equal(JSON.stringify(page.api.STATE[field]), before);
    assert.equal(page.closed(), 0);
    assert.equal(page.rendered(), 0);
    assert.equal(page.messages.at(-1).type, 'error');
    assert.equal(page.messages.some(message => message.type === 'success'), false);
    page.allowSave();
    page.element(selector).events.click();
    assert.equal(page.api.STATE[field].length, JSON.parse(before).length + 1);
    assert.equal(page.closed(), 1);
    assert.equal(page.messages.at(-1).type, 'success');
    assert.equal(page.stored.get(page.api.KEYS[key]), JSON.stringify(page.api.STATE[field]));
  });
}

test('edição, pagamento e exclusão não alteram o estado se a gravação falhar', () => {
  const page = setup();
  const account = { id: 'a', status: 'pendente', value: 10 };
  page.api.STATE.financialAccounts = [account];
  assert.equal(page.api.saveRecord(page.api.KEYS.financial, account, { value: 20 }), false);
  page.api.markPaid(account);
  assert.equal(account.status, 'pendente');
  assert.equal(account.value, 10);
  assert.equal(page.api.persist(page.api.KEYS.financial, []), false);
  assert.equal(page.api.STATE.financialAccounts[0], account);
  assert.equal(page.messages.every(message => message.type === 'error'), true);
  page.allowSave();
  page.api.markPaid(account);
  assert.equal(page.api.STATE.financialAccounts[0].status, 'pago');
  assert.equal(account.status, 'pendente');
});

test('falha ao salvar tema ou contato preserva as preferências atuais', () => {
  const page = setup();
  assert.equal(page.api.applyTheme('dark'), false);
  assert.equal(page.api.STATE.theme, 'light');
  page.api.bindViewEvents('settings');
  page.element('#settings-whatsapp').value = '11999999999';
  page.element('#contact-settings').events.submit({ preventDefault() {} });
  assert.equal(page.api.STATE.whatsapp, '');
  assert.equal(page.rendered(), 0);
  assert.equal(page.messages.every(message => message.type === 'error'), true);
});

test('falha durante a inicialização apresenta mensagem e opção de tentar novamente', () => {
  const page = setup();
  page.api.init();
  assert.equal(page.element('#app-shell').hidden, false);
  assert.match(page.element('#view-root').innerHTML, /Não foi possível carregar/);
  assert.equal(typeof page.element('#retry-load').events.click, 'function');
});

test('confirmação revalida conflito criado com o modal aberto e falha de gravação permite tentar novamente', () => {
  const page = setup();
  page.stored.set(page.api.KEYS.rooms, JSON.stringify(page.api.STATE.rooms));
  page.stored.set(page.api.KEYS.schedules, '[]');
  page.api.openAllocateModal('r', 5, '20:00', 1);
  page.element('#al-prof').value = 'p';
  page.element('#al-value').value = '10,00';
  page.element('#al-confirm').events.click();
  assert.equal(page.api.STATE.schedules.length, 0);
  assert.equal(page.closed(), 0);
  page.allowSave();
  page.element('#al-confirm').events.click();
  assert.equal(page.api.STATE.schedules.length, 1);
  const count = page.messages.length;
  page.element('#al-confirm').events.click();
  assert.equal(page.api.STATE.schedules.length, 1);
  assert.equal(page.messages.length, count + 1);
  assert.equal(page.messages.at(-1).type, 'error');
});

test('migração interrompe a carga se não conseguir gravar e preserva os registros legados', () => {
  const page = setup();
  const legacy = JSON.stringify([{ id: 'old', week: 0, day: 1, time: '09:00', status: 'reservado' }]);
  page.stored.set(page.api.KEYS.schedules, legacy);
  assert.throws(() => page.api.loadAllIntoState(), /QuotaExceededError/);
  assert.equal(page.stored.get(page.api.KEYS.schedules), legacy);
  assert.equal(page.api.STATE.schedules[0].date, undefined);
  page.allowSave();
  page.api.loadAllIntoState();
  assert.match(page.api.STATE.schedules[0].date, /^\d{4}-\d{2}-\d{2}$/);
  assert.equal(page.stored.get(page.api.KEYS.schedules), JSON.stringify(page.api.STATE.schedules));
});

test('exclusão consulta vínculos persistidos e recusa dados indisponíveis', () => {
  const page = setup();
  assert.equal(page.api.canDelete('room', 'r'), false);
  for (const key of ['professionals', 'schedules', 'financial', 'insurance']) page.stored.set(page.api.KEYS[key], '[]');
  assert.equal(page.api.canDelete('room', 'r'), true);
  page.stored.set(page.api.KEYS.schedules, JSON.stringify([{ roomId: 'r' }]));
  assert.equal(page.api.canDelete('room', 'r'), false);
});
