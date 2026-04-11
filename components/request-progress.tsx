import { RequestStatus, requestStatuses } from "@/lib/novelcraft"
import { cn } from "@/lib/utils"

export function RequestProgress({ status }: { status: RequestStatus }) {
  const currentIndex = requestStatuses.indexOf(status)

  return (
    <div className="grid grid-cols-4 gap-3">
      {requestStatuses.map((step, index) => {
        const completed = index <= currentIndex

        return (
          <div
            key={step}
            className={cn(
              "rounded-2xl border px-4 py-3 text-center text-sm font-medium",
              completed
                ? "border-teal-300 bg-teal-50 text-teal-700"
                : "border-zinc-200 bg-white text-zinc-500"
            )}
          >
            <div
              className={cn(
                "mx-auto mb-2 flex h-7 w-7 items-center justify-center rounded-full text-xs",
                completed ? "bg-teal-400 text-white" : "bg-zinc-200 text-zinc-500"
              )}
            >
              {index + 1}
            </div>
            {step}
          </div>
        )
      })}
    </div>
  )
}
