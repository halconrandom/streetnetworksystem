export const getApiBase = (): string => {
  const envBase = process.env.NEXT_PUBLIC_PLATFORM_API;
  if (typeof envBase === 'string' && envBase.trim()) {
    return envBase.replace(/\/$/, '');
  }
  const builderBase = process.env.NEXT_PUBLIC_MESSAGE_BUILDER_API;
  if (typeof builderBase === 'string' && builderBase.trim()) {
    return builderBase.replace(/\/message-builder\/?$/, '').replace(/\/$/, '');
  }
  if (typeof window !== 'undefined') {
    const windowBase = (window as any)?.__VITE_MESSAGE_BUILDER_API__;
    if (typeof windowBase === 'string' && windowBase.trim()) {
      return windowBase.replace(/\/message-builder\/?$/, '').replace(/\/$/, '');
    }
  }
  return '';
};

export const getApiKey = (): string => {
  const envKey = process.env.NEXT_PUBLIC_PLATFORM_API_KEY;
  if (typeof envKey === 'string' && envKey.trim()) return envKey;
  const builderKey = process.env.NEXT_PUBLIC_MESSAGE_BUILDER_API_KEY;
  if (typeof builderKey === 'string' && builderKey.trim()) return builderKey;
  if (typeof window !== 'undefined') {
    const windowKey = (window as any)?.__VITE_MESSAGE_BUILDER_API_KEY__;
    if (typeof windowKey === 'string' && windowKey.trim()) return windowKey;
  }
  return '';
};
