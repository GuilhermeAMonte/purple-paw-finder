import { describe, it, expect } from 'vitest';
import { validateImageFile, validateReferralFile } from '@/utils/fileValidation';

function makeFile(name: string, type: string, bytes: number[]): File {
  const buf = new Uint8Array(bytes);
  return new File([buf], name, { type });
}

const JPEG_HEADER = [0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10];
const PNG_HEADER  = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];
const PDF_HEADER  = [0x25, 0x50, 0x44, 0x46, 0x2D]; // %PDF-

describe('validateImageFile', () => {
  it('accepts a valid JPEG', async () => {
    const file = makeFile('photo.jpg', 'image/jpeg', JPEG_HEADER);
    expect(await validateImageFile(file)).toBeNull();
  });

  it('accepts a valid PNG', async () => {
    const file = makeFile('photo.png', 'image/png', PNG_HEADER);
    expect(await validateImageFile(file)).toBeNull();
  });

  it('rejects an empty file', async () => {
    const file = new File([], 'empty.jpg', { type: 'image/jpeg' });
    expect(await validateImageFile(file)).toMatch(/vazio/i);
  });

  it('rejects wrong extension', async () => {
    const file = makeFile('photo.exe', 'image/jpeg', JPEG_HEADER);
    expect(await validateImageFile(file)).toMatch(/extensão/i);
  });

  it('rejects mismatched magic bytes (PDF disguised as JPEG)', async () => {
    const file = makeFile('evil.jpg', 'image/jpeg', PDF_HEADER);
    expect(await validateImageFile(file)).toMatch(/conteúdo/i);
  });

  it('rejects file exceeding 5 MB', async () => {
    const big = new Uint8Array(5 * 1024 * 1024 + 1);
    const file = new File([big], 'big.jpg', { type: 'image/jpeg' });
    expect(await validateImageFile(file)).toMatch(/grande/i);
  });
});

describe('validateReferralFile', () => {
  it('accepts a valid PDF', async () => {
    const file = makeFile('ref.pdf', 'application/pdf', PDF_HEADER);
    expect(await validateReferralFile(file)).toBeNull();
  });

  it('accepts a valid JPEG referral', async () => {
    const file = makeFile('ref.jpg', 'image/jpeg', JPEG_HEADER);
    expect(await validateReferralFile(file)).toBeNull();
  });

  it('rejects unsupported extension (.exe)', async () => {
    const file = makeFile('malware.exe', 'application/octet-stream', [0x4D, 0x5A]);
    expect(await validateReferralFile(file)).toMatch(/tipo inválido/i);
  });

  it('rejects PDF bytes with .doc extension', async () => {
    const file = makeFile('fake.doc', 'application/msword', PDF_HEADER);
    expect(await validateReferralFile(file)).toMatch(/conteúdo/i);
  });
});
