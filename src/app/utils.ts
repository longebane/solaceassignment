'use client';
import { useEffect, useState } from 'react';

export function useDebounce<T>(value: T, delay = 500) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const timeout = setTimeout(() => setV(value), delay);
    return () => clearTimeout(timeout);
  }, [value, delay]);
  return v;
}
