# Correct Merge Audit — superbot

## Result

This rebuild integrates the uploaded `ai-chat-bot-main.zip` into the runnable Superbot package rather than only preserving it as an archive.

## Locked backend

`https://script.google.com/macros/s/AKfycbzoGmgKoNq_d-KorQsuBYYeJYQ0pAVk4a7Y3zFxdJncbU7GlMK_Dg2irgbR1zPfyiPr4g/exec`

## Integrated into runnable code

| Source | Converted target |
|---|---|
| `backend/src/ai/ai.service.ts` | Apps Script AI bridge using `AI_API_URL`, `AI_API_KEY`, `AI_MODEL` |
| `backend/src/chat/chat.service.ts` | Apps Script conversation/message history + plan message limit logic |
| `backend/src/auth/auth.service.ts` | Apps Script register/login/session routes |
| `frontend/src/store/useChatStore.ts` | Plain JS conversation state and optimistic send |
| `frontend/src/components/ChatWidget.tsx` | Plain JS/CSS widget/dashboard chat panel |
| `frontend/public/widget.js` | `frontend/embed/superbot-widget.js`, locked to backend |
| `frontend/src/app/(dashboard)/dashboard/chats/page.tsx` | `frontend/superbot.html` dashboard chat layout |
| `frontend/src/app/api/chat/route.ts` | Apps Script OpenAI-compatible AI bridge |

## Why some source was not pasted into Code.gs

Google Apps Script cannot run:
- Next.js app server/routes
- NestJS/Express servers
- Prisma
- JWT middleware libraries
- bcrypt package
- Stripe webhook server
- React/Framer Motion/Zustand packages
- `.next` compiled build output

Those are recorded in `docs/manifests/source_file_manifest.json` and the original archive is kept for audit traceability.

## Quality checks performed

- `Code.gs` syntax checked as plain JavaScript with `node --check`.
- ZIP integrity checked after creation.
- Frontend API client hard-locks the deployment URL.
- No API keys or secrets hard-coded.

## Important boundary

This package gives a strong Apps Script-compatible project bot. To get true ChatGPT-level model intelligence or real MP3/WAV neural voice synthesis, connect external endpoints through Script Properties.
