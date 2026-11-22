import { test, expect } from 'bun:test';
import { listManualDeposits } from './admin-api';
import { supabase } from '@/integrations/supabase/client';

test('bank deposits use the current preview endpoint', async () => {
  const originalWindow = globalThis.window;
  const originalFetch = globalThis.fetch;
  const originalSession = supabase.auth.getSession;
  let requestedUrl = '';
  let requestedAction = '';
  try {
    supabase.auth.getSession = async () => ({ data: { session: { access_token: 'test-bearer' } }, error: null });
    Object.defineProperty(globalThis, 'window', { configurable: true, value: { location: { hostname: 'example.lovableproject.com', origin: 'https://example.lovableproject.com' } } });
    globalThis.fetch = (async (url, options) => {
      requestedUrl = String(url);
      requestedAction = JSON.parse(String(options?.body)).action;
      expect(new Headers(options?.headers).get('authorization')).toBe('Bearer test-bearer');
      expect(JSON.parse(String(options?.body)).pin).toBeUndefined();
      return Response.json({ data: [] });
    });
    expect(await listManualDeposits('test-pin')).toEqual([]);
    expect(requestedUrl).toBe('https://example.lovableproject.com/api/public/admin');
    expect(requestedAction).toBe('listManualDeposits');
  } finally {
    globalThis.fetch = originalFetch;
    supabase.auth.getSession = originalSession;
    if (originalWindow) Object.defineProperty(globalThis, 'window', { configurable: true, value: originalWindow });
    else Reflect.deleteProperty(globalThis, 'window');
  }
});