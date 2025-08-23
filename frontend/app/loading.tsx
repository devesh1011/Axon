import { LoadingSkeleton } from "@/components/LoadingSkeleton"

export default function Loading() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-gray-900/50 backdrop-blur-sm border border-cyan-500/20 rounded-lg p-8">
          <div className="flex items-center justify-center mb-6">
            <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin"></div>
          </div>
          <div className="space-y-4">
            <LoadingSkeleton variant="text" className="w-3/4 mx-auto" />
            <LoadingSkeleton variant="text" className="w-1/2 mx-auto" />
          </div>
        </div>
      </div>
    </div>
  )
}
