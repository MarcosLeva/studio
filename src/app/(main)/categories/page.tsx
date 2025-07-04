
import { redirect } from 'next/navigation';

// This page is a duplicate and is now unused.
// It redirects to the correct, localized categories page.
export default function CategoriesRedirectPage() {
  redirect('/es/categories');
}
