import { describe, it, expect, vi, beforeEach } from 'vitest';

/* ============================================================
   Supabase mock — hoisted so vi.mock factory can access them
   ============================================================ */

const mocks = vi.hoisted(() => {
  // Terminal methods
  const single   = vi.fn();
  const order    = vi.fn();

  // Chainable builder — every step returns an object with all methods
  // so tests can call .insert(...).select().single() etc.
  const builder: Record<string, unknown> = {};
  const chain = () => builder;

  builder.select  = vi.fn(chain);
  builder.insert  = vi.fn(chain);
  builder.update  = vi.fn(chain);
  builder.eq      = vi.fn(chain);
  builder.single  = single;
  builder.order   = order;

  const from = vi.fn(() => builder);

  return { from, single, order, builder };
});

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: mocks.from,
    // auth stubs (not exercised in these tests but needed to avoid import errors)
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
    },
  },
}));

import {
  createTicket,
  fetchClientTickets,
  fetchClinicTickets,
  approveTicket,
  rejectTicket,
  cancelTicket,
  sendMessage,
} from '@/lib/tickets';

const BASE_INPUT = {
  user_id:        'user-1',
  clinic_id:      'clinic-1',
  pet_name:       'Rex',
  pet_species:    'dog',
  pet_breed:      'Labrador',
  service:        'Clínica Geral',
  title:          'Consulta de rotina',
  description:    'Pet sem apetite há 2 dias',
  scheduled_date: '2026-07-01',
  scheduled_time: '10:00',
};

beforeEach(() => {
  vi.clearAllMocks();
  // Re-wire chain after clearAllMocks
  (mocks.builder.select  as ReturnType<typeof vi.fn>).mockImplementation(() => mocks.builder);
  (mocks.builder.insert  as ReturnType<typeof vi.fn>).mockImplementation(() => mocks.builder);
  (mocks.builder.update  as ReturnType<typeof vi.fn>).mockImplementation(() => mocks.builder);
  (mocks.builder.eq      as ReturnType<typeof vi.fn>).mockImplementation(() => mocks.builder);
  (mocks.builder.order   as ReturnType<typeof vi.fn>).mockImplementation(() => mocks.builder);
});

/* ============================================================
   createTicket
   ============================================================ */

describe('createTicket', () => {
  it('inserts into tickets and returns the created row', async () => {
    const row = { ...BASE_INPUT, id: 'ticket-1', approval_status: 'pending', status: 'pending' };
    mocks.single.mockResolvedValueOnce({ data: row, error: null });

    const result = await createTicket(BASE_INPUT);
    expect(result.id).toBe('ticket-1');
    expect(result.approval_status).toBe('pending');
  });

  it('passes referral_file_url when provided', async () => {
    const row = { ...BASE_INPUT, id: 't-2', referral_file_url: 'user-1/ref.pdf', approval_status: 'pending', status: 'pending' };
    mocks.single.mockResolvedValueOnce({ data: row, error: null });

    const result = await createTicket({ ...BASE_INPUT, referral_file_url: 'user-1/ref.pdf' });
    expect(result.referral_file_url).toBe('user-1/ref.pdf');
  });

  it('throws when the database returns an error', async () => {
    mocks.single.mockResolvedValueOnce({ data: null, error: { message: 'insert failed' } });
    await expect(createTicket(BASE_INPUT)).rejects.toMatchObject({ message: 'insert failed' });
  });
});

/* ============================================================
   fetchClientTickets
   ============================================================ */

