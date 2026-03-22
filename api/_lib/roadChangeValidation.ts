const ROAD_CHANGE_TYPES = new Set([
	"other",
	"one-way",
	"turn-restriction",
	"speed-limit",
	"closed",
	"bus-lane",
	"parking-restriction",
	"traffic-light",
	"speed-bump",
	"road-works",
	"pedestrian-crossing"
])

const ROAD_CHANGE_SEVERITIES = new Set(["red", "yellow", "green"])
const ROAD_CHANGE_STATUSES = new Set(["approved", "pending"])
const MAX_TITLE_LENGTH = 120
const MAX_DESCRIPTION_LENGTH = 1000
const MAX_IMAGE_LENGTH = 4_000_000
const IMAGE_DATA_URL_PATTERN =
	/^data:image\/(png|jpeg|jpg|webp|gif);base64,[a-z0-9+/=]+$/i

interface CreateRoadChangeInput {
	id: string
	title: string
	description: string
	type: string
	severity: "red" | "yellow" | "green"
	status: "approved" | "pending"
	coordinates: [number, number]
	timestamp: string
	upvotes: number
	image: string | null
}

interface ValidationSuccess<T> {
	ok: true
	data: T
}

interface ValidationFailure {
	ok: false
	error: string
}

function isObject(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null
}

function getNonEmptyString(value: unknown, fieldName: string, maxLength: number) {
	if (typeof value !== "string") {
		return { ok: false as const, error: `${fieldName} must be a string` }
	}

	const normalized = value.trim()
	if (!normalized) {
		return { ok: false as const, error: `${fieldName} is required` }
	}

	if (normalized.length > maxLength) {
		return { ok: false as const, error: `${fieldName} is too long` }
	}

	return { ok: true as const, data: normalized }
}

export function validateRoadChangeId(value: unknown) {
	if (typeof value !== "string") {
		return { ok: false as const, error: "Invalid change id" }
	}

	const normalized = value.trim()
	if (!/^[a-zA-Z0-9_-]{6,64}$/.test(normalized)) {
		return { ok: false as const, error: "Invalid change id" }
	}

	return { ok: true as const, data: normalized }
}

export function validateCreateRoadChange(
	body: unknown
): ValidationSuccess<CreateRoadChangeInput> | ValidationFailure {
	if (!isObject(body)) {
		return { ok: false, error: "Request body must be an object" }
	}

	const idResult = validateRoadChangeId(body.id)
	if (!idResult.ok) {
		return idResult
	}

	const titleResult = getNonEmptyString(body.title, "Title", MAX_TITLE_LENGTH)
	if (!titleResult.ok) {
		return titleResult
	}

	const descriptionResult = getNonEmptyString(
		body.description,
		"Description",
		MAX_DESCRIPTION_LENGTH
	)
	if (!descriptionResult.ok) {
		return descriptionResult
	}

	if (!Array.isArray(body.coordinates) || body.coordinates.length !== 2) {
		return { ok: false, error: "Coordinates must contain longitude and latitude" }
	}

	const [longitude, latitude] = body.coordinates
	if (
		typeof longitude !== "number" ||
		typeof latitude !== "number" ||
		!Number.isFinite(longitude) ||
		!Number.isFinite(latitude) ||
		longitude < -180 ||
		longitude > 180 ||
		latitude < -90 ||
		latitude > 90
	) {
		return { ok: false, error: "Coordinates are invalid" }
	}

	const type = typeof body.type === "string" ? body.type.trim() : "other"
	if (!ROAD_CHANGE_TYPES.has(type)) {
		return { ok: false, error: "Road change type is invalid" }
	}

	const severity = typeof body.severity === "string" ? body.severity.trim() : "yellow"
	if (!ROAD_CHANGE_SEVERITIES.has(severity)) {
		return { ok: false, error: "Severity is invalid" }
	}

	const status = typeof body.status === "string" ? body.status.trim() : "pending"
	if (!ROAD_CHANGE_STATUSES.has(status)) {
		return { ok: false, error: "Status is invalid" }
	}

	const timestamp =
		typeof body.timestamp === "string" && !Number.isNaN(Date.parse(body.timestamp))
			? new Date(body.timestamp).toISOString()
			: new Date().toISOString()

	const upvotes =
		typeof body.upvotes === "number" &&
		Number.isInteger(body.upvotes) &&
		body.upvotes >= 0
			? body.upvotes
			: 0

	let image: string | null = null
	if (body.image != null) {
		if (typeof body.image !== "string") {
			return { ok: false, error: "Image must be a string" }
		}

		const normalizedImage = body.image.trim()
		if (normalizedImage.length > MAX_IMAGE_LENGTH) {
			return { ok: false, error: "Image is too large" }
		}

		if (!IMAGE_DATA_URL_PATTERN.test(normalizedImage)) {
			return { ok: false, error: "Image format is invalid" }
		}

		image = normalizedImage
	}

	return {
		ok: true,
		data: {
			id: idResult.data,
			title: titleResult.data,
			description: descriptionResult.data,
			type,
			severity: severity as "red" | "yellow" | "green",
			status: status as "approved" | "pending",
			coordinates: [longitude, latitude],
			timestamp,
			upvotes,
			image
		}
	}
}
