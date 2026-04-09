'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  useEffect(() => {
    const token = localStorage.getItem('v2_token');
    router.push(token ? '/archive' : '/login');
  }, [router]);
  return null;
}
