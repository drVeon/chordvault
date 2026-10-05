import { Button, Paper, SimpleGrid } from '@mantine/core';
import { normalizeKey, ALL_KEYS, ALL_KEYS_MINOR } from '../lib/keys';

interface KeyPickerProps {
  currentKey: string;
  onPickKey: (key: string) => void;
  visible: boolean;
  isModified?: boolean;
  onSaveOnline?: () => void;
  onSaveLocal?: () => void;
}

export function KeyPicker({
  currentKey,
  onPickKey,
  visible,
  isModified,
  onSaveOnline,
  onSaveLocal
}: KeyPickerProps) {
  if (!visible) return null;

  const norm = normalizeKey(currentKey);
  const isMinor = norm && norm.endsWith('m') && norm.length > 1;
  const keys = isMinor ? ALL_KEYS_MINOR : ALL_KEYS;

  return (
    <Paper withBorder p="md" className="key-picker" id="key-picker" role="group" aria-label="Transpose key">
      <SimpleGrid cols={{ base: 4, sm: 6 }} spacing="xs">
        {keys.map((k) => (
          <Button
            key={k}
            px="xs"
            mih={44}
            className={`key-pill${k === norm ? ' active' : ''}`}
            variant={k === norm ? 'light' : 'default'}
            aria-pressed={k === norm}
            onClick={() => onPickKey(k)}
          >
            {k}
          </Button>
        ))}
      </SimpleGrid>
      {isModified && (
        <div className="key-picker-actions">
          <div className="key-picker-save-hint">Save this key?</div>
          <div className="key-picker-btns">
            {onSaveOnline && (
              <Button size="xs" className="btn btn-sm btn-save-online" onClick={onSaveOnline}>
                SAVE (Online)
              </Button>
            )}
            {onSaveLocal && (
              <Button variant="default" size="xs" className="btn btn-sm btn-ghost" onClick={onSaveLocal}>
                Save (Local)
              </Button>
            )}
          </div>
        </div>
      )}
    </Paper>
  );
}
