import { Chip, Group } from '@mantine/core';
import { PRESET_TAGS } from '../lib/constants';

interface TagPickerProps {
  selected: string[];
  onChange: (tags: string[]) => void;
}

export function TagPicker({ selected, onChange }: TagPickerProps) {
  return <Chip.Group multiple value={selected} onChange={onChange}>
    <Group gap={6}>{PRESET_TAGS.map((tag) => <Chip key={tag} value={tag} size="sm">{tag}</Chip>)}</Group>
  </Chip.Group>;
}
