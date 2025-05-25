import { cn } from "@/lib/utils"

interface LayoutProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export function Layout({ children, className, ...props }: LayoutProps) {
  return (
    <div
      className={cn(
        "min-h-screen bg-background font-sans antialiased",
        className
      )}
      {...props}
    >
      <div className="relative flex min-h-screen flex-col">
        <div className="flex-1">{children}</div>
      </div>
    </div>
  )
} 