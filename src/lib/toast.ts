import { toast as sonnerToast } from 'sonner';

interface ToastOptions {
  description?: string;
}

/**
 * Shows an error toast notification and logs to console
 */
export function showError(message: string, error?: unknown, options?: ToastOptions): void {
  const errorMessage = error instanceof Error ? error.message : typeof error === 'string' ? error : undefined;
  const description = options?.description || errorMessage;
  
  console.error(message, error || '');
  
  sonnerToast.error(message, description ? { description } : undefined);
}

/**
 * Shows a success toast notification
 */
export function showSuccess(message: string, options?: ToastOptions): void {
  sonnerToast.success(message, options?.description ? { description: options.description } : undefined);
}

/**
 * Shows an info toast notification
 */
export function showInfo(message: string, options?: ToastOptions): void {
  sonnerToast.info(message, options?.description ? { description: options.description } : undefined);
}

/**
 * Shows a warning toast notification
 */
export function showWarning(message: string, options?: ToastOptions): void {
  sonnerToast.warning(message, options?.description ? { description: options.description } : undefined);
}

