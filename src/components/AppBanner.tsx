import { TimeSlotIcon } from './TimeSlotIcon';

export function AppBanner() {
  return (
    <div className="bg-gradient-to-r from-orange-600 to-orange-700 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center gap-3">
          <TimeSlotIcon className="w-10 h-10" />
          <h1 className="text-2xl font-bold text-white tracking-tight">
            TimeSloter
          </h1>
        </div>
      </div>
    </div>
  );
}
