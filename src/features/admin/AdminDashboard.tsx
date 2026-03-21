import { RoadChange } from "../../data/roadChanges"
import { Check, X, MapPin } from "lucide-react"

interface AdminDashboardProps {
	pendingChanges: RoadChange[]
	onApprove: (id: string) => void
	onReject: (id: string) => void
}

export default function AdminDashboard({
	pendingChanges,
	onApprove,
	onReject
}: AdminDashboardProps) {
	if (pendingChanges.length === 0) {
		return (
			<div className='flex flex-col items-center justify-center h-full p-8 text-center text-gray-500'>
				<Check className='w-16 h-16 text-gray-300 mb-4' />
				<h3 className='text-xl font-bold text-gray-700'>All caught up!</h3>
				<p className='mt-2 text-sm'>There are no pending reports to review right now.</p>
			</div>
		)
	}

	return (
		<div className='p-4 max-w-3xl mx-auto space-y-4 pb-24 h-full overflow-y-auto'>
			<div className='mb-6'>
				<h2 className='text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-indigo-600'>
					Admin Dashboard
				</h2>
				<p className='text-sm text-gray-500'>
					Review community submitted road rule updates
				</p>
			</div>

			{pendingChanges.map((change) => (
				<div
					key={change.id}
					className='bg-white p-5 rounded-xl shadow-sm border border-gray-200'
				>
					<div className='flex justify-between items-start mb-3'>
						<div>
							<span className='px-2 py-1 text-xs font-bold uppercase tracking-wider text-blue-800 bg-blue-100 rounded-md'>
								{change.type.replace("-", " ")}
							</span>
							<span className='text-xs text-gray-400 ml-2'>{change.date}</span>
						</div>
					</div>

					<h3 className='font-semibold text-lg text-gray-900 mb-2'>{change.title}</h3>
					<p className='text-gray-600 text-sm mb-4'>{change.description}</p>

					<div className='flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100 mb-4'>
						<div className='flex items-center text-xs text-gray-600 font-medium'>
							<MapPin className='w-4 h-4 mr-1 text-gray-400' />
							{change.coordinates[1].toFixed(4)}, {change.coordinates[0].toFixed(4)}
						</div>
						<button className='text-xs text-blue-600 font-medium hover:underline'>
							View Evidence
						</button>
					</div>

					<div className='flex space-x-3 pt-2 border-t border-gray-100'>
						<button
							onClick={() => onApprove(change.id)}
							className='flex-1 flex items-center justify-center py-2.5 bg-green-50 text-green-700 hover:bg-green-100 font-semibold rounded-lg transition-colors border border-green-200'
						>
							<Check className='w-4 h-4 mr-1.5' /> Approve
						</button>
						<button
							onClick={() => onReject(change.id)}
							className='flex-1 flex items-center justify-center py-2.5 bg-red-50 text-red-700 hover:bg-red-100 font-semibold rounded-lg transition-colors border border-red-200'
						>
							<X className='w-4 h-4 mr-1.5' /> Reject
						</button>
					</div>
				</div>
			))}
		</div>
	)
}
