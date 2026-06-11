// Consulta de endereço por CEP via ViaCEP (gratuito, sem chave).
// Endpoint fixo e confiável; best-effort (retorna null em qualquer falha).

export interface CepResult {
  state: string;
  city: string;
  street: string;
  neighborhood: string;
}

export async function lookupCEP(cep: string): Promise<CepResult | null> {
  const digits = cep.replace(/\D/g, '');
  if (digits.length !== 8) return null;

  try {
    const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.erro) return null;
    return {
      state: data.uf ?? '',
      city: data.localidade ?? '',
      street: data.logradouro ?? '',
      neighborhood: data.bairro ?? '',
    };
  } catch {
    return null;
  }
}
