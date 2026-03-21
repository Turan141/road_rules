import type { VercelRequest, VercelResponse } from "@vercel/node"
import { neon } from "@neondatabase/serverless"

export default async function handler(req: VercelRequest, res: VercelResponse) {
	try {
		if (!process.env.DATABASE_URL) {
			console.error("DATABASE_URL is missing")
			return res.status(500).json({ error: "Database not configured" })
		}
		
		const sql = neon(process.env.DATABASE_URL)

		if (req.method === "PATCH") {
			const id = req.query.id as string
			try {
				await sql`UPDATE road_changes SET upvotes = upvotes + 1 WHERE id = ${id}`
				return res.status(200).json({ success: true })
			} catch (error: any) {
				console.error("PATCH Error:", error)
				return res.status(500).json({ error: "Failed to upvote rule", details: error.message })
			}
		}

		res.setHeader("Allow", ["PATCH"])
		return res.status(405).end(`Method ${req.method} Not Allowed`)
	} catch (globalError: any) {
		console.error("Global Handler Error:", globalError)
		return res.status(500).json({ error: "Internal Server Function Error", details: globalError.message })
	}
}