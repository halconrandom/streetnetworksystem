import 'i18next';
import website from '../website/src/locales/en.json';
import componentsSdk from '../components-sdk/src/locales/en.json';

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'website';
    resources: {
      website: typeof website;
      'components-sdk': typeof componentsSdk;
    };
  }
}
