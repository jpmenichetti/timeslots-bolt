import { Clock, Plus, Trash2, Users } from 'lucide-react';

interface Reservation {
  id: string;
  worker_id: string;
  profiles: {
    name: string;
    email: string;
    avatar_url?: string;
  };
}

interface TimeSlot {
  id: string;
  project_id: string;
  start_time: string;
  end_time: string;
  total_seats: number;
  reservation_count: number;
  reservations?: Reservation[];
}

interface TimeSlotsListProps {
  timeSlots: TimeSlot[];
  selectedProject: string | null;
  selectedProjectName?: string;
  deletingSlotId: string | null;
  showAvailable: boolean;
  showFull: boolean;
  onCreateTimeSlot: () => void;
  onDeleteTimeSlot: (slotId: string, slotName: string) => void;
  formatDate: (dateString: string) => string;
  formatTime: (dateString: string) => string;
}

export function TimeSlotsList({
  timeSlots,
  selectedProject,
  selectedProjectName,
  deletingSlotId,
  showAvailable,
  showFull,
  onCreateTimeSlot,
  onDeleteTimeSlot,
  formatDate,
  formatTime,
}: TimeSlotsListProps) {
  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
          <Clock size={20} />
          Time Slots
          {selectedProjectName && (
            <span className="text-slate-600 font-normal">
              - {selectedProjectName}
            </span>
          )}
        </h2>
        {selectedProject && (
          <button
            onClick={onCreateTimeSlot}
            className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors"
          >
            <Plus size={18} />
            Add Time Slot
          </button>
        )}
      </div>

      {!selectedProject ? (
        <div className="text-center py-12 text-slate-500">
          Select a project to view time slots
        </div>
      ) : timeSlots.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          No time slots yet. Add one to get started.
        </div>
      ) : (
        <div className="space-y-3">
          {timeSlots.map((slot) => {
            const isFull = slot.reservation_count >= slot.total_seats;
            const isAvailable = slot.reservation_count < slot.total_seats;

            if (isFull && !showFull) return null;
            if (isAvailable && !showAvailable) return null;

            return (
              <div
                key={slot.id}
                className="p-4 border-2 border-slate-200 rounded-lg hover:border-slate-300 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className="text-slate-800 font-medium">
                        {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                      </div>
                      <div className="flex items-center gap-1 text-sm text-slate-600">
                        <Users size={16} />
                        <span>
                          {slot.reservation_count} / {slot.total_seats} seats
                        </span>
                      </div>
                    </div>
                    <div className="text-sm text-slate-600 mt-1">
                      {formatDate(slot.start_time)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        slot.reservation_count >= slot.total_seats
                          ? 'bg-red-100 text-red-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {slot.reservation_count >= slot.total_seats ? 'Full' : 'Available'}
                    </div>
                    <button
                      onClick={() =>
                        onDeleteTimeSlot(
                          slot.id,
                          `${formatDate(slot.start_time)} ${formatTime(slot.start_time)}-${formatTime(slot.end_time)}`
                        )
                      }
                      disabled={deletingSlotId === slot.id}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      title="Delete time slot"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {slot.reservations && slot.reservations.length > 0 && (
                  <div className="border-t border-slate-200 pt-3 mt-3">
                    <div className="text-xs font-medium text-slate-700 mb-2">Reserved by:</div>
                    <div className="space-y-1">
                      {slot.reservations.map((reservation) => (
                        <div
                          key={reservation.id}
                          className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 px-3 py-1.5 rounded"
                        >
                          {reservation.profiles.avatar_url ? (
                            <img
                              src={reservation.profiles.avatar_url}
                              alt={reservation.profiles.name}
                              className="w-6 h-6 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-6 h-6 bg-orange-600 rounded-full flex items-center justify-center text-white text-xs font-medium">
                              {reservation.profiles.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <span className="font-medium">{reservation.profiles.name}</span>
                          <span className="text-slate-400">•</span>
                          <span className="text-xs">{reservation.profiles.email}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
