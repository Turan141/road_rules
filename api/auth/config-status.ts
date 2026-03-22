import type { VercelRequest, VercelResponse } from "@vercel/node"
import { getAuthConfigStatus } from "../_lib/auth.js"

export default async function handler(req: VercelRequest, res: VercelResponse) {
	res.setHeader("Cache-Control", "no-store")

	if (req.method === "OPTIONS") {
		return res.status(200).end()
	}

	if (req.method !== "GET") {
		res.setHeader("Allow", ["GET"])
		return res.status(405).end(`Method ${req.method} Not Allowed`)
	}

	return res.status(200).json(getAuthConfigStatus())
}