let accessToken: string | null = null;

export function setAccessToken(token: string) {
  accessToken = token;

  // Persist in browser
  localStorage.setItem('accessToken', token);

  // Make available to middleware (server)
  document.cookie = `accessToken=${token}; path=/`;
}

export function getAccessToken(): string | null {
  if (accessToken) return accessToken;

  if (typeof window !== 'undefined') {
    return localStorage.getItem('accessToken');
  }

  return null;
}

export function clearAccessToken() {
  accessToken = null;
  localStorage.removeItem('accessToken');
  document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
}