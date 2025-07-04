
import { redirect } from 'next/navigation';

// This page is a duplicate and is now unused.
// It redirects to the correct, localized login page.
export default function LoginPage() {
  redirect('/es/login');
}
