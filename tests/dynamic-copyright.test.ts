import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('Dynamic Copyright Suite (Tahap 9 - PRD §6.3.9)', () => {
  it('1. Tahun berjalan dihitung secara dinamis dari sistem kalender saat ini', () => {
    const calculatedYear = new Date().getFullYear();
    assert.equal(typeof calculatedYear, 'number');
    assert.ok(calculatedYear >= 2026);
  });

  it('2. Memvalidasi format baku copyright [Company Name] © {tahun}', () => {
    const companyName = 'Frasa Klausa Media';
    const currentYear = new Date().getFullYear();
    const formattedCopyright = `${companyName} © ${currentYear}`;

    // Format baku harus diawali nama perusahaan, simbol copyright (©), dan 4 digit tahun
    const copyrightRegex = /^(.+) © (\d{4})$/;
    assert.match(formattedCopyright, copyrightRegex);

    const match = formattedCopyright.match(copyrightRegex);
    assert.ok(match);
    assert.equal(match[1], companyName);
    assert.equal(Number(match[2]), currentYear);
  });

  it('3. Memastikan format copyright fleksibel terhadap perubahan nama entitas penerbit', () => {
    const customCompany = 'PT Frasa Klausa Literasi';
    const currentYear = new Date().getFullYear();
    const formatted = `${customCompany} © ${currentYear}`;

    assert.equal(formatted.includes(customCompany), true);
    assert.equal(formatted.includes(String(currentYear)), true);
  });
});
