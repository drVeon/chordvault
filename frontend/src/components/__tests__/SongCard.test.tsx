import { render, screen } from '@testing-library/react';
import { SongCard } from '../SongCard';
import type { SongListItem } from '../../types';

describe('SongCard', () => {
  it('announces private songs as text, not only as a lock icon', () => {
    const song = { id: 1, title: 'Song', artist: 'Artist', visibility: 'private', language: 'en' } as SongListItem;
    render(<SongCard song={song} onClick={vi.fn()} />);
    expect(screen.getByText('Private')).toBeInTheDocument();
  });
});
