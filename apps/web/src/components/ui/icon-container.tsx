import type { ReactNode } from 'react';

interface IconContainerProps {
  icon: ReactNode;
  className?: string;
  size?: 'sm' | 'md';
}

export const IconContainer = ({ icon, className = '', size = 'md' }: IconContainerProps) => {
  const sizeClass = size === 'sm' ? 'w-8 h-8 rounded-xl' : 'w-12 h-12 rounded-2xl';
  return (
    <div
      className={`${sizeClass} flex items-center justify-center bg-opacity-20 shadow-[inset_0_2px_10px_0_rgba(98,145,212,0.2),inset_0_2px_1px_0_rgba(66,135,232,0.2)] ${className}`}
    >
      {icon}
    </div>
  );
};
