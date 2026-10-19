import { redirect } from 'next/navigation';

export default function KategoriBukuRedirect() {
  redirect('/admin/book-categories');
}
