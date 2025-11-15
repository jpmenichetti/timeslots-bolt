import { useMemo } from 'react';
import { BarChart3 } from 'lucide-react';

interface ReservationData {
  date: string;
  count: number;
}

interface ReservationChartProps {
  data: ReservationData[];
  projectName: string;
}

export function ReservationChart({ data, projectName }: ReservationChartProps) {
  const maxCount = useMemo(() => {
    return Math.max(...data.map((d) => d.count), 1);
  }, [data]);

  const formatDate = (dateString: string) => {
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const getDayOfWeek = (dateString: string) => {
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex items-center gap-2 mb-6">
        <BarChart3 size={20} className="text-slate-800" />
        <h3 className="text-xl font-semibold text-slate-800">
          Reservations per Day
        </h3>
        <span className="text-slate-600 font-normal">- {projectName}</span>
      </div>

      {data.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          No reservation data available for this project
        </div>
      ) : (
        <div className="space-y-4">
          <div className="overflow-x-auto">
            <div className="flex items-end justify-between gap-2 pb-2 pt-8 min-w-full" style={{ height: '288px', minWidth: `${data.length * 40}px` }}>
              {data.map((item) => {
                const barHeight = maxCount > 0 ? (item.count / maxCount) * 200 : 0;

                return (
                  <div key={item.date} className="flex-1 flex flex-col items-center gap-2" style={{ minWidth: '40px' }}>
                    <div className="relative w-full flex flex-col justify-end" style={{ height: '200px' }}>
                      {item.count > 0 && (
                        <div className="absolute -top-7 left-0 right-0 text-center">
                          <span className="text-base font-bold text-slate-800">
                            {item.count}
                          </span>
                        </div>
                      )}
                      <div
                        className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-lg transition-all hover:from-blue-700 hover:to-blue-500 cursor-pointer"
                        style={{
                          height: `${barHeight}px`,
                          minHeight: item.count > 0 ? '8px' : '0px',
                        }}
                        title={`${item.count} reservations on ${formatDate(item.date)}`}
                      />
                    </div>
                    <div className="flex flex-col items-center gap-0.5 mt-2">
                      <span className="text-xs font-medium text-slate-700 whitespace-nowrap">
                        {getDayOfWeek(item.date)}
                      </span>
                      <span className="text-xs text-slate-500 whitespace-nowrap">
                        {formatDate(item.date)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <div className="text-sm text-slate-600">
              Total Reservations: <span className="font-semibold text-slate-800">{data.reduce((sum, d) => sum + d.count, 0)}</span>
            </div>
            <div className="text-sm text-slate-600">
              Showing {data.length} days
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
