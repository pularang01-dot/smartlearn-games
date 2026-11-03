import { describe, expect, it } from "vitest";
import { normalizeAnswer } from "@/lib/answer";
import { IMPORT_TEMPLATE, parseCsv, sanitizeCell, toCsv } from "@/lib/csv";
import { buildImportPreview } from "@/lib/validations/import";

describe("parseCsv", () => {
  it("mem-parse kutip, koma di dalam kutip, dan kutip lolos", () => {
    const rows = parseCsv('a,b\r\n"Halo, dunia","Dia berkata ""ya"""\r\n');
    expect(rows).toEqual([["a", "b"], ["Halo, dunia", 'Dia berkata "ya"']]);
  });
  it("mendeteksi pemisah titik koma (Excel Indonesia) dan BOM", () => {
    expect(parseCsv("\uFEFFa;b\n1;2")).toEqual([["a", "b"], ["1", "2"]]);
  });
  it("mengabaikan baris kosong", () => {
    expect(parseCsv("a,b\n\n1,2\n,\n")).toEqual([["a", "b"], ["1", "2"]]);
  });
  it("template dapat dibaca kembali tanpa kesalahan", () => {
    const preview = buildImportPreview(parseCsv(IMPORT_TEMPLATE));
    expect(preview.fileErrors).toEqual([]);
    expect(preview.rows.every((r) => r.errors.length === 0)).toBe(true);
    expect(preview.rows).toHaveLength(2);
  });
});

describe("toCsv / sanitizeCell", () => {
  it("menetralkan formula injection", () => {
    expect(sanitizeCell("=HYPERLINK(\"x\")")).toBe("'=HYPERLINK(\"x\")");
    expect(sanitizeCell("+1")).toBe("'+1");
    expect(sanitizeCell("aman")).toBe("aman");
  });
  it("meng-escape koma dan kutip", () => {
    expect(toCsv([["a,b", 'c"d']])).toContain('"a,b","c""d"');
  });
});

describe("normalizeAnswer", () => {
  it.each([["benar", true], ["Benar", true], ["B", true], ["true", true], ["TRUE", true], ["salah", false], ["S", false], ["false", false], ["0", false]])("%s", (input, expected) => {
    expect(normalizeAnswer(input)).toBe(expected);
  });
  it("mengembalikan null bila tidak dikenali", () => {
    expect(normalizeAnswer("mungkin")).toBeNull();
    expect(normalizeAnswer("")).toBeNull();
  });
});

describe("buildImportPreview", () => {
  it("melaporkan nomor baris dan alasan error", () => {
    const table = parseCsv("question_text,correct_answer,points,time_limit_seconds\nOk,benar,10,20\n,salah,10,\nSoal,mungkin,10,\nSoal,benar,0,\nSoal,benar,10,3");
    const { rows } = buildImportPreview(table);
    expect(rows[0].errors).toEqual([]);
    expect(rows[1]).toMatchObject({ line: 3 });
    expect(rows[1].errors[0]).toMatch(/kosong/i);
    expect(rows[2].errors[0]).toMatch(/tidak dikenali/i);
    expect(rows[3].errors[0]).toMatch(/Poin/);
    expect(rows[4].errors[0]).toMatch(/waktu/i);
  });
  it("gagal bila kolom wajib tidak ada", () => {
    expect(buildImportPreview(parseCsv("a,b\n1,2")).fileErrors.length).toBeGreaterThan(0);
  });
});
