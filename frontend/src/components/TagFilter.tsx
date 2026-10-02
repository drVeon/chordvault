import { PRESET_TAGS } from '../lib/constants';

interface TagFilterProps {
  selected: string;
  onChange: (tag: string) => void;
}

// Single-select: clicking the active tag clears the filter. A custom tag picked
// from a song card isn't a preset, so it gets its own pill to stay clearable.
export function TagFilter({ selected, onChange }: TagFilterProps) {
  const tags = selected && !PRESET_TAGS.includes(selected) ? [...PRESET_TAGS, selected] : PRESET_TAGS;

  return (
    <div className="tag-picker tag-filter">
      {tags.map((tag) => (
        <button
          key={tag}
          type="button"
          className={`tag-pill${selected === tag ? ' active' : ''}`}
          onClick={() => onChange(selected === tag ? '' : tag)}
        >
          {tag}
        </button>
      ))}
    </div>
  );
}
