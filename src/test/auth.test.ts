import { describe, it, expect, vi, beforeEach } from 'vitest';
import { loginSchema, registerSchema } from '@/schemas/auth.schemas';

/* ============================================================
   auth.schemas — pure Zod, no mocks needed
   ============================================================ */

const VALID_CLIENT = {
  name: 'João Silva',
  email: 'joao@example.com',
  password: 'Senha@123',
  confirmPassword: 'Senha@123',
  userType: 'client' as const,
};

describe('loginSchema', () => {
  it('accepts valid credentials', () => {
    expect(loginSchema.safeParse({ email: 'a@b.com', password: 'pass' }).success).toBe(true);
  });

  it('rejects invalid email format', () => {
    expect(loginSchema.safeParse({ email: 'not-an-email', password: 'pass' }).success).toBe(false);
  });

  it('rejects empty password', () => {
    expect(loginSchema.safeParse({ email: 'a@b.com', password: '' }).success).toBe(false);
  });

  it('trims whitespace from email', () => {
    const r = loginSchema.safeParse({ email: '  a@b.com  ', password: 'pass' });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.email).toBe('a@b.com');
  });
});

describe('registerSchema', () => {
  it('accepts a valid client registration', () => {
    expect(registerSchema.safeParse(VALID_CLIENT).success).toBe(true);
  });

  it('rejects password with no uppercase letter', () => {
    const r = registerSchema.safeParse({
      ...VALID_CLIENT,
      password: 'senha@123',
      confirmPassword: 'senha@123',
    });
    expect(r.success).toBe(false);
    if (!r.success)
      expect(r.error.issues.some(i => /maiúscula/i.test(i.message))).toBe(true);
  });

  it('rejects password with no number', () => {
    const r = registerSchema.safeParse({
      ...VALID_CLIENT,
      password: 'Senha@abc',
      confirmPassword: 'Senha@abc',
    });
    expect(r.success).toBe(false);
  });

  it('rejects password with no special character', () => {
    const r = registerSchema.safeParse({
      ...VALID_CLIENT,
      password: 'SenhaABC1',
      confirmPassword: 'SenhaABC1',
    });
    expect(r.success).toBe(false);
    if (!r.success)
      expect(r.error.issues.some(i => /especial/i.test(i.message))).toBe(true);
  });

  it('rejects password shorter than 8 characters', () => {
    const r = registerSchema.safeParse({ ...VALID_CLIENT, password: 'S@1a', confirmPassword: 'S@1a' });
    expect(r.success).toBe(false);
  });

  it('rejects mismatched passwords', () => {
    const r = registerSchema.safeParse({ ...VALID_CLIENT, confirmPassword: 'Different@1' });
    expect(r.success).toBe(false);
    if (!r.success)
      expect(r.error.issues.some(i => /coincidem/i.test(i.message))).toBe(true);
  });

  it('rejects clinic registration without a plan', () => {
    const r = registerSchema.safeParse({ ...VALID_CLIENT, userType: 'clinic' });
    expect(r.success).toBe(false);
    if (!r.success)
      expect(r.error.issues.some(i => /plano/i.test(i.message))).toBe(true);
  });

  it('accepts clinic registration with a plan', () => {
    expect(
      registerSchema.safeParse({ ...VALID_CLIENT, userType: 'clinic', plan: 'basic' }).success,
    ).toBe(true);
  });

  it('rejects name longer than 150 characters', () => {
    expect(
      registerSchema.safeParse({ ...VALID_CLIENT, name: 'A'.repeat(151) }).success,
    ).toBe(false);
  });

  it('trims leading/trailing whitespace from name and email', () => {
    const r = registerSchema.safeParse({ ...VALID_CLIENT, name: '  João  ', email: '  joao@example.com  ' });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.name).toBe('João');
      expect(r.data.email).toBe('joao@example.com');
    }
  });

  it('rejects invalid userType value', () => {
    expect(
      registerSchema.safeParse({ ...VALID_CLIENT, userType: 'admin' }).success,
    ).toBe(false);
  });
});

/* ============================================================
   AuthContext — supabase mocked
   ============================================================ */

// vi.hoisted ensures these are available when vi.mock factory is called
const { mockUnsubscribe, mockSingle, mockEq, mockSelect, mockFrom, mockSignUp, mockSignIn, mockSignOut, mockGetSession, mockOnAuthStateChange } = vi.hoisted(() => {
  const mockUnsubscribe = vi.fn();
  const mockSingle = vi.fn();
  const mockEq = vi.fn(() => ({ single: mockSingle }));
  const mockSelect = vi.fn(() => ({ eq: mockEq }));
  const mockFrom = vi.fn(() => ({ select: mockSelect, update: vi.fn(() => ({ eq: vi.fn() })) }));
  const mockSignUp = vi.fn();
  const mockSignIn = vi.fn();
  const mockSignOut = vi.fn();
  const mockGetSession = vi.fn().mockResolvedValue({ data: { session: null } });
  const mockOnAuthStateChange = vi.fn().mockReturnValue({
    data: { subscription: { unsubscribe: mockUnsubscribe } },
  });
  return { mockUnsubscribe, mockSingle, mockEq, mockSelect, mockFrom, mockSignUp, mockSignIn, mockSignOut, mockGetSession, mockOnAuthStateChange };
});

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: mockGetSession,
      onAuthStateChange: mockOnAuthStateChange,
      signUp: mockSignUp,
      signInWithPassword: mockSignIn,
      signOut: mockSignOut,
    },
    from: mockFrom,
  },
}));

import { supabase } from '@/lib/supabase';

beforeEach(() => {
  vi.clearAllMocks();
  mockGetSession.mockResolvedValue({ data: { session: null } });
  mockOnAuthStateChange.mockReturnValue({
    data: { subscription: { unsubscribe: mockUnsubscribe } },
  });
});

describe('AuthContext — register', () => {
  it('throws a generic error when signUp fails (no sensitive detail exposed)', async () => {
    mockSignUp.mockResolvedValue({
      data: { session: null, user: null },
      error: { message: 'Database connection timeout' },
    });

    // Dynamically import to get a fresh module with the mock in place
    const { AuthProvider, useAuth } = await import('@/contexts/AuthContext');
    const React = await import('react');
    const { renderHook } = await import('@testing-library/react');

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(AuthProvider, null, children);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await expect(
      result.current.register('Name', 'a@b.com', 'Pass@123', 'client'),
    ).rejects.toThrow('Não foi possível completar o cadastro');
  });

  it('returns null when signUp succeeds but email confirmation is pending', async () => {
    mockSignUp.mockResolvedValue({
      data: { session: null, user: { id: 'uid-1' } },
      error: null,
    });

    const { AuthProvider, useAuth } = await import('@/contexts/AuthContext');
    const React = await import('react');
    const { renderHook } = await import('@testing-library/react');

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(AuthProvider, null, children);

    const { result } = renderHook(() => useAuth(), { wrapper });
    const user = await result.current.register('Name', 'a@b.com', 'Pass@123', 'client');
    expect(user).toBeNull();
  });
});

describe('AuthContext — login', () => {
  it('throws a generic error when credentials are wrong', async () => {
    mockSignIn.mockResolvedValue({
      data: { session: null },
      error: { message: 'Invalid login credentials' },
    });

    const { AuthProvider, useAuth } = await import('@/contexts/AuthContext');
    const React = await import('react');
    const { renderHook } = await import('@testing-library/react');

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(AuthProvider, null, children);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await expect(
      result.current.login('wrong@example.com', 'badpass'),
    ).rejects.toThrow('E-mail ou senha incorretos');
  });
});
