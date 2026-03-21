import React, { useState } from "react"
import { X, Lock } from "lucide-react"

interface LoginModalProps {
	onClose: () => void
	onLogin: (role: "admin" | "user") => void
}

export default function LoginModal({ onClose, onLogin }: LoginModalProps) {
	const [email, setEmail] = useState("")
	const [password, setPassword] = useState("")
	const [error, setError] = useState("")

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault()
		// Hardcoded mock credentials
		if (email === "admin@roadchange.com" && password === "admin") {
			onLogin("admin")
		} else {
			setError("Yanlış məlumat.")
		}
	}

	return (
		<div className='fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4'>
			<div className='bg-white w-full max-w-sm rounded-2xl shadow-xl overflow-hidden animate-slide-up'>
				<div className='flex justify-between items-center p-4 border-b border-gray-100'>
					<h2 className='text-lg font-bold text-gray-900 flex items-center'>
						<Lock className='w-5 h-5 mr-2 text-gray-500' /> İnzibati Giriş
					</h2>
					<button
						onClick={onClose}
						className='p-2 hover:bg-gray-100 rounded-full transition-colors'
					>
						<X className='w-5 h-5 text-gray-500' />
					</button>
				</div>

				<form onSubmit={handleSubmit} className='p-6 space-y-4'>
					{error && (
						<div className='p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg'>
							{error}
						</div>
					)}

					<div>
						<label className='block text-sm font-medium text-gray-700 mb-1'>E-poçt</label>
						<input
							required
							type='email'
							placeholder='admin@roadchange.com'
							className='w-full bg-gray-50 border border-gray-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500'
							value={email}
							onChange={(e) => setEmail(e.target.value)}
						/>
					</div>

					<div>
						<label className='block text-sm font-medium text-gray-700 mb-1'>Şifrə</label>
						<input
							required
							type='password'
							placeholder='••••••••'
							className='w-full bg-gray-50 border border-gray-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500'
							value={password}
							onChange={(e) => setPassword(e.target.value)}
						/>
					</div>

					<button
						type='submit'
						className='w-full mt-2 py-3 bg-black text-white rounded-xl font-bold focus:ring-4 focus:ring-gray-300 transition-shadow'
					>
						Daxil ol
					</button>
				</form>
			</div>
		</div>
	)
}
