/* Autenticação de demonstração. A validação continua local, sem backend. */
(function () {
  'use strict';

  const SESSION_KEY = 'app_session';
  const USERS_KEY = 'app_users';

  function loadDemoUsers(storage) {
    try {
      const users = JSON.parse(storage.getItem(USERS_KEY));
      if (Array.isArray(users)) return users;
    } catch (error) {
      // Mantém a demonstração utilizável se os dados locais estiverem corrompidos.
    }
    const users = [
      { id: 'admin_demo', name: 'Administrador', email: 'admin@demo.com', password: '123456', role: 'admin' },
      { id: 'user_demo', name: 'Usuário Demonstração', email: 'usuario@demo.com', password: '123456', role: 'user' }
    ];
    try {
      storage.setItem(USERS_KEY, JSON.stringify(users));
    } catch (error) {
      console.error('Falha ao salvar usuários de demonstração', error);
    }
    return users;
  }

  function create({ getUsers, storage }) {
    const resolveUsers = getUsers || (() => loadDemoUsers(storage));
    function signIn(email, password) {
      const normalizedEmail = String(email).trim().toLowerCase();
      const user = resolveUsers().find(candidate =>
        candidate.email.toLowerCase() === normalizedEmail && candidate.password === password
      );
      if (!user) return null;

      try {
        storage.setItem(SESSION_KEY, JSON.stringify({ userId: user.id }));
      } catch (error) {
        console.error('Falha ao salvar sessão', error);
      }
      return user;
    }

    function restoreSession() {
      try {
        const session = JSON.parse(storage.getItem(SESSION_KEY));
        return session ? resolveUsers().find(user => user.id === session.userId) || null : null;
      } catch (error) {
        return null;
      }
    }

    function signOut() {
      storage.removeItem(SESSION_KEY);
    }

    return { signIn, restoreSession, signOut };
  }

  window.AttentoAuth = { create };
})();
