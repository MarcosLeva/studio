
import { redirect } from 'next/navigation';

// This page is a duplicate and is now unused.
// It redirects to the correct, localized profile page.
export default function ProfileRedirectPage() {
  redirect('/es/profile');
}
