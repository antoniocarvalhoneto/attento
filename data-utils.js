/* Regras de data e filtros compartilhadas pelas telas do painel. */
(function () {
  'use strict';

  const MONTH_FORMAT = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' });

  function monthKey(isoDate) {
    return /^\d{4}-\d{2}/.test(String(isoDate)) ? String(isoDate).slice(0, 7) : '';
  }

  function monthOptions(accounts) {
    return [...new Set(accounts.map(account => monthKey(account.dueDate)).filter(Boolean))]
      .sort((a, b) => b.localeCompare(a))
      .map(value => {
        const [year, month] = value.split('-').map(Number);
        const label = MONTH_FORMAT.format(new Date(year, month - 1, 1));
        return { value, label: label.charAt(0).toUpperCase() + label.slice(1) };
      });
  }

  function filterAccounts(accounts, { professional = 'all', status = 'all', month = 'all' } = {}) {
    return accounts.filter(account =>
      (professional === 'all' || account.professionalId === professional) &&
      (status === 'all' || account.status === status) &&
      (month === 'all' || monthKey(account.dueDate) === month)
    );
  }

  function startOfCurrentWeek(now = new Date()) {
    const monday = new Date(now);
    monday.setHours(0, 0, 0, 0);
    monday.setDate(monday.getDate() + (monday.getDay() === 0 ? -6 : 1 - monday.getDay()));
    return monday;
  }

  function scheduleDate(schedule, now = new Date()) {
    const date = startOfCurrentWeek(now);
    date.setDate(date.getDate() + Number(schedule.week || 0) * 7 + Number(schedule.day || 0));
    const [hour, minute] = String(schedule.time || '00:00').split(':').map(Number);
    date.setHours(hour || 0, minute || 0, 0, 0);
    return date;
  }

  function upcomingSchedules(schedules, now = new Date()) {
    return schedules
      .filter(schedule => schedule.status === 'reservado' && scheduleDate(schedule, now) >= now)
      .sort((a, b) => scheduleDate(a, now) - scheduleDate(b, now));
  }

  function weekRangeLabel(week, now = new Date()) {
    const start = startOfCurrentWeek(now);
    start.setDate(start.getDate() + Number(week || 0) * 7);
    const end = new Date(start);
    end.setDate(end.getDate() + 5);
    const short = date => date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    return `${short(start)} a ${short(end)}`;
  }

  window.AttentoData = { filterAccounts, monthOptions, upcomingSchedules, scheduleDate, weekRangeLabel };
})();
