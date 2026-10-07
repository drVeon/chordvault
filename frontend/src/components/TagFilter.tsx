import { NativeSelect } from '@mantine/core';
import { PRESET_TAGS } from '../lib/constants';

interface TagFilterProps {
  selected: string;
  onChange: (tag: string) => void;
}

// A dropdown rather than pills: the preset list outgrew one row. A custom tag
// picked from a song card isn't a preset, so it gets its own option, in order, to stay selected.
export function TagFilter({ selected, onChange }: TagFilterProps) {
  const tags = selected && !PRESET_TAGS.includes(selected) ? [...PRESET_TAGS, selected].sort() : PRESET_TAGS;

  return (
    <NativeSelect
      className="language-filter tag-filter"
      aria-label="Filter by tag"
      value={selected}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">All tags</option>
      {tags.map((tag) => (
        <option key={tag} value={tag}>{tag}</option>
      ))}
    </NativeSelect>
  );
}
