"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { ApiError, get } from "../lib/api";

interface ResourceState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export function useResource<T>(path: string | null) {
  const [state, setState] = useState<ResourceState<T>>({ data: null, loading: true, error: null });
  const seq = useRef(0);

  const load = useCallback(async () => {
    if (!path) {
      setState({ data: null, loading: false, error: null });
      return;
    }
    const id = ++seq.current;
    setState((s) => ({ ...s, loading: s.data === null }));
    try {
      const data = await get<T>(path);
      if (seq.current === id) setState({ data, loading: false, error: null });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Something went wrong while loading.";
      if (seq.current === id) setState({ data: null, loading: false, error: message });
    }
  }, [path]);

  useEffect(() => {
    void load();
  }, [load]);

  const reload = useCallback(() => void load(), [load]);

  return { ...state, reload };
}
