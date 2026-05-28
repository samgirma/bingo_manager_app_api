import DashboardLayout from '@/components/shared/DashboardLayout';
import { useRouter } from 'expo-router';
import React from 'react';

export default function AdminHome() {
  const router = useRouter();

  return (
    <DashboardLayout
      balanceLabel="Total System Balance (ETB)"
      insightTitle="Operator Activity Audit"
      insightBody={(a) =>
        `All ${a.activeCenters} active operators are online. No pending balance anomalies detected today.`
      }
      insightIcon="shield-checkmark"
      insightIconColor="#10B981"
      actions={[
        { icon: 'add', title: 'Add Balance' },
        { icon: 'swap-horizontal', title: 'Transfer' },
        {
          icon: 'business',
          title: 'Terminals',
          onPress: () => router.push('/(admin)/operators'),
        },
        { icon: 'ellipsis-horizontal', title: 'More' },
      ]}
    />
  );
}
