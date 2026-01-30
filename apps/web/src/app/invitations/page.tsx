'use client';

import { RightSidebar } from '@/components/layout/RightSidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  DUAL_MENU_ITEMS,
  GUEST_MENU_ITEMS,
  HOST_MENU_ITEMS,
  type MenuItem,
  TENANT_MENU_ITEMS,
} from '@/constants/menu-items';
import { useAuth } from '@/hooks/auth/use-auth';
import { useUserRole } from '@/hooks/useUserRole';
import { ChevronDown, Menu, Search, X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState } from 'react';

type Invitation = {
  id: string;
  property: string;
  owner: string;
  checkIn: string;
  checkOut: string;
  created: string;
  status: string;
  invitation: string;
  paymentMethod?: string;
};

type SortOrder = 'newest' | 'oldest';
type PropertySort = 'a-z' | 'z-a';
type StatusFilter = 'all' | 'pending' | 'accepted' | 'declined' | 'expired';

const MOBILE_ROWS_PER_PAGE = 5;
const DESKTOP_ROWS_PER_PAGE = 10;

const InvitationsPage = () => {
  const { isAuthenticated } = useAuth();
  const { role } = useUserRole();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [mobilePage, setMobilePage] = useState(1);
  const [desktopPage, setDesktopPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [createdSort, setCreatedSort] = useState<SortOrder>('newest');
  const [propertySort, setPropertySort] = useState<PropertySort>('a-z');

  const menuItems: MenuItem[] = useMemo(() => {
    if (!isAuthenticated) return GUEST_MENU_ITEMS;
    switch (role) {
      case 'host':
        return HOST_MENU_ITEMS;
      case 'dual':
        return DUAL_MENU_ITEMS;
      default:
        return TENANT_MENU_ITEMS;
    }
  }, [role, isAuthenticated]);

  const drawerItems = useMemo(() => menuItems.filter((item) => item.id !== 'menu'), [menuItems]);
  const invitations = useMemo<Invitation[]>(() => [], []);

  const filteredInvitations = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    let filtered = invitations.filter((invite) => {
      if (statusFilter !== 'all' && invite.status.toLowerCase() !== statusFilter) return false;
      if (!normalizedQuery) return true;
      return (
        invite.property.toLowerCase().includes(normalizedQuery) ||
        invite.owner.toLowerCase().includes(normalizedQuery) ||
        invite.status.toLowerCase().includes(normalizedQuery) ||
        invite.invitation.toLowerCase().includes(normalizedQuery)
      );
    });

    filtered = [...filtered].sort((left, right) => {
      const propertyCompare = left.property.localeCompare(right.property);
      if (propertyCompare !== 0) {
        return propertySort === 'a-z' ? propertyCompare : -propertyCompare;
      }
      const leftDate = new Date(left.created).getTime();
      const rightDate = new Date(right.created).getTime();
      return createdSort === 'newest' ? rightDate - leftDate : leftDate - rightDate;
    });

    return filtered;
  }, [createdSort, invitations, propertySort, searchQuery, statusFilter]);

  const mobileTotalPages = Math.max(
    1,
    Math.ceil(filteredInvitations.length / MOBILE_ROWS_PER_PAGE)
  );
  const desktopTotalPages = Math.max(
    1,
    Math.ceil(filteredInvitations.length / DESKTOP_ROWS_PER_PAGE)
  );

  const currentMobileInvitations = filteredInvitations.slice(
    (mobilePage - 1) * MOBILE_ROWS_PER_PAGE,
    mobilePage * MOBILE_ROWS_PER_PAGE
  );
  const currentDesktopInvitations = filteredInvitations.slice(
    (desktopPage - 1) * DESKTOP_ROWS_PER_PAGE,
    desktopPage * DESKTOP_ROWS_PER_PAGE
  );

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setMobilePage(1);
    setDesktopPage(1);
  };

  return (
    <div className="flex w-full min-h-screen">
      <main className="flex min-h-screen w-full flex-1 flex-col px-5">
        <header className="relative flex items-center justify-center border-b border-gray-800 p-6">
          <button
            type="button"
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-200 md:hidden"
            onClick={() => setIsMenuOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-semibold text-white">My invitations</h1>
        </header>

        <section className="flex-1 px-4 pb-4">
          <div className="mt-4 rounded-xl bg-secondary p-4">
            <div className="flex flex-col gap-4">
              <SearchBar value={searchQuery} onChange={handleSearchChange} />

              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="text-sm text-gray-400">
                  Total: {filteredInvitations.length} invitations
                </div>

                <div className="flex flex-wrap items-center gap-3 md:justify-end">
                  <FilterDropdown
                    label="Status"
                    valueLabel={statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
                  >
                    <DropdownMenuRadioGroup
                      value={statusFilter}
                      onValueChange={(v) => setStatusFilter(v as StatusFilter)}
                    >
                      <DropdownMenuRadioItem value="all">All</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="pending">Pending</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="accepted">Accepted</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="declined">Declined</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="expired">Expired</DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                  </FilterDropdown>

                  <FilterDropdown
                    label="Created"
                    valueLabel={createdSort === 'newest' ? 'Newest' : 'Oldest'}
                  >
                    <DropdownMenuRadioGroup
                      value={createdSort}
                      onValueChange={(v) => setCreatedSort(v as SortOrder)}
                    >
                      <DropdownMenuRadioItem value="newest">Newest</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="oldest">Oldest</DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                  </FilterDropdown>

                  <FilterDropdown
                    label="Property"
                    valueLabel={propertySort === 'a-z' ? 'A-Z' : 'Z-A'}
                  >
                    <DropdownMenuRadioGroup
                      value={propertySort}
                      onValueChange={(v) => setPropertySort(v as PropertySort)}
                    >
                      <DropdownMenuRadioItem value="a-z">A-Z</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="z-a">Z-A</DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                  </FilterDropdown>
                </div>
              </div>

              <DesktopInvitationsTable invitations={currentDesktopInvitations} />
              <MobileInvitationsList invitations={currentMobileInvitations} />

              <div className="mt-4">
                <PaginationControls
                  className="md:hidden"
                  currentPage={mobilePage}
                  totalPages={mobileTotalPages}
                  onPrevious={() => setMobilePage((p) => Math.max(1, p - 1))}
                  onNext={() => setMobilePage((p) => Math.min(mobileTotalPages, p + 1))}
                />
                <PaginationControls
                  className="hidden md:flex"
                  currentPage={desktopPage}
                  totalPages={desktopTotalPages}
                  onPrevious={() => setDesktopPage((p) => Math.max(1, p - 1))}
                  onNext={() => setDesktopPage((p) => Math.min(desktopTotalPages, p + 1))}
                />
              </div>
            </div>
          </div>
        </section>
      </main>

      <div className="hidden md:flex">
        <RightSidebar />
      </div>

      <MobileMenuDrawer
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        menuItems={drawerItems}
      />
    </div>
  );
};

const SearchBar = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
  <div className="relative w-full max-w-md">
    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
      <Search className="h-4 w-4" />
    </span>
    <input
      type="text"
      placeholder="Search an invitation..."
      className="w-full rounded-full border border-gray-800 bg-background py-2 pl-9 pr-3 text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/60"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  </div>
);

