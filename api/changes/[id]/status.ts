import type { VercelRequest, VercelResponse } from "@vercel/node"
import { neon } from "@neondatabase/serverless"

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (!process.env.DATABASE_URL) {
        return res.status(500).json({ error: "Database not configured" })
    }

    const sql = neon(process.env.DATABASE_URL)

    if (req.method === "OPTIONS") return res.status(200).end()

    if (req.method === "PATCH") {
        const { id } = req.query
        const { status } = req.body

        if (!status || !['approved', 'rejected', 'pending'].includes(status)) {
            return res.status(400).json({ error: "Invalid status provided" })
        }

        try {
            await sql`
                UPDATE road_changes
                SET status = ${status}
                WHERE id = ${id as string}
            `
            return res.status(200).json({ success: true, id, status })
        } catch (error: any) {
            console.error("PATCH Error:", error)
            return res.status(500).json({ error: "Failed to update status", details: error.message })
        }
    }

    res.setHeader("Allow", ["PATCH"])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
}
