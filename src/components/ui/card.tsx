import * as React from "react"

import { cn } from "@/lib/utils"

function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card"
      className={cn(
        "bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm",
        className
      )}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2 px-6 *:text-balance [&>h1]:text-xl/7 [&>h1]:font-semibold [&>h1]:tracking-tight [&>h2]:text-lg/6 [&>h2]:font-semibold [&>h2]:tracking-tight [&>h3]:text-base/6 [&>h3]:font-semibold [&>h3]:tracking-tight [&>h4]:text-sm/5 [&>h4]:font-semibold [&>h4]:tracking-tight [&>h5]:text-sm/5 [&>h5]:font-medium [&>h5]:tracking-tight [&>h6]:text-sm/5 [&>h6]:font-medium [&>h6]:tracking-tight [&>p]:text-sm/6 [&>p]:text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"h3">) {
  return <h3 className={cn("font-semibold leading-none tracking-tight", className)} {...props} />
}

function CardDescription({ className, ...props }: React.ComponentProps<"p">) {
  return <p className={cn("text-sm text-muted-foreground", className)} {...props} />
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("px-6", className)} {...props} />
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("flex items-center gap-3 px-6 pt-3", className)}
      {...props}
    />
  )
}

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }