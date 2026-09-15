const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const context = { window: {}, Intl, Date };
vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../data-utils.js'), 'utf8'), context);
const data = context.window.AttentoData;

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
