import type { Context } from '@better-env/api/';
import { grim } from '@better-env/dev-logger';

const { log } = grim();

export function getClientIP(ctx: Context): string {
  const clientIP = ctx.clientIP || 'unknown';
  
  log("[getClientIP] Client IP from context:", clientIP);
  
  return clientIP;
} 