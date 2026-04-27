function formatNumber(value: number, fractionDigits = 0): string {
  const fixed = value.toFixed(fractionDigits);
  const [intPart, fracPart] = fixed.split(".");
  const withSep = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return fracPart ? `${withSep},${fracPart}` : withSep;
}

export function formatEUR(value: number): string {
  return `${formatNumber(value)} €`;
}

export function formatKM(value: number): string {
  return `${formatNumber(value)} KM`;
}

export function formatCHF(value: number): string {
  return `${formatNumber(value)} CHF`;
}

export function formatKg(value: number): string {
  return `${formatNumber(value, value % 1 === 0 ? 0 : 1)} kg`;
}

export function formatDate(input: string | Date): string {
  const date = typeof input === "string" ? new Date(input) : input;
  const d = String(date.getUTCDate()).padStart(2, "0");
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const y = date.getUTCFullYear();
  return `${d}.${m}.${y}.`;
}

export function formatDateTime(input: string | Date): string {
  const date = typeof input === "string" ? new Date(input) : input;
  const datePart = formatDate(date);
  const hh = String(date.getUTCHours()).padStart(2, "0");
  const mm = String(date.getUTCMinutes()).padStart(2, "0");
  return `${datePart} ${hh}:${mm}`;
}

export function formatCurrency(value: number, currency: "EUR" | "BAM" | "CHF"): string {
  switch (currency) {
    case "EUR":
      return formatEUR(value);
    case "BAM":
      return formatKM(value);
    case "CHF":
      return formatCHF(value);
  }
}
