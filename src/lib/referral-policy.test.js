import { expect, test } from "vitest";
import { referralLink, referralReward } from "./referral-policy";
test("first deposit pays 50 KES plus 10%", () => expect(referralReward(1000, true)).toBe(150));
test("later deposits pay 10%", () => expect(referralReward(500, false)).toBe(50));
test("invite link opens sign-up with code", () => expect(referralLink("https://gkairwin.live", "AB12CD34")).toBe("https://gkairwin.live/auth?ref=AB12CD34"));
