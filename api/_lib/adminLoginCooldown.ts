import type { VercelResponse } from "@vercel/node"
import { createHash } from "node:crypto"

const ADMIN_LOGIN_MAX_FAILURES = 5
const ADMIN_LOGIN_COOLDOWN_MINUTES = 30
const ADMIN_LOGIN_FAILURE_RESET_MINUTES = 180

interface SqlClient {
	(
		strings: TemplateStringsArray,
		...values: unknown[]
	): Promise<Array<Record<string, unknown>>>
}

function getCooldownSalt() {
	return process.env.ADMIN_SECRET || process.env.AUTH_SECRET || "road-rules-admin-lock"
}

function hashAdminAccountKey(email: string) {
	return createHash("sha256")
		.update(`${getCooldownSalt()}:${email.trim().toLowerCase()}`)
		.digest("hex")
}

function setRetryAfterHeader(res: VercelResponse, retryAfterSeconds: number) {
	res.setHeader("Retry-After", String(Math.max(1, retryAfterSeconds)))
}

export async function checkAdminLoginCooldown(
	sql: SqlClient,
	res: VercelResponse,
	email: string
) {
	const accountKey = hashAdminAccountKey(email)

	try {
		const rows = await sql`
			SELECT failure_count, lock_until
			FROM admin_login_cooldowns
			WHERE account_key = ${accountKey}
			LIMIT 1
		`

		const row = rows[0]
		if (!row?.lock_until) {
			return { ok: true as const }
		}

		const lockUntil = new Date(String(row.lock_until))
		if (Number.isNaN(lockUntil.getTime()) || lockUntil.getTime() <= Date.now()) {
			return { ok: true as const }
		}

		const retryAfterSeconds = Math.ceil((lockUntil.getTime() - Date.now()) / 1000)
		setRetryAfterHeader(res, retryAfterSeconds)
		return {
			ok: false as const,
			retryAfterSeconds,
			error:
				"This admin account is temporarily locked after repeated failed logins. Please try again later."
		}
	} catch (error: any) {
		if (
			typeof error?.message === "string" &&
			error.message.includes('relation "admin_login_cooldowns" does not exist')
		) {
			console.warn(
				"admin_login_cooldowns table is missing; account cooldown protection is temporarily bypassed"
			)
			return { ok: true as const }
		}

		throw error
	}
}

export async function recordFailedAdminLogin(sql: SqlClient, email: string) {
	const accountKey = hashAdminAccountKey(email)

	try {
		const existingRows = await sql`
			SELECT failure_count, last_failed_at, lock_until
			FROM admin_login_cooldowns
			WHERE account_key = ${accountKey}
			LIMIT 1
		`

		const existingRow = existingRows[0]
		let nextFailureCount = 1

		if (existingRow) {
			const lastFailedAt = existingRow.last_failed_at
				? new Date(String(existingRow.last_failed_at))
				: null
			const lockUntil = existingRow.lock_until
				? new Date(String(existingRow.lock_until))
				: null

			const shouldResetFailures =
				(lockUntil &&
					!Number.isNaN(lockUntil.getTime()) &&
					lockUntil.getTime() <= Date.now()) ||
				(lastFailedAt &&
					!Number.isNaN(lastFailedAt.getTime()) &&
					Date.now() - lastFailedAt.getTime() >
						ADMIN_LOGIN_FAILURE_RESET_MINUTES * 60 * 1000)

			nextFailureCount = shouldResetFailures
				? 1
				: Number(existingRow.failure_count || 0) + 1
		}

		const lockUntil =
			nextFailureCount >= ADMIN_LOGIN_MAX_FAILURES
				? new Date(Date.now() + ADMIN_LOGIN_COOLDOWN_MINUTES * 60 * 1000).toISOString()
				: null

		await sql`
			INSERT INTO admin_login_cooldowns (account_key, failure_count, last_failed_at, lock_until)
			VALUES (${accountKey}, ${nextFailureCount}, NOW(), ${lockUntil})
			ON CONFLICT (account_key)
			DO UPDATE SET
				failure_count = EXCLUDED.failure_count,
				last_failed_at = NOW(),
				lock_until = EXCLUDED.lock_until
		`
	} catch (error: any) {
		if (
			typeof error?.message === "string" &&
			error.message.includes('relation "admin_login_cooldowns" does not exist')
		) {
			console.warn(
				"admin_login_cooldowns table is missing; account cooldown protection is temporarily bypassed"
			)
			return
		}

		throw error
	}
}

export async function clearAdminLoginCooldown(sql: SqlClient, email: string) {
	const accountKey = hashAdminAccountKey(email)

	try {
		await sql`
			DELETE FROM admin_login_cooldowns
			WHERE account_key = ${accountKey}
		`
	} catch (error: any) {
		if (
			typeof error?.message === "string" &&
			error.message.includes('relation "admin_login_cooldowns" does not exist')
		) {
			console.warn(
				"admin_login_cooldowns table is missing; account cooldown protection is temporarily bypassed"
			)
			return
		}

		throw error
	}
}
