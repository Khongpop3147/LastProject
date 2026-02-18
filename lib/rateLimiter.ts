/**
 * lib/rateLimiter.ts
 * In-memory rate limiter สำหรับ API routes
 * จำกัดจำนวน request ต่อ IP ในช่วงเวลาที่กำหนด
 */

interface RateLimitEntry {
    count: number;
    resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// ล้าง entries ที่หมดอายุแล้วทุก 5 นาที เพื่อป้องกัน memory leak
setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
        if (entry.resetAt <= now) {
            store.delete(key);
        }
    }
}, 5 * 60 * 1000);

export interface RateLimitOptions {
    /** จำนวน request สูงสุดที่อนุญาตใน window */
    limit: number;
    /** ระยะเวลา window เป็นวินาที */
    windowSec: number;
}

export interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    resetAt: number;
}

/**
 * ตรวจสอบ rate limit สำหรับ key ที่กำหนด (เช่น IP address)
 */
export function checkRateLimit(
    key: string,
    options: RateLimitOptions
): RateLimitResult {
    const now = Date.now();
    const windowMs = options.windowSec * 1000;

    let entry = store.get(key);

    if (!entry || entry.resetAt <= now) {
        // เริ่ม window ใหม่
        entry = { count: 1, resetAt: now + windowMs };
        store.set(key, entry);
        return { allowed: true, remaining: options.limit - 1, resetAt: entry.resetAt };
    }

    entry.count += 1;

    if (entry.count > options.limit) {
        return { allowed: false, remaining: 0, resetAt: entry.resetAt };
    }

    return {
        allowed: true,
        remaining: options.limit - entry.count,
        resetAt: entry.resetAt,
    };
}

/**
 * ดึง IP address จาก request
 */
export function getClientIp(req: { headers: Record<string, string | string[] | undefined>; socket?: { remoteAddress?: string } }): string {
    const forwarded = req.headers["x-forwarded-for"];
    if (typeof forwarded === "string") {
        return forwarded.split(",")[0].trim();
    }
    return req.socket?.remoteAddress ?? "unknown";
}
