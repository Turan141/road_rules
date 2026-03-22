import type { VercelRequest, VercelResponse } from "@vercel/node"
import { createHmac, timingSafeEqual } from "node:crypto"

const SESSION_COOKIE_NAME = "road_rules_admin_session"
const SESSION_TTL_SECONDS = 60 * 60 * 4

interface AdminSession {
	email: string
	expiresAt: number
	userAgentHash: string
}

interface AuthConfigStatus {
	isConfigured: boolean
	missing: string[]
	hasAdminSecret: boolean
	hasAuthSecretAlias: boolean
}

function parseCookies(cookieHeader?: string) {
	if (!cookieHeader) {
		return {}
	}

	return cookieHeader.split(";").reduce<Record<string, string>>((cookies, chunk) => {
		const [rawName, ...rawValueParts] = chunk.trim().split("=")
		if (!rawName || rawValueParts.length === 0) {
			return cookies
		}

		cookies[rawName] = decodeURIComponent(rawValueParts.join("="))
		return cookies
	}, {})
}

function signToken(payload: string, secret: string) {
	return createHmac("sha256", secret).update(payload).digest("base64url")
}

function getUserAgent(requestUserAgent?: string) {
	return typeof requestUserAgent === "string" && requestUserAgent.trim()
		? requestUserAgent.trim()
		: "unknown"
}

function hashUserAgent(userAgent: string, secret: string) {
	return createHmac("sha256", secret).update(`ua:${userAgent}`).digest("base64url")
}

function safeCompareStrings(left: string, right: string) {
	const leftBuffer = Buffer.from(left)
	const rightBuffer = Buffer.from(right)
	if (leftBuffer.length !== rightBuffer.length) {
		return false
	}

	return timingSafeEqual(leftBuffer, rightBuffer)
}

function getAuthConfig() {
	const adminEmail = process.env.ADMIN_EMAIL
	const adminPassword = process.env.ADMIN_PASSWORD
	const authSecret = process.env.ADMIN_SECRET || process.env.AUTH_SECRET

	if (!adminEmail || !adminPassword || !authSecret) {
		return null
	}

	return { adminEmail, adminPassword, authSecret }
}

export function getAuthConfigStatus(): AuthConfigStatus {
	const hasAdminEmail = Boolean(process.env.ADMIN_EMAIL)
	const hasAdminPassword = Boolean(process.env.ADMIN_PASSWORD)
	const hasAdminSecret = Boolean(process.env.ADMIN_SECRET)
	const hasAuthSecretAlias = Boolean(process.env.AUTH_SECRET)
	const missing: string[] = []

	if (!hasAdminEmail) {
		missing.push("ADMIN_EMAIL")
	}

	if (!hasAdminPassword) {
		missing.push("ADMIN_PASSWORD")
	}

	if (!hasAdminSecret && !hasAuthSecretAlias) {
		missing.push("ADMIN_SECRET or AUTH_SECRET")
	}

	return {
		isConfigured: missing.length === 0,
		missing,
		hasAdminSecret,
		hasAuthSecretAlias
	}
}

function isSecureCookie() {
	return process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production"
}

function serializeCookie(token: string, maxAgeSeconds: number) {
	const secureDirective = isSecureCookie() ? "; Secure" : ""
	return `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}; HttpOnly; Path=/; SameSite=Strict; Max-Age=${maxAgeSeconds}${secureDirective}`
}

function decodeSessionToken(token: string, secret: string, requestUserAgent?: string): AdminSession | null {
	const [encodedPayload, signature] = token.split(".")
	if (!encodedPayload || !signature) {
		return null
	}

	const expectedSignature = signToken(encodedPayload, secret)
	const providedBuffer = Buffer.from(signature)
	const expectedBuffer = Buffer.from(expectedSignature)

	if (
		providedBuffer.length !== expectedBuffer.length ||
		!timingSafeEqual(providedBuffer, expectedBuffer)
	) {
		return null
	}

	try {
		const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8"))
		if (
			typeof payload?.email !== "string" ||
			typeof payload?.expiresAt !== "number" ||
			typeof payload?.userAgentHash !== "string" ||
			payload.expiresAt <= Date.now()
		) {
			return null
		}

		const expectedUserAgentHash = hashUserAgent(getUserAgent(requestUserAgent), secret)
		if (!safeCompareStrings(payload.userAgentHash, expectedUserAgentHash)) {
			return null
		}

		return payload as AdminSession
	} catch {
		return null
	}
}

export function isAuthConfigured() {
	return getAuthConfigStatus().isConfigured
}

export function authenticateAdmin(email: string, password: string) {
	const config = getAuthConfig()
	if (!config) {
		return { ok: false, reason: "Admin auth is not configured" }
	}

	if (
		!safeCompareStrings(email, config.adminEmail) ||
		!safeCompareStrings(password, config.adminPassword)
	) {
		return { ok: false, reason: "Invalid email or password" }
	}

	return { ok: true }
}

export function createAdminSessionCookie(email: string, requestUserAgent?: string) {
	const config = getAuthConfig()
	if (!config) {
		throw new Error("Admin auth is not configured")
	}

	const session: AdminSession = {
		email,
		expiresAt: Date.now() + SESSION_TTL_SECONDS * 1000,
		userAgentHash: hashUserAgent(getUserAgent(requestUserAgent), config.authSecret)
	}
	const encodedPayload = Buffer.from(JSON.stringify(session), "utf8").toString(
		"base64url"
	)
	const signature = signToken(encodedPayload, config.authSecret)

	return serializeCookie(`${encodedPayload}.${signature}`, SESSION_TTL_SECONDS)
}

export function clearAdminSessionCookie() {
	return serializeCookie("", 0)
}

export function getAdminSession(req: VercelRequest) {
	const config = getAuthConfig()
	if (!config) {
		return null
	}

	const cookies = parseCookies(req.headers.cookie)
	const token = cookies[SESSION_COOKIE_NAME]
	if (!token) {
		return null
	}

	return decodeSessionToken(token, config.authSecret, req.headers["user-agent"])
}

export function requireAdminSession(req: VercelRequest, res: VercelResponse) {
	const session = getAdminSession(req)
	if (!session) {
		res.status(401).json({ error: "Admin authorization required" })
		return null
	}

	return session
}
