import 'i18next';
import website from '../src/features/message-builder/legacy/locales/en.json';
import componentsSdk from '../src/integrations/components-sdk/locales/en.json';

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'website';
    resources: {
      website: typeof website;
      'components-sdk': typeof componentsSdk;
    };
  }
}

