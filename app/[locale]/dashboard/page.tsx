'use client';

import { useEffect } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Spinner } from '@/components/Spinner';
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
        <Spinner size={24} />
      </div>
    );
  }

  if (!merchant) return null;

  return <DashboardClient merchant={merchant} />;
}
