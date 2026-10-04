import { render, screen, fireEvent } from '@testing-library/react';
import { TagFilter } from '../TagFilter';
import { PRESET_TAGS } from '../../lib/constants';

describe('TagFilter', () => {
  const getSelect = () => screen.getByLabelText('Filter by tag') as HTMLSelectElement;

  it('offers "All tags" plus every preset', () => {
    render(<TagFilter selected="" onChange={vi.fn()} />);
    const values = Array.from(getSelect().options).map((o) => o.value);
    expect(values).toEqual(['', ...PRESET_TAGS]);
  });

  it('reports the picked tag, and "" for All tags', () => {
    const onChange = vi.fn();
    render(<TagFilter selected="rock" onChange={onChange} />);
    fireEvent.change(getSelect(), { target: { value: 'folk' } });
    fireEvent.change(getSelect(), { target: { value: '' } });
    expect(onChange.mock.calls).toEqual([['folk'], ['']]);
  });

  it('keeps a custom tag picked from a song card selectable', () => {
    render(<TagFilter selected="kantavtor" onChange={vi.fn()} />);
    expect(getSelect().value).toBe('kantavtor');
  });
});
