/* Entrada da página de login. Compartilha apenas o serviço de autenticação com o painel. */
(function () {
  'use strict';

  function init() {
    const auth = window.AttentoAuth.create({ storage: localStorage });
    const destination = 'index.html' + location.hash;
    if (auth.restoreSession()) {
      location.replace(destination);
      return;
    }

    try {
      const settings = JSON.parse(localStorage.getItem('app_settings'));
      document.documentElement.setAttribute('data-theme', settings?.theme === 'dark' ? 'dark' : 'light');
    } catch (error) {
      document.documentElement.setAttribute('data-theme', 'light');
    }

    window.AttentoLogin.mount({
      root: document.querySelector('#login-screen'),
      onSubmit(email, password) {
        const user = auth.signIn(email, password);
        if (!user) return false;
        if (auth.restoreSession()?.id !== user.id) {
          throw new Error('A sessão não foi persistida.');
        }
        location.replace(destination);
        return true;
      }
    });
  }

  document.addEventListener('DOMContentLoaded', init);
  window.addEventListener('pageshow', event => {
    if (event.persisted) location.reload();
  });
})();
