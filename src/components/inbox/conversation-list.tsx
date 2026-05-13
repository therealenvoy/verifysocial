'use client';

import { useState } from 'react';
import { MessageSquare, CheckCircle, Clock, Star } from 'lucide-react';
import { cn } from '@/src/lib/utils';

const conversations = [
  { id: 1, fan: 'Alex Johnson', platform: 'Fansly', lastMessage: 'Hey, when will the new content drop?', time: '2 min ago', unread: true, status: 'pending', vip: true },
  { id: 2, fan: 'Taylor Swift', platform: 'Fansly', lastMessage: 'Loved the photo set! Can you do more like that?', time: '15 min ago', unread: false, status: 'replied', vip: false },
  { id: 3, fan: 'Jamie Lee', platform: 'Fansly', lastMessage: 'I just purchased your PPV, thanks!', time: '1 hour ago', unread: false, status: 'replied', vip: true },
  { id: 4, fan: 'Riley Smith', platform: 'Fansly', lastMessage: 'What’s your schedule for live streams?', time: '3 hours ago', unread: true, status: 'ai_draft', vip: false },
  { id: 5, fan: 'Casey Brown', platform: 'Fansly', lastMessage: 'Can you customize a video for me?', time: '5 hours ago', unread: true, status: 'needs_review', vip: false },
  { id: 6, fan: 'Morgan Lee', platform: 'Fansly', lastMessage: 'Thanks for the birthday message!', time: '1 day ago', unread: false, status: 'replied', vip: true },
  { id: 7, fan: 'Jordan Park', platform: 'Fansly', lastMessage: 'Do you offer custom rates for long-term?', time: '2 days ago', unread: false, status: 'pending', vip: false },
];

export function ConversationList() {
  const [selectedId, setSelectedId] = useState(1);

  return (
    <div className="h-full overflow-y-auto">
      {conversations.map((conv) => (
        <div
          key={conv.id}
          className={cn(
            'border-b border-gray-100 p-4 hover:bg-gray-50 cursor-pointer transition-colors',
            selectedId === conv.id && 'bg-purple-50 border-l-4 border-l-purple-500'
          )}
          onClick={() => setSelectedId(conv.id)}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start">
              <div className="relative">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-pink-400 to-orange-400" />
                {conv.vip && (
                  <Star className="absolute -right-1 -top-1 h-4 w-4 fill-yellow-400 text-yellow-400" />
                )}
              </div>
              <div className="ml-3">
                <div className="flex items-center">
                  <h4 className="font-medium text-gray-900">{conv.fan}</h4>
                  {conv.unread && (
                    <div className="ml-2 h-2 w-2 rounded-full bg-blue-500" />
                  )}
                </div>
                <p className="text-sm text-gray-600">{conv.platform}</p>
              </div>
            </div>
            <span className="text-xs text-gray-500">{conv.time}</span>
          </div>
          <p className="mt-2 line-clamp-2 text-sm text-gray-900">{conv.lastMessage}</p>
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {conv.status === 'replied' && (
                <CheckCircle className="h-3 w-3 text-green-500" />
              )}
              {conv.status === 'pending' && (
                <Clock className="h-3 w-3 text-amber-500" />
              )}
              {conv.status === 'ai_draft' && (
                <MessageSquare className="h-3 w-3 text-blue-500" />
              )}
              <span className="text-xs text-gray-600 capitalize">{conv.status.replace('_', ' ')}</span>
            </div>
            {conv.unread && (
              <div className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
                New
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}