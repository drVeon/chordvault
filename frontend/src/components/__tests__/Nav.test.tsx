import { render, screen } from '@testing-library/react';
import { Nav } from '../Nav';

vi.mock('../../context/AuthContext', () => ({ useAuth: () => ({ user: null, isAdmin: false, logout: vi.fn() }) }));

describe('Nav', () => {
  it('names the home button even when the brand text is hidden on phones', () => {
    render(<Nav view="browse" navigate={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'ChordVault home' })).toBeInTheDocument();
  });
});
