import { createTheme, defaultVariantColorsResolver, localStorageColorSchemeManager, type CSSVariablesResolver } from '@mantine/core';

const fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, "PingFang TC", "PingFang SC", "Microsoft YaHei", "Noto Sans TC", sans-serif';

export const chordVaultTheme = createTheme({
  fontFamily,
  headings: { fontFamily, fontWeight: '600' },
  primaryColor: 'taupe',
  colors: { taupe: ['#fcf4ea', '#ede7e0', '#d4cec6', '#bbb2a8', '#a69b8f', '#998d7f', '#938575', '#807262', '#736555', '#665744'] },
  primaryShade: { light: 8, dark: 3 },
  defaultRadius: 'md',
  autoContrast: true,
  luminanceThreshold: 0.179,
  variantColorResolver: (input) => ({
    ...defaultVariantColorsResolver(input),
    ...(input.variant === 'filled' && input.color === 'taupe' ? { color: 'var(--mantine-primary-color-contrast)' } : {}),
  }),
  components: {
    Button: { defaultProps: { variant: 'light' } },
    ActionIcon: { defaultProps: { variant: 'subtle', size: 'lg' } },
    Modal: { defaultProps: { centered: true, size: 'lg', overlayProps: { backgroundOpacity: 0.5, blur: 0 } } },
  },
});

export const colorSchemeManager = localStorageColorSchemeManager({ key: 'cv_theme' });

export const chordVaultVariables: CSSVariablesResolver = () => ({
  variables: {},
  light: {
    '--mantine-color-body': '#fffdf9',
    '--mantine-color-default': '#fffdf9',
    '--mantine-color-default-hover': '#f3eee8',
    '--mantine-color-text': '#251605',
    '--mantine-color-default-color': '#251605',
    '--mantine-color-dimmed': '#75665b',
    '--mantine-color-default-border': '#e7ded2',
    '--cv-chord': '#8e3f3b',
    '--cv-brand': '#8e3f3b',
    '--cv-surface': '#fffdf9',
    '--cv-surface-secondary': '#f3eee8',
    '--cv-border': '#e7ded2',
  },
  dark: {
    '--mantine-color-text': '#fffdf9',
    '--mantine-color-default-color': '#fffdf9',
    '--mantine-color-dimmed': '#c6bbae',
    '--mantine-color-default-border': '#48413a',
    '--cv-chord': '#dda19b',
    '--cv-brand': '#dda19b',
    '--cv-surface': 'var(--mantine-color-default)',
    '--cv-surface-secondary': 'var(--mantine-color-default-hover)',
    '--cv-border': '#48413a',
  },
});
