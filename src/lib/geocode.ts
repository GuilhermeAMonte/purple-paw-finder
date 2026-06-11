// ============================================================================
// Geocoding via Nominatim (OpenStreetMap) — gratuito, sem chave de API.
// ----------------------------------------------------------------------------
// Endpoint fixo e confiável (não é URL controlada pelo usuário). Usado para
// converter o endereço da clínica em coordenadas, permitindo busca por
// proximidade. É best-effort: se falhar, a clínica é salva sem coordenadas.
//
// Política de uso do Nominatim: baixo volume e identificar a aplicação.
// ============================================================================

export interface GeoPoint {
  latitude: number;
  longitude: number;
}

/**
 * Geocodifica um endereço textual. Retorna null em qualquer falha
 * (rede, sem resultado, timeout) — nunca lança.
 */
export async function geocodeAddress(parts: {
  street?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
}): Promise<GeoPoint | null> {
  const query = [parts.street, parts.city, parts.state, parts.zipCode, 'Brasil']
    .filter((p) => p && p.trim().length > 0)
    .join(', ');

  if (!query) return null;

  try {
    const url = new URL('https://nominatim.openstreetmap.org/search');
    url.searchParams.set('q', query);
    url.searchParams.set('format', 'json');
    url.searchParams.set('limit', '1');
    url.searchParams.set('countrycodes', 'br');

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(url.toString(), {
      headers: { 'Accept': 'application/json' },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) return null;

    const results = (await res.json()) as Array<{ lat: string; lon: string }>;
    if (!Array.isArray(results) || results.length === 0) return null;

    const lat = parseFloat(results[0].lat);
    const lon = parseFloat(results[0].lon);
    if (Number.isNaN(lat) || Number.isNaN(lon)) return null;

    return { latitude: lat, longitude: lon };
  } catch {
    // Falha de rede/timeout — segue sem coordenadas.
    return null;
  }
}
