import { expect, test } from "@playwright/test";

test("landing page menampilkan demo panel Benar/Salah yang dapat disentuh", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.getByRole("button", { name: "Jawab BENAR", exact: false }).first().or(page.getByRole("button", { name: /BENAR/ }).first()).click();
  await expect(page.getByRole("button", { name: "Soal lain" })).toBeVisible();
});

test("halaman publik dapat dibuka", async ({ page }) => {
  for (const path of ["/login", "/register", "/forgot-password", "/privacy", "/terms"]) {
    const res = await page.goto(path);
    expect(res?.status(), path).toBeLessThan(400);
  }
});

test("route privat tanpa login dialihkan ke /login", async ({ page }) => {
  for (const path of ["/dashboard", "/dashboard/games", "/dashboard/reports", "/play/3f2b8c1e-5d4a-4b7e-9a1c-0e6f7a8b9c10"]) {
    await page.goto(path);
    await expect(page, path).toHaveURL(/\/login/);
  }
});

test("tautan share yang tidak valid menampilkan pesan, bukan data", async ({ page }) => {
  await page.goto("/share/token-palsu-token-palsu-token-palsu");
  await expect(page.getByText("Tautan tidak berlaku")).toBeVisible();
});

test("validasi form registrasi tampil di dekat field", async ({ page }) => {
  await page.goto("/register");
  await page.getByRole("button", { name: "Buat akun" }).click();
  await expect(page.getByRole("alert").first()).toBeVisible();
});
