
import { SavedTemplate, SavedWebhook } from '../types/builder';

const TEMPLATES_KEY = 'discord_templates';
const WEBHOOKS_KEY = 'discord_webhooks';

// --- Templates ---
export const getTemplates = (): SavedTemplate[] => {
  const data = localStorage.getItem(TEMPLATES_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveTemplate = (template: SavedTemplate) => {
  const templates = getTemplates();
  const index = templates.findIndex(t => t.id === template.id);
  if (index >= 0) {
    templates[index] = template;
  } else {
    templates.push(template);
  }
  localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates));
};

export const deleteTemplate = (id: string) => {
  const templates = getTemplates().filter(t => t.id !== id);
  localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates));
};

// --- Webhooks ---
export const getWebhooks = (): SavedWebhook[] => {
  const data = localStorage.getItem(WEBHOOKS_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveWebhook = (webhook: SavedWebhook) => {
  const webhooks = getWebhooks();
  const index = webhooks.findIndex(w => w.id === webhook.id);
  if (index >= 0) {
    webhooks[index] = webhook;
  } else {
    webhooks.push(webhook);
  }
  localStorage.setItem(WEBHOOKS_KEY, JSON.stringify(webhooks));
};

export const deleteWebhook = (id: string) => {
  const webhooks = getWebhooks().filter(w => w.id !== id);
  localStorage.setItem(WEBHOOKS_KEY, JSON.stringify(webhooks));
};