const FilterDropdown = ({
  label,
  valueLabel,
  children,
}: { label: string; valueLabel: string; children: React.ReactNode }) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <button
        type="button"
        className="flex items-center gap-2 rounded-full bg-[#0B1D39] px-4 py-2 text-sm text-gray-200"
      >
        {label} <span className="text-xs text-gray-400">{valueLabel}</span>
        <ChevronDown className="h-4 w-4" />
      </button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" className="bg-[#0B1D39] text-gray-200">
      {children}
    </DropdownMenuContent>
  </DropdownMenu>
);

const DesktopInvitationsTable = ({ invitations }: { invitations: Invitation[] }) => (
  <div className="mt-4 hidden w-full overflow-hidden rounded-lg border border-gray-800 md:block">
    <div className="grid grid-cols-7 bg-[#0B1D39] text-xs font-medium uppercase text-gray-300">
      <div className="px-4 py-3">Property</div>
      <div className="px-4 py-3">Owner</div>
      <div className="px-4 py-3">Check-in</div>
      <div className="px-4 py-3">Check-out</div>
      <div className="px-4 py-3">Created</div>
      <div className="px-4 py-3">Status</div>
      <div className="px-4 py-3">Invitation</div>
    </div>
    <div className="divide-y divide-gray-800 bg-[#071429] text-sm text-gray-200">
      {invitations.length === 0 ? (
        <div className="py-16 text-center">No invitations sent yet</div>
      ) : (
        invitations.map((invite) => (
          <div key={invite.id} className="grid grid-cols-7">
            <div className="px-4 py-3 font-medium text-white">{invite.property}</div>
            <div className="px-4 py-3">{invite.owner}</div>
            <div className="px-4 py-3">{invite.checkIn}</div>
            <div className="px-4 py-3">{invite.checkOut}</div>
            <div className="px-4 py-3">{invite.created}</div>
            <div className="px-4 py-3">{invite.status}</div>
            <div className="px-4 py-3">{invite.invitation}</div>
          </div>
        ))
      )}
    </div>
  </div>
);

