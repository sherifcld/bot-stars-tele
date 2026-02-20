import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions/index.js";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

const apiId = 22411945; // ganti kalau perlu
const apiHash = "a17d565b2cecc948463a723e9cace280";

const stringSession = new StringSession("");

const rl = readline.createInterface({ input, output });
const ask = (q) => rl.question(q);

(async () => {
  console.log("Login dulu buat generate session string...");
  const client = new TelegramClient(stringSession, apiId, apiHash, {
    connectionRetries: 5,
  });

  await client.start({
    phoneNumber: async () =>
      await ask("Nomor HP (format internasional, contoh +628xxxxx): "),
    password: async () =>
      await ask("Password 2FA (kalau nggak ada, kosongin aja): "),
    phoneCode: async () => await ask("Kode OTP dari Telegram: "),
    onError: (err) => console.log("Error:", err),
  });

  await rl.close();

  console.log("Login sukses.");
  console.log("Session string lo (COPY INI, JANGAN SHARE KE SIAPA2):");
  console.log(client.session.save());
  process.exit(0);
})();