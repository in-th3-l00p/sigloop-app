export const TX_STATUS = {
  PROGRESS: "progress",
  SUCCESS: "success",
  ERROR: "error",
} as const

export type TxStatus = (typeof TX_STATUS)[keyof typeof TX_STATUS]

export const TX_STATUS_LEGEND = [
  { status: TX_STATUS.PROGRESS, label: "Progress" },
  { status: TX_STATUS.SUCCESS, label: "Success" },
  { status: TX_STATUS.ERROR, label: "Error" },
] as const

export function getTxStatusMeta(status: string): { dotClass: string; label: "Progress" | "Success" | "Error" } {
  if (status === TX_STATUS.SUCCESS) {
    return { dotClass: "bg-green-500", label: "Success" }
  }
  if (status === TX_STATUS.ERROR) {
    return { dotClass: "bg-red-500", label: "Error" }
  }
  return { dotClass: "bg-amber-500", label: "Progress" }
}
