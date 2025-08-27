'use client';

import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { PropertyCalendarProps } from '@/lib/types/property';

type AvailabilityStatus = 'available' | 'unavailable' | 'selected' | 'in-range';

export function PropertyCalendar({
  unavailableDates = [],
  onDateSelect,
  selectedDates,
  minNights = 1,
  className = '',
}: PropertyCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isExpanded, setIsExpanded] = useState(false);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Generate calendar days for current month
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days = [];
    const current = new Date(startDate);

    // Generate 42 days (6 weeks)
    for (let i = 0; i < 42; i++) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return days;
  }, [currentMonth]);

  // Check if a date is unavailable
  const isDateUnavailable = (date: Date) => {
    return unavailableDates.some((unavailableDate) => {
      const normalizedUnavailable = new Date(unavailableDate);
      normalizedUnavailable.setHours(0, 0, 0, 0);
      const normalizedDate = new Date(date);
      normalizedDate.setHours(0, 0, 0, 0);
      return normalizedUnavailable.getTime() === normalizedDate.getTime();
    });
  };

  // Get availability status for a date
  const getDateStatus = (date: Date): AvailabilityStatus => {
    const normalizedDate = new Date(date);
    normalizedDate.setHours(0, 0, 0, 0);

    if (selectedDates?.from) {
      const normalizedFrom = new Date(selectedDates.from);
      normalizedFrom.setHours(0, 0, 0, 0);

      if (normalizedDate.getTime() === normalizedFrom.getTime()) {
        return 'selected';
      }
    }

    if (selectedDates?.to) {
      const normalizedTo = new Date(selectedDates.to);
      normalizedTo.setHours(0, 0, 0, 0);

      if (normalizedDate.getTime() === normalizedTo.getTime()) {
        return 'selected';
      }
    }

    if (selectedDates?.from && selectedDates?.to) {
      const normalizedFrom = new Date(selectedDates.from);
      normalizedFrom.setHours(0, 0, 0, 0);
      const normalizedTo = new Date(selectedDates.to);
      normalizedTo.setHours(0, 0, 0, 0);

      if (normalizedDate > normalizedFrom && normalizedDate < normalizedTo) {
        return 'in-range';
      }
    }

    if (isDateUnavailable(date) || normalizedDate < today) {
      return 'unavailable';
    }

    return 'available';
  };

  // Handle date click
  const handleDateClick = (date: Date) => {
    if (getDateStatus(date) === 'unavailable') return;

    const normalizedDate = new Date(date);
    normalizedDate.setHours(0, 0, 0, 0);

    // If no dates selected or both dates are selected, start fresh
    if (!selectedDates?.from || (selectedDates.from && selectedDates.to)) {
      onDateSelect?.({ from: normalizedDate, to: undefined });
      return;
    }

    // If only check-in is selected
    if (selectedDates.from && !selectedDates.to) {
      const normalizedFrom = new Date(selectedDates.from);
      normalizedFrom.setHours(0, 0, 0, 0);

      // If clicking the same date as check-in, clear selection
      if (normalizedDate.getTime() === normalizedFrom.getTime()) {
        onDateSelect?.({ from: undefined, to: undefined });
        return;
      }

      // If clicking a date before check-in, make it the new check-in
      if (normalizedDate < normalizedFrom) {
        onDateSelect?.({ from: normalizedDate, to: undefined });
        return;
      }

      // If clicking a date after check-in, check minimum nights and set as check-out
      const daysDiff = Math.ceil(
        (normalizedDate.getTime() - normalizedFrom.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysDiff >= minNights) {
        onDateSelect?.({ from: normalizedFrom, to: normalizedDate });
      } else {
        // If doesn't meet minimum nights, make it the new check-in
        onDateSelect?.({ from: normalizedDate, to: undefined });
      }
    }
  };

  // Navigation functions
  const goToPreviousMonth = () => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <Card className={`p-6 ${className}`}>
      <div className="space-y-4">
        {/* Header with collapse toggle */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Select dates</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2"
          >
            <span>{isExpanded ? 'Hide Calendar' : 'Show Calendar'}</span>
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>

        {/* Collapsible Calendar Content */}
        {isExpanded && (
          <>
            {/* Month Navigation */}
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="icon"
                onClick={goToPreviousMonth}
                aria-label="Previous month"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium min-w-[120px] text-center">
                {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </span>
              <Button variant="outline" size="icon" onClick={goToNextMonth} aria-label="Next month">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Calendar Grid */}
            <div className="space-y-2">
              {/* Day headers */}
              <div className="grid grid-cols-7 gap-1">
                {dayNames.map((day) => (
                  <div
                    key={day}
                    className="p-2 text-center text-sm font-medium text-muted-foreground"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar days */}
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((date) => {
                  const status = getDateStatus(date);
                  const isCurrentMonth = date.getMonth() === currentMonth.getMonth();
                  const isToday = date.toDateString() === today.toDateString();
                  // Create a unique key using the date's timestamp
                  const dateKey = date.getTime();

                  return (
                    <button
                      type="button"
                      key={dateKey}
                      onClick={() => handleDateClick(date)}
                      disabled={status === 'unavailable'}
                      className={`
                    relative p-2 text-sm rounded-md transition-all duration-200 min-h-[40px]
                    ${!isCurrentMonth ? 'text-muted-foreground/50' : ''}
                    ${isToday ? 'ring-2 ring-primary ring-offset-2' : ''}
                    ${
                      status === 'available' && isCurrentMonth
                        ? 'hover:bg-primary/10 text-foreground'
                        : ''
                    }
                    ${
                      status === 'unavailable'
                        ? 'text-muted-foreground/30 cursor-not-allowed line-through'
                        : 'cursor-pointer'
                    }
                    ${
                      status === 'selected'
                        ? 'bg-primary text-primary-foreground font-semibold'
                        : ''
                    }
                    ${status === 'in-range' ? 'bg-primary/20 text-primary-foreground' : ''}
                  `}
                      aria-label={`${date.toLocaleDateString()} - ${status}`}
                    >
                      {date.getDate()}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-primary" />
                <span>Selected</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-primary/20" />
                <span>In range</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-muted line-through" />
                <span>Unavailable</span>
              </div>
            </div>
          </>
        )}

        {/* Selected dates display - now appears after calendar */}
        {selectedDates?.from && (
          <div className="pt-4 border-t">
            <div className="text-sm">
              <span className="font-medium">Check-in: </span>
              {selectedDates.from.toLocaleDateString()}
            </div>
            {selectedDates.to && (
              <div className="text-sm">
                <span className="font-medium">Check-out: </span>
                {selectedDates.to.toLocaleDateString()}
              </div>
            )}
            {selectedDates.from && selectedDates.to && (
              <div className="text-sm text-muted-foreground mt-1">
                {Math.ceil(
                  (selectedDates.to.getTime() - selectedDates.from.getTime()) /
                    (1000 * 60 * 60 * 24)
                )}{' '}
                nights
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
