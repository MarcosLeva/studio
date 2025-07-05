import {getRequestConfig} from 'import { useTranslations } from "next-intl";ntl/server';
 
export default getRequestConfig(async ({locale}) => ({
  messages: (await import(`./messages/${locale}.json`)).default
}));