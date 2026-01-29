'use client';

import { Search } from 'lucide-react';
import { useState } from 'react';

export default function MessagesPage() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    /* CORRECCIÓN: Se cambió 64px por 56px para coincidir con la altura real del Navbar (h-14) */
    <div className="flex h-[calc(100vh-56px)] w-full bg-[#0B1221] text-white overflow-hidden font-sans">
      {/* Columna Izquierda */}
      <div className="w-80 border-r border-gray-800 flex flex-col bg-[#0F172A]">
        <div className="p-4 border-b border-gray-800">
          <div className="relative">
            <Search className="absolute left-4 top-2.5 h-4 w-4 text-gray-500" aria-hidden="true" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chat"
              aria-label="Search chats"
              className="w-full bg-[#161F2F] border-none rounded-full py-2 pl-12 pr-4 text-sm focus:ring-1 focus:ring-blue-500 outline-none placeholder:text-gray-500"
            />
          </div>
        </div>

        {/* no_chats: Posicionado arriba con padding para balance visual */}
        <div className="flex-1 flex flex-col items-center pt-8">
          <span className="text-gray-500 text-sm font-light italic">No chats available</span>
        </div>
      </div>

      {/* Columna Derecha */}
      <div className="flex-1 flex items-center justify-center bg-[#0B1221]">
        <span className="text-gray-500 text-sm font-light tracking-[0.2em] uppercase opacity-60">
          Select a chat
        </span>
      </div>
    </div>
  );
}
