
import { redirect } from 'next/navigation';

// This page is a duplicate and is now unused.
// It redirects to the correct, localized set-password page.
export default function SetPasswordPage() {
  redirect('/es/set-password');
}
