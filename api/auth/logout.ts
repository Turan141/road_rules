import type { VercelRequest, VercelResponse } from "@vercel/node"
import { clearAdminSessionCookie } from "../_lib/auth.js"

export default async function handler(req: VercelRequest, res: VercelResponse) {
	res.setHeader("Cache-Control", "no-store")

	if (req.method === "OPTIONS") {
		return res.status(200).end()
	}

	if (req.method !== "POST") {
		res.setHeader("Allow", ["POST"])
		return res.status(405).end(`Method ${req.method} Not Allowed`)
	}

	res.setHeader("Set-Cookie", clearAdminSessionCookie())
	return res.status(200).json({ authenticated: false })
}
