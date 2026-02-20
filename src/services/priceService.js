import { getSetting, setSetting as setSettingRepo } from "../repositories/settingsRepo.js";

const PRICING_KEY = "stars_pricing";

export const getPricingConfig = async () => {
  const setting = await getSetting(PRICING_KEY);
  if (!setting) {
    return {
      unitPrice: 100,
      minOrder: 50,
      maxOrder: 100000,
    };
  }
  return setting.value;
};

export const setPricingConfig = async (value) => {
  await setSettingRepo(PRICING_KEY, value);
};

export const calculatePrice = async (starsAmount) => {
  const pricing = await getPricingConfig();
  if (starsAmount < pricing.minOrder || starsAmount > pricing.maxOrder) {
    throw new Error("Jumlah Stars di luar batas minimal atau maksimal");
  }
  const total = pricing.unitPrice * starsAmount;
  return {
    unitPrice: pricing.unitPrice,
    totalPrice: total,
  };
};
