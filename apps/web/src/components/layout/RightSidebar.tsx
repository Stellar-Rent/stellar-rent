'use client';

import {
  AlignJustify,
  Filter,
  Heart,
  Lock,
  Mail,
  Search,
  Send,
  SlidersVertical,
  User,
} from 'lucide-react';
import { IconContainer } from '../ui/icon-container';

export const RightSidebar = () => {
  return (
    <div className="fixed right-0 top-0 h-full w-16 bg-secondary flex flex-col items-center py-4 z-40 rounded-s-3xl">
      {/* Navigation Icons */}
      <div className="flex flex-col items-center space-y-6">
        <button type="button" className="text-primary transition-colors duration-200 p-2">
          <AlignJustify className="w-6 h-6" />
        </button>

        <button type="button" className="text-primary transition-colors duration-200 p-2">
          <IconContainer icon={<Search className="h-10 w-10 text-primary p-2" />} />
        </button>

        <button type="button" className="text-primary transition-colors duration-200 p-2">
          <Heart className="w-6 h-6" />
        </button>

        <button type="button" className="text-primary transition-colors duration-200 p-2">
          <Send className="w-6 h-6" />
        </button>

        <button type="button" className="text-primary transition-colors duration-200 p-2">
          <SlidersVertical className="w-6 h-6" />
        </button>

        <button type="button" className="text-primary transition-colors duration-200 p-2">
          <Filter className="w-6 h-6" />
        </button>

        <button type="button" className="text-primary transition-colors duration-200 p-2">
          <Lock className="w-6 h-6" />
        </button>

        <button type="button" className="text-primary transition-colors duration-200 p-2">
          <Mail className="w-6 h-6" />
        </button>
      </div>

      {/* User Profile - Bottom */}
      <div className="mt-auto">
        <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center">
          <User className="w-6 h-6 text-primary" />
        </div>
      </div>
    </div>
  );
};
