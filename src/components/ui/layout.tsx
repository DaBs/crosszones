import { TitleBar } from "../TitleBar/TitleBar"
import { Tabs } from "./tabs"

interface LayoutProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  activeTab?: string;
  onTabChange?: (value: string) => void;
  showTabs?: boolean;
}

export function Layout({ children, activeTab, onTabChange, showTabs = true }: LayoutProps) {
  const hasTabs = showTabs && activeTab && onTabChange;

  return (
    <div className="flex flex-col h-screen">
      <TitleBar showTabs={hasTabs} />
      {hasTabs ? (
        <Tabs value={activeTab} onValueChange={onTabChange} className="flex flex-col flex-1 overflow-hidden">
          <main className="flex-1 overflow-hidden">{children}</main>
        </Tabs>
      ) : (
        <main className="flex-1 overflow-hidden">{children}</main>
      )}
    </div>
  )
} 