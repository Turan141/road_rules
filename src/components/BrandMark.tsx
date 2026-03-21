interface BrandMarkProps {
  className?: string
}

export default function BrandMark({ className = "w-9 h-9" }: BrandMarkProps) {
  return (
    <svg
      viewBox="0 0 256 256"
      aria-hidden="true"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="brandmark-bg" x1="36" y1="24" x2="220" y2="232" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0F172A" />
          <stop offset="0.55" stopColor="#1D4ED8" />
          <stop offset="1" stopColor="#22C55E" />
        </linearGradient>
        <linearGradient id="brandmark-road" x1="92" y1="44" x2="164" y2="212" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F8FAFC" />
          <stop offset="1" stopColor="#DCE8F8" />
        </linearGradient>
      </defs>
      <rect x="12" y="12" width="232" height="232" rx="64" fill="url(#brandmark-bg)" />
      <path
        d="M128 34C96.52 34 71 59.52 71 91C71 132.56 120.08 183.57 126.03 189.6C127.12 190.71 128.88 190.71 129.97 189.6C135.92 183.57 185 132.56 185 91C185 59.52 159.48 34 128 34Z"
        fill="url(#brandmark-road)"
      />
      <path
        d="M109 67C111.76 67 114 69.24 114 72V124C114 126.76 111.76 129 109 129H101C98.24 129 96 126.76 96 124V72C96 69.24 98.24 67 101 67H109Z"
        fill="#0F172A"
        fillOpacity="0.82"
      />
      <path
        d="M155 67C157.76 67 160 69.24 160 72V124C160 126.76 157.76 129 155 129H147C144.24 129 142 126.76 142 124V72C142 69.24 144.24 67 147 67H155Z"
        fill="#0F172A"
        fillOpacity="0.82"
      />
      <path
        d="M128 68C130.76 68 133 70.24 133 73V84C133 86.76 130.76 89 128 89C125.24 89 123 86.76 123 84V73C123 70.24 125.24 68 128 68Z"
        fill="#F97316"
      />
      <path
        d="M128 97C130.76 97 133 99.24 133 102V113C133 115.76 130.76 118 128 118C125.24 118 123 115.76 123 113V102C123 99.24 125.24 97 128 97Z"
        fill="#F97316"
      />
      <circle cx="128" cy="207" r="17" fill="#F97316" />
      <path d="M121 207L128 200L135 207L128 214L121 207Z" fill="#FFF7ED" />
    </svg>
  )
}
