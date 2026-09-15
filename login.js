/* Eventos do formulario de login, independentes do dashboard e do armazenamento. */
(function () {
  'use strict';

  function mount({ root, onSubmit }) {
    const $ = selector => root.querySelector(selector);
    const $$ = selector => Array.from(root.querySelectorAll(selector));

    $('#login-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const email = $('#login-email').value.trim();
      const password = $('#login-password').value;
      $('#login-email-error').textContent = ''; $('#login-password-error').textContent = ''; $('#login-general-error').textContent = '';
      let valid = true;
      if (!email) { $('#login-email-error').textContent = 'Informe o e-mail.'; valid = false; }
      if (!password) { $('#login-password-error').textContent = 'Informe a senha.'; valid = false; }
      if (!valid) return;

      const submitBtn = $('#login-submit');
      submitBtn.disabled = true;
      submitBtn.querySelector('.btn-label').hidden = true;
      submitBtn.querySelector('.btn-spinner').hidden = false;

      try {
        if (!onSubmit(email, password)) { $('#login-general-error').textContent = 'E-mail ou senha inválidos.'; }
      } catch (error) {
        console.error('Falha ao concluir o acesso', error);
        $('#login-general-error').textContent = 'Não foi possível concluir o acesso. Verifique se o navegador permite salvar dados deste site.';
      } finally {
        submitBtn.disabled = false;
        submitBtn.querySelector('.btn-label').hidden = false;
        submitBtn.querySelector('.btn-spinner').hidden = true;
      }
    });

    $('#password-toggle').addEventListener('click', () => {
      const input = $('#login-password');
      const icon = $('#password-toggle i');
      const showing = input.type === 'text';
      input.type = showing ? 'password' : 'text';
      icon.className = showing ? 'fa-solid fa-eye' : 'fa-solid fa-eye-slash';
      $('#password-toggle').setAttribute('aria-label', showing ? 'Mostrar senha' : 'Ocultar senha');
    });

    $$('.demo-chip').forEach(chip => chip.addEventListener('click', () => {
      const kind = chip.dataset.demo;
      $('#login-email').value = kind === 'admin' ? 'admin@demo.com' : 'usuario@demo.com';
      $('#login-password').value = '123456';
    }));
  }

  window.AttentoLogin = { mount };
})();
