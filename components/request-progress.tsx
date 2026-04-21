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
              "rounded-[24px] border px-4 py-3 text-center text-sm font-medium shadow-[0_10px_24px_rgba(124,98,81,0.05)]",
              completed
                ? "border-[#e3c5bd] bg-[#f4e3df] text-[#9f6f66]"
                : "border-[#ead9cf] bg-white text-[#8a7670]"
            )}
          >
            <div
              className={cn(
                "mx-auto mb-2 flex h-7 w-7 items-center justify-center rounded-full text-xs",
                completed ? "bg-[#b98677] text-white" : "bg-[#f5ebe6] text-[#8a7670]"
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
