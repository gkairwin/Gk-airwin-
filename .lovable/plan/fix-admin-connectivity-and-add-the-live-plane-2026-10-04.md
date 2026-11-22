# Fix admin connectivity and add the live plane

## What will change
- Make Accounts and Chats use the managed GK Airwin backend even when the frontend is opened from another browser or a Vercel deployment.
- Keep the private backend key server-side; the app will never ask players or admins to enter backend URLs or keys.
- Add the existing red GK Airwin plane alone in the marked top-right area of the Control Centre, with the same gentle up-and-down motion and spinning propeller used in the game.

## Implementation
- Add authenticated-by-admin-PIN server endpoints for account listing, balance credits, chat listing, chat reading, and replies on the permanent GK Airwin backend.
- Update admin calls to use local managed credentials when available and automatically fall back to the permanent backend endpoints when the current host lacks private server configuration.
- Preserve all existing account merging, balance-credit, private-chat, and error-handling behavior.
- Add the existing `Plane` component to the Control Centre header without a card, label, path, or extra decoration.

## Verification
- Confirm the preview builds without errors.
- Open the Control Centre, Accounts, and Chats pages and confirm the missing-environment warning is gone.
- Verify adding money is reflected for the player account, then send and reply to an individual chat.
- Check the plane position and motion at the current phone size and desktop width.

## Security note
The service-role and NestLink secrets will remain private. They will not be embedded in browser code or placed in `VITE_` variables.
