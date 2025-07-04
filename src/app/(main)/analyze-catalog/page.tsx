
import { redirect } from 'next/navigation';

// This page is a duplicate and is now unused.
// It redirects to the correct, localized analyze-catalog page.
export default function AnalyzeCatalogRedirectPage() {
  redirect('/es/analyze-catalog');
}
