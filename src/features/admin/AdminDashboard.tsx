import {
	RoadChange,
	formatRoadChangeDate,
	getRoadChangeTypeLabel
} from "../../data/roadChanges"
import { formatAnalyticsDate, SiteAnalyticsSummary } from "../../data/siteAnalytics"
import { Check, X, MapPin, Activity, Users, Clock3, BarChart3 } from "lucide-react"

interface AdminDashboardProps {
	pendingChanges: RoadChange[]
	reviewedChanges: RoadChange[]
	analyticsSummary: SiteAnalyticsSummary | null
	isAnalyticsLoading: boolean
	onApprove: (id: string) => void
	onReject: (id: string) => void
	onDelete: (id: string) => void
}

export default function AdminDashboard({
	pendingChanges,
	reviewedChanges,
	analyticsSummary,
	isAnalyticsLoading,
	onApprove,
	onReject,
	onDelete
}: AdminDashboardProps) {
	return (
		<div className='p-4 max-w-3xl mx-auto space-y-4 pb-24 h-full overflow-y-auto'>
			<div className='mb-6'>
				<h2 className='text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-indigo-600'>
					İdarəetmə Paneli
				</h2>
				<p className='text-sm text-gray-500'>
					İcma tərəfindən təqdim edilən yol qaydaları yeniləmələrini nəzərdən keçirin
				</p>
			</div>

			<section className='space-y-3'>
				<div className='flex items-center justify-between gap-3'>
					<div>
						<h3 className='text-sm font-semibold uppercase tracking-wide text-gray-500'>
							Sayt statistikası
						</h3>
						<p className='mt-1 text-xs text-gray-400'>Yalnız admin üçün görünür</p>
					</div>
					{analyticsSummary?.latestVisitAt && (
						<span className='text-xs text-gray-400'>
							Son giriş: {formatAnalyticsDate(analyticsSummary.latestVisitAt)}
						</span>
					)}
				</div>

				{isAnalyticsLoading ? (
					<div className='rounded-2xl border border-gray-200 bg-white p-5 text-sm text-gray-500'>
						Statistika yüklənir...
					</div>
				) : (
					<div className='grid grid-cols-2 gap-3 sm:grid-cols-4'>
						<div className='rounded-2xl border border-gray-200 bg-white p-4 shadow-sm'>
							<div className='flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-400'>
								<Activity className='h-4 w-4' /> Cəmi giriş
							</div>
							<div className='mt-3 text-2xl font-semibold text-gray-900'>
								{analyticsSummary?.totalVisits ?? 0}
							</div>
						</div>
						<div className='rounded-2xl border border-gray-200 bg-white p-4 shadow-sm'>
							<div className='flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-400'>
								<BarChart3 className='h-4 w-4' /> Bu gün
							</div>
							<div className='mt-3 text-2xl font-semibold text-gray-900'>
								{analyticsSummary?.visitsToday ?? 0}
							</div>
						</div>
						<div className='rounded-2xl border border-gray-200 bg-white p-4 shadow-sm'>
							<div className='flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-400'>
								<Users className='h-4 w-4' /> 7 gün unikallar
							</div>
							<div className='mt-3 text-2xl font-semibold text-gray-900'>
								{analyticsSummary?.uniqueVisitors7d ?? 0}
							</div>
						</div>
						<div className='rounded-2xl border border-gray-200 bg-white p-4 shadow-sm'>
							<div className='flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-400'>
								<Clock3 className='h-4 w-4' /> 24 saat aktiv
							</div>
							<div className='mt-3 text-2xl font-semibold text-gray-900'>
								{analyticsSummary?.activeSessions24h ?? 0}
							</div>
						</div>
					</div>
				)}
			</section>

			{pendingChanges.length === 0 && reviewedChanges.length === 0 && (
				<div className='flex flex-col items-center justify-center rounded-3xl border border-dashed border-gray-200 bg-white p-8 text-center text-gray-500'>
					<Check className='w-16 h-16 text-gray-300 mb-4' />
					<h3 className='text-xl font-bold text-gray-700'>Hamısı hazırdır!</h3>
					<p className='mt-2 text-sm'>Hazırda idarə olunacaq hesabat yoxdur.</p>
				</div>
			)}

			{pendingChanges.length > 0 && (
				<section className='space-y-4'>
					<div>
						<h3 className='text-sm font-semibold uppercase tracking-wide text-gray-500'>
							Gözləyən hesabatlar
						</h3>
					</div>
					{pendingChanges.map((change) => (
						<div
							key={change.id}
							className='bg-white p-5 rounded-xl shadow-sm border border-gray-200'
						>
							<div className='flex justify-between items-start mb-3'>
								<div>
									{change.type !== "other" && (
										<span className='px-2 py-1 text-xs font-bold uppercase tracking-wider text-blue-800 bg-blue-100 rounded-md'>
											{getRoadChangeTypeLabel(change.type)}
										</span>
									)}
									<span className='text-xs text-gray-400 ml-2'>
										{formatRoadChangeDate(change.date)}
									</span>
								</div>
							</div>

							<h3 className='font-semibold text-lg text-gray-900 mb-2'>{change.title}</h3>
							<p className='text-gray-600 text-sm mb-4'>{change.description}</p>
							{change.image && (
								<img
									src={change.image}
									alt='Yüklənmiş sübut'
									className='w-full h-56 object-cover rounded-xl border border-gray-200 mb-4'
								/>
							)}

							<div className='flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100 mb-4'>
								<div className='flex items-center text-xs text-gray-600 font-medium'>
									<MapPin className='w-4 h-4 mr-1 text-gray-400' />
									{change.coordinates[1].toFixed(4)}, {change.coordinates[0].toFixed(4)}
								</div>
								<span className='text-xs text-gray-500'>
									{change.image ? "Foto əlavə olunub" : "Foto əlavə olunmayıb"}
								</span>
							</div>

							<div className='flex space-x-3 pt-2 border-t border-gray-100'>
								<button
									onClick={() => onApprove(change.id)}
									className='flex-1 flex items-center justify-center py-2.5 bg-green-50 text-green-700 hover:bg-green-100 font-semibold rounded-lg transition-colors border border-green-200'
								>
									<Check className='w-4 h-4 mr-1.5' /> Təsdiqlə
								</button>
								<button
									onClick={() => onReject(change.id)}
									className='flex-1 flex items-center justify-center py-2.5 bg-red-50 text-red-700 hover:bg-red-100 font-semibold rounded-lg transition-colors border border-red-200'
								>
									<X className='w-4 h-4 mr-1.5' /> Rədd et
								</button>
								<button
									onClick={() => onDelete(change.id)}
									className='flex-1 flex items-center justify-center py-2.5 bg-gray-100 text-gray-700 hover:bg-gray-200 font-semibold rounded-lg transition-colors border border-gray-200'
								>
									Sil
								</button>
							</div>
						</div>
					))}
				</section>
			)}

			{reviewedChanges.length > 0 && (
				<section className='space-y-4 pt-4'>
					<div>
						<h3 className='text-sm font-semibold uppercase tracking-wide text-gray-500'>
							Təsdiqlənmiş hesabatlar
						</h3>
						<p className='mt-1 text-xs text-gray-400'>
							Buradan artıq yayımlanmış qeydləri silə bilərsiniz.
						</p>
					</div>
					{reviewedChanges.map((change) => (
						<div
							key={change.id}
							className='bg-white p-5 rounded-xl shadow-sm border border-gray-200'
						>
							<div className='flex justify-between items-start mb-3'>
								<div>
									{change.type !== "other" && (
										<span className='px-2 py-1 text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 rounded-md'>
											{getRoadChangeTypeLabel(change.type)}
										</span>
									)}
									<span className='text-xs text-gray-400 ml-2'>
										{formatRoadChangeDate(change.date)}
									</span>
								</div>
								<span className='rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700'>
									Təsdiqlənib
								</span>
							</div>

							<h3 className='font-semibold text-lg text-gray-900 mb-2'>{change.title}</h3>
							<p className='text-gray-600 text-sm mb-4'>{change.description}</p>
							{change.image && (
								<img
									src={change.image}
									alt='Yüklənmiş sübut'
									className='w-full h-56 object-cover rounded-xl border border-gray-200 mb-4'
								/>
							)}

							<div className='flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100 mb-4'>
								<div className='flex items-center text-xs text-gray-600 font-medium'>
									<MapPin className='w-4 h-4 mr-1 text-gray-400' />
									{change.coordinates[1].toFixed(4)}, {change.coordinates[0].toFixed(4)}
								</div>
								<span className='text-xs text-gray-500'>
									{change.image ? "Foto əlavə olunub" : "Foto əlavə olunmayıb"}
								</span>
							</div>

							<div className='flex pt-2 border-t border-gray-100'>
								<button
									onClick={() => onDelete(change.id)}
									className='w-full flex items-center justify-center py-2.5 bg-gray-100 text-gray-700 hover:bg-gray-200 font-semibold rounded-lg transition-colors border border-gray-200'
								>
									Sil
								</button>
							</div>
						</div>
					))}
				</section>
			)}
		</div>
	)
}
