import * as React from "react"
const cn = (...classes) => classes.filter(Boolean).join(" ")

export function Badge({ className, variant = "default", ...props }) {
  const variants = {
    default:   "bg-blue-600 text-white",
    secondary: "bg-slate-700 text-slate-300",
    outline:   "border border-slate-600 text-slate-300",
    success:   "bg-green-600 text-white",
    danger:    "bg-red-600 text-white",
    warning:   "bg-amber-600 text-white",
  }
  return (
    <div className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", variants[variant], className)} {...props}/>
  )
}