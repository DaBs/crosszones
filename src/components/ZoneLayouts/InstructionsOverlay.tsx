import React from 'react';

export function InstructionsOverlay() {
  return (
    <div className="absolute bottom-4 left-4 bg-black/70 text-white p-4 rounded-lg text-sm space-y-1 max-w-xs">
      <div className="font-semibold mb-2">Zone Editor Instructions</div>
      <div>• Drag zones to move them</div>
      <div>• Hover over a zone and click to split (follows mouse)</div>
      <div>• Hold Shift to split vertically instead of horizontally</div>
      <div>• Drag a zone onto another to merge them</div>
      <div className="mt-2 text-xs text-gray-400">Press ESC or right-click to close</div>
    </div>
  );
}

