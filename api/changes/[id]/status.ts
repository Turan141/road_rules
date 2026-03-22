import type { VercelRequest, VercelResponse } from "@vercel/node"
import { neon } from "@neondatabase/serverless"
import { requireAdminSession } from "../../_lib/auth"
import { validateRoadChangeId } from "../../_lib/roadChangeValidation"

export default async function handler(req: VercelRequest, res: VercelResponse) {
	if (!process.env.DATABASE_URL) {
		return res.status(500).json({ error: "Database not configured" })
	}

	const sql = neon(process.env.DATABASE_URL)

	if (req.method === "OPTIONS") return res.status(200).end()

	const adminSession = requireAdminSession(req, res)
	if (!adminSession) {
		return
	}

	const idResult = validateRoadChangeId(req.query.id)
	if (!idResult.ok) {
		return res.status(400).json({ error: idResult.error })
	}

	const changeId = idResult.data

	if (req.method === "PATCH") {
		const { status } = req.body

		if (!status || !["approved", "rejected", "pending"].includes(status)) {
			return res.status(400).json({ error: "Invalid status provided" })
		}

		try {
			const rows = await sql`
                UPDATE road_changes
                SET status = ${status}
                WHERE id = ${changeId}
                RETURNING id
            `
			if (rows.length === 0) {
				return res.status(404).json({ error: "Change not found" })
			}

			return res.status(200).json({ success: true, id: changeId, status })
		} catch (error: any) {
			console.error("PATCH Error:", error)
			return res
				.status(500)
				.json({ error: "Failed to update status", details: error.message })
		}
	}

	if (req.method === "DELETE") {
		try {
			const rows = await sql`
                DELETE FROM road_changes
                WHERE id = ${changeId}
                RETURNING id
            `
			if (rows.length === 0) {
				return res.status(404).json({ error: "Change not found" })
			}

			return res.status(200).json({ success: true, id: changeId })
		} catch (error: any) {
			console.error("DELETE Error:", error)
			return res
				.status(500)
				.json({ error: "Failed to delete rule", details: error.message })
		}
	}

	res.setHeader("Allow", ["PATCH", "DELETE"])
	return res.status(405).end(`Method ${req.method} Not Allowed`)
}
