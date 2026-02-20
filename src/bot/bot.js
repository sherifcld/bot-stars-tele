import TelegramBot from "node-telegram-bot-api";
import QRCode from "qrcode";
import { config } from "../config.js";
import { logger } from "../logger.js";
import { mainMenuKeyboard, paymentMethodKeyboard } from "./keyboards.js";
import { setUserState, getUserState, clearUserState } from "./flowState.js";
import { calculatePrice, getPricingConfig } from "../services/priceService.js";
import { PaymentProvider } from "../services/payment/index.js";
import { canCreateOrder } from "./rateLimiter.js";
import { attachAdminHandlers } from "./admin.js";
import { findByTelegramId, createUser, updateUser } from "../repositories/usersRepo.js";
import {
  createOrder,
  updateOrderById,
  findOrdersByUserId,
} from "../repositories/ordersRepo.js";

export const createBot = () => {
  const bot = new TelegramBot(config.botToken, { polling: true });

  bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    await ensureUser(msg.from);
    bot.sendMessage(
      chatId,
      "Selamat datang di Bot Penjualan Telegram Stars.\nSilakan pilih menu:",
      mainMenuKeyboard
    );
  });

  bot.on("callback_query", async (query) => {
    const chatId = query.message.chat.id;
    const data = query.data;

    if (data === "menu_buy") {
      if (!canCreateOrder(query.from.id)) {
        bot.sendMessage(chatId, "Terlalu sering membuat pesanan. Silakan coba lagi dalam 1 menit.");
        return;
      }
      setUserState(chatId, { step: "ASK_STARS_AMOUNT" });
      bot.sendMessage(chatId, "Masukkan jumlah Stars yang ingin dibeli (contoh: 50, 100, 500):");
      return;
    }

    if (data === "menu_price") {
      const pricing = await getPricingConfig();
      bot.sendMessage(chatId, `Harga saat ini: ${pricing.unitPrice} IDR per 1 Star\nMin order: ${pricing.minOrder} Stars`);
      return;
    }

    if (data === "menu_status") {
      const user = await ensureUser(query.from);
      const orders = await findOrdersByUserId(user.id, 5);
      if (orders.length === 0) {
        bot.sendMessage(chatId, "Belum ada pesanan.");
        return;
      }
      const text = orders
        .map(
          (o) =>
            `${o.orderCode} - ${o.starsAmount} Stars - ${o.status} - Rp${o.totalPrice.toLocaleString("id-ID")}`
        )
        .join("\n");
      bot.sendMessage(chatId, text);
      return;
    }

    if (data === "menu_account") {
      const user = await ensureUser(query.from);
      bot.sendMessage(
        chatId,
        `ID: ${user.telegramId}\nTotal pembelian: Rp${user.totalSpent.toLocaleString(
          "id-ID"
        )}\nJumlah order: ${user.ordersCount}\nSaldo: ${user.balance}`
      );
      return;
    }

    if (data === "menu_history") {
      const user = await ensureUser(query.from);
      const orders = await findOrdersByUserId(user.id, 10);
      if (orders.length === 0) {
        bot.sendMessage(chatId, "Belum ada riwayat pesanan.");
        return;
      }
      const text = orders
        .map(
          (o) =>
            `${o.createdAt.toLocaleString("id-ID")} - ${o.orderCode} - ${o.starsAmount} Stars - ${o.status}`
        )
        .join("\n");
      bot.sendMessage(chatId, text);
      return;
    }

    if (data === "menu_help") {
      bot.sendMessage(
        chatId,
        "Bantuan:\n1. Pilih menu Beli Stars untuk membuat pesanan.\n2. Lakukan pembayaran sesuai instruksi.\n3. Stars akan dikirim otomatis setelah pembayaran terverifikasi."
      );
      return;
    }

    if (data === "back_main") {
      clearUserState(chatId);
      bot.sendMessage(chatId, "Kembali ke menu utama:", mainMenuKeyboard);
      return;
    }

    if (data.startsWith("pay_")) {
      const method = data.replace("pay_", "").toUpperCase();
      const state = getUserState(chatId);
      if (!state || state.step !== "CHOOSE_PAYMENT_METHOD") {
        bot.sendMessage(chatId, "Session tidak ditemukan. Silakan mulai ulang /start.");
        return;
      }
      try {
        const user = await ensureUser(query.from);
        const { unitPrice, totalPrice } = await calculatePrice(state.starsAmount);
        const orderCode = `ORD-${Date.now()}`;

        const order = await createOrder({
          userId: user.id,
          orderCode,
          starsAmount: state.starsAmount,
          unitPrice,
          totalPrice,
          targetUsername: state.targetUsername,
          status: "MENUNGGU_PEMBAYARAN",
          paymentMethod: method,
        });

        const { payment, checkoutUrl, paymentNumber, expiredAt } = await PaymentProvider.createInvoice({
          orderCode,
          amount: totalPrice,
          customerName: `${query.from.first_name || ""} ${query.from.last_name || ""}`.trim(),
          customerEmail: "",
          method,
        });

        await updateOrderById(order.id, { paymentId: payment.id });

        clearUserState(chatId);

        const baseCaption = `Order berhasil dibuat.\nKode: ${orderCode}\nJumlah: ${state.starsAmount} Stars\nTotal: Rp${totalPrice.toLocaleString(
          "id-ID"
        )}`;

        if (payment.method === "qris" && paymentNumber) {
          const qrBuffer = await QRCode.toBuffer(paymentNumber);
          const expiredText = expiredAt
            ? new Date(expiredAt).toLocaleString("id-ID")
            : "-";
          await bot.sendPhoto(chatId, qrBuffer, {
            caption: `${baseCaption}\n\nSilakan SCAN QRIS berikut untuk pembayaran.\nJatuh tempo: ${expiredText}\n\nStatus akan otomatis terupdate setelah pembayaran berhasil.`,
          });
        } else {
          await bot.sendMessage(
            chatId,
            `${baseCaption}\n\nSilakan lakukan pembayaran di link berikut:\n${
              checkoutUrl || "-"
            }\n\nStatus akan otomatis terupdate setelah pembayaran berhasil.`
          );
        }
      } catch (err) {
        logger.error({ err }, "Error create order");
        bot.sendMessage(chatId, "Terjadi kesalahan saat membuat order. Silakan coba lagi.");
      }
      return;
    }
  });

  bot.on("message", async (msg) => {
    const chatId = msg.chat.id;
    if (!msg.text || msg.text.startsWith("/")) {
      return;
    }
    const state = getUserState(chatId);
    if (!state) {
      return;
    }

    if (state.step === "ASK_STARS_AMOUNT") {
      const amount = parseInt(msg.text.trim(), 10);
      if (!amount || amount <= 0) {
        bot.sendMessage(chatId, "Format jumlah Stars tidak valid.");
        return;
      }
      try {
        const { unitPrice, totalPrice } = await calculatePrice(amount);
        setUserState(chatId, {
          step: "ASK_TARGET_USERNAME",
          starsAmount: amount,
        });
        bot.sendMessage(
          chatId,
          `Jumlah: ${amount} Stars\nHarga per Star: Rp${unitPrice.toLocaleString(
            "id-ID"
          )}\nTotal: Rp${totalPrice.toLocaleString(
          "id-ID"
          )}\n\nSekarang kirim username Telegram yang akan menerima Stars (contoh: @username):`
        );
      } catch (err) {
        bot.sendMessage(chatId, err.message);
      }
      return;
    }

    if (state.step === "ASK_TARGET_USERNAME") {
      const username = msg.text.trim();
      if (!/^@?[a-zA-Z0-9_]{5,32}$/.test(username)) {
        bot.sendMessage(chatId, "Username tidak valid. Contoh: @username (5-32 karakter, huruf/angka/underscore).");
        return;
      }
      setUserState(chatId, {
        ...state,
        step: "CHOOSE_PAYMENT_METHOD",
        targetUsername: username.startsWith("@") ? username.substring(1) : username,
      });
      bot.sendMessage(
        chatId,
        "Username penerima tersimpan.\nSilakan pilih metode pembayaran:",
        paymentMethodKeyboard
      );
      return;
    }
  });

  const ensureUser = async (from) => {
    const telegramId = from.id;
    let user = await findByTelegramId(telegramId);
    if (!user) {
      user = await createUser({
        telegramId,
        username: from.username,
        firstName: from.first_name,
        lastName: from.last_name,
      });
    }
    return user;
  };

  attachAdminHandlers(bot);

  logger.info("Telegram bot started with polling");
  return bot;
};

