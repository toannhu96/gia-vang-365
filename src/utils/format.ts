import { DojiResponse } from "../types/doji";
import dayjs from "dayjs";

export const formatGoldPrices = (data: DojiResponse): string => {
  const { currency, jewelry } = data;
  const dateTime = dayjs(jewelry.dateTime).format("HH:mm:ss DD/MM/YYYY");

  let message = `<b>🏆 Vietnamese Gold Prices</b>\n`;
  message += `<i>Updated: ${dateTime}</i>\n\n`;

  message += `<b>💵 Currency</b>\n`;
  message += `----------------------------------------\n`;
  currency.prices.forEach((price) => {
    message += `<b>${price.name}</b>\n`;
    message += `Buy: <code>${
      !price.buy ? "---" : Intl.NumberFormat("vi-VN").format(price.buy * 1000)
    }</code> | Sell: <code>${
      !price.sell ? "---" : Intl.NumberFormat("vi-VN").format(price.sell * 1000)
    }</code>\n`;
    message += `----------------------------------------\n`;
  });

  message += `\n<b>💍 Jewelry</b>\n`;
  message += `----------------------------------------\n`;
  jewelry.prices.forEach((price) => {
    if (price.name.includes("Giá Nguyên Liệu")) return;
    message += `<b>${price.name}</b>\n`;
    message += `Buy: <code>${
      !price.buy ? "---" : Intl.NumberFormat("vi-VN").format(price.buy * 1000)
    }</code> | Sell: <code>${
      !price.sell ? "---" : Intl.NumberFormat("vi-VN").format(price.sell * 1000)
    }</code>\n`;
    message += `----------------------------------------\n`;
  });

  return message;
};
