import { TitleBar } from "../TitleBar/TitleBar"
import { Tabs } from "./tabs"

interface LayoutProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  activeTab?: string;
  onTabChange?: (value: string) => void;
  showTabs?: boolean;
}

// TODO: Refactor titlebar to handle this more gracefully in terms of where tabs live.
export function Layout({ children, activeTab, onTabChange, showTabs = true }: LayoutProps) {
  const hasTabs = showTabs;

  return (
    <div className="flex flex-col h-screen">
      {hasTabs ? (
        <Tabs value={activeTab} onValueChange={onTabChange} className="flex flex-col flex-1 overflow-hidden">
          <TitleBar showTabs={true} />
          <main className="flex-1 overflow-hidden">{children}</main>
        </Tabs>
      ) : (
        <>
          <TitleBar showTabs={false} />
          <main className="flex-1 overflow-hidden">{children}</main>
        </>
      )}
    </div>
  )
} 