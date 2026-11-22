# Animated GK Airwin welcome

- Add a full-screen animated welcome using the supplied GK Airwin Aviator artwork, with cinematic movement, glowing flight trails, atmospheric light, and a prominent take-flight button.
- Show the welcome to signed-out visitors at `/`; send the button to the existing `/auth` screen.
- Keep the current sign-in/sign-up layout and logic unchanged, including country and language options.
- After successful sign-in or registration, return to `/` and reveal the existing Aviator game only when a session is present; signing out returns to the welcome.
- Respect reduced-motion settings and verify the welcome, authentication navigation, and signed-in game on phone and desktop.
