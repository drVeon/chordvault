import { Group, type GroupProps } from '@mantine/core';

export function SearchRow({ children, ...others }: GroupProps) {
  return <Group className="search-row" gap={10} mb={20} {...others}>{children}</Group>;
}
