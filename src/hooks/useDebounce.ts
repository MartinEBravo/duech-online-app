/**
 * Custom hook for debouncing values.
 *
 * Delays updating the returned value until the input has stopped
 * changing for the specified delay. Useful for search inputs to
 * reduce API calls while typing.
 *
 * @module hooks/useDebounce
 */

import { useEffect, useState } from 'react';

/**
 * Debounces a value by delaying updates until after a specified delay.
 *
 * @param value - The value to debounce
 * @param delay - Delay in milliseconds (default: 300ms)
 * @returns The debounced value
 *
 * @example
 * ```tsx
 * const [searchTerm, setSearchTerm] = useState('');
 * const debouncedSearch = useDebounce(searchTerm, 500);
 *
 * useEffect(() => {
 *   // This only runs 500ms after user stops typing
 *   searchApi(debouncedSearch);
 * }, [debouncedSearch]);
 * ```
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Set up a timeout to update the debounced value
    const timeoutId = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Clean up the timeout if value changes before delay completes
    return () => {
      clearTimeout(timeoutId);
    };
  }, [value, delay]);

  return debouncedValue;
}
