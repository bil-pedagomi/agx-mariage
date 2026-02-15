import { redirect } from 'next/navigation';

export default function Home() {
  // Redirige vers /login — le login page vérifie si déjà connecté
  // et redirige vers /dashboard si c'est le cas
  redirect('/login');
}
