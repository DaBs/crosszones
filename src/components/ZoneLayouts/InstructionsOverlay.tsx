import { Checkbox } from '@/components/ui/checkbox';

interface InstructionsOverlayProps {
  snapEnabled: boolean;
  onSnapToggle: (enabled: boolean) => void;
}

export function InstructionsOverlay({ snapEnabled, onSnapToggle }: InstructionsOverlayProps) {
  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white p-4 rounded-lg text-sm space-y-1 max-w-xs z-10">
      <div className="font-semibold mb-2">Zone Editor Instructions</div>
      <div>• Drag zones to move them</div>
      <div>• Hover over a zone and click to split (follows mouse)</div>
      <div>• Hold Shift to split vertically instead of horizontally</div>
      <div>• Drag a zone onto another to merge them</div>
      <div className="mt-3 pt-3 border-t border-white/20 flex items-center gap-2">
        <Checkbox
          id="snap-toggle"
          checked={snapEnabled}
          onCheckedChange={(checked) => onSnapToggle(checked === true)}
          className="border-white/40 data-[state=checked]:bg-white data-[state=checked]:text-black"
        />
        <label htmlFor="snap-toggle" className="cursor-pointer select-none">
          Enable snap to edges
        </label>
      </div>
      <div className="mt-2 text-xs text-gray-400">Press ESC or right-click to close</div>
    </div>
  );
}

