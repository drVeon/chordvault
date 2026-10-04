import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { OcrModal } from '../OcrModal';

const { api, toast } = vi.hoisted(() => ({ api: vi.fn(), toast: vi.fn() }));
vi.mock('../../hooks/useApi', () => ({ useApi: () => api }));
vi.mock('../../lib/notifications', () => ({ showStatusNotification: toast }));

beforeEach(() => {
  api.mockReset();
  toast.mockReset();
  api.mockResolvedValue({ model: 'test-model', models: [] });
});

it('loads only while open, restores focus, and ignores a closed extraction failure after reopening', async () => {
  let rejectExtraction!: (error: Error) => void;
  api.mockImplementation((method: string) => method === 'GET'
    ? Promise.resolve({ model: 'test-model', models: [] })
    : new Promise((_, reject) => { rejectExtraction = reject; }));
  function Harness() {
    const [opened, setOpened] = useState(false);
    return <><button onClick={() => setOpened(true)}>Open OCR</button><OcrModal opened={opened} hasGeminiKey onResult={vi.fn()} onClose={() => setOpened(false)} /></>;
  }
  render(<Harness />);
  expect(api).not.toHaveBeenCalled();
  const opener = screen.getByRole('button', { name: 'Open OCR' });
  await userEvent.click(opener);
  await userEvent.upload(screen.getByLabelText('Select image or PDF'), new File(['image'], 'sheet.png', { type: 'image/png' }));
  await userEvent.click(screen.getByRole('button', { name: /Extract text/ }));
  await waitFor(() => expect(api).toHaveBeenCalledWith('POST', '/api/ocr/gemini', expect.objectContaining({ model: 'test-model' })));
  await userEvent.keyboard('{Escape}');
  await waitFor(() => expect(opener).toHaveFocus());
  await userEvent.click(opener);
  expect((screen.getByLabelText('Select image or PDF') as HTMLInputElement).files).toHaveLength(0);
  expect(screen.getByRole('button', { name: /Extract text/ })).toBeEnabled();
  await act(async () => { rejectExtraction(new Error('Old request failed')); });
  expect(toast).not.toHaveBeenCalled();
  expect(api.mock.calls.filter(([method]) => method === 'GET')).toHaveLength(2);
});
