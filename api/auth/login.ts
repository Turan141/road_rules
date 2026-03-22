import type { VercelRequest, VercelResponse } from "@vercel/node"
import { neon } from "@neondatabase/serverless"
import {
	authenticateAdmin,
	createAdminSessionCookie,
	getAuthConfigStatus,
	isAuthConfigured
} from "../_lib/auth.js"
import {
	checkAdminLoginCooldown,
	clearAdminLoginCooldown,
	recordFailedAdminLogin
} from "../_lib/adminLoginCooldown.js"
import { enforceRateLimit } from "../_lib/rateLimit.js"

const FAILED_LOGIN_DELAY_MS = 900

function delay(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms))
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
	res.setHeader("Cache-Control", "no-store")

	if (req.method === "OPTIONS") {
		return res.status(200).end()
	}

	if (req.method !== "POST") {
		res.setHeader("Allow", ["POST"])
		return res.status(405).end(`Method ${req.method} Not Allowed`)
	}

	if (!isAuthConfigured()) {
		const status = getAuthConfigStatus()
		return res.status(503).json({
			error: "Admin auth is not configured",
			missing: status.missing,
			hasAdminSecret: status.hasAdminSecret,
			hasAuthSecretAlias: status.hasAuthSecretAlias
		})
	}

	const email = typeof req.body?.email === "string" ? req.body.email.trim() : ""
	const password = typeof req.body?.password === "string" ? req.body.password : ""
	const configuredAdminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase() || ""
	const normalizedEmail = email.toLowerCase()
	const isRealAdminAccountAttempt =
		normalizedEmail === configuredAdminEmail && configuredAdminEmail !== ""

	if (process.env.DATABASE_URL) {
		const sql = neon(process.env.DATABASE_URL)

		const isAllowedByIp = await enforceRateLimit(sql, req, res, {
			scope: "admin-login-ip",
			maxRequests: 6,
			windowMinutes: 15,
			errorMessage: "Too many login attempts. Please try again later."
		})
		if (!isAllowedByIp) {
			return
		}

		const isAllowedByEmail = await enforceRateLimit(sql, req, res, {
			scope: "admin-login-email",
			maxRequests: 5,
			windowMinutes: 30,
			resourceKey: `email:${normalizedEmail || "unknown"}`,
			errorMessage: "This admin account is temporarily locked. Please try again later."
		})
		if (!isAllowedByEmail) {
			return
		}

		if (isRealAdminAccountAttempt) {
			const cooldownStatus = await checkAdminLoginCooldown(sql, res, normalizedEmail)
			if (!cooldownStatus.ok) {
				return res.status(429).json({ error: cooldownStatus.error })
			}
		}
	}

	const authResult = authenticateAdmin(email, password)

	if (!authResult.ok) {
		if (process.env.DATABASE_URL && isRealAdminAccountAttempt) {
			const sql = neon(process.env.DATABASE_URL)
			await recordFailedAdminLogin(sql, normalizedEmail)
		}

		await delay(FAILED_LOGIN_DELAY_MS)
		return res.status(401).json({ error: "Invalid email or password" })
	}

	if (process.env.DATABASE_URL && isRealAdminAccountAttempt) {
		const sql = neon(process.env.DATABASE_URL)
		await clearAdminLoginCooldown(sql, normalizedEmail)
	}

	res.setHeader("Set-Cookie", createAdminSessionCookie(email, req.headers["user-agent"]))
	return res.status(200).json({ authenticated: true, role: "admin" })
}
