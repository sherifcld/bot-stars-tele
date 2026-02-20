# Bot Auto Order Telegram Stars

Bot ini buat lo yang males ribet kirim Telegram Stars manual.  
User order → bayar → Stars auto kelempar ke target. Tanpa lo sentuh-sentuh lagi.

---

## Fitur Singkat

- Order Telegram Stars auto, realtime
- Pembayaran via **Pakasir** (QRIS, dll)
- QRIS nongol langsung di chat (bukan cuma link receh)
- DB cuma pake **file JSON** (nggak ada Mongo, nggak ada .env)
- Panel admin:
  - Liat order terbaru
  - Liat statistik omzet
  - Atur harga per Star (`/setprice`)
  - Liat log error

---

## Yang Lo Butuh

- Node.js (versi baru, udah support `type: module`)
- Bot Telegram dari **@BotFather**
- Akun **Pakasir** + project (punya `projectSlug` & `apiKey`)
- VPS / hosting yang bisa jalanin Node + punya domain / subdomain (biar webhook Pakasir bisa nembak server lo)

---

## Setup Cepet

### 1. Install dependency

```bash
npm install
```

### 2. Edit config

Buka:

- `src/config.js`

Isi bagian ini pake punya lo:

```js
export const config = {
  botToken: "TOKEN_BOT_LO",
  port: 3000,
  baseUrl: "https://domain-lo.com", // URL backend lo (buat webhook Pakasir)
  adminIds: [123456789], // ID Telegram lo (admin)

  payment: {
    provider: "pakasir",
    pakasir: {
      projectSlug: "slug-proyek-lo",
      apiKey: "api-key-pakasir-lo",
      defaultMethod: "qris", // biarin qris, paling aman
    },
  },

  starsSender: {
    mode: "userbot",
    apiId: "api_id_telegram_lo",
    apiHash: "api_hash_telegram_lo",
    session: "string_session_userbot_lo",
  },
};
```

Catatan:

- `botToken` → dari @BotFather
- `adminIds` → ID Telegram lo (bisa cek via bot `@userinfobot`)
- `baseUrl` → domain / subdomain yang ngarah ke server Node ini  
  contoh: `https://stars.domainlo.com`
- `projectSlug`, `apiKey` → dari dashboard Pakasir (Project → API)

---

## Jalanin Bot

Dev / VPS:

```bash
npm start
```

Kalau bener, di terminal bakal keluar:

- `Telegram bot started with polling`
- `Server listening on port 3000`

Kalau error 409 (conflict polling) → artinya lo jalanin bot dobel. Matikan instance lama, tinggalin satu.

---

## Set Webhook Pakasir

Di dashboard Pakasir, set Webhook URL ke:

```text
https://domain-lo.com/payments/pakasir/callback
```

Sesuai `baseUrl` + path `/payments/pakasir/callback`.

Begitu payment sukses, Pakasir nembak URL itu → bot:

- Cek payment
- Ubah status order
- Jalankan pengiriman Stars via userbot

---

## Cara Pakai di Telegram (User)

User tinggal:

1. Chat bot lo → `/start`
2. Pilih **💫 Beli Stars**
3. Masukin jumlah Stars (harus ≥ min order yang lo set)
4. Masukin username target (tanpa typo, itu urusan mereka)
5. Pilih metode bayar (di UI: QRIS / e-wallet / bank → di belakang diarahkan ke Pakasir)
6. Bot kirim:
   - Gambar **QRIS** buat discan (kalau metode qris)
   - Atau link pembayaran (kalau mode lain)
7. Setelah bayar sukses dan webhook masuk:
   - Bot kirim Stars ke target
   - Status order jadi **SELESAI**

---

## Panel Admin

Cuma user dengan `id` yang ada di `adminIds` yang bisa pake.

### `/admin`

Buka menu admin:

- **📦 Order Terbaru** → list order terakhir
- **💰 Ubah Harga** → info shortcut ke `/setprice`
- **📊 Statistik** → total order, order sukses, total omzet
- **📜 Log Error** → error-error yang kejadian di backend

### `/setprice`

Format:

```text
/setprice <harga_per_star> <min_order> <max_order>
```

Contoh:

```text
/setprice 120 50 100000
```

Artinya:

- 1 Star = 120 IDR
- Minimal order = 50 Stars
- Maksimal = 100000 Stars

Kalau user order di luar range itu → langsung ditolak.

---

## Struktur Data

Semua data nongkrong di folder `data/`:

- `users.json` → data user Telegram
- `orders.json` → order Stars
- `payments.json` → transaksi Pakasir
- `settings.json` → config harga Stars
- `logs.json` → error log

Dikelola lewat repository:

- `src/repositories/usersRepo.js`
- `src/repositories/ordersRepo.js`
- `src/repositories/ordersRepo.js`
- `src/repositories/paymentsRepo.js`
- `src/repositories/settingsRepo.js`
- `src/repositories/logsRepo.js`

Nggak ada Mongo, nggak ada .env, nggak ada config ribet.

---

## Debug Cepat

- Bot mati pas user input Stars → cek `minOrder` / `maxOrder` di `/setprice`
- Pembayaran nggak nge-update status:
  - Cek webhook Pakasir (URL udah bener belum)
  - Cek `logs.json` atau menu **📜 Log Error** di `/admin`
- Error 409 di terminal → bot lo jalan dobel, matiin salah satunya.

# bot-stars-tele
