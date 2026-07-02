export function stripCPF(cpf: string): string {
  return cpf.replace(/\D/g, '');
}

export function validateCPF(cpf: string): boolean {
  const digits = stripCPF(cpf);
  if (digits.length !== 11) return false;
  if (/^(\d)\1+$/.test(digits)) return false;

  const calc = (len: number): number => {
    let sum = 0;
    for (let i = 0; i < len; i++) {
      sum += parseInt(digits[i], 10) * (len + 1 - i);
    }
    const r = (sum * 10) % 11;
    return r >= 10 ? 0 : r;
  };

  return calc(9) === parseInt(digits[9], 10) && calc(10) === parseInt(digits[10], 10);
}
