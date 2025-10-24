<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1_aFqfLkVlm4DT57oKJ5BTFXrl7XO3IlU

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `VITE_GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key. Optionally configure `VITE_API_BASE_URL` if you need to point at a custom Teller backend.
3. Run the app for local development:
   `npm run dev`
4. Build the production bundle:
   `npm run build`
5. Serve the production build (includes the Teller proxy backend):
   `npm start`

## Proxy endpoints

- `GET /api/config` – fetch Teller backend configuration (falls back to static defaults)
- `POST /api/enrollments` – forwards enrollment payloads to `${BACKEND_URL}/api/enrollments`, preserving the caller's `Authorization` header and streaming the upstream response
