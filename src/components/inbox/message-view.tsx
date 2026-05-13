'use client';

import { useState } from 'react';
import { Send, ThumbsUp, ThumbsDown, Edit, MoreVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

const messages = [
  { id: 1, sender: 'fan', content: 'Hey! I loved your latest photo set. Do you have any behind-the-scenes content?', time: '2:30 PM' },
  { id: 2, sender: 'ai', content: 'Thanks so much! 😊 I do have some exclusive behind-the-scenes footage that I can share. Would you like me to send it as a PPV?', time: '2:32 PM' },
  { id: 3, sender: 'fan', content: 'Definitely! How much?', time: '2:33 PM' },
  { id: 4, sender: 'ai', content: 'It\'s $9.99 for a 5-minute video showing the whole shoot process. Includes bloopers too!', time: '2:35 PM' },
  { id: 5, sender: 'fan', content: 'Sounds perfect, send it over!', time: '2:36 PM' },
];

export function MessageView() {
  const [input, setInput] = useState('');

  return (
    <div className="flex h-full flex-col">
      {/* Chat Header */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-pink-400 to-orange-400" />
            <div className="ml-3">
              <h3 className="font-bold text-gray-900">Alex Johnson</h3>
              <p className="text-sm text-gray-600">VIP Fan • Fansly</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              View Profile
            </button>
            <button className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700">
              Send PPV
            </button>
            <button className="p-2">
              <MoreVertical className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-6">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                'flex',
                msg.sender === 'fan' ? 'justify-start' : 'justify-end'
              )}
            >
              <div
                className={cn(
                  'max-w-[70%] rounded-2xl px-4 py-3',
                  msg.sender === 'fan'
                    ? 'bg-gray-100 text-gray-900'
                    : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                )}
              >
                <p>{msg.content}</p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs opacity-75">{msg.time}</span>
                  {msg.sender === 'ai' && (
                    <div className="flex items-center space-x-2">
                      <button className="opacity-75 hover:opacity-100">
                        <ThumbsUp className="h-4 w-4" />
                      </button>
                      <button className="opacity-75 hover:opacity-100">
                        <ThumbsDown className="h-4 w-4" />
                      </button>
                      <button className="opacity-75 hover:opacity-100">
                        <Edit className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message here... (AI assist is enabled)"
              className="w-full rounded-xl border border-gray-300 p-4 focus:border-purple-500 focus:ring-purple-500"
              rows={2}
            />
          </div>
          <div className="flex flex-col space-y-3">
            <button className="flex items-center justify-center rounded-lg bg-purple-600 p-3 text-white hover:bg-purple-700">
              <Send className="h-5 w-5" />
            </button>
            <button className="flex items-center justify-center rounded-lg border border-gray-300 p-3 hover:bg-gray-50">
              <Edit className="h-5 w-5 text-gray-700" />
            </button>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center space-x-4">
            <span>💡 AI suggests: "I can send it right now! Check your DMs."</span>
          </div>
          <div className="flex items-center space-x-4">
            <button className="text-purple-600 hover:text-purple-700">Use suggestion</button>
            <button className="text-gray-500 hover:text-gray-700">Regenerate</button>
          </div>
        </div>
      </div>
    </div>
  );
}