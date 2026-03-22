const CONTACT_PATTERNS = [
	/(?:https?:\/\/|www\.)\S+/i,
	/\b(?:t\.me|telegram\.me|wa\.me|discord\.gg|instagram\.com|facebook\.com|vk\.com)\/\S+/i,
	/\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b/i,
	/(?:\+?\d[\d\s()_-]{7,}\d)/,
	/(?:^|\s)@[_a-z0-9.]{3,}/i
]

const PROFANITY_PATTERNS = [
	/\b(?:fuck|fucking|shit|bitch|bastard|dick|porn|nsfw|nude|sex(?:cam)?|blowjob)\b/i,
	/\b(?:сука|бляд|блят|хуй|хуе|пизд|еба|ебл|пидор|шлюх|секс|порно)\b/i,
	/\b(?:sik(?:dir)?|amc[ıi]q|qəhbə|fahişə|porno|seks)\b/i
]

const SPAM_PATTERNS = [/(.)\1{6,}/, /(?:\b\w+\b)(?:\s+\1\b){4,}/i]
const MIN_FORM_COMPLETION_MS = 2500

interface ReportMetaInput {
	honeypot?: unknown
	startedAt?: unknown
	completedAt?: unknown
}

function normalizeWhitespace(value: string) {
	return value.replace(/\s+/g, " ").trim()
}

function getUppercaseRatio(value: string) {
	const letters = Array.from(value).filter((char) => /\p{L}/u.test(char))
	if (letters.length === 0) {
		return 0
	}

	const uppercaseLetters = letters.filter((char) => char === char.toUpperCase())
	return uppercaseLetters.length / letters.length
}

function isTooFastSubmission(reportMeta?: ReportMetaInput) {
	if (!reportMeta) {
		return false
	}

	if (typeof reportMeta.honeypot === "string" && reportMeta.honeypot.trim()) {
		return true
	}

	if (
		typeof reportMeta.startedAt !== "string" ||
		typeof reportMeta.completedAt !== "string"
	) {
		return false
	}

	const startedAt = Date.parse(reportMeta.startedAt)
	const completedAt = Date.parse(reportMeta.completedAt)
	if (Number.isNaN(startedAt) || Number.isNaN(completedAt)) {
		return false
	}

	return completedAt - startedAt < MIN_FORM_COMPLETION_MS
}

export function getReportAbuseError(input: {
	title: string
	description: string
	roadName?: string | null
	reportMeta?: ReportMetaInput
}) {
	if (isTooFastSubmission(input.reportMeta)) {
		return "Suspicious automated submission detected"
	}

	const title = normalizeWhitespace(input.title)
	const description = normalizeWhitespace(input.description)
	const roadName = normalizeWhitespace(input.roadName || "")
	const combinedText = [title, description, roadName].filter(Boolean).join(" \n ")

	if (CONTACT_PATTERNS.some((pattern) => pattern.test(combinedText))) {
		return "Links and contact details are not allowed in reports"
	}

	if (PROFANITY_PATTERNS.some((pattern) => pattern.test(combinedText))) {
		return "Offensive or adult language is not allowed in reports"
	}

	if (SPAM_PATTERNS.some((pattern) => pattern.test(combinedText))) {
		return "Report text looks like spam"
	}

	if (title.length >= 12 && getUppercaseRatio(title) > 0.7) {
		return "Please avoid all-caps titles"
	}

	if (description.length >= 24 && getUppercaseRatio(description) > 0.75) {
		return "Please avoid all-caps descriptions"
	}

	return null
}