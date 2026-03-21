export type RoadChangeType =
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
	upvotes?: number // Added for multiple users reporting the same changing rule
}

export const mockRoadChanges: RoadChange[] = [
	{
		id: "1",
		title: "Nizami Street is now One-Way",
		description:
			"Nizami street from Rashid Behbudov to Bulbul avenue is now exclusively one-way Eastbound.",
		type: "one-way",
		coordinates: [49.8436, 40.3752], // Baku coords approx
		date: "Yesterday",
		severity: "red",
		status: "approved",
		upvotes: 42
	},
	{
		id: "2",
		title: "No Left Turn onto Neftchilar Ave",
		description:
			"Left turns from Yusif Safarov street onto Neftchilar Avenue are now prohibited to reduce congestion.",
		type: "turn-restriction",
		coordinates: [49.8521, 40.3725],
		date: "2 Days Ago",
		severity: "yellow",
		status: "approved"
	},
	{
		id: "3",
		title: "Speed Limit Reduced on Heydar Aliyev Ave",
		description:
			"Speed limit has been reduced from 90 to 70 km/h due to road works near Koroglu metro station.",
		type: "speed-limit",
		coordinates: [49.9167, 40.4183],
		date: "Today",
		severity: "yellow",
		status: "approved"
	}
]
