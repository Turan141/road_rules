const CONTACT_PATTERNS = [
	/(?:https?:\/\/|www\.)\S+/i,
	/\b(?:t\.me|telegram\.me|wa\.me|discord\.gg|instagram\.com|facebook\.com|vk\.com)\/\S+/i,
	/\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b/i,
	/(?:\+?\d[\d\s()_-]{7,}\d)/,
	/(?:^|\s)@[_a-z0-9.]{3,}/i
]

const PROFANITY_PATTERNS = [
	/\b(?:fuck|fucking|motherfucker|shit|bullshit|bitch|bastard|asshole|dick|whore|slut|porn|nsfw|nude|sex(?:cam)?|blowjob|boobs?|naked)\b/i,
	/\b(?:сука|бляд|блят|блять|хуй|хуе|хуйня|пизд|еба|ебл|пидор|пидр|шлюх|мраз|гандон|секс|порно|голая|голый)\b/i,
	/\b(?:sik(?:dir)?|amc[ıi]q|amina|qəhbə|fahişə|gijd[ıi]llaq|pezeveng|porno|seks|çılpaq|çiplak|yarraq)\b/i,
	/\b(?:sik|sikerim|amk|amina|orospu|piç|pic|yarak|porno|seks|çıplak|ciplak|mem[ea])\b/i
]

const NORMALIZED_PROFANITY_PATTERNS = [
	/(?:f+u+c+k+|s+h+i+t+|b+i+t+c+h+|p+o+r+n+|n+u+d+e+|s+e+x+)/,
	/(?:s+u+k+a+|b+l+y+a+[dt]+|x+u+y+|h+u+y+|p+i+z+d+a+|e+b+a+t?)/,
	/(?:s+i+k+|a+m+c+i+q+|q+e+h+b+e+|f+a+h+i+s+e+|y+a+r+r+a+q+|o+r+o+s+p+u+|p+i+c+)/
]

const SPAM_PATTERNS = [/([^.\s])\1{6,}/, /\b(\w+)\b(?:\s+\1\b){4,}/i]
const MIN_FORM_COMPLETION_MS = 2500

interface ReportMetaInput {
	honeypot?: unknown
	startedAt?: unknown
	completedAt?: unknown
}

function normalizeWhitespace(value: string) {
	return value.replace(/\s+/g, " ").trim()
}

function normalizeForDetection(value: string) {
	return value
		.toLowerCase()
		.normalize("NFKD")
		.replace(/[\u0300-\u036f]/g, "")
		.replace(/[0@]/g, "o")
		.replace(/[1!|]/g, "i")
		.replace(/[3]/g, "e")
		.replace(/[4]/g, "a")
		.replace(/[5$]/g, "s")
		.replace(/[7]/g, "t")
		.replace(/[8]/g, "b")
		.replace(/[^\p{L}\p{N}\s]/gu, "")
		.replace(/\s+/g, " ")
		.trim()
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
	const normalizedCombinedText = normalizeForDetection(combinedText)

	if (CONTACT_PATTERNS.some((pattern) => pattern.test(combinedText))) {
		return "Links and contact details are not allowed in reports"
	}

	if (PROFANITY_PATTERNS.some((pattern) => pattern.test(combinedText))) {
		return "Offensive or adult language is not allowed in reports"
	}

	if (
		NORMALIZED_PROFANITY_PATTERNS.some((pattern) => pattern.test(normalizedCombinedText))
	) {
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
