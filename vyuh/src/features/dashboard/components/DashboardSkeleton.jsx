import { Skeleton } from '@/shared/ui/Skeleton.jsx'

/**
 * Loading state for the student home. It mirrors the real grid: header, a wide
 * ink panel, a chart block, and a narrow column of three cards. Nothing here
 * spins.
 */
export function DashboardSkeleton() {
  return (
    <Skeleton.Region label="Loading your workspace">
      <div aria-hidden="true">
        <div className="mb-6 border-b border-line pb-5">
          <Skeleton.Line className="w-40" />
          <Skeleton.Block className="mt-4 h-10 w-[min(26rem,80%)]" />
          <Skeleton.Line className="mt-3 w-64" />
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.55fr_1fr]">
          <div className="flex flex-col gap-5">
            <Skeleton.Block className="h-44 w-full rounded-md" />
            <div className="rounded-md border border-line bg-surface-raised p-5">
              <Skeleton.Line className="w-28" />
              <Skeleton.Block className="mt-4 h-52 w-full" />
            </div>
            <div className="rounded-md border border-line bg-surface-raised p-5">
              <Skeleton.Line className="w-32" />
              <div className="mt-4 space-y-3">
                <Skeleton.Block className="h-9 w-full" />
                <Skeleton.Block className="h-9 w-full" />
                <Skeleton.Block className="h-9 w-4/5" />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-5">
            {[0, 1, 2].map((index) => (
              <div key={index} className="rounded-md border border-line bg-surface-raised p-5">
                <Skeleton.Line className="w-24" />
                <Skeleton.Block className="mt-4 h-6 w-4/5" />
                <Skeleton.Lines lines={2} className="mt-3" />
                <Skeleton.Block className="mt-4 h-10 w-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </Skeleton.Region>
  )
}
