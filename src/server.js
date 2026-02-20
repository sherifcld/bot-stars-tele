import express from "express";
import { logger } from "./logger.js";
import { PaymentProvider } from "./services/payment/index.js";
import { sendStarsToUser } from "./services/starsSender.js";
import { findOrderByPaymentId, updateOrderById } from "./repositories/ordersRepo.js";
import { updateUser, findUserById } from "./repositories/usersRepo.js";

export const createServer = () => {
  const app = express();

  app.use(express.json());

  app.get("/", (req, res) => {
    res.send("Telegram Stars Bot is running");
  });

  app.post("/payments/:provider/callback", async (req, res) => {
    const provider = req.params.provider;
    try {
      const payment = await PaymentProvider.handleCallback(provider, req.body);
      const order = await findOrderByPaymentId(payment.id);
      if (!order) {
        logger.error({ paymentId: payment.id }, "Order not found for payment");
        return res.status(200).json({ success: true });
      }

      if (payment.status === "PAID" && !["SELESAI", "GAGAL"].includes(order.status)) {
        await updateOrderById(order.id, { status: "PROSES" });

        const result = await sendStarsToUser({
          targetUsername: order.targetUsername,
          starsAmount: order.starsAmount,
          orderCode: order.orderCode,
        });

        if (result.success) {
          await updateOrderById(order.id, { status: "SELESAI" });

          const user = await findUserById(order.userId);
          if (user) {
            const newTotalSpent = (user.totalSpent || 0) + order.totalPrice;
            const newOrdersCount = (user.ordersCount || 0) + 1;
            await updateUser(user.id, {
              totalSpent: newTotalSpent,
              ordersCount: newOrdersCount,
            });
          }
        } else {
          await updateOrderById(order.id, { status: "GAGAL" });
        }
      }

      res.status(200).json({ success: true });
    } catch (err) {
      logger.error({ err }, "Error handling payment callback");
      res.status(400).json({ success: false });
    }
  });

  return app;
};
