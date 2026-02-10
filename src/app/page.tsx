import { redirect } from 'next/navigation';

export default function Home() {
  // Le middleware gère la redirection :
  // - Si connecté → /clients
  // - Si non connecté → /login
  // Cette page ne devrait normalement pas être atteinte,
  // mais au cas où, on redirige vers /clients
  redirect('/clients');
}
