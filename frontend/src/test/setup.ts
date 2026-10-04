import '@testing-library/jest-dom/vitest';
import { createElement, type ReactNode } from 'react';
import { TestWrapper } from './wrappers';

window.HTMLElement.prototype.scrollIntoView = vi.fn();
window.HTMLElement.prototype.scrollTo = vi.fn();
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn((media: string) => ({
    matches: false, media, onchange: null,
    addListener: vi.fn(), removeListener: vi.fn(),
    addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn(),
  })),
});
globalThis.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

vi.mock('@testing-library/react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@testing-library/react')>();
  const withProvider = (Wrapper?: NonNullable<Parameters<typeof actual.render>[1]>['wrapper']) => {
    return {
      wrapper: ({ children }: { children: ReactNode }) => createElement(TestWrapper, null,
        Wrapper ? createElement(Wrapper, null, children) : children),
    };
  };
  return {
    ...actual,
    render: (ui: ReactNode, options?: Parameters<typeof actual.render>[1]) => actual.render(ui, { ...options, ...withProvider(options?.wrapper) }),
    renderHook: (callback: (props: unknown) => unknown, options?: Parameters<typeof actual.renderHook>[1]) => actual.renderHook(callback, { ...options, ...withProvider(options?.wrapper) }),
  };
});
