'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import DashboardClient from './DashboardClient';

export default function DashboardPage() {
  const { merchant, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !merchant) {
      router.push('/dashboard/login');
    }
  }, [loading, merchant, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-cp-cyan border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!merchant) return null;

  return <DashboardClient merchant={merchant} />;
}
