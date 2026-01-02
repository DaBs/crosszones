import { TitleBar } from "../TitleBar/TitleBar"
import { Tabs } from "./tabs"

interface LayoutProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  activeTab?: string;
  onTabChange?: (value: string) => void;
}

export function Layout({ children, activeTab, onTabChange }: LayoutProps) {
  return (
    <div className="flex flex-col h-screen">
      {activeTab && onTabChange ? (
        <Tabs value={activeTab} onValueChange={onTabChange} className="flex flex-col h-full">
          <TitleBar />
          <main className="flex-1 overflow-hidden">{children}</main>
        </Tabs>
      ) : (
        <main className="flex-1 overflow-hidden">{children}</main>
      )}
    </div>
  )
} 