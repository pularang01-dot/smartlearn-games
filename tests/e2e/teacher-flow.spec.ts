import { expect, test } from "@playwright/test";

const email = process.env.E2E_EMAIL;
const password = process.env.E2E_PASSWORD;

test.skip(!email || !password, "Set E2E_EMAIL dan E2E_PASSWORD (akun guru pada project Supabase test) untuk menjalankan alur ini.");

test("guru: login, buat game contoh, mainkan, hasil tersimpan", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email!);
  await page.getByLabel("Password").fill(password!);
  await page.getByRole("button", { name: "Masuk" }).click();
  await expect(page).toHaveURL(/\/dashboard/);

  // tutup tur onboarding bila muncul
  const skip = page.getByRole("button", { name: "Lewati" });
  if (await skip.isVisible().catch(() => false)) await skip.click();

  await page.goto("/dashboard/games/new");
  await page.getByRole("button", { name: "Buat game contoh" }).click();
  await expect(page).toHaveURL(/\/dashboard\/games\/[0-9a-f-]{36}/);

  await page.getByRole("link", { name: "Mainkan" }).click();
  await page.getByRole("button", { name: "Mulai" }).click();
  for (let i = 0; i < 5; i++) {
    await page.getByRole("button", { name: "Jawab BENAR" }).click();
    await page.getByRole("button", { name: /Lanjut|Lihat hasil/ }).click();
  }
  await expect(page.getByText("Permainan selesai!")).toBeVisible();
  await expect(page.getByText("Hasil tersimpan di riwayat sesi.")).toBeVisible();

  await page.goto("/dashboard/sessions");
  await expect(page.getByText("Mengenal Tata Surya").first()).toBeVisible();
});
