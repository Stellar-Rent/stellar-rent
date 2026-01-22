'use client';

import { RightSidebar } from '@/components/layout/RightSidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { IconContainer } from '@/components/ui/icon-container';
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
import { useEffect, useMemo, useState } from 'react';

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

const MOBILE_INVITATIONS: Invitation[] = [];
const DESKTOP_INVITATIONS: Invitation[] = [];

const InvitationsPage = () => {
  const { isAuthenticated } = useAuth();
  const { role } = useUserRole();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [desktopPage, setDesktopPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [createdSort, setCreatedSort] = useState('newest');
  const [propertySort, setPropertySort] = useState('a-z');
  const mobileRowsPerPage = 5;
  const desktopRowsPerPage = 10;

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

  const mobileInvitations = MOBILE_INVITATIONS;
  const drawerItems = useMemo(() => menuItems.filter((item) => item.id !== 'menu'), [menuItems]);
  const filteredDesktopInvitations = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    let filtered = DESKTOP_INVITATIONS.filter((invite) => {
      if (statusFilter !== 'all' && invite.status.toLowerCase() !== statusFilter) {
        return false;
      }
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
  }, [createdSort, propertySort, searchQuery, statusFilter]);
  const filteredMobileInvitations = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    let filtered = MOBILE_INVITATIONS.filter((invite) => {
      if (statusFilter !== 'all' && invite.status.toLowerCase() !== statusFilter) {
        return false;
      }
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
  }, [createdSort, propertySort, searchQuery, statusFilter]);
  const totalPages = Math.max(1, Math.ceil(filteredMobileInvitations.length / mobileRowsPerPage));
  const desktopTotalPages = Math.max(
    1,
    Math.ceil(filteredDesktopInvitations.length / desktopRowsPerPage)
  );
  const currentInvitations = filteredMobileInvitations.slice(
    (currentPage - 1) * mobileRowsPerPage,
    currentPage * mobileRowsPerPage
  );
  const currentDesktopInvitations = filteredDesktopInvitations.slice(
    (desktopPage - 1) * desktopRowsPerPage,
    desktopPage * desktopRowsPerPage
  );

  return (
    <div className="flex w-full min-h-screen">
      <main className="flex flex-1 flex-col w-full min-h-screen px-5 pr-5">
        <header className="relative flex items-center justify-center p-6 border-b border-gray-800">
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
          <div className="bg-secondary rounded-xl p-4 mt-4">
            <div className="flex flex-col gap-4">
              <div className="relative w-full max-w-md">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  <Search className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  placeholder="Search an invitation..."
                  className="w-full pl-9 pr-3 py-2 rounded-full bg-background text-white placeholder:text-gray-400 border border-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/60"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                />
              </div>

              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="text-sm text-gray-400 md:hidden">
                  Total: {filteredMobileInvitations.length} invitations
                </div>
                <div className="hidden text-sm text-gray-400 md:block">
                  Total: {filteredDesktopInvitations.length} invitations
                </div>

                <div className="flex flex-wrap items-center gap-3 md:justify-end">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className="flex items-center gap-2 rounded-full bg-[#0B1D39] px-4 py-2 text-sm text-gray-200"
                      >
                        Status
                        <span className="text-xs text-gray-400">
                          {statusFilter === 'all'
                            ? 'All'
                            : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
                        </span>
                        <ChevronDown className="h-4 w-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-[#0B1D39] text-gray-200">
                      <DropdownMenuRadioGroup value={statusFilter} onValueChange={setStatusFilter}>
                        <DropdownMenuRadioItem value="all">All</DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="pending">Pending</DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="accepted">Accepted</DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="declined">Declined</DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="expired">Expired</DropdownMenuRadioItem>
                      </DropdownMenuRadioGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className="flex items-center gap-2 rounded-full bg-[#0B1D39] px-4 py-2 text-sm text-gray-200"
                      >
                        Created
                        <span className="text-xs text-gray-400">
                          {createdSort === 'newest' ? 'Newest' : 'Oldest'}
                        </span>
                        <ChevronDown className="h-4 w-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-[#0B1D39] text-gray-200">
                      <DropdownMenuRadioGroup value={createdSort} onValueChange={setCreatedSort}>
                        <DropdownMenuRadioItem value="newest">Newest</DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="oldest">Oldest</DropdownMenuRadioItem>
                      </DropdownMenuRadioGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className="flex items-center gap-2 rounded-full bg-[#0B1D39] px-4 py-2 text-sm text-gray-200"
                      >
                        Property
                        <span className="text-xs text-gray-400">
                          {propertySort === 'a-z' ? 'A-Z' : 'Z-A'}
                        </span>
                        <ChevronDown className="h-4 w-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-[#0B1D39] text-gray-200">
                      <DropdownMenuRadioGroup value={propertySort} onValueChange={setPropertySort}>
                        <DropdownMenuRadioItem value="a-z">A-Z</DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="z-a">Z-A</DropdownMenuRadioItem>
                      </DropdownMenuRadioGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <span>Rows per page</span>
                    <button
                      type="button"
                      className="flex items-center gap-1 rounded-full bg-[#0B1D39] px-3 py-1 text-sm text-gray-200 md:hidden"
                      disabled
                    >
                      {mobileRowsPerPage}
                      <ChevronDown className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      className="hidden items-center gap-1 rounded-full bg-[#0B1D39] px-3 py-1 text-sm text-gray-200 md:flex"
                      disabled
                    >
                      10
                      <ChevronDown className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 hidden w-full overflow-hidden rounded-lg border border-gray-800 md:block">
              <div className="grid grid-cols-7 text-xs font-medium text-gray-300 uppercase tracking-wide bg-[#0B1D39]">
                <div className="py-3 px-4">Property</div>
                <div className="py-3 px-4">Owner</div>
                <div className="py-3 px-4">Check-in</div>
                <div className="py-3 px-4">Check-out</div>
                <div className="py-3 px-4 flex items-center gap-2">
                  Created
                  <ChevronDown className="h-3 w-3" />
                </div>
                <div className="py-3 px-4">Status</div>
                <div className="py-3 px-4">Invitation</div>
              </div>

              {filteredDesktopInvitations.length === 0 ? (
                <div className="py-16 text-center text-gray-300 bg-[#071429] text-sm md:text-base">
                  No invitations sent yet
                </div>
              ) : (
                <div className="divide-y divide-gray-800 bg-[#071429] text-sm text-gray-200">
                  {currentDesktopInvitations.map((invite) => (
                    <div key={invite.id} className="grid grid-cols-7">
                      <div className="py-3 px-4 font-medium text-white">{invite.property}</div>
                      <div className="py-3 px-4 text-gray-300">{invite.owner}</div>
                      <div className="py-3 px-4 text-gray-300">{invite.checkIn}</div>
                      <div className="py-3 px-4 text-gray-300">{invite.checkOut}</div>
                      <div className="py-3 px-4 text-gray-300">{invite.created}</div>
                      <div className="py-3 px-4 text-gray-300">{invite.status}</div>
                      <div className="py-3 px-4 text-gray-300">{invite.invitation}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-4 space-y-3 md:hidden">
              {filteredMobileInvitations.length === 0 ? (
                <div className="rounded-lg border border-gray-800 bg-[`#071429`] p-6 text-center text-sm text-gray-300">
                  No invitations sent yet
                </div>
              ) : (
                currentInvitations.map((invite) => (
                  <div
                    key={invite.id}
                    className="rounded-lg border border-gray-800 bg-[#071429] p-4 text-sm text-gray-200"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-base font-semibold text-white">{invite.property}</div>
                        <div className="text-xs text-gray-400">{invite.owner}</div>
                      </div>
                      <span className="rounded-full bg-[#0B1D39] px-3 py-1 text-xs text-gray-200">
                        {invite.status}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <div className="text-gray-400">Check-in</div>
                        <div className="text-gray-200">{invite.checkIn}</div>
                      </div>
                      <div>
                        <div className="text-gray-400">Check-out</div>
                        <div className="text-gray-200">{invite.checkOut}</div>
                      </div>
                      <div>
                        <div className="text-gray-400">Created</div>
                        <div className="text-gray-200">{invite.created}</div>
                      </div>
                      <div>
                        <div className="text-gray-400">Payment</div>
                        <div className="text-gray-200">{invite.paymentMethod}</div>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between text-xs text-gray-400">
                      <span>{invite.invitation}</span>
                      <span className="text-gray-300">View</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-4 text-sm text-gray-400">
              <div className="flex items-center justify-between md:hidden">
                <div className="text-xs text-gray-500">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="px-3 py-1 rounded-md bg-[#0B1D39] border border-gray-800 text-gray-300 disabled:opacity-60"
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    className="px-3 py-1 rounded-md bg-[#0B1D39] border border-gray-800 text-gray-300 disabled:opacity-60"
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </button>
                </div>
              </div>
              <div className="hidden items-center justify-between md:flex">
                <div className="text-xs text-gray-500">
                  Page {desktopPage} of {desktopTotalPages}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="px-3 py-1 rounded-md bg-[#0B1D39] border border-gray-800 text-gray-300 disabled:opacity-60"
                    onClick={() => setDesktopPage((prev) => Math.max(1, prev - 1))}
                    disabled={desktopPage === 1}
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    className="px-3 py-1 rounded-md bg-[#0B1D39] border border-gray-800 text-gray-300 disabled:opacity-60"
                    onClick={() => setDesktopPage((prev) => Math.min(desktopTotalPages, prev + 1))}
                    disabled={desktopPage === desktopTotalPages}
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <div className="hidden md:flex">
        <RightSidebar />
      </div>

      <div
        className={`fixed inset-0 z-50 transition-opacity md:hidden ${
          isMenuOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        aria-hidden={!isMenuOpen}
      >
        <button
          type="button"
          className="absolute inset-0 bg-black/60"
          onClick={() => setIsMenuOpen(false)}
          aria-label="Close menu"
        />
        <aside
          className={`absolute right-0 top-0 h-full w-72 max-w-[85vw] bg-secondary border-l border-gray-800 p-6 transform transition-transform ${
            isMenuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Menu</h2>
            <button
              type="button"
              className="text-gray-300"
              onClick={() => setIsMenuOpen(false)}
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="mt-6 flex flex-col gap-2">
            {drawerItems.map((drawerItem) => (
              <Link
                key={drawerItem.id}
                href={drawerItem.href}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-200 hover:bg-white/5"
                onClick={() => setIsMenuOpen(false)}
              >
                {drawerItem.withContainer ? (
                  <IconContainer
                    size="sm"
                    icon={
                      <Image
                        src={drawerItem.src}
                        alt={drawerItem.alt}
                        width={20}
                        height={20}
                        className="p-0.5"
                      />
                    }
                  />
                ) : (
                  <Image
                    src={drawerItem.src}
                    alt={drawerItem.alt}
                    width={20}
                    height={20}
                    className="p-0.5"
                  />
                )}
                <span>{drawerItem.label}</span>
              </Link>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
};

export default InvitationsPage;
