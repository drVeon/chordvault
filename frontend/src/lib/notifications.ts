import { notifications, notificationsStore } from '@mantine/notifications';

export function showStatusNotification(message: string, type?: string) {
  const notification = {
    id: 'cv-status', message, autoClose: 3000,
    color: type === 'error' ? 'red' : type === 'success' ? 'green' : undefined,
  };
  const state = notificationsStore.getState();
  if ([...state.notifications, ...state.queue].some((item) => item.id === notification.id)) {
    notifications.update(notification);
  } else {
    notifications.show(notification);
  }
}
