import { DojiResponse } from "../types/doji";
import dayjs from "dayjs";

export const formatGoldPrices = (data: DojiResponse): string => {
  const { jewelry } = data;
  const dateTime = dayjs(jewelry.dateTime).format("HH:mm:ss DD/MM/YYYY");

  let message = `<b>🏆 Giá vàng trong nước hôm nay</b>\n`;
  message += `<i>Cập nhật: ${dateTime}</i>\n\n`;

  message += `<b>💍 Kim loại quý</b>\n`;
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
