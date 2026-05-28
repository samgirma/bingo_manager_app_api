import DashboardLayout from '@/components/shared/DashboardLayout';
import { apiService } from '@/services/api';
import { useRouter } from 'expo-router';
import React from 'react';

export default function OperatorHome() {
  const router = useRouter();
  const currentUser = apiService.getCurrentUserSync();

  return (
    <DashboardLayout
      balanceLabel="Your Balance (ETB)"
      insightTitle="Your Performance"
      insightBody={(a) =>
        `You have ${a.activeCenters} active centers. Generated ${a.todayGeneratedTopups.toLocaleString()} ETB in top-ups today.`
      }
      insightIcon="trending-up"
      insightIconColor="#10B981"
      actions={[
        {
          icon: 'person-add',
          title: 'Add Center',
          onPress: () => router.push('/(operator)/create-user'),
        },
        {
          icon: 'wallet',
          title: 'Recharge',
          onPress: () => router.push('/(operator)/recharge-balance'),
        },
        { icon: 'business', title: 'Terminals' },
        { icon: 'ellipsis-horizontal', title: 'More' },
      ]}
      transactionsDebitedBy={currentUser?.username}
    />
  );
}
