import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, ArrowLeft, CheckCircle2, ClipboardList, Database, Droplet, GitBranch, PackageCheck, Send, UserRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import { API_URL, authHeaders, parseResponse } from '../api';
import { useTheme } from '../ThemeContext';

const stages = [
  { key: 'request', label: 'Request submitted', icon: ClipboardList },
  { key: 'matching', label: 'Donor / inventory match', icon: GitBranch },
  { key: 'approval', label: 'Hospital approval', icon: CheckCircle2 },
  { key: 'allocation', label: 'Units allocated', icon: PackageCheck },
  { key: 'dispatch', label: 'Blood dispatched', icon: Send }
];

const statusRank = { Pending: 1, Approved: 3, Rejected: 0, Dispatched: 5, Delivered: 5 };

const formatDate = (value) => value ? new Date(value).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'Not recorded';

const DonationToDispatchTracking = () => {
  const { theme } = useTheme();
  const [requests, setRequests] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const loadRequests = async () => {
      try {
        const response = await fetch(`${API_URL}/patient-requests`, { headers: authHeaders() });
        const data = await parseResponse(response);
        if (!response.ok) throw new Error(data.message || 'Unable to load dispatch records.');
        if (active) {
          const rows = Array.isArray(data) ? data : [];
          setRequests(rows);
          setSelectedId((current) => current || rows[0]?._id || '');
          setError('');
        }
      } catch (loadError) {
        if (active) setError(loadError.message);
      } finally {
        if (active) setLoading(false);
      }
    };
    loadRequests();
    const timer = setInterval(loadRequests, 15000);
    return () => { active = false; clearInterval(timer); };
  }, []);

  const selected = useMemo(() => requests.find((item) => item._id === selectedId) || requests[0], [requests, selectedId]);
  const currentRank = statusRank[selected?.status] || 0;
  const sourceLabel = selected?.sourceType === 'donor' ? selected.donorName || 'Matched donor' : selected?.sourceType === 'inventory' ? 'Hospital inventory' : 'Awaiting match';

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-[#F7F4EC] font-black text-[#4A1521]">Loading donation-to-dispatch records...</div>;

  return <div className={`min-h-screen px-4 py-8 font-sans sm:px-6 lg:px-8 ${theme === 'navy' ? 'bg-[#EEF4FA] text-[#173B68]' : 'bg-[#F7F4EC] text-[#4A1521]'}`}>
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="rounded-3xl border-2 border-[#6B1D2F]/20 bg-white p-6 shadow-md">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="flex items-start gap-3">
            <Link to="/" className="rounded-xl border border-[#6B1D2F]/20 bg-white p-2 shadow-sm transition hover:bg-[#5A1827] hover:text-white"><ArrowLeft className="h-5 w-5" /></Link>
            <div><span className="rounded-full border border-[#E5C158] bg-[#E5C158]/20 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[#7A6305]">Workflow monitor</span><h1 className="mt-2 flex items-center gap-2 text-2xl font-black tracking-tight sm:text-3xl"><Droplet className="h-7 w-7 text-[#990000]" />Donation-to-Dispatch Tracking</h1><p className="mt-1 text-sm font-medium text-slate-600">A record-based view of matching, approval, allocation, inventory updates, and dispatch.</p></div>
          </div>
          <div className="rounded-2xl border-2 border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-black uppercase tracking-wider text-emerald-800">Database records synced</div>
        </div>
      </header>

      {error && <div className="rounded-2xl border-2 border-rose-300 bg-rose-50 p-4 text-sm font-bold text-rose-800">{error}</div>}
      {!requests.length ? <div className="rounded-3xl border-2 border-[#6B1D2F]/20 bg-white p-12 text-center shadow-md"><AlertCircle className="mx-auto h-10 w-10 text-[#990000]" /><h2 className="mt-4 text-xl font-black">No patient requests recorded</h2><p className="mt-2 text-sm text-slate-600">Submit a hospital request to see its donation-to-dispatch workflow here.</p></div> : <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="rounded-3xl border-2 border-[#6B1D2F]/20 bg-white p-4 shadow-md"><div className="mb-3 flex items-center justify-between"><h2 className="font-black">Request records</h2><span className="rounded-full bg-[#E5C158]/25 px-2 py-1 text-[10px] font-black">{requests.length}</span></div><div className="space-y-2">{requests.map((request) => <button type="button" key={request._id} onClick={() => setSelectedId(request._id)} className={`w-full rounded-2xl border-2 p-3 text-left transition ${selected?._id === request._id ? 'border-[#5A1827] bg-[#5A1827] text-white' : 'border-[#6B1D2F]/10 bg-[#FAF9F6] hover:border-[#5A1827]/40'}`}><div className="flex items-center justify-between gap-2"><span className="truncate text-sm font-black">{request.patientName || 'Patient request'}</span><span className="rounded-full bg-white/20 px-2 py-1 text-[9px] font-black uppercase">{request.status || 'Pending'}</span></div><p className={`mt-1 text-xs ${selected?._id === request._id ? 'text-rose-100' : 'text-slate-500'}`}>{request.bloodGroup} · {request.unitsRequired} unit(s)</p></button>)}</div></aside>
        <main className="space-y-6">
          <section className="rounded-3xl border-2 border-[#6B1D2F]/20 bg-white p-6 shadow-md"><div className="flex flex-col justify-between gap-3 border-b border-slate-100 pb-5 sm:flex-row sm:items-start"><div><span className="text-[10px] font-black uppercase tracking-widest text-[#990000]">Selected request</span><h2 className="mt-1 text-2xl font-black">{selected.patientName || 'Patient request'}</h2><p className="text-sm font-medium text-slate-600">{selected.hospitalName} · {selected.hospitalLocation}</p></div><span className="w-fit rounded-xl border-2 border-[#E5C158] bg-[#E5C158]/20 px-3 py-2 text-xs font-black uppercase tracking-wider text-[#7A6305]">{selected.status || 'Pending'}</span></div><div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4"><div className="rounded-2xl bg-[#FAF9F6] p-4"><Droplet className="h-4 w-4 text-[#990000]" /><p className="mt-2 text-[10px] font-black uppercase text-slate-500">Blood group</p><p className="text-lg font-black">{selected.bloodGroup}</p></div><div className="rounded-2xl bg-[#FAF9F6] p-4"><Database className="h-4 w-4 text-[#990000]" /><p className="mt-2 text-[10px] font-black uppercase text-slate-500">Units</p><p className="text-lg font-black">{selected.unitsRequired}</p></div><div className="rounded-2xl bg-[#FAF9F6] p-4"><UserRound className="h-4 w-4 text-[#990000]" /><p className="mt-2 text-[10px] font-black uppercase text-slate-500">Source</p><p className="truncate text-sm font-black">{sourceLabel}</p></div><div className="rounded-2xl bg-[#FAF9F6] p-4"><ClipboardList className="h-4 w-4 text-[#990000]" /><p className="mt-2 text-[10px] font-black uppercase text-slate-500">Submitted</p><p className="text-xs font-black">{formatDate(selected.createdAt)}</p></div></div></section>
          <section className="rounded-3xl border-2 border-[#6B1D2F]/20 bg-white p-6 shadow-md"><h2 className="text-xl font-black">Donation-to-dispatch workflow</h2><p className="mt-1 text-sm text-slate-600">Each stage reflects the persisted request and allocation state. Dispatch is the point at which inventory is deducted.</p><div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-5">{stages.map((stage, index) => { const complete = currentRank >= index + 1; const Icon = stage.icon; const detail = stage.key === 'request' ? formatDate(selected.createdAt) : stage.key === 'matching' ? sourceLabel : stage.key === 'approval' ? (currentRank >= 3 ? 'Approved' : 'Awaiting review') : stage.key === 'allocation' ? (selected.isAllocated ? 'Allocation recorded' : 'Not allocated') : currentRank >= 5 ? formatDate(selected.updatedAt) : 'Awaiting dispatch'; return <div key={stage.key} className="relative"><div className={`flex h-14 w-14 items-center justify-center rounded-2xl border-2 transition ${complete ? 'border-[#5A1827] bg-[#5A1827] text-[#E5C158] shadow-lg' : 'border-slate-200 bg-slate-50 text-slate-400'}`}><Icon className="h-6 w-6" /></div>{index < stages.length - 1 && <div className={`absolute left-14 top-7 hidden h-0.5 w-[calc(100%-2rem)] md:block ${currentRank > index + 1 ? 'bg-[#5A1827]' : 'bg-slate-200'}`} />}<h3 className="mt-3 text-sm font-black">{stage.label}</h3><p className="mt-1 text-xs font-medium text-slate-500">{detail}</p></div>; })}</div></section>
          <section className="rounded-3xl border-2 border-[#6B1D2F]/20 bg-white p-6 shadow-md"><h2 className="text-xl font-black">Dispatch record details</h2><div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2"><div className="rounded-2xl border border-slate-100 p-4"><p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Allocation</p><p className="mt-1 font-black">{selected.isAllocated ? 'Allocated' : 'Not allocated'}</p><p className="mt-1 text-xs text-slate-500">Match status: {selected.matchStatus || 'Not recorded'}</p></div><div className="rounded-2xl border border-slate-100 p-4"><p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Inventory effect</p><p className="mt-1 font-black">{currentRank >= 5 ? 'Units deducted at dispatch' : 'No deduction yet'}</p><p className="mt-1 text-xs text-slate-500">Dispatch status: {currentRank >= 5 ? 'Dispatched' : 'Pending'}</p></div></div>{selected.currentLocationNote && <p className="mt-4 rounded-2xl bg-[#FAF9F6] p-4 text-sm font-medium text-slate-600"><strong className="text-[#5A1827]">Recorded note:</strong> {selected.currentLocationNote}</p>}</section>
        </main>
      </div>}
    </div>
  </div>;
};

export default DonationToDispatchTracking;
