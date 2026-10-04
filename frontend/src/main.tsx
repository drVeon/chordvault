import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AuthProvider } from './context/AuthContext';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { ModalsProvider } from '@mantine/modals';
import { chordVaultTheme, chordVaultVariables, colorSchemeManager } from './theme';
import { I18nProvider } from './context/I18nContext';
import { DemoProvider } from './context/DemoContext';
import { SetlistNameModal } from './components/SetlistNameModal';
import { ResetPasswordModal } from './components/ResetPasswordModal';
import { App } from './App';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import './styles/global.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DemoProvider>
      <AuthProvider>
        <MantineProvider theme={chordVaultTheme} cssVariablesResolver={chordVaultVariables} colorSchemeManager={colorSchemeManager} defaultColorScheme="dark">
            <I18nProvider>
              <ModalsProvider modals={{ setlistName: SetlistNameModal, resetPassword: ResetPasswordModal }}>
                <Notifications position="bottom-center" autoClose={3000} limit={1} />
                <App />
              </ModalsProvider>
            </I18nProvider>
        </MantineProvider>
      </AuthProvider>
    </DemoProvider>
  </StrictMode>
);
