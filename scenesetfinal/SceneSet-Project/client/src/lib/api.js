const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/$/, '');

export async function api(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  const isForm = options.body instanceof FormData;
  if (options.body && !isForm && typeof options.body !== 'string') {
    headers['Content-Type'] = 'application/json';
    options = { ...options, body: JSON.stringify(options.body) };
  }
  let response;
  try {
    response = await fetch(`${API_BASE}${path.startsWith('/') ? path : `/${path}`}`, {
      ...options,
      headers,
      credentials: 'include'
    });
  } catch (_error) {
    throw new Error('Could not connect to SceneSet. Check that the backend is running.');
  }
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload?.error?.message || payload?.message || 'Something went wrong.');
    error.status = response.status;
    error.code = payload?.error?.code;
    throw error;
  }
  return payload;
}

export { API_BASE };
