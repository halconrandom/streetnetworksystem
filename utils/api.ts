export const getApiBase = (): string => {
  const metaBase = (import.meta as any)?.env?.VITE_PLATFORM_API;
  if (typeof metaBase === 'string' && metaBase.trim()) {
    return metaBase.replace(/\/$/, '');
  }
  const builderBase = (import.meta as any)?.env?.VITE_MESSAGE_BUILDER_API;
  if (typeof builderBase === 'string' && builderBase.trim()) {
    return builderBase.replace(/\/message-builder\/?$/, '').replace(/\/$/, '');
  }
  const windowBase = (window as any)?.__VITE_MESSAGE_BUILDER_API__;
  if (typeof windowBase === 'string' && windowBase.trim()) {
    return windowBase.replace(/\/message-builder\/?$/, '').replace(/\/$/, '');
  }
  return '';
};

export const getApiKey = (): string => {
  const metaKey = (import.meta as any)?.env?.VITE_PLATFORM_API_KEY;
  if (typeof metaKey === 'string' && metaKey.trim()) return metaKey;
  const builderKey = (import.meta as any)?.env?.VITE_MESSAGE_BUILDER_API_KEY;
  if (typeof builderKey === 'string' && builderKey.trim()) return builderKey;
  const windowKey = (window as any)?.__VITE_MESSAGE_BUILDER_API_KEY__;
  if (typeof windowKey === 'string' && windowKey.trim()) return windowKey;
  return '';
};
