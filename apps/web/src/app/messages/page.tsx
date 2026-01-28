'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';

export default function MessagesPage() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="flex h-[calc(100vh-64px)] w-full bg-[#0B1221] text-white overflow-hidden font-sans">
      {/* Columna Izquierda */}
      <div className="w-80 border-r border-gray-800 flex flex-col bg-[#0F172A]">
        <div className="p-4 border-b border-gray-800">
          <div className="relative">
            <Search className="absolute left-4 top-2.5 h-4 w-4 text-gray-500" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="search_chat" 
              className="w-full bg-[#161F2F] border-none rounded-full py-2 pl-12 pr-4 text-sm focus:ring-1 focus:ring-blue-500 outline-none placeholder:text-gray-500"
            />
          </div>
        </div>
        
        {/* no_chats: Ahora arriba, pero con un padding-top (pt-8) para que no esté pegado a la línea */}
        <div className="flex-1 flex flex-col items-center pt-8">
          <span className="text-gray-500 text-sm font-light italic">
            no_chats
          </span>
        </div>
      </div>

      {/* Columna Derecha */}
      <div className="flex-1 flex items-center justify-center bg-[#0B1221]">
        <span className="text-gray-500 text-sm font-light tracking-[0.2em] uppercase opacity-60">
          select_chat
        </span>
      </div>
    </div>
  );
}