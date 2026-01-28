import { Navbar } from '../components/layout/Navbar';
import { RightSidebar } from '../components/layout/RightSidebar';
import './globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#0B1221] min-h-screen flex flex-col antialiased">
        <Navbar />
        <div className="flex flex-1 overflow-hidden pt-14">
          <main className="flex-1 flex flex-col min-w-0">
            {children}
          </main>
          <RightSidebar />
        </div>
      </body>
    </html>
  );
}