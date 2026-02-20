import { config } from "../config.js";
import { findRecentOrders, countOrders, sumTotalPrice } from "../repositories/ordersRepo.js";
import { setSetting } from "../repositories/settingsRepo.js";
import { getRecentLogs } from "../repositories/logsRepo.js";

const isAdmin = (userId) => config.adminIds.includes(userId);

export const attachAdminHandlers = (bot) => {
  bot.onText(/\/admin\b/, async (msg) => {
    const chatId = msg.chat.id;
    const fromId = msg.from.id;
    if (!isAdmin(fromId)) {
      return;
    }
    bot.sendMessage(chatId, "Panel Admin:", {
      reply_markup: {
        inline_keyboard: [
          [
            { text: "📦 Order Terbaru", callback_data: "admin_orders" },
            { text: "💰 Ubah Harga", callback_data: "admin_price" },
          ],
          [
            { text: "📊 Statistik", callback_data: "admin_stats" },
            { text: "📜 Log Error", callback_data: "admin_logs" },
          ],
        ],
      },
    });
  });

  bot.on("callback_query", async (query) => {
    const chatId = query.message.chat.id;
    const data = query.data;
    const fromId = query.from.id;
    if (!data.startsWith("admin_")) {
      return;
    }
    if (!isAdmin(fromId)) {
      return;
    }

    if (data === "admin_orders") {
      const orders = await findRecentOrders(20);
      if (orders.length === 0) {
        bot.sendMessage(chatId, "Tidak ada order.");
        return;
      }
      const text = orders
        .map(
          (o) =>
            `${o.createdAt.toLocaleString("id-ID")} - ${o.orderCode} - ${o.starsAmount} Stars - ${o.status} - Rp${o.totalPrice.toLocaleString(
              "id-ID"
            )}`
        )
        .join("\n");
      bot.sendMessage(chatId, text);
    }

    if (data === "admin_stats") {
      const totalOrders = await countOrders();
      const totalSuccess = await countOrders({ status: "SELESAI" });
      const totalRevenue = await sumTotalPrice({ status: "SELESAI" });
      bot.sendMessage(
        chatId,
        `Statistik:\nTotal order: ${totalOrders}\nOrder sukses: ${totalSuccess}\nTotal omzet: Rp${totalRevenue.toLocaleString(
          "id-ID"
        )}`
      );
    }

    if (data === "admin_logs") {
      const logs = await getRecentLogs(20);
      if (logs.length === 0) {
        bot.sendMessage(chatId, "Belum ada log.");
        return;
      }
      const text = logs
        .map((l) => `[${l.level}] ${l.createdAt.toISOString()} ${l.message}`)
        .join("\n");
      bot.sendMessage(chatId, text.slice(0, 3500));
    }
  });

  bot.onText(/\/setprice (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const fromId = msg.from.id;
    if (!isAdmin(fromId)) {
      return;
    }
    const parts = match[1].split(" ").map((p) => p.trim());
    if (parts.length < 3) {
      bot.sendMessage(chatId, "Format: /setprice <harga_per_star> <min_order> <max_order>");
      return;
    }
    const unitPrice = parseInt(parts[0], 10);
    const minOrder = parseInt(parts[1], 10);
    const maxOrder = parseInt(parts[2], 10);
    if (!unitPrice || !minOrder || !maxOrder) {
      bot.sendMessage(chatId, "Nilai tidak valid.");
      return;
    }
    await setSetting("stars_pricing", { unitPrice, minOrder, maxOrder });
    bot.sendMessage(
      chatId,
      `Harga diperbarui:\nHarga per Star: Rp${unitPrice}\nMin order: ${minOrder}\nMax order: ${maxOrder}`
    );
  });
};
