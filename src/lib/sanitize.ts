// Input sanitization utilities (INPUT-001, INPUT-012).
//
// NOTA SOBRE SQL INJECTION: o cliente Supabase usa prepared statements
// internamente — apostrofes e aspas em valores de usuário são 100% seguros
// (INPUT-006). Esta camada foca em:
//   1. Remover null bytes (\x00) que corrompem colunas text no PostgreSQL.
//   2. Remover caracteres de controle que não têm sentido em campos de texto.
//   3. Normalizar espaços repetidos para reduzir tamanho de índices no banco.

/** Campos de linha única: remove controles, colapsa espaços, faz trim. */
export function sanitizeLine(s: string): string {
  return s
    .replace(/\x00/g, '')              // null byte — corrompe text no PostgreSQL
    .replace(/[\x01-\x1F\x7F]/g, '')   // outros caracteres de controle (tab, LF, CR…)
    .replace(/ {2,}/g, ' ')            // múltiplos espaços → um espaço
    .trim();
}

/** Campos multilinha (descrições, observações): preserva \n mas remove o resto. */
export function sanitizeMultiline(s: string): string {
  return s
    .replace(/\x00/g, '')
    .replace(/[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // controles, exceto \t\n\r
    .replace(/[ \t]{2,}/g, ' ')        // colapsa espaços/tabs mas mantém quebras de linha
    .replace(/\n{3,}/g, '\n\n')        // máximo 2 linhas em branco seguidas
    .trim();
}
