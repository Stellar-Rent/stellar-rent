// apps/web/src/components/shared/layout/nav-bar.tsx
import { ThemeToggle } from 'src/components/theme-toggle';

export function Navbar() {
  return (
    <nav className="border-b">
      <div className="flex h-16 items-center px-4 justify-end">
        <ThemeToggle />
      </div>
    </nav>
  );
}
