import { fireEvent, render, screen } from '@testing-library/react';
import { SearchField } from '../SearchField';

describe('SearchField', () => {
  it('has no clear button while empty', () => {
    render(<SearchField label="Search setlists" value="" onChange={vi.fn()} onSearch={vi.fn()} onClear={vi.fn()} />);
    expect(screen.queryByRole('button', { name: 'Clear search' })).toBeNull();
  });

  it('puts the clear button inside the field and clears on click', () => {
    const onClear = vi.fn();
    const { container } = render(<SearchField label="Search setlists" value="grace" onChange={vi.fn()} onSearch={vi.fn()} onClear={onClear} />);
    const clear = screen.getByRole('button', { name: 'Clear search' });
    expect(container.querySelector('.mantine-TextInput-root')).toContainElement(clear);
    fireEvent.click(clear);
    expect(onClear).toHaveBeenCalled();
  });

  it('searches on Enter and reports typing', () => {
    const onSearch = vi.fn();
    const onChange = vi.fn();
    render(<SearchField label="Search setlists" value="" onChange={onChange} onSearch={onSearch} onClear={vi.fn()} />);
    const input = screen.getByRole('searchbox', { name: 'Search setlists' });
    fireEvent.change(input, { target: { value: 'well' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onChange).toHaveBeenCalledWith('well');
    expect(onSearch).toHaveBeenCalled();
  });
});
