import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WindowSnapIcon } from "@/components/WindowSnapIcon/WindowSnapIcon";
import { type HotkeyConfig } from "./types";
import { getShortcutMapping } from "./keyMapping";

interface HotkeyConfigProps {
  config: HotkeyConfig;
  index: number;
  recording: boolean;
  setRecording: (recording: boolean) => void;
  onShortcutClear: () => void;
  handleKeyDown: (e: React.KeyboardEvent) => void;
}

export const HotkeyConfigComponent: React.FC<HotkeyConfigProps> = ({ config, index, recording, setRecording, onShortcutClear, handleKeyDown }) => {
  const canRecord = config.layoutAction !== null || config.zoneNumber !== undefined;

  return (
    <div key={index} className="flex items-center gap-2">
      {config.layoutAction && (
        <div className="flex items-center justify-center w-5 h-5 rounded bg-muted shrink-0">
          <WindowSnapIcon action={config.layoutAction} width={14} height={10} />
        </div>
      )}
      {config.zoneNumber !== undefined && (
        <div className="flex items-center justify-center w-5 h-5 rounded bg-muted shrink-0">
          <span className="text-[10px] font-medium">{config.zoneNumber}</span>
        </div>
      )}
      <span className="text-xs select-none">{config.name}</span>
      <div className="flex items-center gap-1 ml-auto">
        <div className="w-32 h-7 relative">
          <Input
            type="text"
            value={recording ? 'Press keys...' : getShortcutMapping(config.shortcut)}
            className={`w-32 h-7 text-xs select-none ${recording ? 'ring-2 ring-primary' : ''}`}
            readOnly
            placeholder="Record shortcut"
            onFocus={() => canRecord && setRecording(true)}
            onBlur={() => setRecording(false)}
            onKeyDown={canRecord ? handleKeyDown : undefined}
          />
        </div>
        <Button
          variant="outline"
          disabled={!config.shortcut}
          size="icon"
          className={`h-7 w-7 ${!config.shortcut ? 'invisible' : ''}`}
          onClick={onShortcutClear}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
};