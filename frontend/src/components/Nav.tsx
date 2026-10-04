import { ActionIcon, Button, Menu, UnstyledButton, useComputedColorScheme, useMantineColorScheme } from '@mantine/core';
import { useAuth } from '../context/AuthContext';
import logoSvg from '../assets/logo.svg?raw';

interface NavProps {
  view: string;
  navigate: (view: string, params?: Record<string, string>) => void;
}

export function Nav({ view, navigate }: NavProps) {
  const { user, isAdmin, logout } = useAuth();
  const theme = useComputedColorScheme('dark');
  const { toggleColorScheme } = useMantineColorScheme();
  const setlistsActive = ['setlists', 'setlist-edit', 'setlist-play', 'public-setlists'].includes(view);
  return (
    <nav id="nav">
      <UnstyledButton className="nav-brand" onClick={() => navigate('browse')}>
        <span className="nav-logo" dangerouslySetInnerHTML={{ __html: logoSvg }} /> ChordVault
      </UnstyledButton>
      <div className="nav-links" id="nav-links">
        <ActionIcon onClick={() => toggleColorScheme()} title="Toggle theme" aria-label="Toggle theme">{theme === 'light' ? '☾' : '☼'}</ActionIcon>
        <Button variant={view === 'browse' ? 'light' : 'subtle'} onClick={() => navigate('browse')}>Songs</Button>
        <Button variant={setlistsActive ? 'light' : 'subtle'} onClick={() => navigate(user ? 'setlists' : 'public-setlists')}>Setlists</Button>
        {isAdmin && <Button variant={view === 'admin' ? 'light' : 'subtle'} onClick={() => navigate('admin')}>Admin</Button>}
        {!user ? <Button variant={view === 'auth' ? 'light' : 'subtle'} onClick={() => navigate('auth')}>Sign in</Button> : (
          <Menu position="bottom-end" shadow="sm">
            <Menu.Target><ActionIcon id="nav-menu-btn" title="Menu" aria-label="Account menu">☰</ActionIcon></Menu.Target>
            <Menu.Dropdown>
              <Menu.Item onClick={() => navigate('my-songs')}>My Songs</Menu.Item>
              <Menu.Item onClick={() => navigate('settings')}>Settings</Menu.Item>
              <Menu.Divider />
              <Menu.Item onClick={() => { logout(); navigate('browse'); }}>Sign out</Menu.Item>
            </Menu.Dropdown>
          </Menu>
        )}
      </div>
    </nav>
  );
}
