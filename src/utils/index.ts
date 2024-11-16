export function parseFormattedNumber(formattedString: string) {
  const numberString = formattedString.replace(/,/g, "");
  return numberString ? Number(numberString) : undefined;
}
