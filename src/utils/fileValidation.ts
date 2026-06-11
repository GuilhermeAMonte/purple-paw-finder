const HEADER_SIZE = 16;

async function readHeader(file: File): Promise<Uint8Array> {
  const buffer = await file.slice(0, HEADER_SIZE).arrayBuffer();
  return new Uint8Array(buffer);
}

function startsWith(header: Uint8Array, bytes: number[]): boolean {
  return bytes.every((b, i) => header[i] === b);
}

const MAGIC = {
  jpeg: [0xFF, 0xD8, 0xFF],
  png:  [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A],
  webp: [0x52, 0x49, 0x46, 0x46],   // RIFF — bytes 8–11 must be "WEBP"
  pdf:  [0x25, 0x50, 0x44, 0x46],   // %PDF
  zip:  [0x50, 0x4B, 0x03, 0x04],   // PK — DOCX is a ZIP
  doc:  [0xD0, 0xCF, 0x11, 0xE0],   // OLE2 compound document (legacy .doc)
};

function isWebP(h: Uint8Array): boolean {
  return startsWith(h, MAGIC.webp) &&
    h[8] === 0x57 && h[9] === 0x45 && h[10] === 0x42 && h[11] === 0x50;
}

/* -------------------------------------------------------------------------- */
/* Image validation — avatars & pet photos                                     */
/* Bucket limits: image/jpeg | image/png | image/webp, max 5 MB               */
/* -------------------------------------------------------------------------- */

const IMAGE_MIME  = new Set(['image/jpeg', 'image/png', 'image/webp']);
const IMAGE_EXT   = new Set(['.jpg', '.jpeg', '.png', '.webp']);
const IMAGE_LIMIT = 5 * 1024 * 1024;

export async function validateImageFile(file: File): Promise<string | null> {
  if (file.size === 0) return 'Arquivo vazio.';
  if (file.size > IMAGE_LIMIT) return 'Imagem muito grande. Máximo 5 MB.';

  const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
  if (!IMAGE_EXT.has(ext)) return 'Extensão inválida. Use JPG, PNG ou WebP.';
  if (!IMAGE_MIME.has(file.type)) return 'Tipo de arquivo não permitido.';

  const h = await readHeader(file);
  if (!startsWith(h, MAGIC.jpeg) && !startsWith(h, MAGIC.png) && !isWebP(h))
    return 'O conteúdo do arquivo não corresponde ao tipo de imagem.';

  return null;
}

/* -------------------------------------------------------------------------- */
/* Referral file validation — ticket attachments                               */
/* Bucket limits: pdf | jpeg | png | msword | docx, max 10 MB                 */
/* -------------------------------------------------------------------------- */

const REFERRAL_MIME = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);
const REFERRAL_EXT   = new Set(['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx']);
const REFERRAL_LIMIT = 10 * 1024 * 1024;

export async function validateReferralFile(file: File): Promise<string | null> {
  if (file.size === 0) return 'Arquivo vazio.';
  if (file.size > REFERRAL_LIMIT) return 'Arquivo muito grande. Máximo 10 MB.';

  const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
  if (!REFERRAL_EXT.has(ext)) return 'Tipo inválido. Use PDF, JPG, PNG, DOC ou DOCX.';
  if (!REFERRAL_MIME.has(file.type)) return 'Tipo de arquivo não permitido.';

  const h = await readHeader(file);
  let valid = false;
  if (ext === '.pdf')                       valid = startsWith(h, MAGIC.pdf);
  else if (ext === '.jpg' || ext === '.jpeg') valid = startsWith(h, MAGIC.jpeg);
  else if (ext === '.png')                  valid = startsWith(h, MAGIC.png);
  else if (ext === '.docx')                 valid = startsWith(h, MAGIC.zip);
  else if (ext === '.doc')                  valid = startsWith(h, MAGIC.doc);

  if (!valid) return 'O conteúdo do arquivo não corresponde à extensão declarada.';
  return null;
}
