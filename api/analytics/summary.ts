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
				COUNT(DISTINCT visitor_hash)::int AS total_unique_visitors,
				COUNT(DISTINCT visitor_hash) FILTER (
					WHERE last_seen_at >= CURRENT_DATE
				)::int AS unique_visitors_today,
				COUNT(DISTINCT visitor_hash) FILTER (
					WHERE last_seen_at >= NOW() - INTERVAL '7 days'
				)::int AS unique_visitors_7d,
				COUNT(*) FILTER (
					WHERE last_seen_at >= NOW() - INTERVAL '24 hours'
				)::int AS active_sessions_24h,
				COALESCE(SUM(hits), 0)::int AS total_page_views,
				MAX(last_seen_at) AS latest_visit_at
			FROM site_visit_sessions
		`

		const summary = rows[0] || {
			total_unique_visitors: 0,
			unique_visitors_today: 0,
			unique_visitors_7d: 0,
			active_sessions_24h: 0,
			total_page_views: 0,
			latest_visit_at: null
		}

		return res.status(200).json({
			totalUniqueVisitors: Number(summary.total_unique_visitors || 0),
			uniqueVisitorsToday: Number(summary.unique_visitors_today || 0),
			uniqueVisitors7d: Number(summary.unique_visitors_7d || 0),
			activeSessions24h: Number(summary.active_sessions_24h || 0),
			totalPageViews: Number(summary.total_page_views || 0),
			latestVisitAt:
				typeof summary.latest_visit_at === "string" ? summary.latest_visit_at : null
		})
	} catch (error: any) {
		if (
			typeof error?.message === "string" &&
			error.message.includes('relation "site_visit_sessions" does not exist')
		) {
			return res.status(200).json({
				totalUniqueVisitors: 0,
				uniqueVisitorsToday: 0,
				uniqueVisitors7d: 0,
				activeSessions24h: 0,
				totalPageViews: 0,
				latestVisitAt: null,
				schemaMissing: true
			})
		}

		console.error("Analytics summary error:", error)
		return res.status(500).json({ error: "Failed to fetch analytics" })
	}
}