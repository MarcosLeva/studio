
import { redirect } from 'next/navigation';

// This page is a duplicate and is now unused.
// It redirects to the correct, localized reset-password page.
export default function ResetPasswordPage() {
  redirect('/es/reset-password');
}
