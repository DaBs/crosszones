import { cn } from "@/lib/utils"
import { TitleBar } from "./TitleBar"

interface LayoutProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  isSettingsOpen: boolean
  setIsSettingsOpen: (isSettingsOpen: boolean) => void
}

export function Layout({ children, className, isSettingsOpen, setIsSettingsOpen, ...props }: LayoutProps) {
  return (
    <div>
      <TitleBar isSettingsOpen={isSettingsOpen} setIsSettingsOpen={setIsSettingsOpen} />
      <main className="flex-1">{children}</main>
    </div>
  )
} 