describe('fetchClientTickets', () => {
  it('returns an empty array when there are no tickets', async () => {
    (mocks.builder.order as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: [], error: null });
    const result = await fetchClientTickets('user-1');
    expect(result).toEqual([]);
  });

  it('maps clinic_name from the joined clinics row', async () => {
    const row = { ...BASE_INPUT, id: 't-1', approval_status: 'pending', status: 'pending', clinics: { clinic_name: 'VetCenter' } };
    (mocks.builder.order as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: [row], error: null });

    const [ticket] = await fetchClientTickets('user-1');
    expect(ticket.clinic_name).toBe('VetCenter');
  });

  it('falls back to "Clínica" when clinic_name is absent', async () => {
    const row = { ...BASE_INPUT, id: 't-2', approval_status: 'pending', status: 'pending', clinics: null };
    (mocks.builder.order as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: [row], error: null });

    const [ticket] = await fetchClientTickets('user-1');
    expect(ticket.clinic_name).toBe('Clínica');
  });

  it('throws when the query returns an error', async () => {
    (mocks.builder.order as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: null, error: { message: 'db error' } });
    await expect(fetchClientTickets('user-1')).rejects.toMatchObject({ message: 'db error' });
  });
});

/* ============================================================
   fetchClinicTickets
   ============================================================ */

describe('fetchClinicTickets', () => {
  it('maps client_name from the joined profiles row', async () => {
    const row = { ...BASE_INPUT, id: 't-3', approval_status: 'pending', status: 'pending', profiles: { name: 'Maria' } };
    (mocks.builder.order as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: [row], error: null });

    const [ticket] = await fetchClinicTickets('clinic-1');
    expect(ticket.client_name).toBe('Maria');
  });

  it('falls back to "Cliente" when client name is absent', async () => {
    const row = { ...BASE_INPUT, id: 't-4', approval_status: 'pending', status: 'pending', profiles: null };
    (mocks.builder.order as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: [row], error: null });

    const [ticket] = await fetchClinicTickets('clinic-1');
    expect(ticket.client_name).toBe('Cliente');
  });
});

/* ============================================================
   approveTicket / rejectTicket / cancelTicket
   ============================================================ */

describe('approveTicket', () => {
  it('resolves without error on success', async () => {
    (mocks.builder.eq as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ error: null });
    await expect(approveTicket('ticket-1')).resolves.toBeUndefined();
  });

  it('throws when the update fails', async () => {
    (mocks.builder.eq as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ error: { message: 'update failed' } });
    await expect(approveTicket('ticket-1')).rejects.toMatchObject({ message: 'update failed' });
  });
});

describe('rejectTicket', () => {
  it('resolves without error on success', async () => {
    (mocks.builder.eq as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ error: null });
    await expect(rejectTicket('ticket-1', 'Horário indisponível')).resolves.toBeUndefined();
  });
});

describe('cancelTicket', () => {
  it('resolves without error on success', async () => {
    (mocks.builder.eq as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ error: null });
    await expect(cancelTicket('ticket-1')).resolves.toBeUndefined();
  });
});

/* ============================================================
   sendMessage
   ============================================================ */

describe('sendMessage', () => {
  it('returns the created message with correct fields', async () => {
    const msg = { id: 'msg-1', ticket_id: 'ticket-1', sender_id: 'user-1', sender_type: 'client', text: 'Olá', type: 'text', created_at: '2026-07-01T10:00:00Z' };
    mocks.single.mockResolvedValueOnce({ data: msg, error: null });

    const result = await sendMessage('ticket-1', 'user-1', 'client', 'Olá');
    expect(result.text).toBe('Olá');
    expect(result.sender_type).toBe('client');
  });

  it('sets sender_id to null for system messages', async () => {
    const msg = { id: 'msg-2', ticket_id: 'ticket-1', sender_id: null, sender_type: 'system', text: 'Chamado aprovado', type: 'system', created_at: '2026-07-01T10:01:00Z' };
    mocks.single.mockResolvedValueOnce({ data: msg, error: null });

    const result = await sendMessage('ticket-1', 'irrelevant', 'system', 'Chamado aprovado');
    expect(result.sender_id).toBeNull();
    expect(result.type).toBe('system');
  });

  it('throws when the insert fails', async () => {
    mocks.single.mockResolvedValueOnce({ data: null, error: { message: 'msg insert failed' } });
    await expect(sendMessage('ticket-1', 'user-1', 'client', 'test')).rejects.toMatchObject({ message: 'msg insert failed' });
  });
});
