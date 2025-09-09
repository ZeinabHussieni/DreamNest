const json = async (res: Response) => ({ data: await res.json() });
const headers = { 'Content-Type': 'application/json' };

const api = {
  get: async (url: string, init?: RequestInit) => json(await fetch(url, init)),
  delete: async (url: string, init?: RequestInit) => json(await fetch(url, { method: 'DELETE', ...(init || {}) })),
  post: async (url: string, data?: any, init?: RequestInit) =>
    json(
      await fetch(url, {
        method: 'POST',
        headers,
        body: data == null ? undefined : JSON.stringify(data),
        ...(init || {}),
      })
    ),
  patch: async (url: string, data?: any, init?: RequestInit) =>
    json(
      await fetch(url, {
        method: 'PATCH',
        headers,
        body: data == null ? undefined : JSON.stringify(data),
        ...(init || {}),
      })
    ),
  interceptors: { request: { use: () => {} }, response: { use: () => {} } },
};

export default api;


test('axios-fetch helper loaded', () => expect(typeof api.post).toBe('function'));


