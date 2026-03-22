import type { VercelRequest, VercelResponse } from "@vercel/node"
import { getAdminSession, isAuthConfigured } from "../_lib/auth"

export default async function handler(req: VercelRequest, res: VercelResponse) {
	res.setHeader("Cache-Control", "no-store")

	if (req.method === "OPTIONS") {
		return res.status(200).end()
	}

	if (req.method !== "GET") {
		res.setHeader("Allow", ["GET"])
		return res.status(405).end(`Method ${req.method} Not Allowed`)
	}

	if (!isAuthConfigured()) {
		return res.status(200).json({ authenticated: false, configured: false })
	}

	const session = getAdminSession(req)
	if (!session) {
		return res.status(200).json({ authenticated: false, configured: true })
	}

	return res.status(200).json({
		authenticated: true,
		configured: true,
		role: "admin",
		email: session.email
	})
}
