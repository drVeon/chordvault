import { useSessionStorage } from '@mantine/hooks';

export function useSearchSessionValue(key: string, defaultValue = '') {
  return useSessionStorage<string>({
    key,
    defaultValue,
    getInitialValueInEffect: false,
    sync: false,
    serialize: value => value,
    deserialize: value => value ?? defaultValue,
  });
}

export function searchPage(value: string): number {
  const page = Number(value);
  return Number.isSafeInteger(page) && page > 0 ? page : 1;
}
