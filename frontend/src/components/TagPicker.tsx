import { Chip, Group } from '@mantine/core';
import { PRESET_TAGS } from '../lib/constants';

interface TagPickerProps {
  label?: string;
  selected: string[];
  onChange: (tags: string[]) => void;
}

export function TagPicker({ selected, onChange, label }: TagPickerProps) {
  return <Chip.Group multiple value={selected} onChange={onChange}>
    <Group gap={6} role="group" aria-label={label}>{PRESET_TAGS.map((tag) => <Chip key={tag} value={tag} size="sm">{tag}</Chip>)}</Group>
  </Chip.Group>;
}
