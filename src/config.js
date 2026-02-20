export const config = {
  botToken: "8460338497:AAGm237oWFYhbdW5INPszqVJclW9tCXHhng",
  port: 3000,
  baseUrl: "https://your-domain.com",
  adminIds: [8096125818],
  payment: {
    provider: "pakasir",
    pakasir: {
      projectSlug: "sherif-payment",
      apiKey: "5kM3YYt3PrNZoKxAlo92UgBvYmoy1u4q",
      defaultMethod: "qris",
    },
  },
  starsSender: {
    mode: "userbot",
    apiId: "your_telegram_api_id",
    apiHash: "your_telegram_api_hash",
    session: "your_userbot_session_string",
  },
};
