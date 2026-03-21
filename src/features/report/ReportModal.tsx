import React, { useState, useEffect } from "react"
import { X, Upload, MapPin, Loader2, AlertCircle, ThumbsUp } from "lucide-react"
import { RoadChange } from "../../data/roadChanges"

interface ReportModalProps {
	onClose: () => void
	onSubmit: (change: RoadChange) => void
	onUpvote?: (id: string) => void
	selectedCoords: [number, number]
	existingChanges?: RoadChange[]
}

// Haversine distance in meters
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
	const R = 6371e3
	const p1 = (lat1 * Math.PI) / 180
	const p2 = (lat2 * Math.PI) / 180
	const dp = ((lat2 - lat1) * Math.PI) / 180
	const dl = ((lon2 - lon1) * Math.PI) / 180

	const a =
		Math.sin(dp / 2) * Math.sin(dp / 2) +
		Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) * Math.sin(dl / 2)
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
	return R * c
}

export default function ReportModal({
	onClose,
	onSubmit,
	onUpvote,
	selectedCoords,
	existingChanges
}: ReportModalProps) {
	const [title, setTitle] = useState("")
	const [description, setDescription] = useState("")
	const [type, setType] = useState<RoadChange["type"]>("one-way")
	const [submitting, setSubmitting] = useState(false)
	const [address, setAddress] = useState<string | null>(null)
	const [loadingAddress, setLoadingAddress] = useState(true)

	// Check for nearby reports to avoid duplicates
	const nearbyReports =
		existingChanges?.filter((c) => {
			const dist = getDistance(
				selectedCoords[1],
				selectedCoords[0],
				c.coordinates[1],
				c.coordinates[0]
			)
			// Must be close AND have strictly less than 10 upvotes to show confirm.
			// Once a report has 10 upvotes, we assume it's highly corroborated and
			// don't necessarily bother new users with it unless they're adding novel data.
			return dist < 100 && (c.upvotes || 1) < 10
		}) || []

	// Reverse geocoding to get street name from coordinates
	useEffect(() => {
		const fetchAddress = async () => {
			setLoadingAddress(true)
			try {
				const response = await fetch(
					`https://nominatim.openstreetmap.org/reverse?lat=${selectedCoords[1]}&lon=${selectedCoords[0]}&format=json`
				)
				const data = await response.json()

				// Prefer road name, fallback to display name, or default if not found
				const streetName =
					data?.address?.road ||
					data?.address?.pedestrian ||
					data?.address?.suburb ||
					"Unknown Street"
				setAddress(streetName)
			} catch (error) {
				console.error("Failed to fetch address:", error)
				setAddress("Selected Location")
			} finally {
				setLoadingAddress(false)
			}
		}

		fetchAddress()
	}, [selectedCoords])

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault()
		setSubmitting(true)

		// Simulate network delay for uploading image/data
		setTimeout(() => {
			const newChange: RoadChange = {
				id: Math.random().toString(36).substring(7),
				title,
				description,
				type,
				roadName: address || "Selected Coordinates",
				coordinates: selectedCoords,
				date: "Just now",
				severity: "yellow",
				status: "pending", // Key feature: sent to admin approval
				upvotes: 1
			}

			onSubmit(newChange)
			setSubmitting(false)
		}, 1200)
	}

	return (
		<div className='fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4'>
			<div className='bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-slide-up max-h-[90vh] overflow-y-auto'>
				<div className='flex justify-between items-center p-4 border-b border-gray-100 sticky top-0 bg-white z-10'>
					<h2 className='text-lg font-bold text-gray-900'>Report Road Change</h2>
					<button
						onClick={onClose}
						className='p-2 hover:bg-gray-100 rounded-full transition-colors'
					>
						<X className='w-5 h-5 text-gray-500' />
					</button>
				</div>

				<div className='p-4'>
					{/* Nearby Duplicate Reports Alert */}
					{nearbyReports.length > 0 && (
						<div className='mb-4 bg-orange-50 border border-orange-200 rounded-xl p-3 shadow-sm'>
							<div className='flex items-start mb-2'>
								<AlertCircle className='w-5 h-5 text-orange-600 mr-2 shrink-0' />
								<div>
									<h3 className='font-bold text-orange-900 text-sm'>
										Similar Reports Nearby
									</h3>
									<p className='text-xs text-orange-800 mt-0.5 mb-2'>
										Other users have already reported issues here. You can add your
										confirmation instead of making a new report.
									</p>
								</div>
							</div>
							<div className='space-y-2'>
								{nearbyReports.map((report) => (
									<div
										key={report.id}
										className='bg-white border border-orange-100 p-2 rounded-lg flex items-center justify-between'
									>
										<div>
											<p className='text-sm font-semibold text-gray-800'>
												{report.title}
											</p>
											<p className='text-xs text-gray-500'>
												{report.upvotes || 1} people reported this
											</p>
										</div>
										{onUpvote && (
											<button
												type='button'
												onClick={() => {
													onUpvote(report.id)
													onClose()
												}}
												className='ml-2 px-3 py-1.5 bg-orange-100 hover:bg-orange-200 text-orange-800 text-xs font-bold rounded-lg transition-colors flex items-center'
											>
												<ThumbsUp className='w-3 h-3 mr-1' />
												Confirm
											</button>
										)}
									</div>
								))}
							</div>
							<div className='mt-3 text-center text-xs text-orange-600 font-medium'>
								Or continue to submit a new report below
							</div>
						</div>
					)}

					<form onSubmit={handleSubmit} className='space-y-4'>
						<div className='bg-blue-50 text-blue-800 text-sm p-3 rounded-lg border border-blue-100 flex items-start'>
							<MapPin className='w-4 h-4 mt-0.5 mr-2 shrink-0' />
							<div className='flex-1'>
								<p>Location pinned at:</p>
								{loadingAddress ? (
									<p className='font-bold flex items-center mt-1'>
										<Loader2 className='w-3 h-3 animate-spin mr-1.5' /> fetching street
										name...
									</p>
								) : (
									<p className='font-bold mt-1 text-base'>{address}</p>
								)}
								<p className='text-xs text-blue-600/80 mt-1.5 pt-1.5 border-t border-blue-200/50'>
									Report will be held for admin review.
								</p>
							</div>
						</div>

						<div>
							<label className='block text-sm font-medium text-gray-700 mb-1'>
								Title
							</label>
							<input
								required
								type='text'
								placeholder='e.g. Left turn forbidden at intersection'
								className='w-full bg-gray-50 border border-gray-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500'
								value={title}
								onChange={(e) => setTitle(e.target.value)}
							/>
						</div>

						<div>
							<label className='block text-sm font-medium text-gray-700 mb-1'>
								Change Type
							</label>
							<select
								className='w-full bg-gray-50 border border-gray-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500'
								value={type}
								onChange={(e) => setType(e.target.value as any)}
							>
								<option value='one-way'>Became One-Way</option>
								<option value='turn-restriction'>New Turn Restriction</option>
								<option value='speed-limit'>Speed Limit Changed</option>
								<option value='closed'>Road Closed</option>
								<option value='bus-lane'>New Bus Lane</option>
								<option value='parking-restriction'>Parking Restricted</option>
								<option value='traffic-light'>New Traffic Light</option>
								<option value='speed-bump'>New Speed Bump</option>
								<option value='road-works'>Road Works / Construction</option>
								<option value='pedestrian-crossing'>New Pedestrian Crossing</option>
							</select>
						</div>

						<div>
							<label className='block text-sm font-medium text-gray-700 mb-1'>
								Description
							</label>
							<textarea
								required
								rows={3}
								placeholder='Add details so our moderators can verify...'
								className='w-full bg-gray-50 border border-gray-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500'
								value={description}
								onChange={(e) => setDescription(e.target.value)}
							/>
						</div>

						<div className='border-2 border-dashed border-gray-200 rounded-xl p-6 flex flex-col items-center justify-center text-gray-500 bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer relative'>
							<input
								type='file'
								className='absolute inset-0 opacity-0 cursor-pointer'
								accept='image/*'
							/>
							<Upload className='w-6 h-6 mb-2 text-gray-400' />
							<p className='text-sm font-medium text-gray-700'>Upload Photo proof</p>
							<p className='text-xs text-gray-400 mt-1'>Improves approval speed</p>
						</div>

						<button
							type='submit'
							disabled={submitting}
							className='w-full py-3.5 bg-black text-white rounded-xl font-medium focus:ring-4 focus:ring-gray-300 transition-shadow disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center'
						>
							{submitting ? (
								<span className='w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin'></span>
							) : (
								"Submit for Moderation"
							)}
						</button>
					</form>
				</div>
			</div>
		</div>
	)
}
