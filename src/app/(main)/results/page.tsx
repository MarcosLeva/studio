
import { redirect } from 'next/navigation';

// This page is a duplicate and is now unused.
// It redirects to the correct, localized results page.
export default function ResultsRedirectPage() {
  redirect('/es/results');
}
