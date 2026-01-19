// Central place to decide what base URL we put into emails (invites, password resets, magic links).
//
// Prefer VITE_PUBLIC_APP_URL so admins can send correct links even when they are using
// preview/staging URLs.

export function getPublicAppUrl(): string {
  const configured = import.meta.env.VITE_PUBLIC_APP_URL as string | undefined;

  const base = (configured || window.location.origin).trim();

  // Normalize: remove trailing slashes
  return base.replace(/\/+$/, '');
}

export function buildPublicUrl(pathname: string): string {
  const base = getPublicAppUrl();
  const path = pathname.startsWith('/') ? pathname : `/${pathname}`;
  return `${base}${path}`;
}
