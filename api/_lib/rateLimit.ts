import type { VercelRequest, VercelResponse } from "@vercel/node"
import { createHash } from "node:crypto"

interface RateLimitOptions {
	scope: string
	maxRequests: number
	windowMinutes: number
	resourceKey?: string
	errorMessage: string
}

interface SqlClient {
	(
		strings: TemplateStringsArray,
		...values: unknown[]
	): Promise<Array<Record<string, unknown>>>
}

function getClientIp(req: VercelRequest) {
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

function hashIdentifier(value: string) {
	const salt = process.env.AUTH_SECRET || "road-rules-rate-limit"
	return createHash("sha256").update(`${salt}:${value}`).digest("hex")
}

function getBucketWindow(windowMinutes: number) {
	const windowMs = windowMinutes * 60 * 1000
	const now = Date.now()
	const bucketStart = new Date(Math.floor(now / windowMs) * windowMs)
	const bucketEnd = new Date(bucketStart.getTime() + windowMs)

	return { bucketStart, bucketEnd }
}

function setRateLimitHeaders(
	res: VercelResponse,
	maxRequests: number,
	remaining: number,
	retryAfterSeconds: number
) {
	res.setHeader("X-RateLimit-Limit", String(maxRequests))
	res.setHeader("X-RateLimit-Remaining", String(Math.max(0, remaining)))
	res.setHeader("Retry-After", String(Math.max(1, retryAfterSeconds)))
}

export async function enforceRateLimit(
	sql: SqlClient,
	req: VercelRequest,
	res: VercelResponse,
	options: RateLimitOptions
) {
	const { bucketStart, bucketEnd } = getBucketWindow(options.windowMinutes)
	const userAgent =
		typeof req.headers["user-agent"] === "string" ? req.headers["user-agent"] : "unknown"
	const identifier = hashIdentifier(
		[getClientIp(req), userAgent, options.resourceKey || "global"].join("|")
	)

	try {
		await sql`
			DELETE FROM request_rate_limits
			WHERE expires_at < NOW()
		`

		const rows = await sql`
			INSERT INTO request_rate_limits (scope, identifier_hash, bucket_start, hits, expires_at)
			VALUES (${options.scope}, ${identifier}, ${bucketStart.toISOString()}, 1, ${bucketEnd.toISOString()})
			ON CONFLICT (scope, identifier_hash, bucket_start)
			DO UPDATE SET hits = request_rate_limits.hits + 1, expires_at = EXCLUDED.expires_at
			RETURNING hits
		`

		const hits = Number(rows[0]?.hits || 0)
		const remaining = options.maxRequests - hits
		const retryAfterSeconds = Math.ceil((bucketEnd.getTime() - Date.now()) / 1000)

		setRateLimitHeaders(res, options.maxRequests, remaining, retryAfterSeconds)

		if (hits > options.maxRequests) {
			res.status(429).json({ error: options.errorMessage })
			return false
		}

		return true
	} catch (error: any) {
		if (
			typeof error?.message === "string" &&
			error.message.includes('relation "request_rate_limits" does not exist')
		) {
			console.warn(
				"request_rate_limits table is missing; rate limiting is temporarily bypassed"
			)
			return true
		}

		throw error
	}
}
