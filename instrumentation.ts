export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { reconcile } = await import('./lib/jobs');
    reconcile();
  }
}
