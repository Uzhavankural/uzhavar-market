import CustomerBottomNav from '../../components/CustomerBottomNav'

export default function CustomerLayout({ children }) {
  return (
    <div className="pb-16 sm:pb-0 min-h-screen">
      {children}
      <CustomerBottomNav />
    </div>
  )
}
