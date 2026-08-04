import React from 'react';
import { InAppChat } from '../chat/InAppChat';

interface CustomerMessagesManagerProps {
  onMessagesChanged?: () => void;
}

export const CustomerMessagesManager: React.FC<CustomerMessagesManagerProps> = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[11px] font-mono font-bold text-[#C5A059] uppercase tracking-widest">
            Real-Time Customer Inbox
          </div>
          <h3 className="text-2xl font-serif-brand font-bold text-[#F2F2ED]">
            In-App Customer Communications
          </h3>
        </div>
      </div>

      <InAppChat userRole="admin" />
    </div>
  );
};
