import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import { ComponentsSdkBackend } from '@integrations/components-sdk/I18nextBackend';

if (!i18next.isInitialized) {
    i18next
        .use(ComponentsSdkBackend)
        .use(initReactI18next)
        .init({
            lng: 'en',
            fallbackLng: 'en',
            ns: ['components-sdk'],
            defaultNS: 'components-sdk',
            interpolation: { escapeValue: false },
        });
}

export default i18next;
