export type ApiErrorPayload = {
  status?: boolean;
  code?: string;
  message?: string;
  error?: string | {message?: string};
  data?: {message?: string};
};

/**
 * Returns the error message from an API response, if provided.
 */
export const extractApiErrorMessage = (
  response: ApiErrorPayload | null | undefined,
): string => {
  if (!response) {
    return '';
  }

  if (typeof response.message === 'string' && response.message.trim()) {
    return response.message.trim();
  }

  if (response.data?.message) {
    return response.data.message;
  }

  if (typeof response.error === 'string' && response.error.trim()) {
    return response.error.trim();
  }

  if (
    response.error &&
    typeof response.error === 'object' &&
    response.error.message
  ) {
    return response.error.message;
  }

  if (typeof response === 'string' && response.trim()) {
    return response.trim();
  }

  return '';
};
