import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';

interface AsyncCallbackState {
  loading: boolean;
  error: Error | null;
}

interface UseAsyncCallbackOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
  successMessage?: string;
  errorMessage?: string;
}

export function useAsyncCallback<T extends (...args: any[]) => Promise<any>>(
  asyncFunction: T,
  options: UseAsyncCallbackOptions = {}
) {
  const [state, setState] = useState<AsyncCallbackState>({
    loading: false,
    error: null,
  });

  const execute = useCallback(
    async (...args: Parameters<T>): Promise<ReturnType<T> | undefined> => {
      setState({ loading: true, error: null });

      try {
        const result = await asyncFunction(...args);
        
        setState({ loading: false, error: null });
        
        if (options.successMessage) {
          toast.success(options.successMessage, {
            icon: '✅',
          });
        }
        
        if (options.onSuccess) {
          options.onSuccess(result);
        }
        
        return result;
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Unknown error');
        
        setState({ loading: false, error: err });
        
        const errorMessage = options.errorMessage || err.message || '오류가 발생했습니다';
        toast.error(errorMessage, {
          icon: '❌',
        });
        
        if (options.onError) {
          options.onError(err);
        }
        
        throw err;
      }
    },
    [asyncFunction, options]
  );

  return {
    execute,
    loading: state.loading,
    error: state.error,
  };
}