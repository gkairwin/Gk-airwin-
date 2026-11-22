import { test, expect } from "bun:test";
import { readFileSync } from "node:fs";

const sql = readFileSync(new URL("../../drizzle/migrations/0013_secure_deposit_credit_signup_and_suspended_bets.sql", import.meta.url), "utf8");

test("deposit settlement revokes public and player execution and checks the server role", () => {
  expect(sql).toContain("FROM PUBLIC, anon, authenticated");
  expect(sql).toContain("TO service_role");
  expect(sql).toContain("auth.role() IS DISTINCT FROM ''service_role''");
});

test("signup initializes only the new profile with zero balance", () => {
  const signup = sql.split("CREATE OR REPLACE FUNCTION public.handle_new_user()")[1].split("$function$;")[0];
  expect(signup).toContain("NEW.raw_user_meta_data ->> 'phone', 0,");
  expect(signup).not.toMatch(/UPDATE|sum\(balance\)|legacy/i);
});

test("both cash-out entry points and cancellation lock and reject suspended profiles", () => {
  for (const fn of ["public.cash_out_at(uuid,numeric)", "public.cash_out(uuid)", "public.cancel_bet(uuid)"]) {
    expect(sql).toContain(fn);
  }
  expect(sql).toContain("WHERE id = uid AND NOT suspended FOR UPDATE");
  expect(sql).toContain("IF NOT FOUND THEN RAISE EXCEPTION ''account_suspended''");
});