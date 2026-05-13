import { Plus, Zap, BarChart3, Settings, MessageSquare, Users } from 'lucide-react';

const actions = [
  {
    title: 'New Message',
    description: 'Send a message to a fan',
    icon: Plus,
    color: 'bg-purple-500',
    href: '#',
  },
  {
    title: 'Run AI Assistant',
    description: 'Generate responses for pending messages',
    icon: Zap,
    color: 'bg-blue-500',
    href: '#',
  },
  {
    title: 'Add Creator',
    description: 'Onboard a new creator to the platform',
    icon: Users,
    color: 'bg-green-500',
    href: '#',
  },
  {
    title: 'View Analytics',
    description: 'See detailed performance reports',
    icon: BarChart3,
    color: 'bg-amber-500',
    href: '#',
  },
];

export function QuickActions() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="mb-6 text-xl font-bold text-gray-900">Quick Actions</h2>
      <div className="grid grid-cols-2 gap-4">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.title}
              className="group flex flex-col items-center justify-center rounded-lg border border-gray-200 p-4 text-center hover:border-purple-300 hover:bg-purple-50 transition-colors"
            >
              <div className={`${action.color} mb-3 rounded-lg p-3 group-hover:scale-105 transition-transform`}>
                <Icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-medium text-gray-900">{action.title}</h3>
              <p className="mt-1 text-xs text-gray-600">{action.description}</p>
            </button>
          );
        })}
      </div>
      <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-6">
        <div className="flex items-center">
          <MessageSquare className="h-5 w-5 text-gray-400" />
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-900">AI Mode</p>
            <p className="text-xs text-gray-600">Sandbox (mock responses)</p>
          </div>
        </div>
        <button className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200">
          Upgrade
        </button>
      </div>
    </div>
  );
}