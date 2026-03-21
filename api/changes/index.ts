import type { VercelRequest, VercelResponse } from "@vercel/node"
import { neon } from "@neondatabase/serverless"

export default async function handler(req: VercelRequest, res: VercelResponse) {
	try {
		if (!process.env.DATABASE_URL) {
			console.error("DATABASE_URL is missing")
			return res.status(500).json({ error: "Database not configured" })
		}
		
		const sql = neon(process.env.DATABASE_URL);

	if (req.method === 'OPTIONS') return res.status(200).end();

		if (req.method === "GET") {
			try {
				const rows = await sql`SELECT * FROM road_changes ORDER BY timestamp DESC`
				const mapped = rows.map((r: any) => ({
					...r,
					coordinates: [r.longitude, r.latitude]
				}))
				return res.status(200).json(mapped)
			} catch (error: any) {
				if (error.message && error.message.includes('relation "road_changes" does not exist')) {
					return res.status(200).json([]) // DB not initialized yet
				}
				console.error("GET Error:", error)
				return res.status(500).json({ error: "Failed to fetch rules", details: error.message })
			}
		}

		if (req.method === "POST") {
			const { id, title, description, severity, status, coordinates, timestamp, upvotes } = req.body
			try {
				await sql`
					INSERT INTO road_changes (id, title, description, severity, status, longitude, latitude, timestamp, upvotes)
					VALUES (${id}, ${title}, ${description}, ${severity}, ${status || "pending"}, ${coordinates[0]}, ${coordinates[1]}, ${timestamp || new Date().toISOString()}, ${upvotes || 0})
				`
				return res.status(201).json({ success: true, id })
			} catch (error: any) {
				console.error("POST Error:", error)
				if (error.message && error.message.includes('relation "road_changes" does not exist')) {
					return res.status(500).json({ error: "Table doesn't exist. Please visit /api/init-db first" })
				}
				return res.status(500).json({ error: "Failed to create rule", details: error.message })
			}
		}

		res.setHeader("Allow", ["GET", "POST"])
		return res.status(405).end(`Method ${req.method} Not Allowed`)
	} catch (globalError: any) {
		console.error("Global Handler Error:", globalError)
		return res.status(500).json({ error: "Internal Server Function Error", details: globalError.message })
	}
}