'use client';
import { X } from 'lucide-react';
import type React from 'react';
import type { Property } from '../types';

interface CalendarModalProps {
  open: boolean;
  selectedProperty: Property | null;
  selectedDates: Set<string>;
  onToggleDate: (date: Date) => void;
  onClearAll: () => void;
  onClose: () => void;
  onSave: () => void;
}

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

const generateCalendar = (): Date[] => {
  const today = new Date();
  const days: Date[] = [];
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  const firstDay = new Date(currentYear, currentMonth, 1);
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - firstDay.getDay());

  for (let i = 0; i < 42; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    days.push(date);
  }

  return days;
};

export const CalendarModal: React.FC<CalendarModalProps> = ({
  open,
  selectedProperty,
  selectedDates,
  onToggleDate,
  onClearAll,
  onClose,
  onSave,
}) => {
  if (!open || !selectedProperty) return null;
  const calendarDays = generateCalendar();
  const today = new Date();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Manage Calendar - {selectedProperty.title}
            </h2>
            <button type="button" onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4">
              {monthNames[today.getMonth()]} {today.getFullYear()}
            </h3>

            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((date) => {
                const dateStr = date.toISOString().split('T')[0];
                const isSelected = selectedDates.has(dateStr);
                const isCurrentMonth = date.getMonth() === today.getMonth();
                const isPast = date < today;

                return (
                  <button
                    type="button"
                    key={date.toISOString()}
                    onClick={() => !isPast && onToggleDate(date)}
                    disabled={isPast}
                    className={`p-2 text-sm rounded-lg transition-colors ${
                      isPast
                        ? 'text-gray-300 cursor-not-allowed'
                        : isSelected
                          ? 'bg-blue-600 text-white'
                          : isCurrentMonth
                            ? 'text-gray-900 hover:bg-gray-100'
                            : 'text-gray-400 hover:bg-gray-50'
                    }`}
                  >
                    {date.getDate()}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">{selectedDates.size} dates blocked</div>
            <div className="space-x-3">
              <button
                type="button"
                onClick={onClearAll}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Clear All
              </button>
              <button
                type="button"
                onClick={onSave}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
