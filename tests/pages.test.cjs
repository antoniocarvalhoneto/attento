const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function startPage(filename, { hash = '', entries = [] } = {}) {
  const data = new Map(entries);
  const redirects = [];
  const handlers = {};
  const root = {};
  let form;
  let reloads = 0;
  const storage = {
    getItem: key => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, value),
    removeItem: key => data.delete(key)
  };
  const context = vm.createContext({
    console: { error() {} },
    localStorage: storage,
    location: { hash, replace: url => redirects.push(url), reload: () => reloads++ },
    document: {
      addEventListener: (event, handler) => { handlers[event] = handler; },
      documentElement: { setAttribute() {} },
      querySelector(selector) {
        assert.equal(filename, 'login-page.js', 'O painel sem sessão não deve acessar suas telas');
        assert.equal(selector, '#login-screen');
        return root;
      }
    },
    window: {
      addEventListener: (event, handler) => { handlers[event] = handler; },
      AttentoLogin: { mount: options => { form = options; } }
    }
  });
  for (const file of ['auth.js', filename]) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), context);
  }
  handlers.DOMContentLoaded();
  return { data, redirects, form, root, storage, handlers, reloads: () => reloads };
}

test('painel sem sessão redireciona preservando o destino e não inicializa dados', () => {
  const page = startPage('script.js', { hash: '#financial' });
  assert.deepEqual(page.redirects, ['login.html#financial']);
  assert.equal(page.data.size, 0);
});

test('painel com sessão corrompida redireciona para o login', () => {
  const page = startPage('script.js', { entries: [['app_session', '{']] });
  assert.deepEqual(page.redirects, ['login.html']);
});

test('primeiro acesso cria contas demo e entra no destino sem executar o painel', () => {
  const page = startPage('login-page.js', { hash: '#availability' });
  assert.equal(page.form.root, page.root);
  assert.equal(page.form.onSubmit('usuario@demo.com', '123456'), true);
  assert.deepEqual(page.redirects, ['index.html#availability']);
  assert.deepEqual(JSON.parse(page.data.get('app_session')), { userId: 'user_demo' });
  assert.equal(JSON.parse(page.data.get('app_users')).length, 2);
  assert.equal(page.data.has('app_rooms'), false);
});

test('senha incorreta permanece no login e não cria sessão', () => {
  const page = startPage('login-page.js');
  assert.equal(page.form.onSubmit('admin@demo.com', 'errada'), false);
  assert.equal(page.data.has('app_session'), false);
  assert.deepEqual(page.redirects, []);
});

test('login com sessão existente abre diretamente o destino', () => {
  const users = [{ id: 'existing', email: 'existing@example.com', password: 'secret', role: 'user' }];
  const page = startPage('login-page.js', {
    hash: '#myschedule',
    entries: [['app_users', JSON.stringify(users)], ['app_session', JSON.stringify({ userId: 'existing' })]]
  });
  assert.deepEqual(page.redirects, ['index.html#myschedule']);
  assert.equal(page.form, undefined);
  assert.deepEqual(JSON.parse(page.data.get('app_users')), users);
});

test('usuários existentes não são substituídos pelas contas de demonstração', () => {
  const users = [{ id: 'existing', email: 'existing@example.com', password: 'secret', role: 'admin' }];
  const page = startPage('login-page.js', { entries: [['app_users', JSON.stringify(users)]] });
  assert.equal(page.form.onSubmit('existing@example.com', 'secret'), true);
  assert.deepEqual(JSON.parse(page.data.get('app_users')), users);
});

test('falha ao persistir a sessão não causa um ciclo de redirecionamentos', () => {
  const page = startPage('login-page.js');
  page.storage.setItem = () => { throw new Error('Armazenamento bloqueado'); };
  assert.throws(() => page.form.onSubmit('admin@demo.com', '123456'));
  assert.deepEqual(page.redirects, []);
});

test('restauração pelo histórico recarrega ambas as páginas para verificar a sessão', () => {
  for (const filename of ['script.js', 'login-page.js']) {
    const page = startPage(filename);
    page.handlers.pageshow({ persisted: false });
    assert.equal(page.reloads(), 0);
    page.handlers.pageshow({ persisted: true });
    assert.equal(page.reloads(), 1);
  }
});
