import React, { useState, useEffect } from "react"
import { X, Upload, MapPin, Loader2, AlertCircle } from "lucide-react"
import { RoadChange } from "../../data/roadChanges"

interface ReportModalProps {
	selectedCoords: [number, number] | null
	onClose: () => void
	onSubmit: (newChange: RoadChange) => Promise<void>
	existingChanges?: RoadChange[]
	onUpvote?: (id: string) => Promise<void>
}

const MAX_IMAGE_SIZE_BYTES = 3 * 1024 * 1024
const ALLOWED_IMAGE_TYPES = new Set([
	"image/png",
	"image/jpeg",
	"image/webp",
	"image/gif"
])

export default function ReportModal({
	selectedCoords,
	onClose,
	onSubmit,
	existingChanges = [],
	onUpvote
}: ReportModalProps) {
	const [title, setTitle] = useState("")
	const [description, setDescription] = useState("")
	const [address, setAddress] = useState<string | null>(null)
	const [imageBase64, setImageBase64] = useState<string | null>(null)
	const [loadingAddress, setLoadingAddress] = useState(false)
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [submitError, setSubmitError] = useState<string | null>(null)

	const getDistanceMeters = (
		firstPoint: [number, number],
		secondPoint: [number, number]
	) => {
		const [firstLongitude, firstLatitude] = firstPoint
		const [secondLongitude, secondLatitude] = secondPoint
		const earthRadius = 6371e3
		const firstLatRadians = (firstLatitude * Math.PI) / 180
		const secondLatRadians = (secondLatitude * Math.PI) / 180
		const latitudeDelta = ((secondLatitude - firstLatitude) * Math.PI) / 180
		const longitudeDelta = ((secondLongitude - firstLongitude) * Math.PI) / 180

		const a =
			Math.sin(latitudeDelta / 2) * Math.sin(latitudeDelta / 2) +
			Math.cos(firstLatRadians) *
				Math.cos(secondLatRadians) *
				Math.sin(longitudeDelta / 2) *
				Math.sin(longitudeDelta / 2)

		const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
		return earthRadius * c
	}

	const getDisplayNameParts = (displayName?: string) =>
		displayName
			?.split(",")
			.map((part) => part.trim())
			.filter(Boolean) || []

	const getFirstDefined = (...values: Array<string | null | undefined>) =>
		values.find((value) => value && value.trim().length > 0) || null

	const getDisplayNameFallback = (displayName?: string) => {
		const usefulParts = getDisplayNameParts(displayName).filter(
			(part) => !/^(azerbaijan|azərbaycan)$/i.test(part)
		)

		if (usefulParts.length === 0) return null
		return usefulParts.slice(0, 3).join(", ")
	}

	const formatAddress = (addressData?: Record<string, string>, displayName?: string) => {
		if (!addressData) return getDisplayNameFallback(displayName)

		const displayParts = getDisplayNameParts(displayName)
		const inferredHouseNumber =
			displayParts.find((part) => /^\d+[a-zA-Z\/-]*$/i.test(part)) || undefined
		const street = getFirstDefined(
			addressData.road,
			addressData.residential,
			addressData.pedestrian,
			addressData.footway,
			addressData.path,
			addressData.service,
			addressData.cycleway,
			addressData.unclassified,
			addressData.construction
		)
		const houseNumber = getFirstDefined(addressData.house_number, inferredHouseNumber)
		const landmark = getFirstDefined(
			addressData.amenity,
			addressData.building,
			addressData.shop,
			addressData.office,
			addressData.tourism,
			addressData.leisure
		)
		const area = getFirstDefined(
			addressData.neighbourhood,
			addressData.suburb,
			addressData.city_district,
			addressData.quarter,
			addressData.borough
		)
		const locality = getFirstDefined(
			addressData.city,
			addressData.town,
			addressData.village,
			addressData.municipality
		)

		if (street) {
			const streetLine = houseNumber ? `${street} ${houseNumber}` : street
			const detail = [landmark, area, locality].find(
				(part) => part && !streetLine.toLowerCase().includes(part.toLowerCase())
			)

			return detail ? `${streetLine}, ${detail}` : streetLine
		}

		return (
			getFirstDefined(landmark, area, locality) || getDisplayNameFallback(displayName)
		)
	}

	useEffect(() => {
		if (selectedCoords) {
			const fetchAddress = async () => {
				setLoadingAddress(true)
				try {
					const [longitude, latitude] = selectedCoords
					const response = await fetch(
						`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=az&zoom=18&addressdetails=1`
					)
					const data = await response.json()
					const formattedAddress = formatAddress(data.address, data.display_name)

					setAddress(
						formattedAddress ||
							data.name ||
							getDisplayNameFallback(data.display_name) ||
							"Naməlum küçə"
					)
				} catch (error) {
					console.error("Məkan alınarkən xəta:", error)
					setAddress("Məkan alınmadı")
				}
				setLoadingAddress(false)
			}
			fetchAddress()
		} else {
			setTitle("")
			setDescription("")
			setAddress(null)
			setSubmitError(null)
			setImageBase64(null)
		}
	}, [selectedCoords])

	if (!selectedCoords) return null

	const duplicates = existingChanges
		.filter((change) => change.status === "pending" || change.status === "approved")
		.map((change) => ({
			change,
			distance: getDistanceMeters(selectedCoords, change.coordinates)
		}))
		.filter(({ distance }) => distance <= 150)
		.sort((firstItem, secondItem) => firstItem.distance - secondItem.distance)

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0]
		if (file) {
			if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
				setSubmitError("Yalnız PNG, JPG, WEBP və GIF faylları qəbul olunur.")
				e.target.value = ""
				return
			}

			if (file.size > MAX_IMAGE_SIZE_BYTES) {
				setSubmitError("Şəkil ölçüsü 3 MB-dan böyük olmamalıdır.")
				e.target.value = ""
				return
			}

			setSubmitError(null)
			const reader = new FileReader()
			reader.onloadend = () => {
				setImageBase64(reader.result as string)
			}
			reader.readAsDataURL(file)
		}
	}

	const handleSubmit = async (e?: React.FormEvent | React.MouseEvent) => {
		e?.preventDefault()
		if (!selectedCoords) return

		setIsSubmitting(true)
		setSubmitError(null)

		const newChange: RoadChange = {
			id: globalThis.crypto?.randomUUID?.().replace(/-/g, "") ?? `${Date.now()}report`,
			title: title.trim(),
			description: description.trim(),
			type: "other",
			roadName: address || "Seçilmiş Koordinatlar",
			coordinates: selectedCoords,
			date: "İndi",
			severity: "yellow",
			status: "pending",
			upvotes: 1,
			image: imageBase64 || undefined
		}

		try {
			await onSubmit(newChange)
			onClose()
		} catch (error) {
			console.error("Hesabat göndərilərkən xəta baş verdi:", error)
			setSubmitError("Hesabatı göndərmək mümkün olmadı. Zəhmət olmasa yenidən cəhd edin.")
		} finally {
			setIsSubmitting(false)
		}
	}

	const handleDuplicateUpvote = async (id: string) => {
		if (!onUpvote) {
			return
		}

		try {
			await onUpvote(id)
		} catch (error) {
			console.error("Failed to confirm duplicate report", error)
			setSubmitError("Təsdiq göndərilə bilmədi. Zəhmət olmasa yenidən cəhd edin.")
		}
	}

	return (
		<div className='fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4'>
			<div className='bg-white rounded-2xl w-full max-w-lg shadow-xl flex flex-col max-h-[90vh]'>
				<div className='flex justify-between items-center p-6 border-b shrink-0'>
					<h2 className='text-2xl font-bold text-gray-800'>Yeni Dəyişikliyi Bildir</h2>
					<button
						onClick={onClose}
						className='text-gray-500 hover:text-gray-700 hover:bg-gray-100 p-2 rounded-full transition-colors'
					>
						<X className='w-6 h-6' />
					</button>
				</div>

				<div className='p-6 overflow-y-auto flex-1'>
					{submitError && (
						<div className='mb-4 p-3 bg-red-50 text-red-700 rounded-lg flex items-center'>
							<AlertCircle className='w-5 h-5 mr-2 shrink-0' />
							<p className='text-sm'>{submitError}</p>
						</div>
					)}

					{(() => {
						if (duplicates.length === 0) return null

						return (
							<div className='mb-6 p-4 bg-orange-50 rounded-xl border border-orange-200'>
								<div className='flex items-start mb-2'>
									<AlertCircle className='w-5 h-5 text-orange-500 mt-0.5 mr-2 shrink-0' />
									<div>
										<h4 className='font-semibold text-orange-800'>
											Bu ərazidə artıq bildirilmiş dəyişikliklər var!
										</h4>
										<p className='text-sm text-orange-600 mt-1'>
											Sizin bildirmək istədiyiniz dəyişiklik aşağıdakılardan biri ola
											bilərmi?
										</p>
									</div>
								</div>

								<div className='mt-3 space-y-2 pl-7'>
									{duplicates.map(({ change, distance }) => (
										<div
											key={change.id}
											className='bg-white p-3 rounded-lg border border-orange-100 shadow-sm flex flex-col justify-between'
										>
											<div className='flex justify-between'>
												<span className='font-medium text-gray-800 text-sm'>
													{change.title}
												</span>
												<span className='text-xs font-semibold px-2 py-1 bg-orange-100 text-orange-700 rounded-full'>
													{change.status === "approved" ? "Təsdiqlənib" : "Gözləmədədir"}
												</span>
											</div>
											<div className='flex flex-col mt-2'>
												<span className='text-sm text-gray-500 line-clamp-1'>
													{change.description}
												</span>
												<div className='flex items-center justify-between mt-2'>
													<div className='flex items-center text-xs text-orange-600 font-medium bg-orange-50 px-2 py-1 rounded whitespace-nowrap'>
														<MapPin className='w-3 h-3 mr-1' />
														{Math.round(distance)} m yaxınlıqda
													</div>
													{onUpvote && change.status === "pending" && (
														<button
															type='button'
															onClick={() => {
																void handleDuplicateUpvote(change.id)
															}}
															className='text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1.5 rounded-full font-medium transition-colors'
														>
															Mən də təsdiqləyirəm ({change.upvotes || 1})
														</button>
													)}
												</div>
											</div>
										</div>
									))}
								</div>

								{duplicates.length > 0 && (
									<div className='mt-3 pl-7 text-xs text-orange-600 font-medium'>
										Yaxud aşağıdan yeni hesabat göndərməyə davam edin
									</div>
								)}
							</div>
						)
					})()}
					<form onSubmit={handleSubmit} className='space-y-4'>
						<div className='bg-blue-50 text-blue-800 text-sm p-3 rounded-lg border border-blue-100 flex items-start'>
							<MapPin className='w-4 h-4 mt-0.5 mr-2 shrink-0' />
							<div className='flex-1'>
								<p>Məkan qeydə alındı:</p>
								{loadingAddress ? (
									<p className='font-bold flex items-center mt-1'>
										<Loader2 className='w-3 h-3 animate-spin mr-1.5' /> küçə adı alınır...
									</p>
								) : (
									<p className='font-bold mt-1 text-base'>{address}</p>
								)}
								<p className='text-xs text-blue-600/80 mt-1.5 pt-1.5 border-t border-blue-200/50'>
									Hesabat admin yoxlanışı üçün saxlanılacaq.
								</p>
							</div>
						</div>

						<div>
							<label className='block text-sm font-medium text-gray-700 mb-1'>
								Başlıq
							</label>
							<input
								type='text'
								required
								value={title}
								onChange={(e) => setTitle(e.target.value)}
								maxLength={120}
								className='w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors'
								placeholder='Məsələn: Təbriz küçəsi tək yönlü oldu'
							/>
						</div>

						<div>
							<label className='block text-sm font-medium text-gray-700 mb-1'>
								Ətraflı Məlumat
							</label>
							<textarea
								required
								value={description}
								onChange={(e) => setDescription(e.target.value)}
								maxLength={1000}
								className='w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors'
								rows={3}
								placeholder='Vəziyyəti ətraflı təsvir edin...'
							/>
						</div>

						<div>
							<label className='block text-sm font-medium text-gray-700 mb-1'>
								Sübut (İstəyə bağlı)
							</label>
							<div className='mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-xl hover:bg-gray-50 transition-colors relative'>
								<div className='space-y-1 text-center flex flex-col items-center justify-center p-4 w-full'>
									<input
										type='file'
										className='absolute inset-0 w-full h-full opacity-0 cursor-pointer'
										accept='image/*'
										onChange={handleFileChange}
									/>
									{imageBase64 ? (
										<div className='w-full h-32 rounded-lg overflow-hidden flex items-center justify-center bg-black/5'>
											<img
												src={imageBase64}
												className='h-full w-auto object-contain'
												alt='Ön baxış'
											/>
										</div>
									) : (
										<>
											<Upload className='w-6 h-6 mb-2 text-gray-400' />
											<p className='text-sm font-medium text-gray-700'>
												Foto sübutu yüklə
											</p>
											<p className='text-xs text-gray-400 mt-1'>
												Təsdiqlənmə sürətini artırır, maksimum 3 MB
											</p>
										</>
									)}
								</div>
							</div>
						</div>
					</form>
				</div>

				<div className='p-6 border-t bg-gray-50 rounded-b-2xl shrink-0 space-y-3'>
					<button
						onClick={handleSubmit}
						disabled={isSubmitting}
						className='w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors shadow-sm focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center'
					>
						{isSubmitting ? (
							<>
								<Loader2 className='w-5 h-5 mr-2 animate-spin' />
								Göndərilir...
							</>
						) : (
							"Dəyişikliyi Göndər"
						)}
					</button>
					<button
						onClick={onClose}
						disabled={isSubmitting}
						className='w-full py-3 px-4 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl font-medium transition-colors disabled:opacity-70'
					>
						Ləğv Et
					</button>
				</div>
			</div>
		</div>
	)
}
