import { RoadChange } from "../../data/roadChanges"
import { AlertCircle, X } from "lucide-react"

interface AlertBarProps {
	change: RoadChange
	onClose: () => void
}

export default function AlertBar({ change, onClose }: AlertBarProps) {
	return (
		<div
			className={`flex items-start justify-between p-3 rounded-xl shadow-lg border-l-4 ${
				change.severity === "red"
					? "bg-red-50 border-red-500"
					: "bg-yellow-50 border-yellow-500"
			}`}
		>
			<div className='flex items-start space-x-3'>
				{change.severity === "red" ? (
					<AlertCircle className='w-5 h-5 text-red-500 mt-0.5 shrink-0' />
				) : (
					<AlertCircle className='w-5 h-5 text-yellow-500 mt-0.5 shrink-0' />
				)}
				<div>
					<h3
						className={`font-semibold text-sm ${
							change.severity === "red" ? "text-red-900" : "text-yellow-900"
						}`}
					>
						Warning: You are approaching a changed zone
					</h3>
					<p className='text-sm mt-1 text-gray-700'>{change.title}</p>
				</div>
			</div>
			<button
				onClick={onClose}
				className='p-1 hover:bg-black/5 rounded-full transition-colors'
			>
				<X className='w-4 h-4 text-gray-500' />
			</button>
		</div>
	)
}
