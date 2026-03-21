import { RoadChange, formatRoadChangeDate, getRoadChangeTypeLabel } from "../../data/roadChanges"
import { Clock, MapPin } from "lucide-react"

interface FeedProps {
	changes: RoadChange[]
	onSelect: (change: RoadChange) => void
}

export default function Feed({ changes, onSelect }: FeedProps) {
	return (
		<div className='p-4 space-y-4 pb-24'>
			<div className='flex flex-col mb-6 space-y-4'>
				<h2 className='text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600'>
					Bakıda Son Yol Dəyişiklikləri
				</h2>
			</div>

			{changes.length === 0 ? (
				<div className='text-center py-10 text-gray-500 bg-white rounded-xl border border-gray-100 border-dashed'>
					<p>Bu vaxt aralığı üçün yol dəyişikliyi tapılmadı.</p>
				</div>
			) : (
				changes.map((change) => (
					<div
						key={change.id}
						className='bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow cursor-pointer'
						onClick={() => onSelect(change)}
					>
						<div className='p-4'>
							<div className='flex justify-between items-start mb-2'>
								{change.type !== "other" ? (
									<span
										className={`px-2.5 py-1 text-[10px] uppercase tracking-wider font-bold rounded-full ${
											change.severity === "red"
												? "bg-red-50 text-red-600 ring-1 ring-red-100"
												: change.severity === "yellow"
													? "bg-yellow-50 text-yellow-600 ring-1 ring-yellow-100"
													: "bg-green-50 text-green-600 ring-1 ring-green-100"
										}`}
									>
										{getRoadChangeTypeLabel(change.type)}
									</span>
								) : (
									<div />
								)}
								<div className='flex items-center text-gray-400 text-xs font-medium'>
									<Clock className='w-3.5 h-3.5 mr-1' />
									{formatRoadChangeDate(change.date)}
								</div>
							</div>

							<h3 className='font-semibold text-gray-900 leading-tight mb-2'>
								{change.title}
							</h3>

							<p className='text-gray-500 text-sm line-clamp-2 mb-4'>
								{change.description}
							</p>

							<div className='flex items-center text-xs text-blue-600 font-medium group'>
								<MapPin className='w-3.5 h-3.5 mr-1 group-hover:animate-bounce' />
								<span>Xəritədə göstər</span>
							</div>
						</div>
					</div>
				))
			)}
		</div>
	)
}
