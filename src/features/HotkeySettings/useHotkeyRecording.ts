/**
 * Shared utility function for handling hotkey recording keydown events
 * Extracts modifiers and non-modifier keys from keyboard events
 * 
 * @param e - The keyboard event
 * @param onShortcutRecorded - Callback when a valid shortcut is recorded
 * @param onCancel - Optional callback when recording is cancelled (Escape key)
 * @returns true if the event was handled, false otherwise
 */
export function handleHotkeyKeyDown(
  e: React.KeyboardEvent,
  onShortcutRecorded: (shortcut: string) => void,
  onCancel?: () => void
): boolean {
  e.preventDefault();
  e.stopPropagation();

  if (e.key === 'Escape') {
    onCancel?.();
    return true;
  }

  const key = e.key.toLowerCase();

  const modifiers = [];
  if (e.ctrlKey) modifiers.push('control');
  if (e.altKey) modifiers.push('alt');
  if (e.shiftKey) modifiers.push('shift');
  if (e.metaKey) modifiers.push('super');

  // If the key is a modifier key, don't record
  if (['control', 'alt', 'shift', 'super', 'meta'].includes(key)) {
    return true;
  }

  // Use e.code for the key (e.g., "KeyA", "Digit1", "ArrowUp")
  // This matches the format expected by the global shortcut system
  modifiers.push(e.code);

  if (modifiers.length > 0) {
    const shortcut = modifiers.join('+');
    onShortcutRecorded(shortcut);
    return true;
  }

  return false;
}
