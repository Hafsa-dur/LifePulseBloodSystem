import { useEffect, useMemo, useState } from 'react';
import { BarChart3, Activity, Droplet, ClipboardList } from 'lucide-react';
import { API_URL, authHeaders, parseResponse } from '../api';

const ReportsAnalytics = () => {
  const [metrics, setMetrics] = useState({
    totalRequests: 0,
    approvedRequests: 0,
    dispatchedUnits: 0,
    totalDonations: 0,
  });
  const [bloodBreakdown, setBloodBreakdown] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({ from: '', to: '' });

  useEffect(() => {
    const load = async () => {
      try {
        const query = new URLSearchParams();
        if (dateRange.from) query.set('from', dateRange.from);
        if (dateRange.to) query.set('to', dateRange.to);
        const response = await fetch(`${API_URL}/hospital/analytics${query.toString() ? `?${query}` : ''}`, { headers: authHeaders() });
        const data = await parseResponse(response);
        if (!response.ok) throw new Error(data.message || 'Analytics unavailable.');
        setMetrics(data.metrics || {});
        setBloodBreakdown((data.bloodBreakdown || []).filter((item) => item.units > 0));
      } catch (error) {
        console.error('Failed to load analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [dateRange]);

  const exportCsv = () => {
    const rows = [
      ['Metric', 'Value'],
      ['Total Requests', metrics.totalRequests],
      ['Approved Requests', metrics.approvedRequests],
      ['Dispatched Units', metrics.dispatchedUnits],
      ['Collected Units', metrics.totalDonations],
      [],
      ['Blood Group', 'Units'],
      ...bloodBreakdown.map((item) => [item.group, item.units])
    ];
    const csv = rows.map((row) => row.join(',')).join('\n');
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    link.download = `lifepulse-report-${dateRange.from || 'all'}-${dateRange.to || 'time'}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const maxValue = useMemo(() => {
    return Math.max(1, ...bloodBreakdown.map((item) => item.units));
  }, [bloodBreakdown]);

  if (loading) {
    return <div className="min-h-screen bg-[#F7F4EC] flex items-center justify-center text-[#4A1521] font-black">Loading analytics…</div>;
  }

  return (
    <div className="min-h-screen bg-[#F7F4EC] text-[#4A1521] py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="bg-white border-2 border-[#6B1D2F]/20 rounded-2xl p-6 shadow-md">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#E5C158]/20 border border-[#E5C158] flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-[#5A1827]" />
            </div>
            <div>
              <span className="px-3 py-1 bg-[#E5C158]/20 border border-[#E5C158] text-[#7A6305] font-bold text-[10px] uppercase tracking-wider rounded-full">Reports</span>
              <h1 className="text-3xl font-black text-[#4A1521] mt-2">Analytics & Performance</h1>
            </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <input type="date" value={dateRange.from} onChange={(event) => setDateRange({ ...dateRange, from: event.target.value })} className="border-2 border-[#6B1D2F]/20 bg-[#FAF9F6] rounded-xl px-3 py-2 text-xs font-bold" />
              <input type="date" value={dateRange.to} onChange={(event) => setDateRange({ ...dateRange, to: event.target.value })} className="border-2 border-[#6B1D2F]/20 bg-[#FAF9F6] rounded-xl px-3 py-2 text-xs font-bold" />
              <button onClick={exportCsv} className="bg-[#5A1827] text-white rounded-xl px-3 py-2 text-xs font-black uppercase">Export CSV</button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[
            { label: 'Total Requests', value: metrics.totalRequests, icon: ClipboardList, tone: 'rose' },
            { label: 'Approved', value: metrics.approvedRequests, icon: Activity, tone: 'emerald' },
            { label: 'Dispatched Units', value: metrics.dispatchedUnits, icon: Droplet, tone: 'amber' },
            { label: 'Collected Units', value: metrics.totalDonations, icon: BarChart3, tone: 'indigo' },
          ].map(({ label, value, icon: Icon, tone }) => (
            <div key={label} className="bg-white border-2 border-[#6B1D2F]/20 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">{label}</p>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${tone === 'rose' ? 'bg-rose-100 text-rose-700' : tone === 'emerald' ? 'bg-emerald-100 text-emerald-700' : tone === 'amber' ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700'}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <p className="mt-5 text-2xl font-black text-[#4A1521]">{value}</p>
            </div>
          ))}
        </div>

        <div className="bg-white border-2 border-[#6B1D2F]/20 rounded-2xl p-6 shadow-md">
          <h2 className="text-xl font-black text-[#4A1521] mb-4">Blood group balance</h2>
          <div className="space-y-3">
            {bloodBreakdown.length > 0 ? bloodBreakdown.map((item) => (
              <div key={item.group}>
                <div className="flex justify-between mb-1 text-sm font-bold text-[#4A1521]">
                  <span>{item.group}</span>
                  <span>{item.units} units</span>
                </div>
                <div className="h-3 w-full bg-[#FAF9F6] border border-[#6B1D2F]/10 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#5A1827] via-[#9C1D3C] to-[#E5C158]"
                    style={{ width: `${(item.units / maxValue) * 100}%` }}
                  />
                </div>
              </div>
            )) : (
              <p className="text-sm text-slate-600">No donation data is available for this hospital yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsAnalytics;
