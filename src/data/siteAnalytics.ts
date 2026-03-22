export interface SiteAnalyticsSummary {
	totalVisits: number
	visitsToday: number
	uniqueVisitors7d: number
	activeSessions24h: number
	latestVisitAt: string | null
	schemaMissing?: boolean
}

export function formatAnalyticsDate(value: string | null) {
	if (!value) {
		return "Hələ qeyd yoxdur"
	}

	const parsed = new Date(value)
	if (Number.isNaN(parsed.getTime())) {
		return value
	}

	return parsed.toLocaleString("az-Latn-AZ")
}
