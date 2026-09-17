import { KEYS, loadData, saveData, uid } from './storage'
import { HOURS } from './models'
import type { Room, Schedule } from './models'
import { migrateSchedules } from './dates'

export function initializeData() {
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
      const schedules: Omit<Schedule, 'date'>[] = [];
      const roomIds = ['room_1', 'room_2', 'room_4', 'room_5'];
      const profIds = ['prof_1', 'prof_2', 'prof_3', 'prof_4'];
      [0, 1].forEach(week => {
        roomIds.forEach((roomId, ri) => {
          for (let day = 0; day < 6; day++) {
            HOURS.forEach((time, hi) => {
              const seed = (ri * 31 + day * 7 + hi * 3 + week * 5) % 10;
              let status = 'disponivel';
              if (seed < 2) status = 'ocupado';
              else if (seed < 4) status = 'reservado';
              else if (seed === 4 && ri === 2 && day === 2) status = 'manutencao';
              if (status !== 'disponivel') {
                const room = loadData<Room[]>(KEYS.rooms)!.find(r => r.id === roomId)!;
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
      schedules.push({ id: uid('sch'), week: 0, unitId: 'unit_centro', roomId: 'room_1', day: 1, time: '09:00', shift: 'Manhã', professionalId: 'prof_1', value: 500, note: 'Avaliação inicial', status: 'reservado', userId: 'user_demo' });
      schedules.push({ id: uid('sch'), week: 0, unitId: 'unit_sul', roomId: 'room_5', day: 3, time: '18:00', shift: 'Noite', professionalId: 'prof_4', value: 340, note: '', status: 'reservado', userId: 'user_demo' });
      saveData(KEYS.schedules, migrateSchedules(schedules));
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

