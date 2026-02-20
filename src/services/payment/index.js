import { config } from "../../config.js";
import { createPakasirTransaction, handlePakasirCallback } from "./pakasirProvider.js";

export const PaymentProvider = {
  async createInvoice(params) {
    if (config.payment.provider === "pakasir") {
      const rawMethod = (params.method || config.payment.pakasir.defaultMethod || "qris").toLowerCase();
      const allowed = [
        "all",
        "qris",
        "cimb_niaga_va",
        "bni_va",
        "qris",
        "sampoerna_va",
        "bnc_va",
        "maybank_va",
        "permata_va",
        "atm_bersama_va",
        "artha_graha_va",
        "bri_va",
        "paypal",
      ];
      const method = allowed.includes(rawMethod) ? rawMethod : (config.payment.pakasir.defaultMethod || "qris");
      return createPakasirTransaction({
        orderCode: params.orderCode,
        amount: params.amount,
        method,
      });
    }
    throw new Error("Payment provider tidak dikenali");
  },

  async handleCallback(provider, body) {
    if (provider === "pakasir") {
      return handlePakasirCallback(body);
    }
    throw new Error("Payment provider tidak dikenali");
  },
};

