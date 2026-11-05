import { redirect } from 'next/navigation';

export default function PaymentPageRedirect() {
  redirect('/dashboard/settings');
}
