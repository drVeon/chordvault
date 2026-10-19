import { Badge } from '@mantine/core';
import { useI18n } from '../context/I18nContext';
import { splitTags, tagLabel } from '../lib/tagName';

// With onTagClick (song lists), each tag is a button that filters the list by it.
export function TagBadges({ tags, onTagClick }: { tags: string | null; onTagClick?: (tag: string) => void }) {
  const { t } = useI18n();
  return <>{splitTags(tags).map(tag => onTagClick ? (
    <Badge key={tag} component="button" type="button" className="badge-tag-link" title={`Show songs tagged ${tagLabel(t, tag)}`}
      onClick={(e: React.MouseEvent) => { e.stopPropagation(); onTagClick(tag); }}>
      {tagLabel(t, tag)}
    </Badge>
  ) : <Badge key={tag}>{tagLabel(t, tag)}</Badge>)}</>;
}
