import { useState, useEffect, useCallback } from 'react';

interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

export function useAsync<T = any>(
  asyncFunction: () => Promise<T>,
  deps: any[] = []
) {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  const execute = useCallback(async () => {
    setState({ data: null, loading: true, error: null });
    
    try {
      const data = await asyncFunction();
      setState({ data, loading: false, error: null });
      return data;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      setState({ data: null, loading: false, error: err });
      throw err;
    }
  }, deps);

  useEffect(() => {
    execute();
  }, [execute]);

  return {
    ...state,
    execute,
    reload: execute,
  };
}