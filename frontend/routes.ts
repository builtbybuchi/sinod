import { View } from './types';

export const paths: Record<View, string> = {
  [View.DASHBOARD]: '/dashboard',
  [View.EVENT]: '/event/:eventId',
  [View.SIGN_UP]: '/signup',
  [View.SIGN_UP_SUCCESS]: '/signup-success',
  [View.SIGN_IN]: '/signin',
};

export const viewToPath = (view: View, params?: { eventId?: string }) => {
  if (view === View.EVENT) {
    return `/event/${params?.eventId || 'event-id'}`;
  }
  return paths[view]
    .replace(':eventId', params?.eventId || 'event-id');
};
