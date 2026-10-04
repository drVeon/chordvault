import { useHotkeys, type HotkeyItem } from '@mantine/hooks';

type HandlerMap = Record<string, (e: KeyboardEvent) => void>;

export function useKeyboardShortcuts(handlers: HandlerMap, enabled: boolean) {
  const hotkeys: HotkeyItem[] = Object.keys(handlers).flatMap((key) => {
    const combinations = key === '+' ? ['[plus]', 'shift+[plus]']
      : /^[A-Z]$/.test(key) ? [`shift+${key.toLowerCase()}`] : [key];
    return combinations.map((combination): HotkeyItem => [combination, (event) => {
      if (!enabled || event.defaultPrevented) return;
      // Music shortcuts yield to focused controls and any open interaction.
      const interactions = document.querySelectorAll('[role="dialog"], [role="menu"], [role="listbox"]');
      if ([...interactions].some((interaction) => {
        for (let owner: Element | null = interaction; owner; owner = owner.parentElement) {
          const style = getComputedStyle(owner);
          if (owner.hasAttribute('hidden') || style.display === 'none' || style.visibility === 'hidden') return false;
        }
        return true;
      })) return;
      if (event.target instanceof Element && event.target.closest('button, a, input, textarea, select, [contenteditable="true"], [role="button"]')) return;
      handlers[event.key]?.(event);
    }, { preventDefault: false }]);
  });
  useHotkeys(hotkeys);
}
