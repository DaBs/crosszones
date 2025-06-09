import { cn } from "@/lib/utils"
import { TitleBar } from "./TitleBar"

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
      <div className="relative flex min-h-screen flex-col pt-8">
        <TitleBar />
        <div className="flex-1">{children}</div>
      </div>
    </div>
  )
} 