import React, { createContext, useCallback, useContext, useState } from 'react';
import { apiUrl } from '../utils/api';

const DataContext = createContext();

export function DataProvider({ children }) {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);

  const fetchItems = useCallback(async ({ q, page, limit, signal } = {}) => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (limit) params.set('limit', String(limit));
    if (page) params.set('page', String(page));

    try {
      const url = apiUrl(`/api/items${params.toString() ? `?${params.toString()}` : ''}`);
      const res = await fetch(url, { signal });
      if (!res.ok) {
        const err = new Error(`Request failed (${res.status})`);
        err.status = res.status;
        throw err;
      }

      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        const preview = (await res.text()).slice(0, 120);
        throw new Error(`Expected JSON but got "${contentType}". Response starts with: ${preview}`);
      }

      const json = await res.json();
      if (signal?.aborted) return;

      const totalHeader = res.headers.get('X-Total-Count');
      const totalCount =
        totalHeader != null && !Number.isNaN(Number.parseInt(totalHeader, 10))
          ? Number.parseInt(totalHeader, 10)
          : json.length;

      setTotal(totalCount);
      setItems(json);
      return { items: json, total: totalCount };
    } catch (err) {
      if (err?.name === 'AbortError') return;
      throw err;
    }
  }, []);

  return (
    <DataContext.Provider value={{ items, total, fetchItems }}>
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => useContext(DataContext);