import express from "express"
import cors from "cors"
import sqlite3 from "sqlite3"
import { open } from "sqlite"
import path from "path"

const app = express()
app.use(cors())
app.use(express.json())

// Serve static frontend in production
app.use(express.static(path.join(process.cwd(), "dist")))

// Initialize SQLite database
const initDB = async () => {
	const db = await open({
		filename: "./road_rules.db",
		driver: sqlite3.Database
	})

	await db.exec(`
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
	`)

	return db
}

initDB().then((db) => {
	// GET all rules
	app.get("/api/changes", async (req, res) => {
		try {
			const rows = await db.all("SELECT * FROM road_changes ORDER BY timestamp DESC")
			// SQLite doesn't natively support arrays, so maps the coordinates back
			const mapped = rows.map((r: any) => ({
				...r,
				coordinates: [r.longitude, r.latitude] // GeoJSON format: [long, lat]
			}))
			res.json(mapped)
		} catch (error) {
			res.status(500).json({ error: "Failed to fetch rules" })
		}
	})

	// POST a new rule
	app.post("/api/changes", async (req, res) => {
		const { id, title, description, severity, status, coordinates, timestamp, upvotes } =
			req.body
		try {
			await db.run(
				`INSERT INTO road_changes (id, title, description, severity, status, longitude, latitude, timestamp, upvotes)
				VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
				[
					id,
					title,
					description,
					severity,
					status || "pending",
					coordinates[0],
					coordinates[1],
					timestamp,
					upvotes || 0
				]
			)
			res.status(201).json({ success: true, id })
		} catch (error) {
			console.error(error)
			res.status(500).json({ error: "Failed to create rule" })
		}
	})

	// PATCH upvote
	app.patch("/api/changes/:id/upvote", async (req, res) => {
		const { id } = req.params
		try {
			await db.run("UPDATE road_changes SET upvotes = upvotes + 1 WHERE id = ?", [id])
			res.json({ success: true })
		} catch (error) {
			res.status(500).json({ error: "Failed to upvote rule" })
		}
	})

	// Catch-all to serve index.html for frontend routing
	app.get("*", (req, res) => {
		res.sendFile(path.join(process.cwd(), "dist", "index.html"))
	})

	const PORT = process.env.PORT || 3001
	app.listen(PORT, () => {
		console.log(`Backend server running on port ${PORT}`)
	})
})
