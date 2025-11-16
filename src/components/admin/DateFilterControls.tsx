interface DateFilterControlsProps {
  startDateFilter: string;
  endDateFilter: string;
  selectedPreset: string;
  showAvailable: boolean;
  showFull: boolean;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  onPresetChange: (preset: string) => void;
  onShowAvailableChange: (show: boolean) => void;
  onShowFullChange: (show: boolean) => void;
  onReset: () => void;
}

export function DateFilterControls({
  startDateFilter,
  endDateFilter,
  selectedPreset,
  showAvailable,
  showFull,
  onStartDateChange,
  onEndDateChange,
  onPresetChange,
  onShowAvailableChange,
  onShowFullChange,
  onReset,
}: DateFilterControlsProps) {
  return (
    <div className="bg-white rounded-xl shadow-md p-4 mb-6">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <label className="text-sm text-slate-600 whitespace-nowrap">Preset:</label>
          <select
            value={selectedPreset}
            onChange={(e) => {
              if (e.target.value) {
                onPresetChange(e.target.value);
              }
            }}
            className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
          >
            <option value="">Select range...</option>
            <option value="last-month">Last Month</option>
            <option value="last-two-weeks">Last Two Weeks</option>
            <option value="next-two-weeks">Next Two Weeks</option>
            <option value="next-month">Next Month</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-slate-600 whitespace-nowrap">From:</label>
          <input
            type="date"
            value={startDateFilter}
            onChange={(e) => onStartDateChange(e.target.value)}
            className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-slate-600 whitespace-nowrap">To:</label>
          <input
            type="date"
            value={endDateFilter}
            onChange={(e) => onEndDateChange(e.target.value)}
            className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>
        <div className="flex items-center gap-4 ml-4 pl-4 border-l border-slate-300">
          <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={showAvailable}
              onChange={(e) => onShowAvailableChange(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-orange-600 focus:ring-2 focus:ring-orange-500"
            />
            Show Available
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={showFull}
              onChange={(e) => onShowFullChange(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-orange-600 focus:ring-2 focus:ring-orange-500"
            />
            Show Full
          </label>
        </div>
        <button
          onClick={onReset}
          className="ml-auto px-3 py-1.5 text-sm text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
