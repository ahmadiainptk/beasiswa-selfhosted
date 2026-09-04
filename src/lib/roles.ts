// path: src/lib/roles.ts
// Role-based access control for admin panel
//
// superadmin — semua akses
// admin      — verifikator: Dashboard, Profil Mahasiswa, Export Data
// editor     — blog: Dashboard, Blog/Berita

export type Role = 'mahasiswa' | 'admin' | 'superadmin' | 'editor';

const permissions: Record<Role, string[]> = {
  mahasiswa: [],
  admin: [
    'dashboard:view',
    'profile:view', 'profile:verify',
    'export:view',
  ],
  superadmin: [
    'dashboard:view',
    'profile:view', 'profile:verify',
    'beasiswa:view', 'beasiswa:manage',
    'admin:manage',
    'blog:view', 'blog:manage',
    'export:view',
  ],
  editor: [
    'dashboard:view',
    'blog:view', 'blog:manage',
  ],
};

export function hasPermission(role: string, permission: string): boolean {
  return permissions[role as Role]?.includes(permission) ?? false;
}

export function canAccessAdmin(role: string): boolean {
  return ['admin', 'superadmin', 'editor'].includes(role);
}

// Route guards — which roles can access which admin sections
export function canAccessRoute(role: string, pathname: string): boolean {
  if (role === 'superadmin') return true;

  // Blog routes — editor + superadmin
  if (pathname.startsWith('/admin/blog')) {
    return role === 'editor' || role === 'superadmin';
  }

  // Pendaftaran beasiswa — admin + superadmin
  if (pathname.startsWith('/admin/pendaftaran-beasiswa')) {
    return role === 'admin' || role === 'superadmin';
  }

  // Profile verification — admin + superadmin
  if (pathname.startsWith('/admin/pendaftaran')) {
    return role === 'admin' || role === 'superadmin';
  }

  // Dashboard — all admin roles
  if (pathname === '/admin' || pathname === '/admin/') {
    return canAccessAdmin(role);
  }

  // Beasiswa management — superadmin only
  if (pathname.startsWith('/admin/beasiswa')) {
    return role === 'superadmin';
  }

  // Pengumuman — superadmin only
  if (pathname.startsWith('/admin/pengumuman')) {
    return role === 'superadmin';
  }

  // Export — admin + superadmin
  if (pathname.startsWith('/admin/export')) {
    return role === 'admin' || role === 'superadmin';
  }

  // Pengaturan (admin management) — superadmin only
  if (pathname.startsWith('/admin/pengaturan')) {
    return role === 'superadmin';
  }

  // Default: allow admin + superadmin
  return role === 'admin' || role === 'superadmin';
}
