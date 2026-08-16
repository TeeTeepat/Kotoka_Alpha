# LINE Messaging API Setup — Kotoka Parent Reports

Goal: the app pushes a progress report to the parent's LINE every time the kid completes a path step (demo mode).

Time needed: ~15 minutes.

## 1. Create a LINE Official Account (OA)

1. Go to https://manager.line.biz/ and log in with your personal LINE account.
2. Click **Create a new LINE Official Account**.
3. Name it e.g. `Kotoka Report`, category: Education. Everything else default.

## 2. Enable Messaging API

1. In LINE Official Account Manager, open your new OA → **Settings** (gear, top right) → **Messaging API**.
2. Click **Enable Messaging API**.
3. It asks to create/link a **LINE Developers provider** — create one named `Kotoka`.
4. After enabling, note the **Channel ID** and **Channel secret** shown on that page.

## 3. Get the Channel Access Token

1. Go to https://developers.line.biz/console/ → provider `Kotoka` → your Messaging API channel.
2. Open the **Messaging API** tab.
3. Scroll to **Channel access token (long-lived)** → click **Issue**.
4. Copy the token.

## 4. Put credentials in `.env`

Add to `.env` (and `.env.local` if you use it):

```
LINE_CHANNEL_ACCESS_TOKEN=<long-lived token from step 3>
LINE_CHANNEL_SECRET=<channel secret from step 2>
```

## 5. Turn off auto-reply spam

In LINE OA Manager → **Settings → Response settings**:
- Response mode: **Bot**
- Auto-response messages: **Off**
- Greeting message: optional (kid-friendly welcome is nice)

## 6. Connect a parent (getting the userId)

The app will have a **LINE connect card** in the Parent tab showing your OA's QR code (from the Messaging API tab in LINE Developers — "QR code").

Two ways the app learns the parent's userId:

- **Webhook (production way):** set Webhook URL in LINE Developers → Messaging API tab to `https://<your-deployed-domain>/api/line/webhook`, toggle **Use webhook = On**. When the parent adds the bot as a friend, the app receives a `follow` event and stores the userId.
- **Demo shortcut (no public URL needed):** after you add the bot as friend, message it anything, then in the Parent tab paste the userId manually — OR simplest for judging: we hardcode YOUR userId in `.env` as `LINE_DEMO_PARENT_USER_ID`. You can find your userId at LINE Developers console → Messaging API tab → **Your user ID** (bottom of Basic settings tab).

For today's demo, add:

```
LINE_DEMO_PARENT_USER_ID=<Your user ID from Basic settings tab>
```

With that set, every path-step completion pushes the report to your own LINE — perfect for showing the judge.

## 7. Test

Once the team's code lands, the Parent tab has a **Send test report** button. Tap it — you should receive a LINE message within seconds.

Free tier: 200 push messages/month — plenty for demo.

## 8. Pairing code flow (per-parent connect, no manual userId copying)

The Parent tab now has a proper connect flow instead of relying only on the
hardcoded `LINE_DEMO_PARENT_USER_ID`: tap **Get pairing code**, it shows a
6-digit code, the parent sends that code to the bot in LINE chat, and the
webhook links that LINE userId to their Kotoka account (`lineParentUserId`
on `User`). Reports then push to that userId — the env var is now only a
fallback for accounts that never paired.

This requires the webhook to actually reach your dev server, which means a
public URL:

1. Run the app locally (`npm run dev`, port 3000).
2. In another terminal: `ngrok http 3000` (install via `brew install ngrok`
   or https://ngrok.com/download if you don't have it). Copy the
   `https://<random>.ngrok-free.app` URL it prints.
3. LINE Developers console → provider `Kotoka` → your Messaging API channel
   → **Messaging API** tab → **Webhook settings** → Webhook URL:
   `https://<random>.ngrok-free.app/api/line/webhook` → **Verify** (should
   say Success) → toggle **Use webhook = On**.
4. Also toggle **Auto-reply messages = Off** if you haven't (step 5 above) —
   otherwise LINE's own auto-reply fires alongside the bot's pairing reply.
5. Add-friend QR/link: same **Messaging API** tab, the QR code image near
   the top, or **Basic settings** tab → "Bot basic ID" → build a link as
   `https://line.me/R/ti/p/@<your-basic-id>`. Put that link in `.env` as
   `NEXT_PUBLIC_LINE_ADD_FRIEND_URL` — the Parent tab uses it for the
   "add the bot as a friend" step before showing the pairing code.

Because ngrok URLs change every restart (on the free tier), re-verify the
webhook URL each time you restart ngrok during the demo.
