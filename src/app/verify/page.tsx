import { redirect } from 'next/navigation';
// Legacy email links now lead to the Google flow; they cannot verify an account.
export default function Verify() {
  redirect('/signin');
}
