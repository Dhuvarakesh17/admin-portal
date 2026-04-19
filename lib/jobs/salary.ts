const INR_PER_LPA = 100000;

function toNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value !== "string") {
    return NaN;
  }

  const normalized = value
    .toLowerCase()
    .replace(/usd|\$/g, "")
    .replace(/inr|rs\.?|rupees?/g, "")
    .replace(/lpa|lakh|lakhs|ctc/g, "")
    .replace(/,/g, "")
    .trim();

  return Number.parseFloat(normalized);
}

function isDollarLike(value: unknown, currency?: string) {
  const source = String(value ?? "").toLowerCase();
  const normalizedCurrency = String(currency ?? "").toLowerCase();

  return (
    source.includes("$") ||
    source.includes("usd") ||
    normalizedCurrency === "usd" ||
    normalizedCurrency === "$"
  );
}

function annualAmountToLpa(value: number, valueLooksUsd: boolean) {
  if (value <= 0) return 0;

  // Legacy annual numeric values are normalized to LPA before rendering/saving.
  if (value >= 1000) {
    return valueLooksUsd ? value / 10000 : value / INR_PER_LPA;
  }

  return value;
}

export function normalizeToLpa(value: unknown, currency?: string) {
  const parsed = toNumber(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 0;
  }

  const looksUsd = isDollarLike(value, currency);
  return Number(annualAmountToLpa(parsed, looksUsd).toFixed(2));
}

export function toInrFromLpa(value: unknown) {
  const lpa = normalizeToLpa(value, "INR");
  if (lpa <= 0) {
    return 0;
  }

  return Math.round(lpa * INR_PER_LPA);
}

export function toLpaFromStored(value: unknown, currency?: string) {
  return normalizeToLpa(value, currency);
}

function formatLpaValue(value: number) {
  return Number.isInteger(value) ? `${value}` : value.toFixed(1);
}

export function formatLpaRange(min: unknown, max: unknown) {
  const minLpa = normalizeToLpa(min, "INR");
  const maxLpa = normalizeToLpa(max, "INR");

  if (minLpa <= 0 && maxLpa <= 0) {
    return "Salary based on experience";
  }

  if (minLpa > 0 && maxLpa > 0) {
    return `₹ ${formatLpaValue(minLpa)} - ${formatLpaValue(maxLpa)} LPA`;
  }

  if (minLpa > 0) {
    return `₹ ${formatLpaValue(minLpa)}+ LPA`;
  }

  return `Up to ₹ ${formatLpaValue(maxLpa)} LPA`;
}
