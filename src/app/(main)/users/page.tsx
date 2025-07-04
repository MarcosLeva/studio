
import { redirect } from 'next/navigation';

// This page is a duplicate and is now unused.
// It redirects to the correct, localized users page.
export default function UsersRedirectPage() {
  redirect('/es/users');
}
