export type EnvCategory =
  | "Storage"
  | "Authentication"
  | "Payments"
  | "Configuration"
  | "Analytics"
  | "External"
  | "Misc";

const firstPartyPrefixes = ["NEXT_PUBLIC_", "BETTER_", "ENV_NEW_"];

const externalPrefixes = [
  "AWS_",
  "SENDGRID",
  "RESEND",
  "MAILGUN",
  "UPSTASH_",
  "VERCEL_",
  "CLOUDFLARE_",
  "SUPABASE_",
];

export function classifyEnvVar(key: string, value: string): EnvCategory {
  const k = key.toUpperCase();
  const v = value ?? "";

  if (k === "DATABASE_URL" || k.endsWith("_DATABASE_URL") || k.endsWith("_DB_URL")) {
    return "Storage";
  }

  if (k.startsWith("BETTER_AUTH_")) {
    return "Authentication";
  }

  if (v.startsWith("sk_live") || v.startsWith("sk_test") || k.includes("STRIPE_SECRET")) {
    return "Payments";
  }
  
  if (v.startsWith("pk_live") || v.startsWith("pk_test") || k.includes("STRIPE_PUBLISHABLE")) {
    return "Payments";
  }

  if (k.startsWith("NEXT_PUBLIC_")) {
    return "Configuration";
  }

  if (k.includes("POSTHOG")) {
    return "Analytics";
  }

  const isFirstParty = firstPartyPrefixes.some((p) => k.startsWith(p));
  const looksExternal = externalPrefixes.some((p) => k.startsWith(p));

  if (!isFirstParty && looksExternal) {
    return "External";
  }

  return isFirstParty ? "Configuration" : "Misc";
}

