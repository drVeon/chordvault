import { Select } from '@mantine/core';
import { LANGUAGES } from '../lib/languages';

interface LanguagePickerProps {
  value: string;
  onChange: (code: string) => void;
  preferredLanguages: string[];
}

export function LanguagePicker({ value, onChange, preferredLanguages }: LanguagePickerProps) {
  const items = (preferred: boolean) => LANGUAGES.filter((language) => preferredLanguages.includes(language.code) === preferred)
    .map((language) => ({ value: language.code, label: `${language.name} (${language.code})` }));
  return <Select label="Language" aria-label="Song language" placeholder="Select language..." searchable allowDeselect={false}
    value={value || null} onChange={(next) => { if (next) onChange(next); }}
    data={[{ group: 'My Languages', items: items(true) }, { group: 'Other Languages', items: items(false) }]}
    nothingFoundMessage="No matching languages" />;
}
