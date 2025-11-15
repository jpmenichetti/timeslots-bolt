import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { X } from 'lucide-react';

interface CreateTimeSlotModalProps {
  projectId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateTimeSlotModal({ projectId, onClose, onSuccess }: CreateTimeSlotModalProps) {
  const [mode, setMode] = useState<'single' | 'batch'>('single');
  const [date, setDate] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [totalSeats, setTotalSeats] = useState('');
  const [weekDays, setWeekDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const weekDayLabels = [
    { value: 0, label: 'Sun' },
    { value: 1, label: 'Mon' },
    { value: 2, label: 'Tue' },
    { value: 3, label: 'Wed' },
    { value: 4, label: 'Thu' },
    { value: 5, label: 'Fri' },
    { value: 6, label: 'Sat' },
  ];

  const toggleWeekDay = (day: number) => {
    setWeekDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'single') {
        const startDateTime = new Date(`${date}T${startTime}`).toISOString();
        const endDateTime = new Date(`${date}T${endTime}`).toISOString();

        if (new Date(startDateTime) >= new Date(endDateTime)) {
          throw new Error('End time must be after start time');
        }

        const { error: insertError } = await supabase.from('time_slots').insert({
          project_id: projectId,
          start_time: startDateTime,
          end_time: endDateTime,
          total_seats: parseInt(totalSeats),
        });

        if (insertError) throw insertError;
      } else {
        if (weekDays.length === 0) {
          throw new Error('Please select at least one weekday');
        }

        const startParts = startDate.split('-').map(Number);
        const endParts = endDate.split('-').map(Number);
        const start = new Date(startParts[0], startParts[1] - 1, startParts[2]);
        const end = new Date(endParts[0], endParts[1] - 1, endParts[2]);

        if (start >= end) {
          throw new Error('End date must be after start date');
        }

        const slots = [];
        const currentDate = new Date(start);

        while (currentDate <= end) {
          if (weekDays.includes(currentDate.getDay())) {
            const year = currentDate.getFullYear();
            const month = String(currentDate.getMonth() + 1).padStart(2, '0');
            const day = String(currentDate.getDate()).padStart(2, '0');
            const dateStr = `${year}-${month}-${day}`;

            const startDateTime = new Date(`${dateStr}T${startTime}`).toISOString();
            const endDateTime = new Date(`${dateStr}T${endTime}`).toISOString();

            if (new Date(startDateTime) >= new Date(endDateTime)) {
              throw new Error('End time must be after start time');
            }

            slots.push({
              project_id: projectId,
              start_time: startDateTime,
              end_time: endDateTime,
              total_seats: parseInt(totalSeats),
            });
          }

          currentDate.setDate(currentDate.getDate() + 1);
        }

        if (slots.length === 0) {
          throw new Error('No time slots to create with the selected criteria');
        }

        const { error: insertError } = await supabase.from('time_slots').insert(slots);

        if (insertError) throw insertError;
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-slate-800">Create Time Slot</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex gap-2 mb-4 bg-slate-100 p-1 rounded-lg">
          <button
            type="button"
            onClick={() => setMode('single')}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
              mode === 'single'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Single
          </button>
          <button
            type="button"
            onClick={() => setMode('batch')}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
              mode === 'batch'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Batch
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'single' ? (
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-slate-700 mb-1">
                Date
              </label>
              <input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="start-date" className="block text-sm font-medium text-slate-700 mb-1">
                    Start Date
                  </label>
                  <input
                    id="start-date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="end-date" className="block text-sm font-medium text-slate-700 mb-1">
                    End Date
                  </label>
                  <input
                    id="end-date"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Weekdays
                </label>
                <div className="flex gap-2">
                  {weekDayLabels.map((day) => (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() => toggleWeekDay(day.value)}
                      className={`flex-1 px-2 py-2 text-xs font-medium rounded-lg transition-colors ${
                        weekDays.includes(day.value)
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {day.label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="start-time" className="block text-sm font-medium text-slate-700 mb-1">
                Start Time
              </label>
              <input
                id="start-time"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label htmlFor="end-time" className="block text-sm font-medium text-slate-700 mb-1">
                End Time
              </label>
              <input
                id="end-time"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="seats" className="block text-sm font-medium text-slate-700 mb-1">
              Total Seats
            </label>
            <input
              id="seats"
              type="number"
              min="1"
              value={totalSeats}
              onChange={(e) => setTotalSeats(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : mode === 'batch' ? 'Create Slots' : 'Create Slot'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
