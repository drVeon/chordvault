import { Button, Stack, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import type { ContextModalProps } from '@mantine/modals';

export function SetlistNameModal({ context, id, innerProps }: ContextModalProps<{ onSubmit: (name: string) => void }>) {
  const form = useForm({ initialValues: { name: '' }, validate: { name: value => value.trim() ? null : 'Enter a setlist name' } });
  return <form onSubmit={form.onSubmit(({ name }) => { context.closeModal(id); innerProps.onSubmit(name.trim()); })}>
    <Stack><TextInput label="Setlist name" data-autofocus {...form.getInputProps('name')} /><Button type="submit">Create setlist</Button></Stack>
  </form>;
}
