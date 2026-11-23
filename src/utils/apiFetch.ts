// Reliable API fetch wrapper that attaches session tokens and active user context without mutating window.fetch
export async function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const headers = new Headers(init?.headers || (input instanceof Request ? input.headers : undefined));
  try {
    const token = localStorage.getItem('vault_session_token');
    if (token) {
      if (!headers.has('x-session-token')) {
        headers.set('x-session-token', token);
      }
      if (!headers.has('Authorization')) {
        headers.set('Authorization', `Bearer ${token}`);
      }
    }
    const loggedIn = localStorage.getItem('vault_logged_in');
    const currentUser = localStorage.getItem('vault_current_user');
    const isAdmin = localStorage.getItem('vault_is_admin');
    const isMasterAdmin = localStorage.getItem('vault_is_master_admin');
    if (loggedIn === 'true') {
      headers.set('x-vault-logged-in', 'true');
      if (currentUser) headers.set('x-vault-user', currentUser);
      if (isAdmin) headers.set('x-vault-is-admin', isAdmin);
      if (isMasterAdmin) headers.set('x-vault-is-master-admin', isMasterAdmin);
    }
  } catch {
    // Ignore storage read errors in restricted contexts
  }
  return window.fetch(input, {
    ...init,
    headers,
  });
}
