# Roadmap

- [ ] Add original-plus-translated manual chats, preserve account privacy, and verify both directions

- [x] Enrich the private owner profile, add the supplied certificate to private storage, and verify owner-only viewing on phone and desktop
- [x] Add an owner-only profile with the supplied portrait, private identity details, title and genuine certificate uploads; verify authenticated owner, anonymous/invalid denial and ownership protection
- [x] Restore the original game layout, sizes and proportions; retain only colour changes and verify phone/desktop screens
- [x] Match the supplied vibrant game colors, sharpen panels and controls, and verify signed-in mobile/desktop appearance without changing gameplay
- [x] Mark conversations waiting for a manual reply and show unread totals in the control centre; verify read/reply transitions
- [x] Replace exposed PIN-only admin access with verified admin accounts; verify page-not-found for signed-out and ordinary players
- [x] Audit sensitive data permissions, prevent private offline caching, add security headers and verify authorised/denied admin flows
- [ ] Deeper security review results (background scan pending)

- [x] Disable all Leo reply paths, retain chat history and verify player message → manual admin reply → player readback; no automatic requests

- [x] Restore overseas bank/crypto choices, keep local-currency amounts, and verify a signed-in bank request submits and reads back
- [x] Add subtle game/deposit word animations with reduced-motion support; verify mobile and desktop layouts

- [x] Add animated global Aviator welcome, preserve the existing auth design, and reveal the game only after sign-in or registration

- [x] Audit NOWPayments requests, reject below-provider-minimum amounts before creation, preserve destination tags, and verify automatic status checking through the signed-in player screen on mobile and desktop
- [ ] Verify completed-payment crediting with real funds (requires a completed payment)

- [x] Replace new overseas bank deposits with NOWPayments; keep Kenyan M-Pesa and existing bank requests; verified real unpaid request and status checking

- [x] Fix admin chat back navigation and preview bank-deposit loading; verify chat switching, deposit tabs, predictor return and accounts
- [x] Fix Leo preview connection and verify typing begins after five seconds with a saved player reply
- [x] Add Leo automated private support, delayed replies, typing status and unanswered-message recovery; all 17 existing unanswered chats replied to
- [x] Verify a new Leo reply through signed-in player chat

- [x] Agent integrations (MCP server with OAuth)
- [x] White-label: branding, metadata, self-hosted audio, no external links
- [x] Vercel-independent deploy: all secrets read server-side from env vars
- [x] Deposit button opens https://me.nestlink.co.ke/Gk
- [x] Lion button opens Control Centre (PIN 8733) with real next-round predictions
- [x] Offline mode: game + admin work with data off (service worker cache)
- [x] Reference-style GKAIRWIN.LIVE predictor with animated calculation bars
- [x] Predictor locks the current crash point through fly-away, shows live flight progress, and previews the next crash point
- [x] Accounts and Chats use the permanent GK Airwin admin endpoint across browser hosts
- [x] Control Centre shows the live animated GK Airwin plane beside the current flight
- [x] Bets min 100 KES; cash out pays the multiplier shown (server-capped); deposit warning removed; withdraw min 15,000 KES with 1,000 KES fee
- [x] Queue bets tapped during flight for the next round; recover cleanly from duplicate/late bet RPC responses
- [x] Prefill deposit phone from the signed-in account, with editing only after tapping Edit
- [x] Add African country-aware registration, keep Kenya M-Pesa, and add admin-approved overseas bank transfer deposits
- [x] Add India and Pakistan, country search, and country-aware player languages with mobile and right-to-left layouts
