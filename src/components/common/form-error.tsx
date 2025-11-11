import { ExclamationCircleIcon } from '@/components/icons';

interface FormErrorProps {
  message: string;
}

export function FormError({ message }: FormErrorProps) {
  if (!message) return null;

  return (
    <div className="mt-3 flex h-8 items-end space-x-1" aria-live="polite" aria-atomic="true">
      <ExclamationCircleIcon className="h-5 w-5 text-red-500" />
      <p className="text-sm text-red-500">{message}</p>
    </div>
  );
}
