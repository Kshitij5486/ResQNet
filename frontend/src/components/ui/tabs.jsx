import * as TabsPrimitive from "@radix-ui/react-tabs"
import * as React from "react"
const cn = (...classes) => classes.filter(Boolean).join(" ")

export const Tabs = TabsPrimitive.Root
export const TabsList = React.forwardRef(({ className, ...props }, ref) => (
  <TabsPrimitive.List ref={ref}
    className={cn("inline-flex items-center justify-center rounded-lg bg-slate-800 p-0.5 text-slate-400", className)}
    {...props}/>
))
export const TabsTrigger = React.forwardRef(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger ref={ref}
    className={cn("inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-slate-700 data-[state=active]:text-white data-[state=active]:shadow-sm", className)}
    {...props}/>
))
export const TabsContent = React.forwardRef(({ className, ...props }, ref) => (
  <TabsPrimitive.Content ref={ref} className={cn("mt-2", className)} {...props}/>
))