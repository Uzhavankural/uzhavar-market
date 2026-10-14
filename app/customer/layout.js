import CustomerBottomNav from '../../components/CustomerBottomNav'

export default function CustomerLayout({ children }) {
  return (
    <div className="pb-16 sm:pb-0 min-h-screen">
      <header className="bg-white border-b border-gray-200 py-3 px-4 sm:px-[6%] flex justify-between items-center sticky top-0 z-40 shadow-xs">
        <a href="/" className="text-lg sm:text-xl font-bold text-green-950 flex items-center gap-1.5 no-underline">
          <span>🌾</span>
          <span>Uzhavar Market</span>
        </a>
        <div className="flex items-center gap-2 sm:gap-4">
          <a
            href="/"
            className="text-xs sm:text-sm font-semibold text-green-800 hover:text-green-700 transition-colors"
          >
            ← Store
          </a>
        </div>
      </header>
      {children}
      <CustomerBottomNav />
    </div>
  )
}
