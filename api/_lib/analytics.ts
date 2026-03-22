import type { VercelRequest } from "@vercel/node"
import { createHash } from "node:crypto"

function getAnalyticsSecret() {
	return process.env.ADMIN_SECRET || process.env.AUTH_SECRET || "yolinfo-analytics"
}

export function getClientIp(req: VercelRequest) {
	const forwardedFor = req.headers["x-forwarded-for"]
	if (typeof forwardedFor === "string" && forwardedFor.trim()) {
		return forwardedFor.split(",")[0].trim()
	}

	const realIp = req.headers["x-real-ip"]
	if (typeof realIp === "string" && realIp.trim()) {
		return realIp.trim()
	}

	return "unknown"
}

export function hashAnalyticsValue(value: string) {
	return createHash("sha256")
		.update(`${getAnalyticsSecret()}:${value}`)
		.digest("hex")
}

export function validateAnalyticsToken(value: unknown, fieldName: string) {
	if (typeof value !== "string") {
		return { ok: false as const, error: `${fieldName} is required` }
	}

	const normalized = value.trim()
	if (!/^[a-zA-Z0-9_-]{12,128}$/.test(normalized)) {
		return { ok: false as const, error: `${fieldName} is invalid` }
	}

	return { ok: true as const, data: normalized }
}

export function validateAnalyticsPath(value: unknown) {
	if (typeof value !== "string") {
		return "/"
	}

	const normalized = value.trim()
	if (!normalized.startsWith("/") || normalized.length > 160) {
		return "/"
	}

	return normalized
}