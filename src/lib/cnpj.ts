// Validação de CNPJ com dígitos verificadores oficiais (Receita Federal).

/** Remove tudo que não for dígito. */
export function stripCNPJ(cnpj: string): string {
  return cnpj.replace(/\D/g, '');
}

/** Valida um CNPJ (com ou sem máscara) pelos dígitos verificadores. */
export function validateCNPJ(cnpj: string): boolean {
  const digits = stripCNPJ(cnpj);
  if (digits.length !== 14) return false;
  if (/^(\d)\1+$/.test(digits)) return false; // todos os dígitos iguais

  const calc = (len: number): number => {
    let sum = 0;
    let pos = len - 7;
    for (let i = len; i >= 1; i--) {
      sum += parseInt(digits[len - i], 10) * pos--;
      if (pos < 2) pos = 9;
    }
    const r = sum % 11;
    return r < 2 ? 0 : 11 - r;
  };

  const d1 = calc(12);
  const d2 = calc(13);
  return d1 === parseInt(digits[12], 10) && d2 === parseInt(digits[13], 10);
}
