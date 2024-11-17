import { DojiResponse } from "../types/doji";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault("Asia/Ho_Chi_Minh");

export const formatGoldPrices = (data: DojiResponse): string => {
  const { jewelry } = data;
  const dateTime = dayjs(jewelry.dateTime).format("HH:mm:ss DD/MM/YYYY");

  let message = `<b>🧈 Giá vàng trong nước hôm nay</b>\n`;
  message += `<i>Cập nhật: ${dateTime}</i>\n\n`;

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
