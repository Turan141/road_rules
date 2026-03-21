export type RoadChangeType =
	| "other"
	| "one-way"
	| "turn-restriction"
	| "speed-limit"
	| "closed"
	| "bus-lane"
	| "parking-restriction"
	| "traffic-light"
	| "speed-bump"
	| "road-works"
	| "pedestrian-crossing"

export interface RoadChange {
	id: string
	title: string
	description: string
	type: RoadChangeType
	roadName?: string
	coordinates: [number, number] // [longitude, latitude]
	date: string
	severity: "red" | "yellow" | "green"
	status: "approved" | "pending"
	beforeImageUrl?: string
	afterImageUrl?: string
	image?: string
	upvotes?: number // Added for multiple users reporting the same changing rule
}

export function getRoadChangeTypeLabel(type?: RoadChangeType) {
	const labels: Record<RoadChangeType, string> = {
		other: "Digər dəyişiklik",
		"one-way": "Tək istiqamət",
		"turn-restriction": "Dönüş məhdudiyyəti",
		"speed-limit": "Sürət həddi",
		closed: "Yol bağlıdır",
		"bus-lane": "Avtobus zolağı",
		"parking-restriction": "Parkinq məhdudiyyəti",
		"traffic-light": "Svetofor",
		"speed-bump": "Sürət maneəsi",
		"road-works": "Yol təmiri",
		"pedestrian-crossing": "Piyada keçidi"
	}

	return labels[type || "other"]
}

export function formatRoadChangeDate(date?: string) {
	if (!date) return "Son yenilənmə"

	const trimmedDate = date.trim()
	const lowerDate = trimmedDate.toLowerCase()

	if (["i̇ndi", "indi", "just now"].includes(lowerDate)) {
		return "İndi"
	}

	if (["bu gün", "today"].includes(lowerDate)) {
		return "Bu gün"
	}

	if (["dünən", "yesterday"].includes(lowerDate)) {
		return "Dünən"
	}

	const dayMatch = lowerDate.match(/(\d+)\s*(?:days?\s*ago|days?|gün(?:\s*əvvəl)?)/)
	if (dayMatch) {
		return `${dayMatch[1]} gün əvvəl`
	}

	const parsedDate = new Date(trimmedDate)
	if (
		!Number.isNaN(parsedDate.getTime()) &&
		/\d{4}-\d{2}-\d{2}|t\d{2}:\d{2}/i.test(trimmedDate)
	) {
		return parsedDate.toLocaleDateString("az-Latn-AZ")
	}

	return trimmedDate
}
