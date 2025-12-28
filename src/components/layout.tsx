import { TitleBar } from "./TitleBar"
import { Tabs } from "./ui/tabs"

interface LayoutProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  activeTab?: string;
  onTabChange?: (value: string) => void;
}

/**
 * Renders a full-height application layout that either wraps content in a Tabs container with a TitleBar when tab controls are provided, or renders the content directly.
 *
 * @param children - The layout content to render inside the main area
 * @param activeTab - Optional identifier of the currently active tab; when present with `onTabChange` enables tab mode
 * @param onTabChange - Optional callback invoked with the new tab identifier when the active tab changes
 * @returns The rendered layout element containing the provided children
 */
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