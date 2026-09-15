/* Autenticação de demonstração. A validação continua local, sem backend. */
(function () {
  'use strict';

  const SESSION_KEY = 'app_session';

  function create({ getUsers, storage }) {
    function signIn(email, password) {
      const normalizedEmail = String(email).trim().toLowerCase();
      const user = getUsers().find(candidate =>
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
        return session ? getUsers().find(user => user.id === session.userId) || null : null;
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
