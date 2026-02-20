export const mainMenuKeyboard = {
  reply_markup: {
    inline_keyboard: [
      [
        { text: "💫 Beli Stars", callback_data: "menu_buy" },
        { text: "💰 Cek Harga", callback_data: "menu_price" },
      ],
      [
        { text: "📦 Status Pesanan", callback_data: "menu_status" },
        { text: "👤 Akun Saya", callback_data: "menu_account" },
      ],
      [
        { text: "📜 Riwayat", callback_data: "menu_history" },
        { text: "📞 Bantuan", callback_data: "menu_help" },
      ],
    ],
  },
};

export const paymentMethodKeyboard = {
  reply_markup: {
    inline_keyboard: [
      [
        { text: "QRIS", callback_data: "pay_qris" },
        { text: "Dana", callback_data: "pay_dana" },
      ],
      [
        { text: "OVO", callback_data: "pay_ovo" },
        { text: "GoPay", callback_data: "pay_gopay" },
      ],
      [
        { text: "Transfer Bank", callback_data: "pay_bank" },
      ],
      [{ text: "🔙 Kembali", callback_data: "back_main" }],
    ],
  },
};

