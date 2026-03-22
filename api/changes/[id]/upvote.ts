import type { VercelRequest, VercelResponse } from "@vercel/node"
import { neon } from "@neondatabase/serverless"
import { validateRoadChangeId } from "../../_lib/roadChangeValidation"

export default async function handler(req: VercelRequest, res: VercelResponse) {
	try {
		if (!process.env.DATABASE_URL) {
			console.error("DATABASE_URL is missing")
			return res.status(500).json({ error: "Database not configured" })
		}

		const sql = neon(process.env.DATABASE_URL)

		if (req.method === "OPTIONS") return res.status(200).end()

		if (req.method === "PATCH") {
			const idResult = validateRoadChangeId(req.query.id)
			if (!idResult.ok) {
				return res.status(400).json({ error: idResult.error })
			}

			const id = idResult.data
			try {
				const rows = await sql`
					UPDATE road_changes
					SET upvotes = COALESCE(upvotes, 0) + 1
					WHERE id = ${id}
					RETURNING id
				`
				if (rows.length === 0) {
					return res.status(404).json({ error: "Change not found" })
				}

				return res.status(200).json({ success: true })
			} catch (error: any) {
				console.error("PATCH Error:", error)
				return res
					.status(500)
					.json({ error: "Failed to upvote rule", details: error.message })
			}
		}

		res.setHeader("Allow", ["PATCH"])
		return res.status(405).end(`Method ${req.method} Not Allowed`)
	} catch (globalError: any) {
		console.error("Global Handler Error:", globalError)
		return res
			.status(500)
			.json({ error: "Internal Server Function Error", details: globalError.message })
	}
}
