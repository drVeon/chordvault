import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthView } from '../AuthView';
const { api, login } = vi.hoisted(() => ({ api: vi.fn(), login: vi.fn() }));
vi.mock('../../lib/api', () => ({ api }));
vi.mock('../../context/AuthContext', () => ({ useAuth: () => ({ login }) }));
vi.mock('../../context/I18nContext', () => ({ useI18n: () => ({ t: (key: string) => key }) }));
beforeEach(() => { vi.clearAllMocks(); api.mockImplementation((method: string) => method === 'GET' ? Promise.resolve({ allowRegistration: true }) : new Promise(() => {})); });
it('keeps one sign-in request pending and blocks repeated submits', async () => {
  render(<AuthView navigate={vi.fn()} />);
  await waitFor(() => expect(api).toHaveBeenCalledWith('GET', '/api/auth/config'));
  fireEvent.change(screen.getByLabelText('auth.username'), { target: { value: 'preview' } });
  fireEvent.change(screen.getByLabelText('auth.password'), { target: { value: 'password' } });
  const button = document.querySelector('#auth-submit')!;
  fireEvent.click(button); fireEvent.click(button);
  expect(api.mock.calls.filter(call => call[0] === 'POST')).toHaveLength(1);
  expect(button).toBeDisabled();
});
it('shows backend failure and allows a subsequent attempt', async () => {
  api.mockImplementation((method: string) => method === 'GET' ? Promise.resolve({ allowRegistration: true }) : Promise.reject(new Error('Denied')));
  render(<AuthView navigate={vi.fn()} />);
  fireEvent.change(screen.getByLabelText('auth.username'), { target: { value: 'preview' } });
  fireEvent.change(screen.getByLabelText('auth.password'), { target: { value: 'password' } });
  fireEvent.click(document.querySelector('#auth-submit')!);
  expect(await screen.findByText('Denied')).toBeInTheDocument();
  expect(document.querySelector('#auth-submit')).not.toBeDisabled();
});
