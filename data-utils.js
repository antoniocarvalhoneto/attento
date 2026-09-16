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
    const date = schedule.date ? new Date(schedule.date + 'T00:00:00') : startOfCurrentWeek(now);
    if (!schedule.date) date.setDate(date.getDate() + Number(schedule.week || 0) * 7 + Number(schedule.day || 0));
    const [hour, minute] = String(schedule.time || '00:00').split(':').map(Number);
    date.setHours(hour || 0, minute || 0, 0, 0);
    return date;
  }

  function dateKey(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  function slotDate(week, day, now = new Date()) {
    return dateKey(scheduleDate({ week, day }, now));
  }

  function migrateSchedules(schedules, now = new Date()) {
    return schedules.map(schedule => schedule.date ? schedule : { ...schedule, date: slotDate(schedule.week, schedule.day, now) });
  }

  function inWeek(schedule, week, now = new Date()) {
    const start = slotDate(week, 0, now);
    const end = slotDate(week + 1, 0, now);
    const date = schedule.date || dateKey(scheduleDate(schedule, now));
    return date >= start && date < end;
  }

  function upcomingSchedules(schedules, now = new Date()) {
    return schedules
      .filter(schedule => schedule.status === 'reservado' && scheduleDate(schedule, now) >= now)
      .sort((a, b) => scheduleDate(a, now) - scheduleDate(b, now));
  }

  function slotUnavailableReason(room, schedules, date, time, now = new Date()) {
    if (!room || room.status !== 'disponivel') return 'Esta sala não está disponível para reservas.';
    const slot = scheduleDate({ date, time });
    if (!Number.isFinite(slot.getTime()) || slot <= now) return 'Este horário já passou ou é inválido.';
    if (schedules.some(schedule => schedule.roomId === room.id && schedule.date === date && schedule.time === time && schedule.status !== 'disponivel')) {
      return 'Este horário já está reservado ou indisponível.';
    }
    return '';
  }

  function deletionBlocked(kind, id, records) {
    if (kind === 'room') {
      return records.professionals.some(item => item.roomId === id) || records.schedules.some(item => item.roomId === id);
    }
    if (kind === 'professional') {
      return [records.schedules, records.financial, records.insurance].some(items => items.some(item => item.professionalId === id));
    }
    return true;
  }

  function weekRangeLabel(week, now = new Date()) {
    const start = startOfCurrentWeek(now);
    start.setDate(start.getDate() + Number(week || 0) * 7);
    const end = new Date(start);
    end.setDate(end.getDate() + 5);
    const short = date => date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    return `${short(start)} a ${short(end)}`;
  }

  window.AttentoData = { filterAccounts, monthOptions, upcomingSchedules, scheduleDate, weekRangeLabel, dateKey, slotDate, migrateSchedules, inWeek, slotUnavailableReason, deletionBlocked };
})();
