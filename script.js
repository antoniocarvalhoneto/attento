/* ==========================================================================
   ESPAÇO GESTOR — script.js
   Frontend puro (HTML/CSS/JS). Sem backend, sem build step.
   ========================================================================== */
(function () {
  'use strict';

  /* ==========================================================================
     UTILITIES
     ========================================================================== */
  const $ = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));
  const uid = (p) => (p || 'id') + '_' + Math.random().toString(36).slice(2, 9);
  const esc = (str) => String(str == null ? '' : str).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmtCurrency = (n) => (Number(n) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const fmtDate = (iso) => { if (!iso) return '—'; const [y, m, d] = iso.split('-'); return `${d}/${m}/${y}`; };
  const fmtLongDate = (date = new Date()) => date.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const todayISO = () => new Date().toISOString().slice(0, 10);

  
  function parseCurrencyInput(str) {
    if (typeof str !== 'string') return Number(str) || 0;
    const clean = str.replace(/[R$\s.]/g, '').replace(',', '.');
    return parseFloat(clean) || 0;
  }
  function maskCurrencyInput(el) {
    el.addEventListener('input', () => {
      let digits = el.value.replace(/\D/g, '');
      if (!digits) { el.value = ''; return; }
      let num = (parseInt(digits, 10) / 100);
      el.value = num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    });
  }
  const DAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const HOURS = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'];

  function downloadCSV(filename, rows) {
    const csv = rows.map(r => r.map(c => {
      const s = String(c == null ? '' : c);
      return /[",\n;]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
    }).join(';')).join('\r\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /* ==========================================================================
     STORAGE
     ========================================================================== */
  const KEYS = {
    units: 'app_units', rooms: 'app_rooms', professionals: 'app_professionals',
    schedules: 'app_schedules', financial: 'app_financial_accounts', insurance: 'app_insurance',
    settings: 'app_settings'
  };
  function loadData(key) { try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : null; } catch (e) { return null; } }
  function saveData(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { console.error('Falha ao salvar', key, e); } }

  function initializeData() {
    if (!loadData(KEYS.units)) {
      const units = [
        { id: 'unit_centro', name: 'Unidade Centro' },
        { id: 'unit_sul', name: 'Unidade Zona Sul' }
      ];
      saveData(KEYS.units, units);
    }
    if (!loadData(KEYS.rooms)) {
      const rooms = [
        { id: 'room_1', name: 'Sala 01', unitId: 'unit_centro', capacity: 6, status: 'disponivel', description: 'Sala de atendimento individual, climatizada.' },
        { id: 'room_2', name: 'Sala 02', unitId: 'unit_centro', capacity: 8, status: 'disponivel', description: 'Sala ampla para grupos, com maca.' },
        { id: 'room_3', name: 'Sala 03', unitId: 'unit_centro', capacity: 4, status: 'manutencao', description: 'Sala compacta — em manutenção elétrica.' },
        { id: 'room_4', name: 'Sala 04', unitId: 'unit_sul', capacity: 6, status: 'disponivel', description: 'Sala com espelho e balcão.' },
        { id: 'room_5', name: 'Sala 05', unitId: 'unit_sul', capacity: 10, status: 'disponivel', description: 'Sala multiuso, ideal para terapias em grupo.' },
        { id: 'room_6', name: 'Sala 06', unitId: 'unit_sul', capacity: 5, status: 'inativa', description: 'Aguardando reforma.' }
      ];
      saveData(KEYS.rooms, rooms);
    }
    if (!loadData(KEYS.professionals)) {
      const professionals = [
        { id: 'prof_1', name: 'Dr. João Silva', specialty: 'Fisioterapia', unitId: 'unit_centro', roomId: 'room_1', shift: 'Manhã', value: 500, status: 'ativo' },
        { id: 'prof_2', name: 'Dra. Ana Beatriz', specialty: 'Psicologia', unitId: 'unit_centro', roomId: 'room_2', shift: 'Tarde', value: 420, status: 'ativo' },
        { id: 'prof_3', name: 'Dr. Carlos Mendes', specialty: 'Nutrição', unitId: 'unit_sul', roomId: 'room_4', shift: 'Manhã', value: 380, status: 'ativo' },
        { id: 'prof_4', name: 'Dra. Fernanda Lima', specialty: 'Fonoaudiologia', unitId: 'unit_sul', roomId: 'room_5', shift: 'Noite', value: 340, status: 'ativo' },
        { id: 'prof_5', name: 'Dr. Rafael Souza', specialty: 'Terapia Ocupacional', unitId: 'unit_centro', roomId: 'room_1', shift: 'Tarde', value: 400, status: 'inativo' }
      ];
      saveData(KEYS.professionals, professionals);
    }
    if (!loadData(KEYS.schedules)) {
      const schedules = [];
      const roomIds = ['room_1', 'room_2', 'room_4', 'room_5'];
      const profIds = ['prof_1', 'prof_2', 'prof_3', 'prof_4'];
      [0, 1].forEach(week => {
        roomIds.forEach((roomId, ri) => {
          for (let day = 0; day < 6; day++) {
            HOURS.forEach((time, hi) => {
              // Deixa a maior parte disponível; cria padrões plausíveis de ocupação
              const seed = (ri * 31 + day * 7 + hi * 3 + week * 5) % 10;
              let status = 'disponivel';
              if (seed < 2) status = 'ocupado';
              else if (seed < 4) status = 'reservado';
              else if (seed === 4 && ri === 2 && day === 2) status = 'manutencao';
              if (status !== 'disponivel') {
                const room = ROOMS_CACHE.find(r => r.id === roomId);
                schedules.push({
                  id: uid('sch'),
                  week, unitId: room.unitId, roomId, day, time,
                  shift: hi < 4 ? 'Manhã' : (hi < 9 ? 'Tarde' : 'Noite'),
                  professionalId: status === 'manutencao' ? null : profIds[(ri + hi) % profIds.length],
                  value: status === 'manutencao' ? 0 : [420, 380, 500, 340][(ri + hi) % 4],
                  note: '', status, userId: null
                });
              }
            });
          }
        });
      });
      // Alguns horários reservados pelo usuário demo, para "Meus horários"
      schedules.push({ id: uid('sch'), week: 0, unitId: 'unit_centro', roomId: 'room_1', day: 1, time: '09:00', shift: 'Manhã', professionalId: 'prof_1', value: 500, note: 'Avaliação inicial', status: 'reservado', userId: 'user_demo' });
      schedules.push({ id: uid('sch'), week: 0, unitId: 'unit_sul', roomId: 'room_5', day: 3, time: '18:00', shift: 'Noite', professionalId: 'prof_4', value: 340, note: '', status: 'reservado', userId: 'user_demo' });
      saveData(KEYS.schedules, schedules);
    }
    if (!loadData(KEYS.financial)) {
      const financial = [
        { id: uid('fin'), professionalId: 'prof_1', description: 'Repasse sessões — Agosto', value: 4200, dueDate: '2026-08-10', status: 'pago', paymentDate: '2026-08-09' },
        { id: uid('fin'), professionalId: 'prof_2', description: 'Repasse sessões — Agosto', value: 3360, dueDate: '2026-08-15', status: 'pago', paymentDate: '2026-08-15' },
        { id: uid('fin'), professionalId: 'prof_3', description: 'Repasse sessões — Agosto', value: 2280, dueDate: '2026-08-20', status: 'pendente', paymentDate: null },
        { id: uid('fin'), professionalId: 'prof_4', description: 'Repasse sessões — Agosto', value: 1700, dueDate: '2026-08-05', status: 'vencido', paymentDate: null },
        { id: uid('fin'), professionalId: 'prof_1', description: 'Aluguel de sala — avulso', value: 600, dueDate: '2026-09-02', status: 'pendente', paymentDate: null },
        { id: uid('fin'), professionalId: 'prof_2', description: 'Repasse sessões — Setembro', value: 2940, dueDate: '2026-09-15', status: 'pendente', paymentDate: null },
        { id: uid('fin'), professionalId: 'prof_5', description: 'Repasse sessões — Julho', value: 1600, dueDate: '2026-07-28', status: 'vencido', paymentDate: null }
      ];
      saveData(KEYS.financial, financial);
    }
    if (!loadData(KEYS.insurance)) {
      const insurance = [
        { id: uid('ins'), insuranceType: 'Unimed', professionalId: 'prof_1', quantity: 15, unitValue: 40, status: 'pendente' },
        { id: uid('ins'), insuranceType: 'Bradesco Saúde', professionalId: 'prof_2', quantity: 10, unitValue: 55, status: 'pago' },
        { id: uid('ins'), insuranceType: 'Amil', professionalId: 'prof_3', quantity: 8, unitValue: 48, status: 'pendente' },
        { id: uid('ins'), insuranceType: 'SulAmérica', professionalId: 'prof_4', quantity: 12, unitValue: 50, status: 'pago' },
        { id: uid('ins'), insuranceType: 'Particular', professionalId: 'prof_1', quantity: 6, unitValue: 150, status: 'pago' }
      ];
      saveData(KEYS.insurance, insurance);
    }
    if (!loadData(KEYS.settings)) {
      saveData(KEYS.settings, { theme: 'light' });
    }
  }

  /* Cache temporário usado somente durante a geração dos dados de demonstração */
  let ROOMS_CACHE = [
    { id: 'room_1', unitId: 'unit_centro' }, { id: 'room_2', unitId: 'unit_centro' }, { id: 'room_3', unitId: 'unit_centro' },
    { id: 'room_4', unitId: 'unit_sul' }, { id: 'room_5', unitId: 'unit_sul' }, { id: 'room_6', unitId: 'unit_sul' }
  ];

  /* ==========================================================================
     STATE
     ========================================================================== */
  const STATE = {
    currentUser: null, currentView: 'dashboard', theme: 'light', whatsapp: '',
    units: [], rooms: [], professionals: [], schedules: [], financialAccounts: [], insuranceRecords: [],
    filters: {
      availUnit: 'all', availRoom: 'all', availWeek: 0,
      finProf: 'all', finStatus: 'all', finMonth: 'all',
      repProf: 'all', repStatus: 'all', repMonth: 'all'
    }
  };
  const auth = window.AttentoAuth.create({ storage: localStorage });
  const dataUtils = window.AttentoData;
  const contact = window.AttentoContact;

  function loadAllIntoState() {
    STATE.units = loadData(KEYS.units) || [];
    STATE.rooms = loadData(KEYS.rooms) || [];
    STATE.professionals = loadData(KEYS.professionals) || [];
    STATE.schedules = loadData(KEYS.schedules) || [];
    STATE.financialAccounts = loadData(KEYS.financial) || [];
    STATE.insuranceRecords = loadData(KEYS.insurance) || [];
    const settings = loadData(KEYS.settings) || {};
    STATE.theme = settings.theme || 'light';
    STATE.whatsapp = settings.whatsapp || '';
  }
  function persist(key, data) { saveData(key, data); }

  function unitName(id) { return (STATE.units.find(u => u.id === id) || {}).name || '—'; }
  function roomName(id) { return (STATE.rooms.find(r => r.id === id) || {}).name || '—'; }
  function profName(id) { return (STATE.professionals.find(p => p.id === id) || {}).name || '—'; }
  function whatsappLink(message) { return contact.whatsappUrl(STATE.whatsapp, message); }

  /* ==========================================================================
     TOASTS
     ========================================================================== */
  const toastIcons = { success: 'fa-circle-check', warning: 'fa-triangle-exclamation', error: 'fa-circle-xmark', info: 'fa-circle-info' };
  function showToast(message, type) {
    type = type || 'info';
    const root = $('#toast-root');
    const el = document.createElement('div');
    el.className = 'toast ' + type;
    el.innerHTML = `<i class="fa-solid ${toastIcons[type]}" aria-hidden="true"></i><span>${esc(message)}</span>`;
    root.appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; el.style.transform = 'translateX(12px)'; setTimeout(() => el.remove(), 200); }, 3600);
  }

  /* ==========================================================================
     MODALS
     ========================================================================== */
  let activeModalCleanup = null;
  function openModal({ title, bodyHTML, footHTML, onMount, size }) {
    closeModal();
    const root = $('#modal-root');
    root.setAttribute('aria-hidden', 'false');
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
    <div class="modal-box" role="dialog" aria-modal="true" aria-labelledby="modal-title" style="${size === 'lg' ? 'max-width:680px' : ''}">
      <div class="modal-head">
        <h2 id="modal-title">${esc(title)}</h2>
        <button class="modal-close" aria-label="Fechar"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button>
      </div>
      <div class="modal-body">${bodyHTML}</div>
      ${footHTML ? `<div class="modal-foot">${footHTML}</div>` : ''}
    </div>`;
    root.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('show'));

    function onKey(e) {
      if (e.key === 'Escape') { closeModal(); return; }
      if (e.key === 'Tab') {
        // Focus trap: mantém o Tab circulando dentro do modal enquanto aberto.
        const focusable = $$('input,select,textarea,button,a[href]', overlay).filter(el => !el.disabled && el.offsetParent !== null);
        if (!focusable.length) return;
        const first = focusable[0], last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    }
    function onOverlayClick(e) { if (e.target === overlay) closeModal(); }
    overlay.querySelector('.modal-close').addEventListener('click', closeModal);
    overlay.addEventListener('click', onOverlayClick);
    document.addEventListener('keydown', onKey);
    activeModalCleanup = () => document.removeEventListener('keydown', onKey);

    if (onMount) onMount(overlay);
    const firstInput = overlay.querySelector('input,select,textarea,button.btn-primary');
    if (firstInput) firstInput.focus();
  }
  function closeModal() {
    const root = $('#modal-root');
    const overlay = root.querySelector('.modal-overlay');
    if (!overlay) return;
    overlay.classList.remove('show');
    root.setAttribute('aria-hidden', 'true');
    if (activeModalCleanup) activeModalCleanup();
    setTimeout(() => overlay.remove(), 160);
  }
  function confirmModal(message, onConfirm) {
    openModal({
      title: 'Confirmar ação',
      bodyHTML: `<p>${esc(message)}</p>`,
      footHTML: `<button class="btn btn-secondary" id="cm-cancel">Cancelar</button><button class="btn btn-danger" id="cm-confirm">Excluir</button>`,
      onMount: (overlay) => {
        overlay.querySelector('#cm-cancel').addEventListener('click', closeModal);
        overlay.querySelector('#cm-confirm').addEventListener('click', () => { onConfirm(); closeModal(); });
      }
    });
  }

  /* ==========================================================================
     THEME
     ========================================================================== */
  function applyTheme(theme) {
    STATE.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    const icon = $('#theme-toggle i');
    if (icon) icon.className = theme === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
    const settings = loadData(KEYS.settings) || {};
    settings.theme = theme;
    persist(KEYS.settings, settings);
  }
  function toggleTheme() { applyTheme(STATE.theme === 'dark' ? 'light' : 'dark'); }

  /* ==========================================================================
     ENCERRAMENTO DA SESSÃO
     ========================================================================== */
  function logout() {
    STATE.currentUser = null;
    auth.signOut();
    $('#app-shell').hidden = true;
    location.replace('login.html');
  }
  const NAV_ITEMS = {
    admin: [
      { key: 'dashboard', label: 'Dashboard', icon: 'fa-house' },
      { key: 'availability', label: 'Disponibilidade das Salas', icon: 'fa-calendar-days' },
      { key: 'rooms', label: 'Salas', icon: 'fa-door-open' },
      { key: 'professionals', label: 'Profissionais', icon: 'fa-users' },
      { key: 'financial', label: 'Contas / Financeiro', icon: 'fa-wallet' },
      { key: 'insurance', label: 'Convênios', icon: 'fa-handshake' },
      { key: 'reports', label: 'Relatórios', icon: 'fa-chart-line' },
      { key: 'settings', label: 'Configurações', icon: 'fa-gear' }
    ],
    user: [
      { key: 'dashboard', label: 'Dashboard', icon: 'fa-house' },
      { key: 'availability', label: 'Disponibilidade das Salas', icon: 'fa-calendar-days' },
      { key: 'myschedule', label: 'Meus Horários', icon: 'fa-clock' },
      { key: 'settings', label: 'Configurações', icon: 'fa-gear' }
    ]
  };
  const VIEW_TITLES = {
    dashboard: 'Dashboard', availability: 'Disponibilidade das Salas', rooms: 'Salas', professionals: 'Profissionais',
    financial: 'Contas / Financeiro', insurance: 'Convênios', reports: 'Relatórios Financeiros', settings: 'Configurações',
    myschedule: 'Meus Horários'
  };

  function showApp() {
    $('#app-shell').hidden = false;
    $('#app-logo-slot').innerHTML = '';
    const tpl = $('#tpl-logo').content.cloneNode(true);
    $('#app-logo-slot').appendChild(tpl);

    const role = STATE.currentUser.role;
    $('#user-avatar').textContent = STATE.currentUser.name.charAt(0).toUpperCase();
    $('#topbar-user-name').textContent = STATE.currentUser.name;
    $('#topbar-user-role').textContent = role === 'admin' ? 'Administrador' : 'Usuário';

    renderMainNav(role);
    const requested = location.hash.slice(1);
    const initialView = (requested && viewAllowedForRole(requested, role)) ? requested : 'dashboard';
    setRoute(initialView, { silent: true });
  }

  function renderMainNav(role) {
    const nav = $('#main-nav');
    nav.innerHTML = NAV_ITEMS[role].map(item => `
    <button class="nav-item" data-view="${item.key}">
      <i class="fa-solid ${item.icon}" aria-hidden="true"></i><span>${item.label}</span>
    </button>`).join('');
    $$('.nav-item', nav).forEach(btn => btn.addEventListener('click', () => {
      navigate(btn.dataset.view);
    }));
  }

  /* ==========================================================================
     ROUTING
     ========================================================================== */
  const RENDERERS = {}; // preenchido mais abaixo, por módulo
  /* Views restritas por perfil. Impede acesso via navegação manual/hash mesmo
     quando o item não aparece no menu principal. */
  const ADMIN_ONLY_VIEWS = ['rooms', 'professionals', 'financial', 'insurance', 'reports'];
  const USER_ONLY_VIEWS = ['myschedule'];

  function viewAllowedForRole(view, role) {
    if (ADMIN_ONLY_VIEWS.includes(view) && role !== 'admin') return false;
    if (USER_ONLY_VIEWS.includes(view) && role !== 'user') return false;
    return !!(RENDERERS[view]);
  }

  /* Renderiza de fato a view atual. Não mexe no hash — quem decide a rota é
     setRoute()/hashchange, isto aqui só desenha a tela. */
  function renderCurrentView() {
    const view = STATE.currentView;
    $('#view-title').textContent = VIEW_TITLES[view] || 'Attento';
    $$('.nav-item').forEach(b => {
      const active = b.dataset.view === view;
      b.classList.toggle('active', active);
      if (active) {
        b.setAttribute('aria-current', 'page');
        const nav = b.parentElement;
        const navBounds = nav.getBoundingClientRect();
        const itemBounds = b.getBoundingClientRect();
        if (itemBounds.left < navBounds.left) {
          nav.scrollLeft += itemBounds.left - navBounds.left;
        } else if (itemBounds.right > navBounds.right) {
          nav.scrollLeft += itemBounds.right - navBounds.right;
        }
      } else {
        b.removeAttribute('aria-current');
      }
    });
    const root = $('#view-root');
    const renderer = RENDERERS[view];
    // Mantém os atributos do contêiner e descarta os eventos da tela anterior.
    const freshRoot = root.cloneNode(false);
    freshRoot.innerHTML = renderer ? renderer() : '<div class="empty-state"><i class="fa-solid fa-circle-question"></i><p>Módulo não encontrado.</p></div>';
    root.parentNode.replaceChild(freshRoot, root);
    bindViewEvents(view);
    freshRoot.focus({ preventScroll: true });
  }

  /* Ponto único de navegação: decide a rota, valida permissão e sincroniza o
     hash da URL — habilita voltar/avançar do navegador e links diretos. */
  function setRoute(view, opts) {
    opts = opts || {};
    const role = STATE.currentUser ? STATE.currentUser.role : null;
    if (!role) return;
    if (!viewAllowedForRole(view, role)) {
      if (!opts.silent) showToast('Você não tem permissão para acessar essa área.', 'error');
      view = 'dashboard';
    }
    STATE.currentView = view;
    if (location.hash.slice(1) !== view) {
      SUPPRESS_HASHCHANGE = true;
      location.hash = view;
    }
    renderCurrentView();
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }
  let SUPPRESS_HASHCHANGE = false;
  function handleHashChange() {
    if (SUPPRESS_HASHCHANGE) { SUPPRESS_HASHCHANGE = false; return; }
    if (!STATE.currentUser) return; // sem sessão, hash é ignorado até login
    const view = location.hash.slice(1) || 'dashboard';
    setRoute(view, { silent: false });
  }
  /* Alias mantido para compatibilidade com o restante do código, que sempre
     navegou chamando navigate()/rerender(). */
  function navigate(view) { setRoute(view); }
  function rerender() { renderCurrentView(); }

  /* ==========================================================================
     DASHBOARD
     ========================================================================== */
  function computeDashboardStats() {
    const rooms = STATE.rooms;
    const disponiveis = rooms.filter(r => r.status === 'disponivel').length;
    const totalProf = STATE.professionals.filter(p => p.status === 'ativo').length;
    const agendados = dataUtils.upcomingSchedules(STATE.schedules).length;
    const pendentes = STATE.financialAccounts.filter(a => a.status === 'pendente');
    return { disponiveis, totalProf, agendados, pendentesCount: pendentes.length };
  }
  function renderDashboardAdmin() {
    const s = computeDashboardStats();
    const weekCounts = DAYS.map((d, i) => STATE.schedules.filter(sc => sc.week === 0 && sc.day === i && sc.status === 'reservado').length);
    const chartStep = Math.max(1, Math.ceil(Math.max(...weekCounts) / 4));
    const chartMax = chartStep * 4;
    const weekTotal = weekCounts.reduce((total, count) => total + count, 0);
    const todayIndex = (new Date().getDay() + 6) % 7;
    const financeStatus = {
      pago: STATE.financialAccounts.filter(a => a.status === 'pago').length,
      pendente: STATE.financialAccounts.filter(a => a.status === 'pendente').length,
      vencido: STATE.financialAccounts.filter(a => a.status === 'vencido').length
    };
    const totalFin = financeStatus.pago + financeStatus.pendente + financeStatus.vencido || 1;
    const financialSummary = financeStatus.pendente === 0 && financeStatus.vencido === 0
      ? 'Nenhuma conta pendente ou vencida.'
      : `${financeStatus.pendente} ${financeStatus.pendente === 1 ? 'conta pendente' : 'contas pendentes'} · ${financeStatus.vencido} ${financeStatus.vencido === 1 ? 'conta vencida' : 'contas vencidas'}`;
    const reservations = dataUtils.upcomingSchedules(STATE.schedules);
    const agendaPreview = reservations.slice(0, 6);

    return `
  <div class="page-head">
    <div class="page-head-text">
      <h1>Olá, ${esc(STATE.currentUser.name.split(' ')[0])}</h1>
      <p>${esc(fmtLongDate())} · Todas as unidades</p>
      <p>${financialSummary}</p>
    </div>
    <a href="#financial">Ver financeiro</a>
  </div>

  <div class="section">
    <div class="stat-grid">
      ${statCard('fa-door-open', 'neutral', 'Salas disponíveis', s.disponiveis)}
      ${statCard('fa-users', 'neutral', 'Profissionais ativos', s.totalProf)}
      ${statCard('fa-calendar-check', 'neutral', 'Horários agendados', s.agendados)}
      ${statCard('fa-hourglass-half', s.pendentesCount > 0 ? 'amber' : 'neutral', 'Contas pendentes', s.pendentesCount)}
    </div>
  </div>

  <div class="section">
    <div class="section-head">
      <div>
        <h2>Agenda de reservas</h2>
        <p>Semana atual e próxima semana · Exibindo ${agendaPreview.length} de ${reservations.length} ${reservations.length === 1 ? 'reserva' : 'reservas'}</p>
      </div>
      <a href="#availability">Abrir agenda completa</a>
    </div>
    ${tableOrEmpty(agendaPreview, ['Semana', 'Horário', 'Sala', 'Profissional', 'Unidade', 'Status'], agendaPreview.map(sc => [
      sc.week === 0 ? 'Atual' : 'Próxima', `${DAYS[sc.day]} · ${sc.time}`, roomName(sc.roomId), sc.professionalId ? profName(sc.professionalId) : '—', unitName(sc.unitId), statusBadge(sc.status)
    ]), 'Nenhuma reserva cadastrada. Abra a agenda para reservar um horário.', 'fa-calendar-xmark')}
  </div>

  <div class="section">
    <div class="section-head"><h2>Reservas nesta semana</h2></div>
    <div class="week-strip">
      ${DAYS.map((d, i) => `<div class="week-day"><div class="wd-label">${d}</div><div class="wd-count">${weekCounts[i]}</div><div class="wd-sub">${weekCounts[i] === 1 ? 'reserva' : 'reservas'}</div></div>`).join('')}
    </div>
  </div>

  <div class="section two-col">
    <div class="card">
      <div class="reservation-chart-head">
        <h3>Reservas por dia</h3>
        <span class="reservation-chart-total">${weekTotal} ${weekTotal === 1 ? 'reserva' : 'reservas'}</span>
      </div>
      <p class="text-muted mt-8">Semana atual · Todas as unidades</p>
      <div class="reservation-chart" role="img" aria-label="Reservas por dia, semana atual. ${weekCounts.map((c, i) => `${DAYS[i]}: ${c} ${c === 1 ? 'reserva' : 'reservas'}`).join('; ')}">
        <div class="chart-axis" aria-hidden="true">
          ${[4, 3, 2, 1, 0].map(tick => `<span>${tick * chartStep}</span>`).join('')}
        </div>
        <div class="chart-plot" aria-hidden="true">
          ${weekCounts.map((c, i) => `
            <div class="chart-column${i === todayIndex ? ' is-today' : ''}">
              <div class="chart-bar" style="height:${c / chartMax * 100}%"><span class="chart-value">${c}</span></div>
              <span class="chart-day">${DAYS[i]}${i === todayIndex ? '<small>Hoje</small>' : ''}</span>
            </div>`).join('')}
        </div>
      </div>
      ${weekTotal === 0 ? '<p class="text-muted mt-8">Nenhuma reserva nesta semana.</p>' : ''}
    </div>
    <div class="card">
      <h3>Situação financeira</h3>
      <p class="text-muted mt-8">Distribuição das contas cadastradas</p>
      <div class="split-bar mt-16">
        <span style="width:${financeStatus.pago / totalFin * 100}%;background:var(--success)"></span>
        <span style="width:${financeStatus.pendente / totalFin * 100}%;background:var(--warning)"></span>
        <span style="width:${financeStatus.vencido / totalFin * 100}%;background:var(--danger)"></span>
      </div>
      <div class="legend-row">
        <span class="legend-item"><span class="legend-dot" style="background:var(--success)"></span>Pago (${financeStatus.pago})</span>
        <span class="legend-item"><span class="legend-dot" style="background:var(--warning)"></span>Pendente (${financeStatus.pendente})</span>
        <span class="legend-item"><span class="legend-dot" style="background:var(--danger)"></span>Vencido (${financeStatus.vencido})</span>
      </div>
    </div>
  </div>`;
  }
  function renderDashboardUser() {
    const mine = dataUtils.upcomingSchedules(STATE.schedules.filter(sc => sc.userId === STATE.currentUser.id));
    const weekReservations = mine.filter(sc => sc.week === 0).length;
    const proximo = mine[0];
    const disponiveis = STATE.rooms.filter(r => r.status === 'disponivel').length;
    const helpMessage = 'Olá! Preciso de ajuda com meu acesso ou meus horários no Attento.';
    const helpUrl = whatsappLink(helpMessage);
    return `
  <div class="page-head">
    <div class="page-head-text">
      <h1>Olá, ${esc(STATE.currentUser.name.split(' ')[0])}</h1>
      <p>${esc(fmtLongDate())}</p>
      <p>${weekReservations === 0 ? 'Você ainda não tem reservas nesta semana.' : `Você tem ${weekReservations} ${weekReservations === 1 ? 'reserva' : 'reservas'} nesta semana.`}</p>
    </div>
  </div>
  <div class="section">
    <div class="stat-grid">
      ${statCard('fa-clock', 'neutral', 'Próximo horário', proximo ? `${DAYS[proximo.day]} ${proximo.time}` : 'Nenhum')}
      ${statCard('fa-calendar-days', 'neutral', 'Reservas nesta semana', weekReservations)}
      ${statCard('fa-door-open', 'neutral', 'Salas disponíveis', disponiveis)}
      ${helpUrl
        ? `<a class="stat-card stat-card-link" target="_blank" rel="noopener" href="${helpUrl}"><div class="stat-icon neutral"><i class="fa-brands fa-whatsapp" aria-hidden="true"></i></div><div class="stat-info"><span class="stat-value stat-value-action">Fale conosco</span><span class="stat-label">Atendimento pelo WhatsApp</span></div></a>`
        : statCard('fa-comments', 'neutral', 'Contato da unidade', 'Não configurado')}
    </div>
  </div>
  <div class="section">
    <div class="section-head"><h2>Meus próximos horários</h2></div>
    ${tableOrEmpty(mine, ['Dia', 'Horário', 'Sala', 'Unidade', 'Profissional'], mine.map(m => [DAYS[m.day], m.time, roomName(m.roomId), unitName(m.unitId), m.professionalId ? profName(m.professionalId) : '—']),
      'Você ainda não tem horários reservados.', 'fa-calendar-xmark')}
  </div>`;
  }
  function statCard(icon, color, label, value) {
    return `<div class="stat-card stat-card-${color}"><div class="stat-icon ${color}"><i class="fa-solid ${icon}" aria-hidden="true"></i></div><div class="stat-info"><span class="stat-value">${esc(value)}</span><span class="stat-label">${esc(label)}</span></div></div>`;
  }
  function statusBadge(status) {
    const map = {
      disponivel: ['badge-blue', 'Disponível'], ocupado: ['badge-gray', 'Ocupado'], reservado: ['badge-green', 'Reservado'],
      manutencao: ['badge-red', 'Manutenção'], pago: ['badge-green', 'Pago'], pendente: ['badge-amber', 'Pendente'],
      vencido: ['badge-red', 'Vencido'], ativo: ['badge-green', 'Ativo'], inativo: ['badge-gray', 'Inativo']
    };
    const [cls, label] = map[status] || ['badge-gray', status];
    return `<span class="badge ${cls}">${label}</span>`;
  }
  function tableOrEmpty(list, headers, rows, emptyMsg, emptyIcon) {
    if (!list.length) {
      return `<div class="table-wrap"><div class="empty-state"><i class="fa-solid ${emptyIcon || 'fa-inbox'}" aria-hidden="true"></i><p>${esc(emptyMsg)}</p></div></div>`;
    }
    return `<div class="table-wrap"><table><thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
    <tbody>${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  }

  /* ==========================================================================
     DISPONIBILIDADE DAS SALAS (AGENDA)
     ========================================================================== */
  function renderAvailability() {
    const isAdmin = STATE.currentUser.role === 'admin';
    const f = STATE.filters;
    const rooms = STATE.rooms.filter(r => (f.availUnit === 'all' || r.unitId === f.availUnit) && (f.availRoom === 'all' || r.id === f.availRoom) && r.status !== 'inativa');

    return `
  <div class="page-head">
    <div class="page-head-text"><h1>Disponibilidade das Salas</h1><p>${isAdmin ? 'Clique em um horário disponível para alocar um profissional.' : 'Clique em um horário disponível para reservar.'}</p></div>
  </div>
  <div class="filter-bar">
    <div class="filter-field"><label for="f-unit">Unidade</label>
      <select id="f-unit">
        <option value="all">Todas</option>
        ${STATE.units.map(u => `<option value="${u.id}" ${f.availUnit === u.id ? 'selected' : ''}>${u.name}</option>`).join('')}
      </select>
    </div>
    <div class="filter-field"><label for="f-room">Sala</label>
      <select id="f-room">
        <option value="all">Todas</option>
        ${STATE.rooms.map(r => `<option value="${r.id}" ${f.availRoom === r.id ? 'selected' : ''}>${r.name}</option>`).join('')}
      </select>
    </div>
    <div class="filter-field"><label for="f-week">Semana</label>
      <select id="f-week">
        <option value="0" ${f.availWeek === 0 ? 'selected' : ''}>Semana atual</option>
        <option value="1" ${f.availWeek === 1 ? 'selected' : ''}>Próxima semana</option>
      </select>
    </div>
    <p class="filter-context"><i class="fa-regular fa-calendar" aria-hidden="true"></i> ${dataUtils.weekRangeLabel(f.availWeek)}</p>
    <button class="btn btn-ghost btn-sm" id="clear-avail-filters"><i class="fa-solid fa-rotate-left" aria-hidden="true"></i> Limpar</button>
  </div>

  <div class="agenda-legend">
    <span class="legend-item"><span class="legend-dot" style="background:var(--primary-light);border:1px solid var(--primary)"></span>Disponível</span>
    <span class="legend-item"><span class="legend-dot" style="background:var(--surface-alt);border:1px solid var(--border)"></span>Ocupado</span>
    <span class="legend-item"><span class="legend-dot" style="background:#254060"></span>Reservado</span>
    <span class="legend-item"><span class="legend-dot" style="background:var(--danger-bg);border:1px solid var(--danger)"></span>Manutenção</span>
  </div>

  ${rooms.length === 0 ? `<div class="table-wrap"><div class="empty-state"><i class="fa-solid fa-door-closed"></i><p>Nenhuma sala encontrada com os filtros atuais.</p></div></div>` :
        rooms.map(room => renderRoomAgenda(room, f.availWeek)).join('')}
  `;
  }
  function scheduleFor(week, roomId, day, time) {
    return STATE.schedules.find(s => s.week === week && s.roomId === roomId && s.day === day && s.time === time);
  }
  function renderRoomAgenda(room, week) {
    return `
  <div class="section">
    <div class="section-head"><h3>${esc(room.name)} <span class="text-muted" style="font-weight:500;font-size:.82rem;">— ${esc(unitName(room.unitId))}</span></h3></div>
    <div class="agenda-wrap">
      <div class="agenda-grid">
        <div class="agenda-corner"></div>
        ${DAYS.map(d => `<div class="agenda-head">${d}</div>`).join('')}
        ${HOURS.map(time => `
          <div class="agenda-time">${time}</div>
          ${DAYS.map((d, dayIdx) => {
      const sc = scheduleFor(week, room.id, dayIdx, time);
      const status = sc ? sc.status : 'disponivel';
      const clickable = status === 'disponivel';
      return `<div class="agenda-cell ${status}" ${clickable ? `data-action="slot" data-room="${room.id}" data-day="${dayIdx}" data-time="${time}" data-week="${week}"` : ''} ${!clickable ? `tabindex="0" aria-label="${statusLabelPlain(status)}"` : `tabindex="0" role="button" aria-label="Horário disponível ${room.name} ${DAYS[dayIdx]} ${time}"`}>
              ${status !== 'disponivel' ? `<span class="agenda-cell-label">${statusLabelPlain(status)}</span>` : ''}
            </div>`;
    }).join('')}
        `).join('')}
      </div>
    </div>
  </div>`;
  }
  function statusLabelPlain(status) {
    return { disponivel: '', ocupado: 'Ocupado', reservado: 'Reservado', manutencao: 'Manutenção' }[status] || '';
  }

  function openAllocateModal(roomId, day, time, week) {
    const room = STATE.rooms.find(r => r.id === roomId);
    const activeProfs = STATE.professionals.filter(p => p.status === 'ativo');
    openModal({
      title: 'Alocar profissional',
      bodyHTML:`
      <form id="allocate-form">
        <div class="modal-grid-2">
          <div class="field"><label>Unidade</label><input type="text" value="${esc(unitName(room.unitId))}" disabled></div>
          <div class="field"><label>Sala</label><input type="text" value="${esc(room.name)}" disabled></div>
          <div class="field"><label>Dia</label><input type="text" value="${DAYS[day]}" disabled></div>
          <div class="field"><label>Horário</label><input type="text" value="${time}" disabled></div>
        </div>
        <div class="field"><label for="al-shift">Turno</label>
          <select id="al-shift"><option>Manhã</option><option>Tarde</option><option>Noite</option></select>
        </div>
        <div class="field"><label for="al-prof">Profissional</label>
          <select id="al-prof" required>
            <option value="" disabled selected>Selecione</option>
            ${activeProfs.map(p => `<option value="${p.id}" data-value="${p.value}">${esc(p.name)} — ${esc(p.specialty)}</option>`).join('')}
          </select>
        </div>
        <div class="field"><label for="al-value">Valor</label>
          <div class="currency-input-wrap"><span>R$</span><input type="text" id="al-value" placeholder="0,00"></div>
        </div>
        <div class="field"><label for="al-note">Observação</label><textarea id="al-note" rows="2" placeholder="Opcional"></textarea></div>
      </form>`,
      footHTML: `<button class="btn btn-secondary" id="al-cancel">Cancelar</button><button class="btn btn-primary" id="al-confirm">Confirmar alocação</button>`,
      onMount: (overlay) => {
        const valueInput = overlay.querySelector('#al-value');
        maskCurrencyInput(valueInput);
        overlay.querySelector('#al-prof').addEventListener('change', (e) => {
          const opt = e.target.selectedOptions[0];
          if (opt && opt.dataset.value) valueInput.value = Number(opt.dataset.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
        });
        overlay.querySelector('#al-cancel').addEventListener('click', closeModal);
        overlay.querySelector('#al-confirm').addEventListener('click', () => {
          const profSel = overlay.querySelector('#al-prof');
          if (!profSel.value) { showToast('Selecione um profissional.', 'error'); return; }
          const newSchedule = {
            id: uid('sch'), week, unitId: room.unitId, roomId, day, time,
            shift: overlay.querySelector('#al-shift').value, professionalId: profSel.value,
            value: parseCurrencyInput(valueInput.value), note: overlay.querySelector('#al-note').value.trim(),
            status: 'reservado', userId: null
          };
          STATE.schedules.push(newSchedule);
          persist(KEYS.schedules, STATE.schedules);
          closeModal();
          showToast('Horário alocado com sucesso.', 'success');
          rerender();
        });
      }
    });
  }
  function openSelectSlotModal(roomId, day, time, week) {
    const room = STATE.rooms.find(r => r.id === roomId);
    const eligibleProfs = STATE.professionals.filter(p => p.status === 'ativo' && p.roomId === roomId);
    const prof = eligibleProfs[0] || STATE.professionals.find(p => p.status === 'ativo');
    openModal({
      title: 'Selecionar horário',
      bodyHTML:`
      <div class="info-row"><span>Unidade</span><span>${esc(unitName(room.unitId))}</span></div>
      <div class="info-row"><span>Sala</span><span>${esc(room.name)}</span></div>
      <div class="info-row"><span>Dia</span><span>${DAYS[day]}</span></div>
      <div class="info-row"><span>Horário</span><span>${time}</span></div>
      <div class="info-row"><span>Profissional</span><span>${prof ? esc(prof.name) : 'A definir'}</span></div>
      <div class="info-row"><span>Valor</span><span>${prof ? fmtCurrency(prof.value) : '—'}</span></div>
    `,
      footHTML: `<button class="btn btn-secondary" id="sel-cancel">Cancelar</button><button class="btn btn-primary" id="sel-confirm">Confirmar horário</button>`,
      onMount: (overlay) => {
        overlay.querySelector('#sel-cancel').addEventListener('click', closeModal);
        overlay.querySelector('#sel-confirm').addEventListener('click', () => {
          const newSchedule = {
            id: uid('sch'), week, unitId: room.unitId, roomId, day, time, shift: '', professionalId: prof ? prof.id : null,
            value: prof ? prof.value : 0, note: '', status: 'reservado', userId: STATE.currentUser.id
          };
          STATE.schedules.push(newSchedule);
          persist(KEYS.schedules, STATE.schedules);
          closeModal();
          showToast('Horário selecionado com sucesso.', 'success');
          const dayLabelFull = ['segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'][day];
          const msg = `Olá! Gostaria de confirmar o horário reservado para ${dayLabelFull} às ${time} na ${room.name}.`;
          setTimeout(() => {
            openModal({
              title: 'Horário confirmado',
              bodyHTML: `<p>${whatsappLink(msg) ? 'Seu horário foi reservado. Você pode confirmar diretamente pelo WhatsApp com a unidade.' : 'Seu horário foi reservado. O contato da unidade ainda não foi configurado.'}</p>`,
              footHTML:`<button class="btn btn-secondary" id="wa-close">Fechar</button>
              ${whatsappLink(msg) ? `<a class="btn btn-primary" target="_blank" rel="noopener" href="${whatsappLink(msg)}"><i class="fa-brands fa-whatsapp" aria-hidden="true"></i> Falar pelo WhatsApp</a>` : ''}`,
              onMount: (o2) => o2.querySelector('#wa-close').addEventListener('click', closeModal)
            });
          }, 120);
          rerender();
        });
      }
    });
  }

  /* ==========================================================================
     SALAS (CRUD)
     ========================================================================== */
  function renderRooms() {
    const rows = STATE.rooms.map(r => [
      esc(r.name), esc(unitName(r.unitId)), r.capacity, roomStatusBadge(r.status),
      `<div class="row-actions">
      <button class="icon-btn btn-sm" data-action="view-room" data-id="${r.id}" aria-label="Visualizar"><i class="fa-solid fa-eye"></i></button>
      <button class="icon-btn btn-sm" data-action="edit-room" data-id="${r.id}" aria-label="Editar"><i class="fa-solid fa-pen"></i></button>
      <button class="icon-btn btn-sm" data-action="delete-room" data-id="${r.id}" aria-label="Excluir"><i class="fa-solid fa-trash"></i></button>
    </div>`
    ]);
    return `
  <div class="page-head">
    <div class="page-head-text"><h1>Salas</h1><p>Gerencie as salas de cada unidade.</p></div>
    <button class="btn btn-primary" data-action="new-room"><i class="fa-solid fa-plus" aria-hidden="true"></i> Nova sala</button>
  </div>
  ${tableOrEmpty(STATE.rooms, ['Sala', 'Unidade', 'Capacidade', 'Status', 'Ações'], rows, 'Nenhuma sala cadastrada.', 'fa-door-closed')}
  `;
  }
  function roomStatusBadge(status) {
    const map = { disponivel: ['badge-blue', 'Disponível'], manutencao: ['badge-amber', 'Manutenção'], inativa: ['badge-gray', 'Inativa'] };
    const [cls, label] = map[status] || ['badge-gray', status];
    return `<span class="badge ${cls}">${label}</span>`;
  }
  function roomFormHTML(room) {
    room = room || { name: '', unitId: STATE.units[0].id, description: '', capacity: 6, status: 'disponivel' };
    return `
  <form id="room-form">
    <div class="field"><label for="r-name">Nome da sala</label><input type="text" id="r-name" value="${esc(room.name)}" required></div>
    <div class="field"><label for="r-unit">Unidade</label>
      <select id="r-unit">${STATE.units.map(u => `<option value="${u.id}" ${room.unitId === u.id ? 'selected' : ''}>${u.name}</option>`).join('')}</select>
    </div>
    <div class="field"><label for="r-desc">Descrição</label><textarea id="r-desc" rows="2">${esc(room.description || '')}</textarea></div>
    <div class="modal-grid-2">
      <div class="field"><label for="r-cap">Capacidade</label><input type="number" id="r-cap" min="1" value="${room.capacity}"></div>
      <div class="field"><label for="r-status">Status</label>
        <select id="r-status">
          <option value="disponivel" ${room.status === 'disponivel' ? 'selected' : ''}>Disponível</option>
          <option value="manutencao" ${room.status === 'manutencao' ? 'selected' : ''}>Manutenção</option>
          <option value="inativa" ${room.status === 'inativa' ? 'selected' : ''}>Inativa</option>
        </select>
      </div>
    </div>
  </form>`;
  }
  function openRoomModal(existing) {
    openModal({
      title: existing ? 'Editar sala' : 'Nova sala',
      bodyHTML: roomFormHTML(existing),
      footHTML: `<button class="btn btn-secondary" id="rf-cancel">Cancelar</button><button class="btn btn-primary" id="rf-save">Salvar</button>`,
      onMount: (overlay) => {
        overlay.querySelector('#rf-cancel').addEventListener('click', closeModal);
        overlay.querySelector('#rf-save').addEventListener('click', () => {
          const name = overlay.querySelector('#r-name').value.trim();
          if (!name) { showToast('Informe o nome da sala.', 'error'); return; }
          const data = {
            name, unitId: overlay.querySelector('#r-unit').value, description: overlay.querySelector('#r-desc').value.trim(),
            capacity: Number(overlay.querySelector('#r-cap').value) || 1, status: overlay.querySelector('#r-status').value
          };
          if (existing) { Object.assign(existing, data); showToast('Sala atualizada com sucesso.', 'success'); }
          else { STATE.rooms.push({ id: uid('room'), ...data }); showToast('Sala cadastrada com sucesso.', 'success'); }
          persist(KEYS.rooms, STATE.rooms);
          closeModal(); rerender();
        });
      }
    });
  }
  function viewRoomModal(room) {
    openModal({
      title: room.name,
      bodyHTML:`
      <div class="info-row"><span>Unidade</span><span>${esc(unitName(room.unitId))}</span></div>
      <div class="info-row"><span>Capacidade</span><span>${room.capacity} pessoas</span></div>
      <div class="info-row"><span>Status</span><span>${roomStatusBadge(room.status)}</span></div>
      <div class="info-row"><span>Descrição</span><span>${esc(room.description || '—')}</span></div>
    `,
      footHTML: `<button class="btn btn-secondary" id="vr-close">Fechar</button>`,
      onMount: (overlay) => overlay.querySelector('#vr-close').addEventListener('click', closeModal)
    });
  }

  /* ==========================================================================
     PROFISSIONAIS
     ========================================================================== */
  function renderProfessionals() {
    const rows = STATE.professionals.map(p => [
      esc(p.name), esc(p.specialty), esc(unitName(p.unitId)), esc(roomName(p.roomId)), esc(p.shift), fmtCurrency(p.value),
      statusBadge(p.status),
      `<div class="row-actions">
      <button class="icon-btn btn-sm" data-action="view-prof" data-id="${p.id}" aria-label="Visualizar"><i class="fa-solid fa-eye"></i></button>
      <button class="icon-btn btn-sm" data-action="edit-prof" data-id="${p.id}" aria-label="Editar"><i class="fa-solid fa-pen"></i></button>
      <button class="icon-btn btn-sm" data-action="delete-prof" data-id="${p.id}" aria-label="Excluir"><i class="fa-solid fa-trash"></i></button>
    </div>`
    ]);
    return `
  <div class="page-head">
    <div class="page-head-text"><h1>Profissionais</h1><p>Cadastre e gerencie os profissionais das unidades.</p></div>
    <button class="btn btn-primary" data-action="new-prof"><i class="fa-solid fa-plus" aria-hidden="true"></i> Adicionar profissional</button>
  </div>
  ${tableOrEmpty(STATE.professionals, ['Nome', 'Especialidade', 'Unidade', 'Sala', 'Turno', 'Valor', 'Status', 'Ações'], rows, 'Nenhum profissional cadastrado.', 'fa-user-slash')}
  `;
  }
  function profFormHTML(p) {
    p = p || { name: '', specialty: '', unitId: STATE.units[0].id, roomId: STATE.rooms[0].id, shift: 'Manhã', value: 0, status: 'ativo' };
    return `
  <form id="prof-form">
    <div class="modal-grid-2">
      <div class="field"><label for="p-name">Nome</label><input type="text" id="p-name" value="${esc(p.name)}" required></div>
      <div class="field"><label for="p-spec">Especialidade</label><input type="text" id="p-spec" value="${esc(p.specialty)}"></div>
    </div>
    <div class="modal-grid-2">
      <div class="field"><label for="p-unit">Unidade</label>
        <select id="p-unit">${STATE.units.map(u => `<option value="${u.id}" ${p.unitId === u.id ? 'selected' : ''}>${u.name}</option>`).join('')}</select>
      </div>
      <div class="field"><label for="p-room">Sala</label>
        <select id="p-room">${STATE.rooms.map(r => `<option value="${r.id}" ${p.roomId === r.id ? 'selected' : ''}>${r.name}</option>`).join('')}</select>
      </div>
    </div>
    <div class="modal-grid-2">
      <div class="field"><label for="p-shift">Turno</label>
        <select id="p-shift"><option ${p.shift === 'Manhã' ? 'selected' : ''}>Manhã</option><option ${p.shift === 'Tarde' ? 'selected' : ''}>Tarde</option><option ${p.shift === 'Noite' ? 'selected' : ''}>Noite</option></select>
      </div>
      <div class="field"><label for="p-value">Valor</label><div class="currency-input-wrap"><span>R$</span><input type="text" id="p-value" value="${Number(p.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}"></div></div>
    </div>
    <div class="field"><label for="p-status">Status</label>
      <select id="p-status"><option value="ativo" ${p.status === 'ativo' ? 'selected' : ''}>Ativo</option><option value="inativo" ${p.status === 'inativo' ? 'selected' : ''}>Inativo</option></select>
    </div>
  </form>`;
  }
  function openProfModal(existing) {
    openModal({
      title: existing ? 'Editar profissional' : 'Adicionar profissional', size: 'lg',
      bodyHTML: profFormHTML(existing),
      footHTML: `<button class="btn btn-secondary" id="pf-cancel">Cancelar</button><button class="btn btn-primary" id="pf-save">Salvar</button>`,
      onMount: (overlay) => {
        maskCurrencyInput(overlay.querySelector('#p-value'));
        overlay.querySelector('#pf-cancel').addEventListener('click', closeModal);
        overlay.querySelector('#pf-save').addEventListener('click', () => {
          const name = overlay.querySelector('#p-name').value.trim();
          if (!name) { showToast('Informe o nome do profissional.', 'error'); return; }
          const data = {
            name, specialty: overlay.querySelector('#p-spec').value.trim(), unitId: overlay.querySelector('#p-unit').value,
            roomId: overlay.querySelector('#p-room').value, shift: overlay.querySelector('#p-shift').value,
            value: parseCurrencyInput(overlay.querySelector('#p-value').value), status: overlay.querySelector('#p-status').value
          };
          if (existing) { Object.assign(existing, data); showToast('Profissional atualizado com sucesso.', 'success'); }
          else { STATE.professionals.push({ id: uid('prof'), ...data }); showToast('Profissional cadastrado com sucesso.', 'success'); }
          persist(KEYS.professionals, STATE.professionals);
          closeModal(); rerender();
        });
      }
    });
  }
  function viewProfModal(p) {
    openModal({
      title: p.name,
      bodyHTML:`
      <div class="info-row"><span>Especialidade</span><span>${esc(p.specialty)}</span></div>
      <div class="info-row"><span>Unidade</span><span>${esc(unitName(p.unitId))}</span></div>
      <div class="info-row"><span>Sala</span><span>${esc(roomName(p.roomId))}</span></div>
      <div class="info-row"><span>Turno</span><span>${esc(p.shift)}</span></div>
      <div class="info-row"><span>Valor por sessão</span><span>${fmtCurrency(p.value)}</span></div>
      <div class="info-row"><span>Status</span><span>${statusBadge(p.status)}</span></div>
    `,
      footHTML: `<button class="btn btn-secondary" id="vp-close">Fechar</button>`,
      onMount: (overlay) => overlay.querySelector('#vp-close').addEventListener('click', closeModal)
    });
  }

  /* ==========================================================================
     FINANCEIRO
     ========================================================================== */
  function renderFinancial() {
    const f = STATE.filters;
    const list = dataUtils.filterAccounts(STATE.financialAccounts, { professional: f.finProf, status: f.finStatus, month: f.finMonth });
    const months = dataUtils.monthOptions(STATE.financialAccounts);

    const total = list.reduce((s, a) => s + Number(a.value), 0);
    const pago = list.filter(a => a.status === 'pago').reduce((s, a) => s + Number(a.value), 0);
    const pendente = list.filter(a => a.status === 'pendente').reduce((s, a) => s + Number(a.value), 0);
    const vencido = list.filter(a => a.status === 'vencido').reduce((s, a) => s + Number(a.value), 0);

    const rows = list.map(a => [
      esc(profName(a.professionalId)), esc(a.description), fmtCurrency(a.value), fmtDate(a.dueDate), statusBadge(a.status), fmtDate(a.paymentDate),
      `<div class="row-actions">
      ${a.status !== 'pago' ? `<button class="icon-btn btn-sm tooltip-wrap" data-action="pay-fin" data-id="${a.id}" aria-label="Marcar como pago" data-tip="Marcar como pago"><i class="fa-solid fa-check"></i></button>` : ''}
      <button class="icon-btn btn-sm" data-action="edit-fin" data-id="${a.id}" aria-label="Editar"><i class="fa-solid fa-pen"></i></button>
      <button class="icon-btn btn-sm" data-action="delete-fin" data-id="${a.id}" aria-label="Excluir"><i class="fa-solid fa-trash"></i></button>
    </div>`
    ]);

    return `
  <div class="page-head">
    <div class="page-head-text"><h1>Contas / Financeiro</h1><p>Acompanhe pagamentos e pendências dos profissionais.</p></div>
    <button class="btn btn-primary" data-action="new-fin"><i class="fa-solid fa-plus" aria-hidden="true"></i> Nova conta</button>
  </div>
  <div class="filter-bar">
    <div class="filter-field"><label for="fin-prof">Profissional</label>
      <select id="fin-prof"><option value="all">Todos</option>${STATE.professionals.map(p => `<option value="${p.id}" ${f.finProf === p.id ? 'selected' : ''}>${p.name}</option>`).join('')}</select>
    </div>
    <div class="filter-field"><label for="fin-status">Status</label>
      <select id="fin-status"><option value="all">Todos</option><option value="pago" ${f.finStatus === 'pago' ? 'selected' : ''}>Pago</option><option value="pendente" ${f.finStatus === 'pendente' ? 'selected' : ''}>Pendente</option><option value="vencido" ${f.finStatus === 'vencido' ? 'selected' : ''}>Vencido</option></select>
    </div>
    <div class="filter-field"><label for="fin-month">Mês de vencimento</label><select id="fin-month"><option value="all">Todos</option>${months.map(month => `<option value="${month.value}" ${f.finMonth === month.value ? 'selected' : ''}>${month.label}</option>`).join('')}</select></div>
    <button class="btn btn-ghost btn-sm" id="clear-fin-filters"><i class="fa-solid fa-rotate-left" aria-hidden="true"></i> Limpar</button>
  </div>
  <div class="section">
    <div class="stat-grid">
      ${statCard('fa-wallet', 'neutral', 'Total', fmtCurrency(total))}
      ${statCard('fa-circle-check', 'neutral', 'Pago', fmtCurrency(pago))}
      ${statCard('fa-hourglass-half', pendente > 0 ? 'amber' : 'neutral', 'Pendente', fmtCurrency(pendente))}
      ${statCard('fa-triangle-exclamation', vencido > 0 ? 'red' : 'neutral', 'Vencido', fmtCurrency(vencido))}
    </div>
  </div>
  ${tableOrEmpty(list, ['Profissional', 'Descrição', 'Valor', 'Vencimento', 'Status', 'Pagamento', 'Ações'], rows, 'Nenhuma conta encontrada.', 'fa-file-invoice')}
  `;
  }
  function finFormHTML(a) {
    a = a || { professionalId: STATE.professionals[0].id, description: '', value: 0, dueDate: todayISO(), status: 'pendente' };
    return `
  <form id="fin-form">
    <div class="field"><label for="fn-prof">Profissional</label>
      <select id="fn-prof">${STATE.professionals.map(p => `<option value="${p.id}" ${a.professionalId === p.id ? 'selected' : ''}>${p.name}</option>`).join('')}</select>
    </div>
    <div class="field"><label for="fn-desc">Descrição</label><input type="text" id="fn-desc" value="${esc(a.description)}" required></div>
    <div class="modal-grid-2">
      <div class="field"><label for="fn-value">Valor</label><div class="currency-input-wrap"><span>R$</span><input type="text" id="fn-value" value="${Number(a.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}"></div></div>
      <div class="field"><label for="fn-due">Vencimento</label><input type="date" id="fn-due" value="${a.dueDate}"></div>
    </div>
    <div class="field"><label for="fn-status">Status</label>
      <select id="fn-status"><option value="pendente" ${a.status === 'pendente' ? 'selected' : ''}>Pendente</option><option value="pago" ${a.status === 'pago' ? 'selected' : ''}>Pago</option><option value="vencido" ${a.status === 'vencido' ? 'selected' : ''}>Vencido</option></select>
    </div>
  </form>`;
  }
  function openFinModal(existing) {
    openModal({
      title: existing ? 'Editar conta' : 'Nova conta',
      bodyHTML: finFormHTML(existing),
      footHTML: `<button class="btn btn-secondary" id="ff-cancel">Cancelar</button><button class="btn btn-primary" id="ff-save">Salvar</button>`,
      onMount: (overlay) => {
        maskCurrencyInput(overlay.querySelector('#fn-value'));
        overlay.querySelector('#ff-cancel').addEventListener('click', closeModal);
        overlay.querySelector('#ff-save').addEventListener('click', () => {
          const description = overlay.querySelector('#fn-desc').value.trim();
          if (!description) { showToast('Informe a descrição da conta.', 'error'); return; }
          const status = overlay.querySelector('#fn-status').value;
          const data = {
            professionalId: overlay.querySelector('#fn-prof').value, description,
            value: parseCurrencyInput(overlay.querySelector('#fn-value').value), dueDate: overlay.querySelector('#fn-due').value,
            status, paymentDate: status === 'pago' ? (existing && existing.paymentDate ? existing.paymentDate : todayISO()) : null
          };
          if (existing) { Object.assign(existing, data); showToast('Conta atualizada com sucesso.', 'success'); }
          else { STATE.financialAccounts.push({ id: uid('fin'), ...data }); showToast('Conta cadastrada com sucesso.', 'success'); }
          persist(KEYS.financial, STATE.financialAccounts);
          closeModal(); rerender();
        });
      }
    });
  }
  function markPaid(account) {
    account.status = 'pago'; account.paymentDate = todayISO();
    persist(KEYS.financial, STATE.financialAccounts);
    showToast('Conta marcada como paga.', 'success');
    rerender();
  }

  /* ==========================================================================
     CONVÊNIOS
     ========================================================================== */
  const INSURANCE_TYPES = ['Unimed', 'Bradesco Saúde', 'Amil', 'SulAmérica', 'Particular'];
  function renderInsurance() {
    const f = STATE.filters;
    let list = STATE.insuranceRecords.slice();
    if (f.insType && f.insType !== 'all') list = list.filter(i => i.insuranceType === f.insType);

    const rows = list.map(i => {
      const total = i.quantity * i.unitValue;
      return [
        esc(i.insuranceType), esc(profName(i.professionalId)), i.quantity, fmtCurrency(i.unitValue), fmtCurrency(total), statusBadge(i.status),
        `<div class="row-actions">
        ${i.status !== 'pago' ? `<button class="icon-btn btn-sm tooltip-wrap" data-action="pay-ins" data-id="${i.id}" aria-label="Marcar como pago" data-tip="Marcar como pago"><i class="fa-solid fa-check"></i></button>` : ''}
        <button class="icon-btn btn-sm" data-action="edit-ins" data-id="${i.id}" aria-label="Editar"><i class="fa-solid fa-pen"></i></button>
        <button class="icon-btn btn-sm" data-action="delete-ins" data-id="${i.id}" aria-label="Excluir"><i class="fa-solid fa-trash"></i></button>
      </div>`
      ];
    });
    return `
  <div class="page-head">
    <div class="page-head-text"><h1>Convênios</h1><p>Controle os atendimentos por convênio e o repasse aos profissionais.</p></div>
    <button class="btn btn-primary" data-action="new-ins"><i class="fa-solid fa-plus" aria-hidden="true"></i> Adicionar registro</button>
  </div>
  <div class="filter-bar">
    <div class="filter-field"><label for="ins-type">Tipo de convênio</label>
      <select id="ins-type"><option value="all">Todos</option>${INSURANCE_TYPES.map(t => `<option ${f.insType === t ? 'selected' : ''}>${t}</option>`).join('')}</select>
    </div>
    <button class="btn btn-ghost btn-sm" id="clear-ins-filters"><i class="fa-solid fa-rotate-left" aria-hidden="true"></i> Limpar</button>
  </div>
  ${tableOrEmpty(list, ['Convênio', 'Profissional', 'Quantidade', 'Valor unitário', 'Valor total', 'Status', 'Ações'], rows, 'Nenhum registro de convênio encontrado.', 'fa-handshake')}
  `;
  }
  function insFormHTML(i) {
    i = i || { insuranceType: INSURANCE_TYPES[0], professionalId: STATE.professionals[0].id, quantity: 1, unitValue: 0, status: 'pendente' };
    return `
  <form id="ins-form">
    <div class="field"><label for="in-type">Convênio</label>
      <select id="in-type">${INSURANCE_TYPES.map(t => `<option ${i.insuranceType === t ? 'selected' : ''}>${t}</option>`).join('')}</select>
    </div>
    <div class="field"><label for="in-prof">Profissional</label>
      <select id="in-prof">${STATE.professionals.map(p => `<option value="${p.id}" ${i.professionalId === p.id ? 'selected' : ''}>${p.name}</option>`).join('')}</select>
    </div>
    <div class="modal-grid-2">
      <div class="field"><label for="in-qty">Quantidade</label><input type="number" id="in-qty" min="1" value="${i.quantity}"></div>
      <div class="field"><label for="in-value">Valor unitário</label><div class="currency-input-wrap"><span>R$</span><input type="text" id="in-value" value="${Number(i.unitValue).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}"></div></div>
    </div>
    <p class="mt-8">Total calculado: <strong id="in-total">${fmtCurrency(i.quantity * i.unitValue)}</strong></p>
    <div class="field mt-16"><label for="in-status">Status</label>
      <select id="in-status"><option value="pendente" ${i.status === 'pendente' ? 'selected' : ''}>Pendente</option><option value="pago" ${i.status === 'pago' ? 'selected' : ''}>Pago</option></select>
    </div>
  </form>`;
  }
  function openInsModal(existing) {
    openModal({
      title: existing ? 'Editar registro' : 'Novo registro de convênio',
      bodyHTML: insFormHTML(existing),
      footHTML: `<button class="btn btn-secondary" id="if-cancel">Cancelar</button><button class="btn btn-primary" id="if-save">Salvar</button>`,
      onMount: (overlay) => {
        const qty = overlay.querySelector('#in-qty'), val = overlay.querySelector('#in-value'), totalEl = overlay.querySelector('#in-total');
        maskCurrencyInput(val);
        function recalc() { totalEl.textContent = fmtCurrency(Number(qty.value || 0) * parseCurrencyInput(val.value)); }
        qty.addEventListener('input', recalc); val.addEventListener('input', recalc);
        overlay.querySelector('#if-cancel').addEventListener('click', closeModal);
        overlay.querySelector('#if-save').addEventListener('click', () => {
          const data = {
            insuranceType: overlay.querySelector('#in-type').value, professionalId: overlay.querySelector('#in-prof').value,
            quantity: Number(qty.value) || 1, unitValue: parseCurrencyInput(val.value), status: overlay.querySelector('#in-status').value
          };
          if (existing) { Object.assign(existing, data); showToast('Registro atualizado com sucesso.', 'success'); }
          else { STATE.insuranceRecords.push({ id: uid('ins'), ...data }); showToast('Registro cadastrado com sucesso.', 'success'); }
          persist(KEYS.insurance, STATE.insuranceRecords);
          closeModal(); rerender();
        });
      }
    });
  }

  /* ==========================================================================
     MEUS HORÁRIOS (USUÁRIO)
     ========================================================================== */
  function renderMySchedule() {
    const mine = dataUtils.upcomingSchedules(STATE.schedules.filter(sc => sc.userId === STATE.currentUser.id));
    const rows = mine.map(m => {
      const dayLabelFull = ['segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'][m.day];
      const msg = `Olá! Gostaria de confirmar o horário reservado para ${dayLabelFull} às ${m.time} na ${roomName(m.roomId)}.`;
      return [
        `${m.week === 0 ? 'Esta semana' : 'Próxima semana'} · ${DAYS[m.day]}`, m.time, esc(roomName(m.roomId)), esc(unitName(m.unitId)),
        m.professionalId ? esc(profName(m.professionalId)) : '—', fmtCurrency(m.value),
        whatsappLink(msg)
          ? `<a class="btn btn-ghost btn-sm" target="_blank" rel="noopener" href="${whatsappLink(msg)}"><i class="fa-brands fa-whatsapp" aria-hidden="true"></i> WhatsApp</a>`
          : '<span class="text-muted">Não configurado</span>'
      ];
    });
    return `
  <div class="page-head"><div class="page-head-text"><h1>Meus Horários</h1><p>Seus horários reservados nas próximas semanas.</p></div></div>
  ${tableOrEmpty(mine, ['Dia', 'Horário', 'Sala', 'Unidade', 'Profissional', 'Valor', 'Contato'], rows, 'Você ainda não tem horários reservados. Acesse "Disponibilidade das Salas" para reservar um.', 'fa-calendar-xmark')}
  `;
  }

  /* ==========================================================================
     RELATÓRIOS
     ========================================================================== */
  function renderReports() {
    const f = STATE.filters;
    const list = dataUtils.filterAccounts(STATE.financialAccounts, { professional: f.repProf, status: f.repStatus, month: f.repMonth });
    const months = dataUtils.monthOptions(STATE.financialAccounts);

    const recebido = list.filter(a => a.status === 'pago').reduce((s, a) => s + Number(a.value), 0);
    const pendente = list.filter(a => a.status === 'pendente').reduce((s, a) => s + Number(a.value), 0);
    const vencido = list.filter(a => a.status === 'vencido').reduce((s, a) => s + Number(a.value), 0);
    const totalGeral = recebido + pendente + vencido;

    const rows = list.map(a => [esc(profName(a.professionalId)), esc(a.description), fmtCurrency(a.value), fmtDate(a.dueDate), statusBadge(a.status), fmtDate(a.paymentDate)]);

    return `
  <div class="page-head">
    <div class="page-head-text"><h1>Relatórios Financeiros</h1><p>Consolide os resultados financeiros por período e profissional.</p></div>
    <button class="btn btn-primary" id="export-csv"><i class="fa-solid fa-file-arrow-down" aria-hidden="true"></i> Exportar CSV</button>
  </div>
  <div class="filter-bar">
    <div class="filter-field"><label for="rep-month">Mês de vencimento</label><select id="rep-month"><option value="all">Todos</option>${months.map(month => `<option value="${month.value}" ${f.repMonth === month.value ? 'selected' : ''}>${month.label}</option>`).join('')}</select></div>
    <div class="filter-field"><label for="rep-prof">Profissional</label>
      <select id="rep-prof"><option value="all">Todos</option>${STATE.professionals.map(p => `<option value="${p.id}" ${f.repProf === p.id ? 'selected' : ''}>${p.name}</option>`).join('')}</select>
    </div>
    <div class="filter-field"><label for="rep-status">Status</label>
      <select id="rep-status"><option value="all">Todos</option><option value="pago" ${f.repStatus === 'pago' ? 'selected' : ''}>Pago</option><option value="pendente" ${f.repStatus === 'pendente' ? 'selected' : ''}>Pendente</option><option value="vencido" ${f.repStatus === 'vencido' ? 'selected' : ''}>Vencido</option></select>
    </div>
    <button class="btn btn-ghost btn-sm" id="clear-rep-filters"><i class="fa-solid fa-rotate-left" aria-hidden="true"></i> Limpar</button>
  </div>
  <div class="section">
    <div class="stat-grid">
      ${statCard('fa-sack-dollar', 'neutral', 'Total recebido', fmtCurrency(recebido))}
      ${statCard('fa-hourglass-half', pendente > 0 ? 'amber' : 'neutral', 'Total pendente', fmtCurrency(pendente))}
      ${statCard('fa-triangle-exclamation', vencido > 0 ? 'red' : 'neutral', 'Total vencido', fmtCurrency(vencido))}
      ${statCard('fa-wallet', 'neutral', 'Total geral', fmtCurrency(totalGeral))}
    </div>
  </div>
  ${tableOrEmpty(list, ['Profissional', 'Descrição', 'Valor', 'Vencimento', 'Status', 'Pagamento'], rows, 'Nenhum dado encontrado para os filtros selecionados.', 'fa-chart-line')}
  `;
  }

  /* ==========================================================================
     CONFIGURAÇÕES
     ========================================================================== */
  function renderSettings() {
    return `
  <div class="page-head"><div class="page-head-text"><h1>Configurações</h1><p>Preferências da sua conta e da aplicação.</p></div></div>
  <div class="section two-col">
    <div class="card">
      <h3>Aparência</h3>
      <p class="mt-8">Escolha entre o tema claro ou escuro. Sua preferência é salva neste navegador.</p>
      <div class="gap-8 mt-16">
        <button class="btn ${STATE.theme === 'light' ? 'btn-primary' : 'btn-secondary'}" id="theme-light"><i class="fa-solid fa-sun" aria-hidden="true"></i> Claro</button>
        <button class="btn ${STATE.theme === 'dark' ? 'btn-primary' : 'btn-secondary'}" id="theme-dark"><i class="fa-solid fa-moon" aria-hidden="true"></i> Escuro</button>
      </div>
    </div>
    <div class="card">
      <h3>Conta</h3>
      <div class="info-row"><span>Nome</span><span>${esc(STATE.currentUser.name)}</span></div>
      <div class="info-row"><span>E-mail</span><span>${esc(STATE.currentUser.email)}</span></div>
      <div class="info-row"><span>Perfil</span><span>${STATE.currentUser.role === 'admin' ? 'Administrador' : 'Usuário'}</span></div>
      <p class="mt-16" style="font-size:.78rem;">Este é um ambiente de demonstração. A autenticação é simulada no navegador e não deve ser usada como controle de acesso real.</p>
    </div>
    <div class="card">
      <h3>Contato da unidade</h3>
      <p class="mt-8">Informe o WhatsApp que receberá pedidos de ajuda e confirmação de horários.</p>
      <form id="contact-settings" class="mt-16">
        <div class="field">
          <label for="settings-whatsapp">WhatsApp com DDD</label>
          <input type="tel" id="settings-whatsapp" value="${esc(STATE.whatsapp)}" placeholder="+55 11 99999-9999" autocomplete="tel">
          <span class="field-error" id="settings-whatsapp-error"></span>
        </div>
        <button type="submit" class="btn btn-primary">Salvar contato</button>
      </form>
    </div>
  </div>`;
  }

  /* Registro dos renderizadores por rota, respeitando o perfil de acesso */
  RENDERERS.dashboard = () => STATE.currentUser.role === 'admin' ? renderDashboardAdmin() : renderDashboardUser();
  RENDERERS.availability = renderAvailability;
  RENDERERS.rooms = renderRooms;
  RENDERERS.professionals = renderProfessionals;
  RENDERERS.financial = renderFinancial;
  RENDERERS.insurance = renderInsurance;
  RENDERERS.reports = renderReports;
  RENDERERS.settings = renderSettings;
  RENDERERS.myschedule = renderMySchedule;

  /* ==========================================================================
     EVENT BINDING POR VIEW (event delegation dentro de #view-root)
     ========================================================================== */
  function bindViewEvents(view) {
    const root = $('#view-root');

    if (view === 'availability') {
      const uSel = $('#f-unit'), rSel = $('#f-room'), wSel = $('#f-week');
      if (uSel) uSel.addEventListener('change', e => { STATE.filters.availUnit = e.target.value; rerender(); });
      if (rSel) rSel.addEventListener('change', e => { STATE.filters.availRoom = e.target.value; rerender(); });
      if (wSel) wSel.addEventListener('change', e => { STATE.filters.availWeek = Number(e.target.value); rerender(); });
      const clearBtn = $('#clear-avail-filters');
      if (clearBtn) clearBtn.addEventListener('click', () => { STATE.filters.availUnit = 'all'; STATE.filters.availRoom = 'all'; STATE.filters.availWeek = 0; rerender(); });
      root.addEventListener('click', (e) => {
        const cell = e.target.closest('[data-action="slot"]');
        if (!cell) return;
        const { room, day, time, week } = cell.dataset;
        if (STATE.currentUser.role === 'admin') openAllocateModal(room, Number(day), time, Number(week));
        else openSelectSlotModal(room, Number(day), time, Number(week));
      });
    }

    if (view === 'rooms') {
      const nb = $('[data-action="new-room"]'); if (nb) nb.addEventListener('click', () => openRoomModal(null));
      root.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-action]'); if (!btn) return;
        const id = btn.dataset.id; const room = STATE.rooms.find(r => r.id === id);
        if (btn.dataset.action === 'view-room') viewRoomModal(room);
        if (btn.dataset.action === 'edit-room') openRoomModal(room);
        if (btn.dataset.action === 'delete-room') confirmModal(`Tem certeza que deseja excluir a sala "${room.name}"?`, () => {
          STATE.rooms = STATE.rooms.filter(r => r.id !== id); persist(KEYS.rooms, STATE.rooms); showToast('Registro excluído.', 'success'); rerender();
        });
      });
    }

    if (view === 'professionals') {
      const nb = $('[data-action="new-prof"]'); if (nb) nb.addEventListener('click', () => {
        if (!STATE.rooms.length) { showToast('Cadastre uma sala antes de adicionar um profissional.', 'error'); return; }
        openProfModal(null);
      });
      root.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-action]'); if (!btn) return;
        const id = btn.dataset.id; const p = STATE.professionals.find(x => x.id === id);
        if (btn.dataset.action === 'view-prof') viewProfModal(p);
        if (btn.dataset.action === 'edit-prof') openProfModal(p);
        if (btn.dataset.action === 'delete-prof') confirmModal(`Tem certeza que deseja excluir "${p.name}"?`, () => {
          STATE.professionals = STATE.professionals.filter(x => x.id !== id); persist(KEYS.professionals, STATE.professionals);
          showToast('Registro excluído.', 'success'); rerender();
        });
      });
    }

    if (view === 'financial') {
      const pf = $('#fin-prof'), sf = $('#fin-status'), mf = $('#fin-month');
      if (pf) pf.addEventListener('change', e => { STATE.filters.finProf = e.target.value; rerender(); });
      if (sf) sf.addEventListener('change', e => { STATE.filters.finStatus = e.target.value; rerender(); });
      if (mf) mf.addEventListener('change', e => { STATE.filters.finMonth = e.target.value; rerender(); });
      const clearBtn = $('#clear-fin-filters');
      if (clearBtn) clearBtn.addEventListener('click', () => { STATE.filters.finProf = 'all'; STATE.filters.finStatus = 'all'; STATE.filters.finMonth = 'all'; rerender(); });
      const nb = $('[data-action="new-fin"]'); if (nb) nb.addEventListener('click', () => {
        if (!STATE.professionals.length) { showToast('Cadastre um profissional antes de criar uma conta.', 'error'); return; }
        openFinModal(null);
      });
      root.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-action]'); if (!btn) return;
        const id = btn.dataset.id; const a = STATE.financialAccounts.find(x => x.id === id);
        if (btn.dataset.action === 'edit-fin') openFinModal(a);
        if (btn.dataset.action === 'pay-fin') markPaid(a);
        if (btn.dataset.action === 'delete-fin') confirmModal(`Tem certeza que deseja excluir a conta "${a.description}"?`, () => {
          STATE.financialAccounts = STATE.financialAccounts.filter(x => x.id !== id); persist(KEYS.financial, STATE.financialAccounts);
          showToast('Registro excluído.', 'success'); rerender();
        });
      });
    }

    if (view === 'insurance') {
      const tf = $('#ins-type'); if (tf) tf.addEventListener('change', e => { STATE.filters.insType = e.target.value; rerender(); });
      const clearBtn = $('#clear-ins-filters'); if (clearBtn) clearBtn.addEventListener('click', () => { STATE.filters.insType = 'all'; rerender(); });
      const nb = $('[data-action="new-ins"]'); if (nb) nb.addEventListener('click', () => {
        if (!STATE.professionals.length) { showToast('Cadastre um profissional antes de criar um registro de convênio.', 'error'); return; }
        openInsModal(null);
      });
      root.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-action]'); if (!btn) return;
        const id = btn.dataset.id; const i = STATE.insuranceRecords.find(x => x.id === id);
        if (btn.dataset.action === 'edit-ins') openInsModal(i);
        if (btn.dataset.action === 'pay-ins') { i.status = 'pago'; persist(KEYS.insurance, STATE.insuranceRecords); showToast('Registro marcado como pago.', 'success'); rerender(); }
        if (btn.dataset.action === 'delete-ins') confirmModal(`Tem certeza que deseja excluir este registro de convênio?`, () => {
          STATE.insuranceRecords = STATE.insuranceRecords.filter(x => x.id !== id); persist(KEYS.insurance, STATE.insuranceRecords);
          showToast('Registro excluído.', 'success'); rerender();
        });
      });
    }

    if (view === 'reports') {
      const pf = $('#rep-prof'), sf = $('#rep-status'), mf = $('#rep-month');
      if (pf) pf.addEventListener('change', e => { STATE.filters.repProf = e.target.value; rerender(); });
      if (sf) sf.addEventListener('change', e => { STATE.filters.repStatus = e.target.value; rerender(); });
      if (mf) mf.addEventListener('change', e => { STATE.filters.repMonth = e.target.value; rerender(); });
      const clearBtn = $('#clear-rep-filters'); if (clearBtn) clearBtn.addEventListener('click', () => { STATE.filters.repProf = 'all'; STATE.filters.repStatus = 'all'; STATE.filters.repMonth = 'all'; rerender(); });
      const exportBtn = $('#export-csv');
      if (exportBtn) exportBtn.addEventListener('click', () => {
        const list = dataUtils.filterAccounts(STATE.financialAccounts, {
          professional: STATE.filters.repProf, status: STATE.filters.repStatus, month: STATE.filters.repMonth
        });
        const header = ['Profissional', 'Descrição', 'Valor', 'Vencimento', 'Status', 'Data de pagamento'];
        const rows = list.map(a => [profName(a.professionalId), a.description, a.value.toFixed(2).replace('.', ','), fmtDate(a.dueDate), a.status, fmtDate(a.paymentDate)]);
        const period = STATE.filters.repMonth === 'all' ? 'todos-periodos' : STATE.filters.repMonth;
        const filename = `relatorio-financeiro-${period}.csv`;
        downloadCSV(filename, [header, ...rows]);
        showToast('Relatório exportado com sucesso.', 'success');
      });
    }

    if (view === 'settings') {
      const lb = $('#theme-light'), db = $('#theme-dark');
      if (lb) lb.addEventListener('click', () => { applyTheme('light'); rerender(); });
      if (db) db.addEventListener('click', () => { applyTheme('dark'); rerender(); });
      const contactForm = $('#contact-settings');
      if (contactForm) contactForm.addEventListener('submit', event => {
        event.preventDefault();
        const input = $('#settings-whatsapp');
        const normalized = contact.normalizeWhatsApp(input.value);
        $('#settings-whatsapp-error').textContent = '';
        if (input.value.trim() && !normalized) {
          $('#settings-whatsapp-error').textContent = 'Informe um número válido com DDD.';
          return;
        }
        STATE.whatsapp = normalized;
        const settings = loadData(KEYS.settings) || {};
        settings.whatsapp = normalized;
        persist(KEYS.settings, settings);
        showToast(normalized ? 'Contato atualizado com sucesso.' : 'Contato removido.', 'success');
        rerender();
      });
    }
  }

  /* ==========================================================================
     BOOTSTRAP
     ========================================================================== */
  function bindGlobalEvents() {
    $('#btn-logout').addEventListener('click', logout);
    $('#theme-toggle').addEventListener('click', toggleTheme);
    window.addEventListener('hashchange', handleHashChange);
  }

  function init() {
    STATE.currentUser = auth.restoreSession();
    if (!STATE.currentUser) {
      location.replace('login.html' + location.hash);
      return;
    }
    initializeData();
    loadAllIntoState();
    applyTheme(STATE.theme);
    bindGlobalEvents();
    showApp();
  }

  document.addEventListener('DOMContentLoaded', init);
  window.addEventListener('pageshow', event => {
    if (event.persisted) location.reload();
  });
})();
