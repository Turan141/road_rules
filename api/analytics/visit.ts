import type { VercelRequest, VercelResponse } from "@vercel/node"
import { neon } from "@neondatabase/serverless"
import {
	getClientIp,
	hashAnalyticsValue,
	validateAnalyticsPath,
	validateAnalyticsToken
} from "../_lib/analytics.js"

export default async function handler(req: VercelRequest, res: VercelResponse) {
	res.setHeader("Cache-Control", "no-store")

	if (req.method === "OPTIONS") {
		return res.status(200).end()
	}

	if (req.method !== "POST") {
		res.setHeader("Allow", ["POST"])
		return res.status(405).end(`Method ${req.method} Not Allowed`)
	}

	if (!process.env.DATABASE_URL) {
		return res.status(202).json({ recorded: false, reason: "database-not-configured" })
	}

	const visitorIdResult = validateAnalyticsToken(req.body?.visitorId, "visitorId")
	if (!visitorIdResult.ok) {
		return res.status(400).json({ error: visitorIdResult.error })
	}

	const sessionIdResult = validateAnalyticsToken(req.body?.sessionId, "sessionId")
	if (!sessionIdResult.ok) {
		return res.status(400).json({ error: sessionIdResult.error })
	}

	const entryPath = validateAnalyticsPath(req.body?.path)
	const sql = neon(process.env.DATABASE_URL)
	const sessionHash = hashAnalyticsValue(`session:${sessionIdResult.data}`)
	const visitorHash = hashAnalyticsValue(`visitor:${visitorIdResult.data}`)
	const ipHash = hashAnalyticsValue(`ip:${getClientIp(req)}`)
	const userAgent =
		typeof req.headers["user-agent"] === "string"
			? req.headers["user-agent"].slice(0, 255)
			: "unknown"

	try {
		await sql`
			INSERT INTO site_visit_sessions (
				session_hash,
				visitor_hash,
				ip_hash,
				entry_path,
				user_agent,
				first_seen_at,
				last_seen_at,
				hits
			)
			VALUES (
				${sessionHash},
				${visitorHash},
				${ipHash},
				${entryPath},
				${userAgent},
				NOW(),
				NOW(),
				1
			)
			ON CONFLICT (session_hash)
			DO UPDATE SET
				visitor_hash = EXCLUDED.visitor_hash,
				ip_hash = EXCLUDED.ip_hash,
				entry_path = EXCLUDED.entry_path,
				user_agent = EXCLUDED.user_agent,
				last_seen_at = NOW(),
				hits = site_visit_sessions.hits + 1
		`

		return res.status(200).json({ recorded: true })
	} catch (error: any) {
		if (
			typeof error?.message === "string" &&
			error.message.includes('relation "site_visit_sessions" does not exist')
		) {
			return res.status(202).json({ recorded: false, reason: "schema-missing" })
		}

		console.error("Visit analytics error:", error)
		return res.status(500).json({ error: "Failed to record visit" })
	}
}