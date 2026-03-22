import type { VercelRequest, VercelResponse } from "@vercel/node"
import {
	authenticateAdmin,
	createAdminSessionCookie,
	isAuthConfigured
} from "../_lib/auth.js"

export default async function handler(req: VercelRequest, res: VercelResponse) {
	res.setHeader("Cache-Control", "no-store")

	if (req.method === "OPTIONS") {
		return res.status(200).end()
	}

	if (req.method !== "POST") {
		res.setHeader("Allow", ["POST"])
		return res.status(405).end(`Method ${req.method} Not Allowed`)
	}

	if (!isAuthConfigured()) {
		return res.status(503).json({ error: "Admin auth is not configured" })
	}

	const email = typeof req.body?.email === "string" ? req.body.email.trim() : ""
	const password = typeof req.body?.password === "string" ? req.body.password : ""
	const authResult = authenticateAdmin(email, password)

	if (!authResult.ok) {
		return res.status(401).json({ error: "Invalid email or password" })
	}

	res.setHeader("Set-Cookie", createAdminSessionCookie(email))
	return res.status(200).json({ authenticated: true, role: "admin" })
}
