const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const context = { window: {}, Intl, Date };
vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../data-utils.js'), 'utf8'), context);
const data = context.window.AttentoData;

test('exclusão protege todos os vínculos, inclusive históricos e profissionais inativos', () => {
  const empty = { professionals: [], schedules: [], financial: [], insurance: [] };
  assert.equal(data.deletionBlocked('room', 'r', empty), false);
  assert.equal(data.deletionBlocked('professional', 'p', empty), false);
  assert.equal(data.deletionBlocked('room', 'r', { ...empty, professionals: [{ roomId: 'r', status: 'inativo' }] }), true);
  assert.equal(data.deletionBlocked('room', 'r', { ...empty, schedules: [{ roomId: 'r', date: '2020-01-01' }] }), true);
  for (const key of ['schedules', 'financial', 'insurance']) {
    assert.equal(data.deletionBlocked('professional', 'p', { ...empty, [key]: [{ professionalId: 'p' }] }), true);
    assert.equal(data.deletionBlocked('professional', 'other', { ...empty, [key]: [{ professionalId: 'p' }] }), false);
  }
});

test('disponibilidade bloqueia passado, manutenção, sala inativa e conflito', () => {
  const now = new Date(2026, 8, 16, 12);
  const room = { id: 'r', status: 'disponivel' };
  assert.equal(data.slotUnavailableReason(room, [], '2026-09-16', '13:00', now), '');
  assert.ok(data.slotUnavailableReason(room, [], '2026-09-16', '12:00', now));
  assert.ok(data.slotUnavailableReason(room, [], '2026-09-15', '13:00', now));
  assert.ok(data.slotUnavailableReason(null, [], '2026-09-17', '13:00', now));
  for (const status of ['manutencao', 'inativa']) {
    assert.ok(data.slotUnavailableReason({ ...room, status }, [], '2026-09-17', '13:00', now));
  }
  const schedules = [{ roomId: 'r', date: '2026-09-16', time: '13:00', status: 'reservado' }];
  assert.ok(data.slotUnavailableReason(room, schedules, '2026-09-16', '13:00', now));
  assert.equal(data.slotUnavailableReason(room, schedules, '2026-09-17', '13:00', now), '');
  assert.equal(data.slotUnavailableReason({ ...room, id: 'other' }, schedules, '2026-09-16', '13:00', now), '');
});

test('migração fixa datas legadas uma única vez, inclusive na virada do ano', () => {
  const legacy = [{ id: 'a', week: 1, day: 0, time: '09:00', status: 'reservado' }];
  const migrated = data.migrateSchedules(legacy, new Date(2026, 11, 30));
  assert.equal(migrated[0].date, '2027-01-04');
  assert.equal(legacy[0].date, undefined);
  const again = data.migrateSchedules(migrated, new Date(2027, 0, 12));
  assert.equal(again[0].date, '2027-01-04');
  assert.equal(data.upcomingSchedules(again, new Date(2027, 0, 12)).length, 0);
});

test('reserva da próxima semana passa para a atual sem mudar sua data', () => {
  const schedule = { date: '2026-09-21', time: '09:00', status: 'reservado' };
  assert.equal(data.inWeek(schedule, 1, new Date(2026, 8, 15)), true);
  assert.equal(data.inWeek(schedule, 0, new Date(2026, 8, 21)), true);
  assert.equal(data.inWeek(schedule, 0, new Date(2026, 8, 28)), false);
  assert.equal(data.scheduleDate(schedule, new Date(2026, 8, 28)).getDate(), 21);
  assert.equal(data.slotDate(1, 0, new Date(2026, 8, 15)), schedule.date);
});

test('dateKey mantém o dia do calendário local perto da meia-noite', () => {
  assert.equal(data.dateKey(new Date(2026, 8, 15, 23, 59)), '2026-09-15');
});

test('gera os meses existentes nos dados em ordem mais recente', () => {
  const options = data.monthOptions([
    { dueDate: '2026-08-10' }, { dueDate: '2026-09-15' }, { dueDate: '2026-08-20' }, { dueDate: '' }
  ]);
  assert.deepEqual(Array.from(options, option => option.value), ['2026-09', '2026-08']);
  assert.match(options[0].label, /Setembro.*2026/);
});

test('combina filtros de mês, profissional e status', () => {
  const accounts = [
    { id: 1, professionalId: 'a', status: 'pago', dueDate: '2026-08-10' },
    { id: 2, professionalId: 'a', status: 'pendente', dueDate: '2026-09-10' },
    { id: 3, professionalId: 'b', status: 'pendente', dueDate: '2026-09-20' }
  ];
  const filtered = data.filterAccounts(accounts, { professional: 'a', status: 'pendente', month: '2026-09' });
  assert.deepEqual(Array.from(filtered, account => account.id), [2]);
  assert.equal(data.filterAccounts(accounts).length, 3);
});

test('calcula as datas de uma agenda semanal a partir da segunda-feira atual', () => {
  const now = new Date(2026, 8, 15, 12, 0); // terça-feira
  assert.equal(data.scheduleDate({ week: 0, day: 0, time: '09:00' }, now).getDate(), 14);
  assert.equal(data.scheduleDate({ week: 1, day: 5, time: '18:00' }, now).getDate(), 26);
  assert.equal(data.weekRangeLabel(0, now), '14/09 a 19/09');
  assert.equal(data.weekRangeLabel(1, now), '21/09 a 26/09');
});

test('próximos horários excluem passado e outros status e ficam em ordem cronológica', () => {
  const now = new Date(2026, 8, 15, 12, 0);
  const schedules = [
    { id: 'future-week', week: 1, day: 0, time: '08:00', status: 'reservado' },
    { id: 'past-day', week: 0, day: 0, time: '18:00', status: 'reservado' },
    { id: 'past-time', week: 0, day: 1, time: '11:00', status: 'reservado' },
    { id: 'occupied', week: 0, day: 1, time: '13:00', status: 'ocupado' },
    { id: 'today', week: 0, day: 1, time: '14:00', status: 'reservado' }
  ];
  assert.deepEqual(Array.from(data.upcomingSchedules(schedules, now), item => item.id), ['today', 'future-week']);
});
