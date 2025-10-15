import { redirect } from 'next/navigation';

export default function Home() {
  // Redirect to the leads page
  redirect('/leads');
}
