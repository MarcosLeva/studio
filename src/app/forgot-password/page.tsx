
import { redirect } from 'next/navigation';

// This page is a duplicate and is now unused.
// It redirects to the correct, localized forgot-password page.
export default function ForgotPasswordPage() {
  redirect('/es/forgot-password');
}
