import { useState, useEffect } from "react"
import Map, { Marker, NavigationControl, GeolocateControl } from "react-map-gl/maplibre"
import type { ViewState } from "react-map-gl/maplibre"
import "maplibre-gl/dist/maplibre-gl.css"
import { RoadChange } from "../../data/roadChanges"
import { AlertTriangle, Info, MapPin, Crosshair } from "lucide-react"

interface MapboxMapProps {
	changes: RoadChange[]
	userLocation: [number, number] | null
	onSelectChange: (change: RoadChange) => void
	isSelectingLocation?: boolean
	onConfirmLocation?: (coords: [number, number]) => void
	onCancelSelection?: () => void
}

export default function MapboxMap({
	changes,
	userLocation,
	onSelectChange,
	isSelectingLocation,
	onConfirmLocation,
	onCancelSelection
}: MapboxMapProps) {
	const [viewState, setViewState] = useState<Partial<ViewState>>({
		longitude: 49.88,
		latitude: 40.38,
		zoom: 12
	})
	const [hasPannedToLocation, setHasPannedToLocation] = useState(false)

	// Automatically pan to the user's location exactly once when it's established
	useEffect(() => {
		if (userLocation && !hasPannedToLocation) {
			setViewState((prev) => ({
				...prev,
				longitude: userLocation[0],
				latitude: userLocation[1],
				zoom: 14 // Zoom in slightly when location is found
			}))
			setHasPannedToLocation(true)
		}
	}, [userLocation, hasPannedToLocation])

	return (
		<div className='absolute inset-0 w-full h-full'>
			<Map
				{...viewState}
				onMove={(evt) => setViewState(evt.viewState)}
				mapStyle='https://basemaps.cartocdn.com/gl/positron-gl-style/style.json'
				style={{ width: "100%", height: "100%" }}
			>
				<GeolocateControl position='top-right' />
				<NavigationControl position='top-right' />

				{/* User Location */}
				{userLocation && (
					<Marker longitude={userLocation[0]} latitude={userLocation[1]} anchor='center'>
						<div className='w-5 h-5 bg-blue-500 border-2 border-white rounded-full animate-pulse shadow-lg' />
					</Marker>
				)}

				{/* Road Changes */}
				{changes.map((change) => (
					<Marker
						key={change.id}
						longitude={change.coordinates[0]}
						latitude={change.coordinates[1]}
						anchor='bottom'
						onClick={(e) => {
							e.originalEvent.stopPropagation()
							onSelectChange(change)
						}}
					>
						<div
							className={`cursor-pointer group flex flex-col items-center transition-transform hover:scale-110 ${
								change.severity === "red" ? "text-red-500" : "text-yellow-500"
							}`}
						>
							<div className='px-2 py-1 bg-white rounded shadow text-xs font-bold mb-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap text-gray-800'>
								{change.title}
							</div>
							{change.severity === "red" ? (
								<AlertTriangle className='w-8 h-8 drop-shadow-md fill-white' />
							) : (
								<Info className='w-8 h-8 drop-shadow-md fill-white' />
							)}
						</div>
					</Marker>
				))}
			</Map>

			{/* Custom Location Selection Overlay */}
			{isSelectingLocation && (
				<>
					<div className='absolute inset-0 pointer-events-none flex items-center justify-center z-10 pb-8'>
						<MapPin className='w-12 h-12 text-blue-600 drop-shadow-2xl animate-bounce' />
					</div>
					<div className='absolute bottom-10 left-1/2 transform -translate-x-1/2 z-20 flex space-x-3 w-max'>
						<button
							onClick={onCancelSelection}
							className='px-6 py-3.5 bg-white text-gray-800 font-bold rounded-full shadow-lg hover:bg-gray-50 border border-gray-200 transition-colors'
						>
							Cancel
						</button>
						<button
							onClick={() => {
								if (onConfirmLocation && viewState.longitude && viewState.latitude) {
									onConfirmLocation([viewState.longitude, viewState.latitude])
								}
							}}
							className='px-8 py-3.5 bg-blue-600 text-white font-bold rounded-full shadow-[0_4px_14px_rgba(37,99,235,0.4)] hover:bg-blue-700 transition-colors flex items-center'
						>
							<Crosshair className='w-5 h-5 mr-2' />
							Confirm Location
						</button>
					</div>
				</>
			)}
		</div>
	)
}
