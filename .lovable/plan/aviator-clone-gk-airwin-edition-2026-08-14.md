# Aviator Clone — GK Airwin Edition

Pixel-faithful rebuild of the mobile Aviator screen shown in the three videos. Everything stays identical to the recordings; the only branding change is the provider badge "SPRIBE" → "GK Airwin".

## What the screen contains (from the videos, top to bottom)

1. **App bar** (dark navy): back arrow + "Back", centered "Aviator" title, green pill "Deposit" button with card icon.
2. **Game header** (near-black): red italic "Aviator" logo, balance "3.00 KES", hamburger icon, chat bubble icon.
3. **History strip**: horizontal row of past multipliers as colored pills (purple / blue / pink by value), with a "..." button at the right. New results push in from the left.
4. **Game canvas** (rounded black panel) with animated rotating light rays:
   - Idle/loading state: UFC × Aviator "OFFICIAL PARTNERS" panel, provider badge card ("Official Game", "Since 2019"), red plane graphic, loading bar.
   - Flying state: giant white multiplier ("1.74x"), red curve filling under the flight path, red plane at the curve tip that hovers/wiggles at the top-right, then flies off screen.
   - "FLEW AWAY!" state showing the final multiplier in red.
   - Bottom-right overlay: stacked player avatars + online count (e.g. 2,411).
5. **Bet panel**: Bet / Auto tabs, a second-bet toggle icon, amount stepper (− 5.00 +), quick-amount chips (100 / 200 / 500 / 20,000), large green "Bet 5.00 KES" button that becomes "Cancel" while waiting and "Cash Out" (orange) with live winnings during flight.
6. **Bets list**: All Bets / Previous / Top tabs; summary row with avatars, "4007/4562 Bets", total win KES and a green progress bar that fills as the round runs; table of Player / Bet KES / X / Win KES rows — masked names (a***3), cashed-out rows highlighted green with their multiplier and payout.

## Behavior

- Round loop: betting countdown → plane takes off → multiplier accelerates → random crash → "FLEW AWAY" → next round, matching the video pacing.
- Bet flow: place bet before takeoff, cancel while waiting, cash out during flight, balance updates, result pushed to the history strip.
- Simulated crowd: hundreds of fake players placing bets and cashing out live during each round, driving the counter, total-win figure and progress bar.
- All state is client-side (no accounts or real money) unless you ask for a backend later.

## Technical notes

- Single route at `/` (mobile-first, 390px viewport), React + Tailwind with the Aviator palette defined as design tokens: near-black backgrounds, `#e50539` red, `#28a909` green bet button, purple/blue history pills.
- Canvas rendered with SVG + CSS conic-gradient ray sweep; multiplier curve and plane driven by requestAnimationFrame with an exponential growth curve.
- Round engine in a `useAviatorGame` hook (phases: waiting → flying → crashed), fake player generator in a separate module.
- Avatars generated procedurally so no external images are needed; the plane and logo are inline SVG.
