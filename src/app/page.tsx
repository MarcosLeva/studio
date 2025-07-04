
import { redirect } from 'next/navigation';

// This page now redirects to the default locale's root.
// The localized root page at /src/app/[locale]/page.tsx will then handle further redirects (e.g., to the login page).
export default function RootPage() {
  redirect('/es');
}
