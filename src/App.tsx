import { useState, useEffect } from "react"
import { RoadChange, formatRoadChangeDate } from "./data/roadChanges"
import MapboxMap from "./features/map/MapboxMap"
import AlertBar from "./features/alerts/AlertBar"
import Feed from "./features/feed/Feed"
import ReportModal from "./features/report/ReportModal"
import AdminDashboard from "./features/admin/AdminDashboard"
import LoginModal from "./features/auth/LoginModal"
import { MapPin, List, Plus, ShieldAlert, LogOut, Filter } from "lucide-react"

const API_URL = ""

export type DateFilter = "all" | "today" | "last-3-days" | "last-week" | "last-month"

export default function App() {
	// Simple routing for demo purposes without react-router
	const isReviewerRoute = window.location.pathname === "/reviewer"

	const [isAuthenticated, setIsAuthenticated] = useState(false)

	const [activeTab, setActiveTab] = useState<"map" | "feed" | "admin">("map")
	const [userRole, setUserRole] = useState<"user" | "admin">("user")
	const [userLocation, setUserLocation] = useState<[number, number] | null>(null)

	const [dateFilter, setDateFilter] = useState<DateFilter>("all")

	// Map Pin Drop States
	const [isSelectingLocation, setIsSelectingLocation] = useState(false)
	const [selectedReportCoords, setSelectedReportCoords] = useState<
		[number, number] | null
	>(null)

	const [activeChange, setActiveChange] = useState<RoadChange | null>(null)
	const [nearbyAlert, setNearbyAlert] = useState<RoadChange | null>(null)

	// State for managing mock reports locally
	const [changesList, setChangesList] = useState<RoadChange[]>([])
	const [showReportForm, setShowReportForm] = useState(false)
	const [showToast, setShowToast] = useState(false)
	const [toastMessage, setToastMessage] = useState("")

	const getDateAgeInDays = (date?: string) => {
		if (!date) return null

		const trimmedDate = date.trim()
		const lowerDate = trimmedDate.toLowerCase()

		if (["i̇ndi", "indi", "just now", "bu gün", "today"].includes(lowerDate)) {
			return 0
		}

		if (["dünən", "yesterday"].includes(lowerDate)) {
			return 1
		}

		const dayMatch = lowerDate.match(/(\d+)\s*(?:days?\s*ago|days?|gün(?:\s*əvvəl)?)/)
		if (dayMatch) {
			return Number(dayMatch[1])
		}

		const parsedDate = new Date(trimmedDate)
		if (!Number.isNaN(parsedDate.getTime()) && /\d{4}-\d{2}-\d{2}|t\d{2}:\d{2}/i.test(trimmedDate)) {
			const today = new Date()
			const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
			const parsedStart = new Date(
				parsedDate.getFullYear(),
				parsedDate.getMonth(),
				parsedDate.getDate()
			)
			return Math.max(
				0,
				Math.floor((todayStart.getTime() - parsedStart.getTime()) / (1000 * 60 * 60 * 24))
			)
		}

		return null
	}

	// Fetch rules from backend
	useEffect(() => {
		fetch(`${API_URL}/api/changes`)
			.then((res) => res.json())
			.then((data) => {
				if (Array.isArray(data) && data.length > 0) {
					// Merge backend data with mock data (or replace if you prefer)
					// We'll replace mock objects if they exist, else append
					setChangesList((prev) => {
						const mockMap = new Map(prev.map((p) => [p.id, p]))
						data.forEach((d) => mockMap.set(d.id, d))
						return Array.from(mockMap.values())
					})
				}
			})
			.catch((err) => console.error("Failed to fetch backend changes:", err))
	}, [])

	// Real Geolocation
	useEffect(() => {
		if ("geolocation" in navigator) {
			const watchId = navigator.geolocation.watchPosition(
				(position) =>
					setUserLocation([position.coords.longitude, position.coords.latitude]),
				(error) => console.warn("Geolocation blocked or failed:", error),
				{ enableHighAccuracy: true, maximumAge: 10000 }
			)
			// Mock finding user near Baku eventually if location fails for demo
			setTimeout(() => {
				if (!userLocation) setUserLocation([49.845, 40.375])
			}, 5000)
			return () => navigator.geolocation.clearWatch(watchId)
		} else {
			setUserLocation([49.845, 40.375]) // Fallback
		}
	}, [])

	useEffect(() => {
		// Example check if near an alert (mocked here, real app calculates Haversine distance)
		const timer = setTimeout(() => {
			setNearbyAlert(
				changesList.find((c) => c.status === "approved" && c.severity === "red") || null
			)
		}, 3000)
		return () => clearTimeout(timer)
	}, [changesList])

	const handleReportSubmit = async (newChange: RoadChange) => {
		try {
			await fetch(`${API_URL}/api/changes`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(newChange)
			})
		} catch (error) {
			console.error("Failed to save to backend", error)
		}

		setChangesList([newChange, ...changesList])
		setShowReportForm(false)
		setToastMessage("Hesabat admin yoxlanışı üçün göndərildi")
		setShowToast(true)
		setTimeout(() => setShowToast(false), 4000)
	}

	const handleUpvote = async (id: string) => {
		try {
			await fetch(`${API_URL}/api/changes/${id}/upvote`, {
				method: "PATCH"
			})
		} catch (error) {
			console.error("Failed to upvote on backend", error)
		}

		setChangesList((prev) =>
			prev.map((c) => (c.id === id ? { ...c, upvotes: (c.upvotes || 1) + 1 } : c))
		)
		setToastMessage("Təsdiq etdiyiniz üçün təşəkkürlər.")
		setShowToast(true)
		setTimeout(() => setShowToast(false), 4000)
	}

	const handleApprove = async (id: string) => {
		try {
			await fetch(`${API_URL}/api/changes/${id}/status`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ status: "approved" })
			})
			setChangesList((prev) =>
				prev.map((c) => (c.id === id ? { ...c, status: "approved" } : c))
			)
		} catch (e) {
			console.error("Failed to approve", e)
		}
	}

	const handleReject = async (id: string) => {
		try {
			await fetch(`${API_URL}/api/changes/${id}/status`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ status: "rejected" })
			})
			setChangesList((prev) => prev.filter((c) => c.id !== id))
		} catch (e) {
			console.error("Failed to reject", e)
		}
	}

	const filteredByDate = changesList.filter((change) => {
		if (dateFilter === "all") return true

		const ageInDays = getDateAgeInDays(change.date)
		if (ageInDays === null) return false

		if (dateFilter === "today") {
			return ageInDays === 0
		}

		if (dateFilter === "last-3-days") {
			return ageInDays <= 3
		}

		if (dateFilter === "last-week") {
			return ageInDays <= 7
		}

		if (dateFilter === "last-month") {
			return ageInDays <= 30
		}

		return true
	})

	return (
		<div className='flex flex-col h-screen w-screen bg-gray-50 overflow-hidden font-sans text-gray-900'>
			{/* Header */}
			<header className='px-4 py-3 bg-white shadow-sm flex flex-col z-10 relative space-y-3'>
				<div className='flex items-center justify-between'>
					<div className='flex items-center space-x-2'>
						<div className='w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-white font-bold'>
							R
						</div>
						<h1 className='text-xl flex items-center font-semibold tracking-tight'>
							RoadChange
						</h1>
					</div>
					<div className='flex items-center space-x-2 sm:space-x-4'>
						<div className='flex space-x-1 bg-gray-100 p-1 rounded-lg'>
							<button
								onClick={() => setActiveTab("map")}
								className={`px-3 py-1 flex items-center space-x-1 rounded-md text-sm font-medium transition-colors ${activeTab === "map" ? "bg-white shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
							>
								<MapPin className='w-4 h-4' />
								<span className='hidden sm:inline'>Xəritə</span>
							</button>
							<button
								onClick={() => setActiveTab("feed")}
								className={`px-3 py-1 flex items-center space-x-1 rounded-md text-sm font-medium transition-colors ${activeTab === "feed" ? "bg-white shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
							>
								<List className='w-4 h-4' />
								<span className='hidden sm:inline'>Lent</span>
							</button>
							{userRole === "admin" && (
								<button
									onClick={() => setActiveTab("admin")}
									className={`px-3 py-1 flex items-center space-x-1 rounded-md text-sm font-medium transition-colors ${activeTab === "admin" ? "bg-white shadow-sm text-blue-600" : "text-gray-500 hover:text-gray-700"}`}
								>
									<ShieldAlert className='w-4 h-4' />
									<span className='hidden sm:inline'>Yoxlama</span>
									{changesList.filter((c) => c.status === "pending").length > 0 && (
										<span className='ml-1 w-2 h-2 bg-red-500 rounded-full animate-pulse' />
									)}
								</button>
							)}
						</div>
						{userRole === "admin" && (
							<>
								<div className='h-6 w-px bg-gray-200 hidden sm:block'></div>
								<button
									onClick={() => {
										setUserRole("user")
										setIsAuthenticated(false)
										window.location.href = "/"
									}}
									className='text-xs font-semibold text-gray-500 hover:text-gray-800 flex items-center'
								>
									<LogOut className='w-4 h-4 mr-1' />
									<span className='hidden sm:inline'>Çıxış</span>
								</button>
							</>
						)}
					</div>
				</div>

				{(activeTab === "map" || activeTab === "feed") && (
					<div className='flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-hide'>
						<Filter className='w-4 h-4 text-gray-400 shrink-0 mr-1' />
						{[
							{ id: "all", label: "Bütün yeniliklər" },
							{ id: "today", label: "Bu gün" },
							{ id: "last-3-days", label: "Son 3 gün" },
							{ id: "last-week", label: "Son 1 həftə" },
							{ id: "last-month", label: "Son 1 ay" }
						].map((filter) => (
							<button
								key={filter.id}
								onClick={() => setDateFilter(filter.id as DateFilter)}
								className={`whitespace-nowrap px-3 py-1.5 text-xs font-semibold rounded-full transition-colors border ${
									dateFilter === filter.id
										? "bg-blue-600 text-white border-blue-600 shadow-sm"
										: "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
								}`}
							>
								{filter.label}
							</button>
						))}
					</div>
				)}
			</header>

			{/* Floating Alert Area for current location risk */}
			{nearbyAlert && activeTab === "map" && (
				<div className='absolute top-16 left-0 right-0 z-20 px-4 pt-2'>
					<AlertBar change={nearbyAlert} onClose={() => setNearbyAlert(null)} />
				</div>
			)}

			{/* Main Content Area */}
			<main className='flex-1 relative flex flex-col min-h-0'>
				{activeTab === "map" ? (
					<div className='absolute inset-0'>
						<MapboxMap
							changes={filteredByDate.filter((c) => c.status === "approved")}
							userLocation={userLocation}
							onSelectChange={setActiveChange}
							isSelectingLocation={isSelectingLocation}
							onCancelSelection={() => setIsSelectingLocation(false)}
							onConfirmLocation={(coords) => {
								setSelectedReportCoords(coords)
								setIsSelectingLocation(false)
								setShowReportForm(true)
							}}
						/>
					</div>
				) : activeTab === "feed" ? (
					<div className='h-full overflow-y-auto w-full max-w-2xl mx-auto'>
						<Feed
							changes={filteredByDate.filter((c) => c.status === "approved")}
							onSelect={(change) => {
								setActiveChange(change)
								setActiveTab("map")
							}}
						/>
					</div>
				) : (
					<AdminDashboard
						pendingChanges={changesList.filter((c) => c.status === "pending")}
						onApprove={handleApprove}
						onReject={handleReject}
					/>
				)}

				{/* Selected Change Detail Overlay */}
				{activeChange && activeTab === "map" && (
					<div className='absolute bottom-0 left-0 right-0 p-4 bg-white rounded-t-2xl shadow-[0_-5px_15px_rgba(0,0,0,0.1)] z-20 animate-slide-up transition-transform duration-300'>
						<div className='w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4' />

						<div className='flex justify-between items-start mb-2'>
							<h2 className='text-lg font-bold'>{activeChange.title}</h2>
							<span
								className={`px-2 py-1 text-xs font-semibold rounded ${
									activeChange.severity === "red"
										? "bg-red-100 text-red-700"
										: activeChange.severity === "yellow"
											? "bg-yellow-100 text-yellow-800"
											: "bg-green-100 text-green-700"
								}`}
							>
								{formatRoadChangeDate(activeChange.date)}
							</span>
						</div>

						<p className='text-gray-600 text-sm mb-4'>{activeChange.description}</p>

						<button
							className='w-full py-3 bg-black text-white rounded-xl font-medium focus:ring-4 focus:ring-gray-300 transition-shadow'
							onClick={() => setActiveChange(null)}
						>
							Bağla
						</button>
					</div>
				)}

				{/* Floating Action Button for Reporting */}
				{!isSelectingLocation && (
					<button
						onClick={() => {
							setActiveTab("map")
							setIsSelectingLocation(true)
						}}
						className='absolute bottom-6 right-4 z-30 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg transition-transform hover:scale-105 flex items-center justify-center'
					>
						<Plus className='w-6 h-6' />
					</button>
				)}

				{/* Success Toast */}
				{showToast && (
					<div className='absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white px-6 py-3 rounded-full shadow-xl text-sm font-medium animate-slide-up flex items-center space-x-2'>
						<div className='w-2 h-2 bg-green-400 rounded-full animate-pulse' />
						<span>{toastMessage}</span>
					</div>
				)}

				{/* Modals */}
				{showReportForm && selectedReportCoords && (
					<ReportModal
						selectedCoords={selectedReportCoords}
						onClose={() => setShowReportForm(false)}
						onSubmit={handleReportSubmit}
						existingChanges={changesList}
						onUpvote={handleUpvote}
					/>
				)}

				{isReviewerRoute && !isAuthenticated && (
					<LoginModal
						onClose={() => {
							// If they close without logging in, maybe redirect them to home
							window.location.href = "/"
						}}
						onLogin={(role) => {
							if (role === "admin") {
								setIsAuthenticated(true)
								setUserRole("admin")
								setActiveTab("admin")
							}
						}}
					/>
				)}
			</main>
		</div>
	)
}
