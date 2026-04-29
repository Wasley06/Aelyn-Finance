<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/10c63752-5afd-4e6d-9163-acc6ab8928d5

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Passkeys / Biometrics (WebAuthn)

This app supports passkey (biometric) sign-in using the Firebase Extension `gavinsawyer/firebase-web-authn`.

Firebase setup:
- Enable **Authentication → Anonymous** provider
- Ensure **Firestore** + **Functions** are enabled
- Install the extension: `gavinsawyer/firebase-web-authn`

Vercel setup (Project → Settings → Environment Variables):
- Set **either** `FIREBASE_WEB_AUTHN_API_URL` (full URL) **or** `FIREBASE_PROJECT_ID` (and optional `FIREBASE_FUNCTIONS_REGION`).

This repo proxies `/firebase-web-authn-api` (same-domain requirement) via `vercel.json` + `api/firebase-web-authn-api.ts`.
