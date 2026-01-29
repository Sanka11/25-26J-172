import { TrendingUp, Clock, AlertTriangle, CheckCircle } from 'lucide-react';

const WorkloadSummary = ({ workload }) => {
  if (!workload || workload.length === 0) {
    return null;
  }

  const totalHours = workload.reduce((sum, day) => sum + (day.totalHours || 0), 0);
  const avgHours = (totalHours / workload.length).toFixed(1);

  const statusCounts = workload.reduce((acc, day) => {
    acc[day.loadStatus] = (acc[day.loadStatus] || 0) + 1;
    return acc;
  }, {});

  const overloadedDays = statusCounts.OVERLOADED || 0;
  const lightDays = statusCounts.LIGHT || 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5 border border-blue-200 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <Clock className="w-6 h-6 text-blue-600" />
          <TrendingUp className="w-4 h-4 text-blue-500" />
        </div>
        <div className="text-3xl font-bold text-blue-900 mb-1">{totalHours}h</div>
        <div className="text-sm text-blue-700 font-medium">Total Hours</div>
      </div>

      <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-5 border border-purple-200 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <TrendingUp className="w-6 h-6 text-purple-600" />
        </div>
        <div className="text-3xl font-bold text-purple-900 mb-1">{avgHours}h</div>
        <div className="text-sm text-purple-700 font-medium">Daily Average</div>
      </div>

      <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-5 border border-red-200 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <AlertTriangle className="w-6 h-6 text-red-600" />
        </div>
        <div className="text-3xl font-bold text-red-900 mb-1">{overloadedDays}</div>
        <div className="text-sm text-red-700 font-medium">Overloaded Days</div>
      </div>

      <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-5 border border-emerald-200 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <CheckCircle className="w-6 h-6 text-emerald-600" />
        </div>
        <div className="text-3xl font-bold text-emerald-900 mb-1">{lightDays}</div>
        <div className="text-sm text-emerald-700 font-medium">Light Days</div>
      </div>
    </div>
  );
};

export default WorkloadSummary;



