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

