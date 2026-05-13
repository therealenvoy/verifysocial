import { Search, Filter, Plus } from 'lucide-react';

export function InboxHeader() {
  return (
    <div className="border-b border-gray-200 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Inbox</h2>
          <p className="text-sm text-gray-600">All your fan conversations in one place</p>
        </div>
        <button className="flex items-center rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700">
          <Plus className="mr-2 h-4 w-4" />
          New Message
        </button>
      </div>
      <div className="mt-4 flex items-center space-x-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            placeholder="Search conversations, fans, messages..."
            className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:border-purple-500 focus:ring-purple-500"
          />
        </div>
        <button className="flex items-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
          <Filter className="mr-2 h-4 w-4" />
          Filter
        </button>
      </div>
    </div>
  );
}