import { createFileRoute } from '@tanstack/react-router';
const headers = { 'access-control-allow-origin': '*', 'access-control-allow-methods': 'POST, OPTIONS', 'access-control-allow-headers': 'content-type, authorization', 'cache-control': 'no-store' };
export const Route = createFileRoute('/api/public/crypto-deposit')({ server: { handlers: {
  OPTIONS: () => new Response(null, { status: 204, headers }),
  POST: async ({ request }) => {
    const json = (body: unknown, status = 200) => Response.json(body, { status, headers });
    try {
      const token = (request.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '');
      if (!token) return json({ error: 'Please sign in first.' }, 401);
      const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
      const { data, error } = await supabaseAdmin.auth.getUser(token);
      if (error || !data.user) return json({ error: 'Please sign in again.' }, 401);
      const { cryptoDeposit } = await import('@/lib/crypto-deposits.server');
      return json({ data: await cryptoDeposit(await request.json(), data.user.id) });
    } catch (error) { return json({ error: error instanceof Error ? error.message : 'Payment request failed.', retrySafe: error instanceof Error && 'retrySafe' in error && error.retrySafe === true }, 400); }
  },
} } });