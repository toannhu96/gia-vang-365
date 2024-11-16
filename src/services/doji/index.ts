import axios from "axios";
import axiosRetry from "axios-retry";
import { parseStringPromise } from "xml2js";
import { getOrSet } from "@config/redis";
import { parseFormattedNumber } from "@utils/index";
import { DojiResponse, DojiGoldPrice } from "../../types/doji";
import dayjs from "dayjs";

const dojiApi = axios.create({
  baseURL: "http://giavang.doji.vn/api/giavang",
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
  params: {
    api_key: "258fbd2a72ce8481089d88c678e9fe4f",
  },
  timeout: 30_000, // 30 seconds
});

axiosRetry(dojiApi, {
  retries: 2,
  retryCondition: (err: any) => {
    return (
      axiosRetry.isNetworkOrIdempotentRequestError(err) ||
      err?.response?.status === 429
    );
  },
  retryDelay: axiosRetry.exponentialDelay,
  onMaxRetryTimesExceeded: (err: any, retryCount: number) => {},
});

export const getDojiGoldPrices = async (): Promise<DojiResponse> => {
  return await getOrSet(
    "doji:gold-prices",
    async () => {
      const rawData = await dojiApi
        .get("/giavang")
        .then((res: any) => res.data);
      const result = await parseStringPromise(rawData);
      const goldList = result.GoldList;

      const parseRow = (row: any): DojiGoldPrice => ({
        name: row.$.Name,
        key: row.$.Key,
        buy: parseFormattedNumber(row.$.Buy),
        sell: parseFormattedNumber(row.$.Sell),
      });

      const current = dayjs().toDate();
      return {
        jewelry: {
          dateTime: current,
          prices: goldList.JewelryList[0].Row.map(parseRow),
        },
      } as DojiResponse;
    },
    5 * 60 // 5 mins
  );
};
