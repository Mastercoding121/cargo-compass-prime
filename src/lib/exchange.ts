import axios from "axios";

const EXCHANGE_RATE_API_URL = "https://api.exchangerate-api.com/v4/latest/CNY";
const FALLBACK_RATE = 280;

export async function getLiveExchangeRate(): Promise<number> {
  try {
    const response = await axios.get(EXCHANGE_RATE_API_URL);
    const rate = response.data.rates.NGN;
    if (!rate) {
      throw new Error("NGN rate not found in API response");
    }
    console.log(`[Exchange Rate] Fetched live rate: 1 CNY = ${rate} NGN`);
    return rate;
  } catch (error) {
    console.warn(`[Exchange Rate] Failed to fetch live rate, using fallback: ${FALLBACK_RATE}`, error);
    return FALLBACK_RATE;
  }
}