const MobileInvitationsList = ({ invitations }: { invitations: Invitation[] }) => (
  <div className="mt-4 space-y-3 md:hidden">
    {invitations.length === 0 ? (
      <div className="rounded-lg border border-gray-800 bg-[#071429] p-6 text-center text-sm text-gray-300">
        No invitations sent yet
      </div>
    ) : (
      invitations.map((invite) => (
        <div
          key={invite.id}
          className="rounded-lg border border-gray-800 bg-[#071429] p-4 text-sm text-gray-200"
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="text-base font-semibold text-white">{invite.property}</div>
              <div className="text-xs text-gray-400">{invite.owner}</div>
            </div>
            <span className="rounded-full bg-[#0B1D39] px-3 py-1 text-xs">{invite.status}</span>
          </div>
        </div>
      ))
    )}
  </div>
);

const PaginationControls = ({ className, currentPage, totalPages, onPrevious, onNext }: any) => (
  <div className={`flex items-center justify-between ${className}`}>
    <span className="text-xs text-gray-500">
      Page {currentPage} of {totalPages}
    </span>
    <div className="flex gap-2">
      <button
        type="button"
        className="rounded-md bg-[#0B1D39] px-3 py-1 disabled:opacity-50"
        onClick={onPrevious}
        disabled={currentPage === 1}
      >
        Previous
      </button>
      <button
        type="button"
        className="rounded-md bg-[#0B1D39] px-3 py-1 disabled:opacity-50"
        onClick={onNext}
        disabled={currentPage === totalPages}
      >
        Next
      </button>
    </div>
  </div>
);

const MobileMenuDrawer = ({ isOpen, onClose, menuItems }: any) => (
  <div
    className={`fixed inset-0 z-50 transition-opacity md:hidden ${isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
  >
    <div
      className="absolute inset-0 bg-black/60"
      onClick={onClose}
      onKeyDown={(e) => {
        if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
          onClose();
        }
      }}
      role="button"
      tabIndex={0}
      aria-label="Close menu"
    />
    <aside
      className={`absolute right-0 h-full w-72 bg-secondary p-6 transition-transform ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
    >
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Menu</h2>
        <button type="button" onClick={onClose} aria-label="Close menu">
          <X />
        </button>
      </div>
      <div className="mt-6 flex flex-col gap-2">
        {menuItems.map((item: any) => (
          <Link
            key={item.id}
            href={item.href}
            className="flex items-center gap-3 p-2 text-sm text-gray-200"
            onClick={onClose}
          >
            <Image src={item.src} alt={item.alt} width={20} height={20} />
            <span>{item.label}</span>
          </Link>
        ))}
      </div>
    </aside>
  </div>
);

export default InvitationsPage;
