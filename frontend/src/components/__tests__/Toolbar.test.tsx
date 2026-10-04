import { render, screen, fireEvent } from '@testing-library/react';
import { Toolbar, type ToolbarProps } from '../Toolbar';

const base: ToolbarProps = {
  currentKey: 'G',
  nashville: false,
  onNashvilleChange: vi.fn(),
  twoCol: false,
  onTwoColToggle: vi.fn(),
  fontSize: 0,
  onFontChange: vi.fn(),
  onReset: vi.fn(),
  onPickKey: vi.fn(),
  onAutoFit: vi.fn(),
};

describe('Toolbar', () => {
  it('is a labelled group, not a toolbar without arrow-key navigation', () => {
    render(<Toolbar {...base} />);
    expect(screen.getByRole('group', { name: 'Display' })).toBeInTheDocument();
    expect(screen.queryByRole('toolbar')).toBeNull();
  });

  it('disables Reset when the caller says there is nothing to reset', () => {
    render(<Toolbar {...base} twoCol fontSize={0} canReset={false} />);
    expect(screen.getByRole('button', { name: 'Reset font and columns' })).toBeDisabled();
  });

  it('labels controls in sentence case', () => {
    render(<Toolbar {...base} />);
    expect(screen.getByTestId('key-display')).toHaveTextContent('Key G');
    expect(screen.getByRole('button', { name: 'Fit' })).toHaveAttribute('title', 'Auto-fit for this screen (one-time)');
    expect(screen.queryByText('FIT')).toBeNull();
  });

  it('toggles number notation as a pressed button', () => {
    render(<Toolbar {...base} />);
    const num = screen.getByRole('button', { name: 'Number notation' });
    expect(num).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(num);
    expect(base.onNashvilleChange).toHaveBeenCalledWith(true);
  });

  it('marks temporary overrides on the group, not with dashed outlines', () => {
    render(<Toolbar {...base} overrides={{ font: true, twoCol: true }} />);
    expect(screen.getByRole('group', { name: 'Text size' })).toHaveAttribute('data-overridden', 'true');
    expect(screen.getByRole('button', { name: 'Multi-column layout' }).closest('[data-overridden="true"]')).not.toBeNull();
    expect(document.querySelector('.overridden')).toBeNull();
  });

  it('shows the columns toggle as pressed when on', () => {
    render(<Toolbar {...base} twoCol />);
    expect(screen.getByRole('button', { name: 'Multi-column layout' })).toHaveAttribute('aria-pressed', 'true');
  });
});
