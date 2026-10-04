import { fireEvent, render, screen } from '@testing-library/react';
import { SettingsPanel } from '../SettingsPanel';

const props = {
  nashville: false, onNashvilleChange: vi.fn(), hideYt: false, onHideYtChange: vi.fn(),
  twoCol: true, onTwoColChange: vi.fn(), fontSize: 0, onFontChange: vi.fn(), onFontReset: vi.fn(),
};

describe('SettingsPanel', () => {
  it('names itself as the default for every song', () => {
    render(<SettingsPanel {...props} />);
    expect(screen.getByText('Setlist defaults for all songs')).toBeInTheDocument();
  });

  it('offers a named reset only when the default size has changed', () => {
    const { rerender } = render(<SettingsPanel {...props} />);
    expect(screen.getByRole('button', { name: 'Reset default font size' })).toBeDisabled();
    rerender(<SettingsPanel {...props} fontSize={2} />);
    fireEvent.click(screen.getByRole('button', { name: 'Reset default font size' }));
    expect(props.onFontReset).toHaveBeenCalled();
  });
});
