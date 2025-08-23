import { cn } from "@/lib/utils"

interface LoadingSkeletonProps {
  className?: string
  variant?: "card" | "text" | "avatar" | "button"
}

export function LoadingSkeleton({ className, variant = "card" }: LoadingSkeletonProps) {
  const baseClasses = "animate-pulse bg-gray-800/50 rounded"

  const variants = {
    card: "h-48 w-full",
    text: "h-4 w-3/4",
    avatar: "h-12 w-12 rounded-full",
    button: "h-10 w-24",
  }

  return <div className={cn(baseClasses, variants[variant], className)} />
}

export function PersonaCardSkeleton() {
  return (
    <div className="bg-gray-900/50 backdrop-blur-sm border border-cyan-500/20 rounded-lg p-6">
      <div className="flex items-center space-x-4 mb-4">
        <LoadingSkeleton variant="avatar" />
        <div className="space-y-2 flex-1">
          <LoadingSkeleton variant="text" className="w-1/2" />
          <LoadingSkeleton variant="text" className="w-1/3" />
        </div>
      </div>
      <LoadingSkeleton variant="card" className="h-32" />
      <div className="mt-4 space-y-2">
        <LoadingSkeleton variant="text" />
        <LoadingSkeleton variant="text" className="w-2/3" />
      </div>
    </div>
  )
}
