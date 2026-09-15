const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function startNavigation() {
  const scrolls = [];
  const focuses = [];
  const nav = { scrollLeft: 0, getBoundingClientRect: () => ({ left: 0, right: 300 }) };
  const items = ['dashboard', 'availability'].map((view, i) => ({
    dataset: { view }, parentElement: nav,
    classList: { toggle() {} }, setAttribute() {}, removeAttribute() {},
    getBoundingClientRect: () => ({ left: i * 250, right: i * 250 + 200 })
  }));
  const root = {
    cloneNode: () => ({ focus: options => focuses.push(options) }),
    parentNode: { replaceChild() {} }
  };
  const context = vm.createContext({
    $: selector => selector === '#view-root' ? root : {},
    $$: () => items,
    STATE: { currentUser: { role: 'admin' }, currentView: 'dashboard' },
    VIEW_TITLES: {},
    RENDERERS: { dashboard: () => '<h1>Dashboard</h1>', availability: () => '<h1>Disponibilidade</h1>' },
    bindViewEvents() {}, viewAllowedForRole: () => true,
    location: { hash: '#dashboard' },
    window: { scrollTo: options => scrolls.push(options) }
  });
  // Executa o roteamento real com DOM e conteúdo das páginas simulados.
  const source = fs.readFileSync(path.join(__dirname, '..', 'script.js'), 'utf8');
  const start = source.indexOf('  function renderCurrentView()');
  const end = source.indexOf('  function computeDashboardStats()', start);
  vm.runInContext(source.slice(start, end), context);
  return { context, scrolls, focuses, nav };
}

for (const view of ['dashboard', 'availability']) {
  test(`${view}: navegação abre no topo sem rolagem automática do foco`, () => {
    const page = startNavigation();
    vm.runInContext(`navigate('${view}')`, page.context);
    assert.equal(page.scrolls.length, 1);
    assert.equal(page.scrolls[0].top, 0);
    assert.equal(page.scrolls[0].behavior, 'instant');
    assert.equal(page.focuses[0].preventScroll, true);
  });
}

test('atualização da página preserva rolagem vertical e revela a aba apenas na horizontal', () => {
  const page = startNavigation();
  vm.runInContext("STATE.currentView = 'availability'; rerender()", page.context);
  assert.equal(page.scrolls.length, 0);
  assert.equal(page.focuses[0].preventScroll, true);
  assert.equal(page.nav.scrollLeft, 150);
});
