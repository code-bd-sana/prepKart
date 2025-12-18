import {getRequestConfig} from 'next-intl/server';

// Define supported locales
export const locales = ['en', 'fr'];
export const defaultLocale = 'en';

export default getRequestConfig(async ({locale}) => {
  // Load messages for the given locale
  return {
    messages: (await import(`../messages/${locale}.json`)).default
  };
});