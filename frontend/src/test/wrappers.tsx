import { SetlistNameModal } from '../components/SetlistNameModal';
import { ResetPasswordModal } from '../components/ResetPasswordModal';
import { type ReactNode } from 'react';
import { MantineProvider } from '@mantine/core';
import { ModalsProvider } from '@mantine/modals';
import { chordVaultTheme, chordVaultVariables } from '../theme';

export function TestWrapper({ children }: { children: ReactNode }) {
  return (
    <MantineProvider theme={chordVaultTheme} cssVariablesResolver={chordVaultVariables} forceColorScheme="light" env="test">
      <ModalsProvider modals={{ setlistName: SetlistNameModal, resetPassword: ResetPasswordModal }} modalProps={{ transitionProps: { duration: 0 } }}>{children}</ModalsProvider>
    </MantineProvider>
  );
}

export const mockUser = { id: 1, username: 'testuser', role: 'owner', token: 'fake-token' };
