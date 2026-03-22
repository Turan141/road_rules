import type { VercelRequest, VercelResponse } from "@vercel/node"
import { neon } from "@neondatabase/serverless"
import { validateCreateRoadChange } from "../_lib/roadChangeValidation.js"
import { enforceRateLimit } from "../_lib/rateLimit.js"

export default async function handler(req: VercelRequest, res: VercelResponse) {
	try {
		if (!process.env.DATABASE_URL) {
			console.error("DATABASE_URL is missing")
			return res.status(500).json({ error: "Database not configured" })
		}

		const sql = neon(process.env.DATABASE_URL)

		if (req.method === "OPTIONS") return res.status(200).end()

		if (req.method === "GET") {
			try {
				const rows = await sql`SELECT * FROM road_changes ORDER BY timestamp DESC`
				const mapped = rows.map((r: any) => ({
					...r,
					roadName: r.road_name || undefined,
					type: r.type || "other",
					date: r.timestamp,
					status: r.status || "pending",
					severity: r.severity || "yellow",
					coordinates: [r.longitude, r.latitude],
					image: r.image
				}))
				return res.status(200).json(mapped)
			} catch (error: any) {
				if (
					error.message &&
					error.message.includes('relation "road_changes" does not exist')
				) {
					return res.status(200).json([]) // DB not initialized yet
				}
				console.error("GET Error:", error)
				return res
					.status(500)
					.json({ error: "Failed to fetch rules", details: error.message })
			}
		}

		if (req.method === "POST") {
			const isAllowed = await enforceRateLimit(sql, req, res, {
				scope: "create-change",
				maxRequests: 4,
				windowMinutes: 30,
				errorMessage: "Çox tez-tez hesabat göndərirsiniz. Bir az sonra yenidən cəhd edin."
			})
			if (!isAllowed) {
				return
			}

			const validation = validateCreateRoadChange(req.body)
			if (!validation.ok) {
				return res.status(400).json({ error: validation.error })
			}

			const {
				id,
				title,
				description,
				roadName,
				type,
				severity,
				status,
				coordinates,
				timestamp,
				upvotes,
				image
			} = validation.data
			try {
				const duplicateRows = await sql`
					SELECT id
					FROM road_changes
					WHERE LOWER(title) = LOWER(${title})
					  AND LOWER(description) = LOWER(${description})
					  AND COALESCE(LOWER(road_name), '') = COALESCE(LOWER(${roadName}), '')
					  AND timestamp >= NOW() - INTERVAL '30 days'
					LIMIT 1
				`

				if (duplicateRows.length > 0) {
					return res.status(409).json({
						error: "A similar report was already submitted recently"
					})
				}

				await sql`
					INSERT INTO road_changes (id, title, description, road_name, type, severity, status, longitude, latitude, timestamp, upvotes, image)
					VALUES (${id}, ${title}, ${description}, ${roadName}, ${type}, ${severity}, ${status}, ${coordinates[0]}, ${coordinates[1]}, ${timestamp}, ${upvotes}, ${image})
				`
				return res.status(201).json({ success: true, id })
			} catch (error: any) {
				console.error("POST Error:", error)
				if (
					error.message &&
					error.message.includes(
						'column "road_name" of relation "road_changes" does not exist'
					)
				) {
					return res
						.status(500)
						.json({ error: "Database schema is outdated. Apply the latest schema.sql." })
				}
				if (
					error.message &&
					error.message.includes('relation "road_changes" does not exist')
				) {
					return res
						.status(500)
						.json({ error: "Table doesn't exist. Please visit /api/init-db first" })
				}
				return res
					.status(500)
					.json({ error: "Failed to create rule", details: error.message })
			}
		}

		res.setHeader("Allow", ["GET", "POST"])
		return res.status(405).end(`Method ${req.method} Not Allowed`)
	} catch (globalError: any) {
		console.error("Global Handler Error:", globalError)
		return res
			.status(500)
			.json({ error: "Internal Server Function Error", details: globalError.message })
	}
}
