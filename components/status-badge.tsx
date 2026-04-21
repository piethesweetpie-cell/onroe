import { RequestStatus, statusClassNames } from "@/lib/novelcraft"
import { cn } from "@/lib/utils"

export function StatusBadge({
  status,
  className,
}: {
  status: RequestStatus
  className?: string
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold tracking-[0.04em]",
        statusClassNames[status],
        className
      )}
    >
      {status}
    </span>
  )
}
