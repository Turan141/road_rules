import type { VercelRequest, VercelResponse } from "@vercel/node"
import { sql } from "@vercel/postgres"

export default async function handler(req: VercelRequest, res: VercelResponse) {
	if (req.method === "PATCH") {
		const id = req.query.id as string
		try {
			await sql`UPDATE road_changes SET upvotes = upvotes + 1 WHERE id = ${id}`
			return res.status(200).json({ success: true })
		} catch (error) {
			console.error(error)
			return res.status(500).json({ error: "Failed to upvote rule" })
		}
	}

	res.setHeader("Allow", ["PATCH"])
	return res.status(405).end(`Method ${req.method} Not Allowed`)
}
