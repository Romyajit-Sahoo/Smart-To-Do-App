import { useState, useEffect } from 'react';

/**
 * Custom React Hook to sync state with LocalStorage
 * @param {string} key LocalStorage key name
 * @param {any} initialValue Initial state fallback
 */
export const useLocalStorage = (key, initialValue) => {
  // Get initial value from local storage or set initialValue
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading LocalStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Keep state updated in local storage when state changes
  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      console.warn(`Error writing LocalStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue];
};
