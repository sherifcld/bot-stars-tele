import axios from "axios";
import { config } from "../../config.js";
import { createPayment, updatePaymentById, findPaymentByProviderRef } from "../../repositories/paymentsRepo.js";
import { logger } from "../../logger.js";

const BASE_URL = "https://app.pakasir.com/api";

export const createPakasirTransaction = async ({ orderCode, amount, method }) => {
  const body = {
    project: config.payment.pakasir.projectSlug,
    order_id: orderCode,
    amount,
    api_key: config.payment.pakasir.apiKey,
  };

  const url = `${BASE_URL}/transactioncreate/${method.toLowerCase()}`;

  const res = await axios.post(url, body, {
    headers: {
      "Content-Type": "application/json",
    },
  });

  const data = res.data;
  if (!data || !data.payment) {
    logger.error({ data }, "Pakasir create transaction failed");
    throw new Error("Gagal membuat transaksi Pakasir");
  }

  const payment = await createPayment({
    provider: "pakasir",
    providerReference: data.payment.payment_number || data.payment.payment_url || orderCode,
    method: data.payment.payment_method,
    amount: data.payment.total_payment,
    status: "UNPAID",
    rawRequest: body,
  });

  return {
    payment,
    checkoutUrl: data.payment.payment_url || null,
    paymentNumber: data.payment.payment_number,
    expiredAt: data.payment.expired_at,
  };
};

export const handlePakasirCallback = async (payload) => {
  const { amount, order_id, project, status, payment_method, completed_at } = payload;

  if (project !== config.payment.pakasir.projectSlug) {
    throw new Error("Project slug tidak cocok");
  }

  const payment = await findPaymentByProviderRef("pakasir", order_id);
  if (!payment) {
    logger.error({ order_id }, "Payment not found for Pakasir callback");
    return null;
  }

  const newStatus = status === "completed" ? "PAID" : status.toUpperCase();

  const updated = await updatePaymentById(payment.id, {
    status: newStatus,
    rawCallback: payload,
  });

  return updated;
};