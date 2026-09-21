import { useEffect, useState } from 'react';
import { Activity, BarChart3, ClipboardList, Droplet } from 'lucide-react';
import { API_URL, authHeaders, parseResponse } from '../api';

const GROUP_COLORS = ['#B4233C', '#E05A47', '#2A9D8F', '#1D70A2', '#7B61A8', '#E09F3E', '#2F855A', '#C05621'];

const DonutChart = ({ items }) => {
  const total = items.reduce((sum, item) => sum + Number(item.units || 0), 0);
  const radius = 62;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return <div className="flex flex-col items-center gap-5 md:flex-row">
    <div className="relative h-52 w-52 shrink-0">
      <svg viewBox="0 0 180 180" className="h-full w-full -rotate-90" role="img" aria-label="Blood group distribution">
        <circle cx="90" cy="90" r={radius} fill="none" stroke="#edf1f4" strokeWidth="22" />
        {items.map((item, index) => {
          const dash = total ? (Number(item.units || 0) / total) * circumference : 0;
          const segment = <circle key={item.group} cx="90" cy="90" r={radius} fill="none" stroke={GROUP_COLORS[index]} strokeWidth="22" strokeDasharray={`${dash} ${circumference - dash}`} strokeDashoffset={-offset} className="analytics-donut-segment" />;
          offset += dash;
          return segment;
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-[#4A1521]"><span className="text-3xl font-black">{total}</span><span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Units</span></div>
    </div>
    <div className="grid w-full grid-cols-2 gap-x-5 gap-y-2 text-xs font-bold sm:grid-cols-4 md:grid-cols-2">{items.map((item, index) => <div key={item.group} className="flex items-center justify-between gap-3"><span className="flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: GROUP_COLORS[index] }} />{item.group}</span><span>{item.units || 0}</span></div>)}</div>
  </div>;
};

const PerformanceChart = ({ items }) => {
  const maxValue = Math.max(1, ...items.map((item) => Number(item.value || 0)));
  return <div className="grid h-64 grid-cols-6 items-end gap-3 border-b-2 border-[#6B1D2F]/15 px-2 pb-2 pt-6 sm:gap-6">{items.map((item, index) => <div key={item.label} className="flex h-full min-w-0 flex-col items-center justify-end gap-2"><span className="text-xs font-black text-[#4A1521]">{item.value || 0}</span><div className="analytics-bar w-full max-w-12 rounded-t-xl" style={{ height: `${Math.max(item.value ? 12 : 4, (Number(item.value || 0) / maxValue) * 170)}px`, backgroundColor: GROUP_COLORS[index + 1] }} /><span className="w-full truncate text-center text-[9px] font-black text-slate-500" title={item.label}>{item.label.replace(' Requests', '')}</span></div>)}</div>;
};

const ReportsAnalytics = () => {
  const [metrics, setMetrics] = useState({ totalRequests: 0, approvedRequests: 0, dispatchedUnits: 0, totalDonations: 0, totalCollectedUnits: 0, currentAvailableUnits: 0 });
  const [bloodBreakdown, setBloodBreakdown] = useState([]);
  const [performance, setPerformance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const query = new URLSearchParams();
        if (dateRange.from) query.set('from', dateRange.from);
        if (dateRange.to) query.set('to', dateRange.to);
        const response = await fetch(`${API_URL}/hospital/analytics${query.toString() ? `?${query}` : ''}`, { headers: authHeaders() });
        const data = await parseResponse(response);
        if (!response.ok) throw new Error(data.message || 'Analytics unavailable.');
        setMetrics(data.metrics || {});
        setBloodBreakdown(data.bloodBreakdown || []);
        setPerformance(data.performance || []);
        setError('');
      } catch (loadError) { setError(loadError.message); } finally { setLoading(false); }
    };
    load();
  }, [dateRange]);

  const exportCsv = () => {
    const rows = [['Metric', 'Value'], ...Object.entries(metrics), [], ['Blood Group', 'Units'], ...bloodBreakdown.map((item) => [item.group, item.units]), [], ['Performance', 'Value'], ...performance.map((item) => [item.label, item.value])];
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([rows.map((row) => row.join(',')).join('\n')], { type: 'text/csv' }));
    link.download = `lifepulse-report-${dateRange.from || 'all'}-${dateRange.to || 'time'}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  if (loading) return <div className="min-h-screen bg-[#F7F4EC] flex items-center justify-center text-[#4A1521] font-black">Loading analytics...</div>;

  return <div className="min-h-screen bg-[#F7F4EC] text-[#4A1521] py-8 px-4 sm:px-6 lg:px-8 font-sans"><div className="max-w-6xl mx-auto space-y-6">
    <div className="bg-white border-2 border-[#6B1D2F]/20 rounded-2xl p-6 shadow-md"><div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4"><div className="flex items-center gap-3"><div className="w-12 h-12 rounded-2xl bg-[#E5C158]/20 border border-[#E5C158] flex items-center justify-center"><BarChart3 className="w-6 h-6 text-[#5A1827]" /></div><div><span className="px-3 py-1 bg-[#E5C158]/20 border border-[#E5C158] text-[#7A6305] font-bold text-[10px] uppercase tracking-wider rounded-full">Reports</span><h1 className="text-3xl font-black text-[#4A1521] mt-2">Analytics & Performance</h1></div></div><div className="flex flex-wrap items-center gap-2"><input type="date" value={dateRange.from} onChange={(event) => setDateRange({ ...dateRange, from: event.target.value })} className="border-2 border-[#6B1D2F]/20 bg-[#FAF9F6] rounded-xl px-3 py-2 text-xs font-bold" /><input type="date" value={dateRange.to} onChange={(event) => setDateRange({ ...dateRange, to: event.target.value })} className="border-2 border-[#6B1D2F]/20 bg-[#FAF9F6] rounded-xl px-3 py-2 text-xs font-bold" /><button onClick={exportCsv} className="bg-[#5A1827] text-white rounded-xl px-3 py-2 text-xs font-black uppercase">Export CSV</button></div></div></div>
    {error && <div className="rounded-xl border-2 border-rose-300 bg-rose-50 p-4 text-sm font-bold text-rose-800">{error}</div>}
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">{[['Total Requests', metrics.totalRequests, ClipboardList], ['Approved', metrics.approvedRequests, Activity], ['Dispatched Units', metrics.dispatchedUnits, Droplet], ['Available Units', metrics.currentAvailableUnits, BarChart3]].map(([label, value, Icon]) => <div key={label} className="bg-white border-2 border-[#6B1D2F]/20 rounded-2xl p-5 shadow-sm"><div className="flex items-center justify-between"><p className="text-[10px] font-black uppercase tracking-wider text-slate-500">{label}</p><Icon className="w-4 h-4 text-[#5A1827]" /></div><p className="mt-5 text-2xl font-black text-[#4A1521]">{value || 0}</p></div>)}</div>
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6"><div className="bg-white border-2 border-[#6B1D2F]/20 rounded-2xl p-6 shadow-md"><h2 className="text-xl font-black text-[#4A1521] mb-1">Blood group distribution</h2><p className="text-xs text-slate-500 mb-5">Actual selected-date-range units</p>{bloodBreakdown.length ? <DonutChart items={bloodBreakdown} /> : <p className="text-sm text-slate-600">No data available for this date range.</p>}</div><div className="bg-white border-2 border-[#6B1D2F]/20 rounded-2xl p-6 shadow-md"><h2 className="text-xl font-black text-[#4A1521] mb-1">Request & donor matching</h2><p className="text-xs text-slate-500 mb-5">Workflow performance in the selected range</p>{performance.length ? <PerformanceChart items={performance} /> : <p className="text-sm text-slate-600">No data available for this date range.</p>}</div></div>
    <div className="bg-white border-2 border-[#6B1D2F]/20 rounded-2xl p-6 shadow-md"><h2 className="text-xl font-black text-[#4A1521] mb-4">Donor & inventory performance</h2><div className="grid grid-cols-2 sm:grid-cols-4 gap-3">{[['Donations', metrics.totalDonations], ['Collected Units', metrics.totalCollectedUnits], ['Dispatched Units', metrics.dispatchedUnits], ['Current Available', metrics.currentAvailableUnits]].map(([label, value]) => <div key={label} className="rounded-xl border border-[#6B1D2F]/15 bg-[#FAF9F6] p-4"><p className="text-[10px] font-black uppercase text-slate-500">{label}</p><p className="mt-2 text-xl font-black text-[#4A1521]">{value || 0}</p></div>)}</div></div>
  </div></div>;
};

export default ReportsAnalytics;
