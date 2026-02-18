export function getApiBaseUrl() {
  // Prefer an explicit env var for deployments; default to local backend in dev.
  const envBase = process.env.REACT_APP_API_BASE_URL;
  if (envBase) return envBase.replace(/\/+$/, '');

  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3001';
  }

  return '';
}

export function apiUrl(pathnameWithQuery) {
  const base = getApiBaseUrl();
  if (!pathnameWithQuery.startsWith('/')) {
    pathnameWithQuery = `/${pathnameWithQuery}`;
  }
  return `${base}${pathnameWithQuery}`;
}

