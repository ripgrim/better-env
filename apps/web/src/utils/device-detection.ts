export type DeviceType = "mobile" | "tablet" | "desktop";

export function getDeviceType(userAgent: string): DeviceType {
  const ua = userAgent.toLowerCase();
  const isTablet = /(ipad|tablet|android(?!.*mobile))/i.test(ua);
  const isMobile = /iphone|ipod|android.*mobile|windows phone|blackberry/i.test(ua);
  if (isTablet) return "tablet";
  if (isMobile) return "mobile";
  return "desktop";
}

