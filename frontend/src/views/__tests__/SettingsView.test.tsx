import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SettingsView } from '../SettingsView';
const { call } = vi.hoisted(() => ({ call: vi.fn() }));
vi.mock('../../hooks/useApi', () => ({ useApi: () => call }));
vi.mock('../../context/AuthContext', () => ({ useAuth: () => ({ user: null, isAdmin: false }) }));
vi.mock('../../context/DemoContext', () => ({ useDemo: () => ({ demoMode: false }) }));
vi.mock('../../components/GeminiKeySettings', () => ({ GeminiKeySettings: () => null }));
beforeEach(() => { vi.clearAllMocks(); call.mockImplementation((_method: string, path: string) => Promise.resolve(path.endsWith('/languages') ? { languages: [] } : path.endsWith('/ocr-model') ? { model: 'model', models: [] } : { prompt: null, defaultPrompt: '' })); });
const fill = (confirmation: string) => {
  fireEvent.change(screen.getByLabelText('Current Password'), { target: { value: 'oldpass' } });
  fireEvent.change(screen.getByLabelText('New Password'), { target: { value: 'newpass' } });
  fireEvent.change(screen.getByLabelText('Confirm New Password'), { target: { value: confirmation } });
};
it('rejects mismatched passwords without making a write', async () => {
  render(<SettingsView />); fill('different');
  fireEvent.click(screen.getByRole('button', { name: 'Change Password' }));
  expect(await screen.findByText('New passwords do not match')).toBeInTheDocument();
  expect(call.mock.calls.filter(c => c[0] === 'PUT')).toHaveLength(0);
});
it('blocks repeated pending requests and reports a backend error', async () => {
  let reject: (reason: Error) => void = () => {};
  call.mockImplementation((method: string, path: string) => method === 'PUT' ? new Promise((_resolve, fail) => { reject = fail; }) : Promise.resolve(path.endsWith('/languages') ? { languages: [] } : path.endsWith('/ocr-model') ? { models: [] } : { defaultPrompt: '' }));
  render(<SettingsView />); fill('newpass');
  const button = screen.getByRole('button', { name: 'Change Password' });
  fireEvent.click(button); fireEvent.click(button);
  expect(call.mock.calls.filter(c => c[0] === 'PUT')).toHaveLength(1); expect(button).toBeDisabled();
  reject(new Error('Current password incorrect'));
  await screen.findByText('Current password incorrect');
  await waitFor(() => expect(button).toBeEnabled());
});
