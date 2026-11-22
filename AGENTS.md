<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Aviator rounds use the deterministic shared-clock schedule for both game and admin views so online and offline devices stay aligned.
- Cross-host admin screens call the permanent GK Airwin server endpoint so private backend credentials never enter browser bundles.
- Admin pages and all API/server-function entry points verify a signed-in nonsuspended account against protected user_roles; never trust PINs, browser flags, or user-editable metadata.
- Admin chat summaries count unread player messages separately from conversations whose latest player message follows the last manual reply; opening a chat marks it read but does not resolve waiting status.
- Deposits (NestLink STK) go through the /api/public/deposit route (same-origin on localhost and .lovable.app hosts, the permanent host elsewhere; bearer token verified server-side) so any host works without env setup.
- NestLink settlement is executable only by the server role after provider verification; signup never transfers existing balances by phone metadata, and bet cash-out/cancellation lock and verify a nonsuspended profile before changing funds.
- Bets tapped during flight queue locally for the next round; server-closed or duplicate placement responses recover without exposing database errors.
- Registration and admin payment labels share the supported-country registry; preserve the African subset separately so adding other regions does not change its membership.
- Player language uses shared authored dictionaries and country defaults with a persisted manual override; scope RTL direction to player layouts so the flight scene and admin screens retain their geometry.
- Overseas crypto deposits use authenticated permanent-host APIs and server-verified NOWPayments status; only matching finished KES payments credit through an idempotent database function. Keep existing manual requests for review.
- Crypto deposits preflight NOWPayments currency minimums, preserve provider destination tags, and poll pending payments while the deposit screen is open; never retry uncertain payment creation with a new request ID.
- Chat is manual-only: disable automated player and admin reply entry points server-side as well as in the UI, and preserve historical messages.
- Chat translation is separate from manual messages: authenticate nonsuspended callers, verify ownership or protected admin role, cache server-authored translations by message/language, preserve originals and never generate replies or convert financial amounts.
- The public `/` route is the animated welcome and the game lives at `/play` under the integration-managed authenticated layout, so signed-out visitors authenticate before game state mounts.
- Preserve the existing manual-support composer and transcript, including explicit automated attribution on historical Leo messages.
- Pictures load from the permanent address so custom domains show them.
- Balances stay in KES in the database; player screens convert to the country's currency via MoneyProvider (live rates, cached) and convert entries back to KES.
- Overseas payment choices keep both forms mounted while switching so pending crypto payments and bank entries are not lost; bank transfers use the existing admin-approved request flow.
- Game surfaces, flight artwork and button states share the air-* tokens in the global stylesheet so visual updates never alter gameplay or currency rules.
- Profile attention uses authenticated credited deposit history across all payment methods, not balance, and remains off while history is unknown or an account is suspended.
- Takeoff and crash audio follow observed waiting-to-flying and flying-to-crashed transitions, respect the sound preference, and duck background music until the clip ends; uploaded audio uses permanent-host assets for cross-domain playback.
- Reuse browser audio elements unlocked by pre-login gestures; recover interrupted music on return/connectivity and retry while the game is active, never overriding persisted Sound Off.
- Owner identity is stored in an owner-scoped RLS table, never browser source; owner files use a private bucket with role/suspension and path ownership checks, downloaded with the caller's session rather than public asset URLs.
- Referral rewards are credited only by database triggers on credited deposits (idempotent per deposit), never by client calls.
