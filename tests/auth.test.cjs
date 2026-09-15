const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '../auth.js'), 'utf8');

function setup() {
  const users = [
    { id: 'admin_demo', email: 'admin@demo.com', password: '123456', role: 'admin' },
    { id: 'user_demo', email: 'usuario@demo.com', password: '123456', role: 'user' }
  ];
  const data = new Map();
  const storage = {
    getItem: key => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, value),
    removeItem: key => data.delete(key)
  };
  const context = { window: {}, console: { error() {} } };
  vm.runInNewContext(source, context);
  const create = () => context.window.AttentoAuth.create({ getUsers: () => users, storage });
  return { auth: create(), create, users, data, storage };
}

test('login aceita os dois perfis e persiste apenas a identificação do usuário', () => {
  const { auth, users, data } = setup();
  for (const user of users) {
    assert.equal(auth.signIn(` ${user.email.toUpperCase()} `, '123456'), user);
    assert.deepEqual(JSON.parse(data.get('app_session')), { userId: user.id });
  }
});

test('senha incorreta e usuário desconhecido não criam sessão', () => {
  const { auth, data } = setup();
  assert.equal(auth.signIn('admin@demo.com', 'errada'), null);
  assert.equal(auth.signIn('desconhecido@demo.com', '123456'), null);
  assert.equal(data.has('app_session'), false);
});

test('nova instância restaura a sessão no formato usado antes da extração', () => {
  const { create, data, users } = setup();
  data.set('app_session', JSON.stringify({ userId: 'user_demo' }));
  assert.equal(create().restoreSession(), users[1]);
});

test('sessão ausente, corrompida ou de usuário removido não autentica', () => {
  const { auth, data, users } = setup();
  assert.equal(auth.restoreSession(), null);
  data.set('app_session', '{');
  assert.equal(auth.restoreSession(), null);
  data.set('app_session', JSON.stringify({ userId: 'user_demo' }));
  users.pop();
  assert.equal(auth.restoreSession(), null);
});

test('logout remove a sessão e preserva os outros dados', () => {
  const { auth, create, data } = setup();
  data.set('app_rooms', 'salas existentes');
  auth.signIn('admin@demo.com', '123456');
  auth.signOut();
  assert.equal(create().restoreSession(), null);
  assert.equal(data.get('app_rooms'), 'salas existentes');
});

test('armazenamento indisponível mantém o login local sem restaurar sessão', () => {
  const { auth, storage, users } = setup();
  storage.setItem = () => { throw new Error('Indisponível'); };
  storage.getItem = () => { throw new Error('Indisponível'); };
  assert.equal(auth.signIn('admin@demo.com', '123456'), users[0]);
  assert.equal(auth.restoreSession(), null);
});
