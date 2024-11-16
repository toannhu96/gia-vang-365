export interface DojiGoldPrice {
  name: string;
  key: string;
  buy?: number;
  sell?: number;
}

export interface PriceList {
  dateTime: Date;
  prices: DojiGoldPrice[];
}

export interface DojiResponse {
  currency: PriceList;
  jewelry: PriceList;
}
