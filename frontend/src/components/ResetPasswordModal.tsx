import { Button, PasswordInput, Stack } from '@mantine/core';
import { useForm } from '@mantine/form';
import type { ContextModalProps } from '@mantine/modals';

export function ResetPasswordModal({ context, id, innerProps }: ContextModalProps<{ onSubmit: (password: string) => void }>) {
  const form = useForm({ initialValues: { password: '' }, validate: { password: value => value.length >= 6 ? null : 'Password must be at least 6 characters' } });
  return <form onSubmit={form.onSubmit(({ password }) => { context.closeModal(id); innerProps.onSubmit(password); })}>
    <Stack><PasswordInput label="New password" data-autofocus autoComplete="new-password" {...form.getInputProps('password')} /><Button type="submit">Reset password</Button></Stack>
  </form>;
}
