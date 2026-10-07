import { Pagination as MantinePagination } from '@mantine/core';

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;
  return <MantinePagination className="pagination-row" value={page} total={totalPages} onChange={onPageChange} />;
}
