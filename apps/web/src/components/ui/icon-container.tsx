import type { ReactNode } from 'react';

interface IconContainerProps {
  icon: ReactNode;
  className?: string;
}

export const IconContainer = ({ icon, className = '' }: IconContainerProps) => {
  return (
    <div
      className={`w-12 flex items-center justify-center h-12 rounded-2xl bg-opacity-20 shadow-[inset_0_2px_10px_0_rgba(98,145,212,0.2),inset_0_2px_1px_0_rgba(66,135,232,0.2)] ${className}`}
    >
      {icon}
    </div>
  );
};
