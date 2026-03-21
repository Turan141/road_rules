import type { VercelRequest, VercelResponse } from "@vercel/node"
import { neon } from "@neondatabase/serverless"

export default async function handler(req: VercelRequest, res: VercelResponse) {
	const sql = neon(process.env.DATABASE_URL!)

	try {
		await sql`
			CREATE TABLE IF NOT EXISTS road_changes (
				id TEXT PRIMARY KEY,
				title TEXT NOT NULL,
				description TEXT NOT NULL,
				severity TEXT NOT NULL,
				status TEXT DEFAULT 'pending',
				latitude REAL NOT NULL,
				longitude REAL NOT NULL,
				timestamp TEXT NOT NULL,
				upvotes INTEGER DEFAULT 0
			)
		`
		return res.status(200).json({ success: true, message: "Database table created successfully" })
	} catch (error: any) {
		console.error(error)
		return res.status(500).json({ error: "Failed to create table", details: error.message })
	}
}
