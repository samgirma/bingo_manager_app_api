import TransactionsList from '@/components/shared/TransactionsList';
import { apiService } from '@/services/api';
import React from 'react';

export default function OperatorTransactions() {
  const currentUser = apiService.getCurrentUserSync();
  return (
    <TransactionsList
      title="Your Transactions"
      debitedByFilter={currentUser?.username}
    />
  );
}
