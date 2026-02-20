import { TelegramClient, Api } from "telegram";
import { StringSession } from "telegram/sessions/index.js";
import { logger } from "../logger.js";
import { config } from "../config.js";

let client;
let clientReady = false;

const getClient = async () => {
  if (!client) {
    client = new TelegramClient(
      new StringSession(config.starsSender.session || ""),
      Number(config.starsSender.apiId),
      config.starsSender.apiHash,
      { connectionRetries: 5 }
    );
  }
  if (!clientReady) {
    await client.connect();
    clientReady = true;
  }
  return client;
};

export const sendStarsToUser = async ({ targetUsername, starsAmount, orderCode }) => {
  if (!targetUsername) {
    return { success: false };
  }

  const client = await getClient();
  const user = await client.getEntity(targetUsername.startsWith("@") ? targetUsername : `@${targetUsername}`);
  const gifts = await client.invoke(new Api.payments.GetStarGifts({}));
  const suitableGift = gifts.gifts.find((g) => Number(g.stars) >= starsAmount);
  if (!suitableGift) {
    logger.error({ starsAmount }, "No suitable gift for requested Stars");
    return { success: false };
  }

  const randomId = BigInt(Math.floor(Math.random() * Number.MAX_SAFE_INTEGER));

  const result = await client.invoke(
    new Api.payments.SendStars({
      peer: new Api.InputPeerUser({
        userId: user.id,
        accessHash: user.accessHash,
      }),
      gift: true,
      id: suitableGift.id,
      randomId,
    })
  );

  logger.info({ targetUsername, starsAmount, orderCode }, "Stars sent via MTProto");

  return {
    success: true,
    txId: String(randomId),
    raw: result,
  };
};

