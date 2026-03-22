import type { VercelRequest, VercelResponse } from "@vercel/node"
import { neon } from "@neondatabase/serverless"
import { requireAdminSession } from "../_lib/auth.js"

export default async function handler(req: VercelRequest, res: VercelResponse) {
	res.setHeader("Cache-Control", "no-store")

	if (req.method === "OPTIONS") {
		return res.status(200).end()
	}

	if (req.method !== "GET") {
		res.setHeader("Allow", ["GET"])
		return res.status(405).end(`Method ${req.method} Not Allowed`)
	}

	const adminSession = requireAdminSession(req, res)
	if (!adminSession) {
		return
	}

	if (!process.env.DATABASE_URL) {
		return res.status(500).json({ error: "Database not configured" })
	}

	const sql = neon(process.env.DATABASE_URL)

	try {
		const rows = await sql`
			SELECT
				COUNT(*)::int AS total_visits,
				COUNT(*) FILTER (WHERE first_seen_at >= CURRENT_DATE)::int AS visits_today,
				COUNT(DISTINCT visitor_hash) FILTER (
					WHERE first_seen_at >= NOW() - INTERVAL '7 days'
				)::int AS unique_visitors_7d,
				COUNT(*) FILTER (
					WHERE last_seen_at >= NOW() - INTERVAL '24 hours'
				)::int AS active_sessions_24h,
				MAX(last_seen_at) AS latest_visit_at
			FROM site_visit_sessions
		`

		const summary = rows[0] || {
			total_visits: 0,
			visits_today: 0,
			unique_visitors_7d: 0,
			active_sessions_24h: 0,
			latest_visit_at: null
		}

		return res.status(200).json({
			totalVisits: Number(summary.total_visits || 0),
			visitsToday: Number(summary.visits_today || 0),
			uniqueVisitors7d: Number(summary.unique_visitors_7d || 0),
			activeSessions24h: Number(summary.active_sessions_24h || 0),
			latestVisitAt:
				typeof summary.latest_visit_at === "string" ? summary.latest_visit_at : null
		})
	} catch (error: any) {
		if (
			typeof error?.message === "string" &&
			error.message.includes('relation "site_visit_sessions" does not exist')
		) {
			return res.status(200).json({
				totalVisits: 0,
				visitsToday: 0,
				uniqueVisitors7d: 0,
				activeSessions24h: 0,
				latestVisitAt: null,
				schemaMissing: true
			})
		}

		console.error("Analytics summary error:", error)
		return res.status(500).json({ error: "Failed to fetch analytics" })
	}
}