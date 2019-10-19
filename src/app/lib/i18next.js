import i18next from 'i18next';
import detector from 'i18next-browser-languagedetector';

import translationRu from '../../../assets/i18n/ru/translation.json';
import translationEn from '../../../assets/i18n/en/translation.json';

export default () => i18next
  .use(detector)
  .init({
    fallbackLng: 'en',
    resources: {
      en: {
        translation: translationEn,
      },
      ru: {
        translation: translationRu,
      },
    },
  })
  .then(() => i18next);
