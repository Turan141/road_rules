import type { VercelRequest, VercelResponse } from "@vercel/node"
import { neon } from "@neondatabase/serverless"

export default async function handler(req: VercelRequest, res: VercelResponse) {
	const sql = neon(process.env.DATABASE_URL!)

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
			return res.status(500).json({ error: "Failed to fetch rules" })
		}
	}

	if (req.method === "POST") {
		const { id, title, description, severity, status, coordinates, timestamp, upvotes } = req.body
		try {
			await sql`
				INSERT INTO road_changes (id, title, description, severity, status, longitude, latitude, timestamp, upvotes)
				VALUES (${id}, ${title}, ${description}, ${severity}, ${status || "pending"}, ${coordinates[0]}, ${coordinates[1]}, ${timestamp}, ${upvotes || 0})
			`
			return res.status(201).json({ success: true, id })
		} catch (error) {
			console.error(error)
			return res.status(500).json({ error: "Failed to create rule" })
		}
	}

	res.setHeader("Allow", ["GET", "POST"])
	return res.status(405).end(`Method ${req.method} Not Allowed`)
}
