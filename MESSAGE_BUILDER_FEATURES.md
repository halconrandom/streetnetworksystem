# Message Builder - Features Overview

This document summarizes current Message Builder capabilities for brainstorming.

## Core Builder
- Drag-and-drop UI for Discord Components v2.
- Live editable component tree with add/remove controls.
- Default new session starts with a single Container + TextDisplay.

## Components Supported
- Container (accent color + spoiler toggle).
- Section (with text + accessory).
- Text Display.
- Action Row.
- Button (link + custom id).
- String Select.
- User Select.
- Role Select.
- Mentionable Select.
- Channel Select.
- Media Gallery.
- Thumbnail.
- File.
- Separator.

## Editor Utilities
- Emoji picker and emoji preview.
- Color picker for container accent.
- Inline validation and error alerts.
- JSON view (toggle on/off).

## Sending / Targets
- Send to Discord via proxy endpoint.
- Saved Webhooks modal (name + value).
- Target type: Webhook URL or Channel ID (bot mode).
- Optional Send to Thread toggle + Thread ID validation.
- Selected webhook name shown in toolbar.

## Templates
- Saved Containers modal (save/load/remove layouts).
- Templates stored in localStorage.

## UX / UI
- Custom top toolbar with actions: Show JSON, Color, Incognito, Saved Containers, Saved Webhooks, Send.
- Dark admin theme aligned with panel: black background, subtle borders, red accent.
- Right panel for instructions + JSON (hidden by default).

## Persistence
- Webhooks stored in localStorage.
- Templates stored in localStorage.
- (Optional/legacy) URL hash sharing exists via `useHashRouter` (currently disabled if removed from App).

## Integration Notes
- Requires `VITE_BACKEND_PROXY_KEY` for proxy auth.
- Proxy handles webhook and bot-channel flows.

