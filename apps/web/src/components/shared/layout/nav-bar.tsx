// apps/web/src/components/layout/navbar.tsx
import { ThemeToggle } from 'src/components/theme-toggle';

export function Navbar() {
  return (
    <nav className="border-b">
      <div className="flex h-16 items-center px-4">
        {/* Existing navbar content */}
        <ThemeToggle />
      </div>
    </nav>
  );
}
