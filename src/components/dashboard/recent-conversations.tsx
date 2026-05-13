import { MessageSquare, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const conversations = [
  {
    id: 1,
    fan: 'Alex Johnson',
    platform: 'Fansly',
    lastMessage: 'Hey, when will the new content drop?',
    time: '2 min ago',
    status: 'replied',
    unread: false,
  },
  {
    id: 2,
    fan: 'Taylor Swift',
    platform: 'Fansly',
    lastMessage: 'Loved the photo set! Can you do more like that?',
    time: '15 min ago',
    status: 'pending',
    unread: true,
  },
  {
    id: 3,
    fan: 'Jamie Lee',
    platform: 'Fansly',
    lastMessage: 'I just purchased your PPV, thanks!',
    time: '1 hour ago',
    status: 'replied',
    unread: false,
  },
  {
    id: 4,
    fan: 'Riley Smith',
    platform: 'Fansly',
    lastMessage: 'What’s your schedule for live streams?',
    time: '3 hours ago',
    status: 'ai_draft',
    unread: true,
  },
  {
    id: 5,
    fan: 'Casey Brown',
    platform: 'Fansly',
    lastMessage: 'Can you customize a video for me?',
    time: '5 hours ago',
    status: 'needs_review',
    unread: true,
  },
];

const statusConfig = {
  replied: { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-100', label: 'Replied' },
  pending: { icon: Clock, color: 'text-amber-500', bg: 'bg-amber-100', label: 'Pending' },
  ai_draft: { icon: MessageSquare, color: 'text-blue-500', bg: 'bg-blue-100', label: 'AI Draft' },
  needs_review: { icon: AlertCircle, color: 'text-purple-500', bg: 'bg-purple-100', label: 'Review' },
};

export function RecentConversations() {
  return (
    <div className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="pb-3 text-left text-sm font-medium text-gray-600">Fan</th>
              <th className="pb-3 text-left text-sm font-medium text-gray-600">Last Message</th>
              <th className="pb-3 text-left text-sm font-medium text-gray-600">Time</th>
              <th className="pb-3 text-left text-sm font-medium text-gray-600">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {conversations.map((conv) => {
              const StatusIcon = statusConfig[conv.status as keyof typeof statusConfig].icon;
              const statusColor = statusConfig[conv.status as keyof typeof statusConfig].color;
              const statusBg = statusConfig[conv.status as keyof typeof statusConfig].bg;
              const statusLabel = statusConfig[conv.status as keyof typeof statusConfig].label;
              return (
                <tr key={conv.id} className="hover:bg-gray-50">
                  <td className="py-4">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-pink-400 to-orange-400" />
                      <div className="ml-4">
                        <p className="font-medium text-gray-900">{conv.fan}</p>
                        <p className="text-sm text-gray-500">{conv.platform}</p>
                      </div>
                      {conv.unread && (
                        <div className="ml-2 h-2 w-2 rounded-full bg-blue-500" />
                      )}
                    </div>
                  </td>
                  <td className="py-4">
                    <p className="max-w-xs truncate text-gray-900">{conv.lastMessage}</p>
                  </td>
                  <td className="py-4 text-gray-600">{conv.time}</td>
                  <td className="py-4">
                    <div className={cn(
                      'inline-flex items-center rounded-full px-3 py-1 text-xs font-medium',
                      statusBg
                    )}>
                      <StatusIcon className={cn('mr-1 h-3 w-3', statusColor)} />
                      {statusLabel}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="mt-4 text-center">
        <button className="text-sm font-medium text-purple-600 hover:text-purple-700">
          Load more conversations
        </button>
      </div>
    </div>
  );
}