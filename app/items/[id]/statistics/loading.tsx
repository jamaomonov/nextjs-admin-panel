import { Skeleton } from "@/components/ui/skeleton"
import AdminLayout from "@/components/admin-layout"
import { RefreshCw } from "lucide-react"

export default function StatisticsLoading() {
  return (
    <AdminLayout>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <div>
            <Skeleton className="h-10 w-64 bg-zinc-800" />
            <Skeleton className="h-5 w-48 bg-zinc-800 mt-2" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-32 bg-zinc-800" />
            <Skeleton className="h-10 w-24 bg-zinc-800" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 bg-zinc-800 rounded-lg" />
          ))}
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
            <Skeleton className="h-8 w-40 bg-zinc-800" />
            <div className="flex gap-2">
              <Skeleton className="h-9 w-64 bg-zinc-800" />
              <Skeleton className="h-9 w-32 bg-zinc-800" />
            </div>
          </div>

          <div className="flex justify-center items-center h-[300px] text-zinc-500">
            <div className="flex flex-col items-center">
              <RefreshCw size={24} className="animate-spin mb-2" />
              <p>Loading chart data...</p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
