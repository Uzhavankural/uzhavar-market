import CustomerBottomNav from '../../components/CustomerBottomNav'
import CustomerHeader from '../components/CustomerHeader'

export default function CustomerLayout({ children }) {
  return (
    <div className="pb-16 sm:pb-0 min-h-screen">
      <CustomerHeader />
      {children}
      <CustomerBottomNav />
    </div>
  )
}
