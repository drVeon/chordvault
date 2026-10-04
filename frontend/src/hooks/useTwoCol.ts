import { useState } from 'react';
import { useMediaQuery } from '@mantine/hooks';

const DEFAULT_COLUMNS_QUERY = '(min-width: 768px)';

export function useTwoCol() {
  const responsiveDefault = useMediaQuery(DEFAULT_COLUMNS_QUERY, undefined, { getInitialValueInEffect: false });
  const [manualChoice, setManualChoice] = useState<boolean | null>(null);
  const twoCol = manualChoice ?? responsiveDefault;
  const toggleTwoCol = () => setManualChoice(!twoCol);
  const setTwoColTo = (value: boolean) => setManualChoice(value);
  return { twoCol, toggleTwoCol, setTwoColTo };
}
