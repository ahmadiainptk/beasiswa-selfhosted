// path: src/lib/runtime.ts
// Helper to get Cloudflare runtime from Astro locals (v12 pattern)
export function getRuntime(locals: any) {
  return locals?.runtime;
}

export function getEnv(locals: any) {
  return locals?.runtime?.env;
}

export function getDb(locals: any) {
  const env = getEnv(locals);
  return env?.DB;
}
