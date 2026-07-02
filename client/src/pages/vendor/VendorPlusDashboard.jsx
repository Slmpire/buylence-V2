import { DashboardContent } from './VendorDashboard'
import VendorLayout from '../../components/vendor/VendorLayout'

export default function VendorPlusDashboard() {
  return (
    <VendorLayout searchPlaceholder="Search orders...">
      <DashboardContent isPlus={true} />
    </VendorLayout>
  )
}