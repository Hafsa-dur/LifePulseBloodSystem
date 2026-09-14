import { useEffect, useState } from 'react';
import { Settings, BellRing, Building2, ShieldCheck, DatabaseZap } from 'lucide-react';
import { API_URL, authHeaders, parseResponse } from '../api';

const HospitalSettings = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [settings, setSettings] = useState({
    emergencyAlerts: true,
    autoDispatch: true,
    donorNotifications: true,
    hospitalScope: user.hospitalName || 'Current hospital',
  });

  useEffect(() => {
    fetch(`${API_URL}/hospital/settings`, { headers: authHeaders() }).then(parseResponse).then((data) => { if (data.settings) setSettings(data.settings); }).catch(() => {});
  }, []);

  const updateSetting = (key) => {
    const next = { ...settings, [key]: !settings[key] };
    setSettings(next);
    fetch(`${API_URL}/hospital/settings`, { method: 'PUT', headers: authHeaders(true), body: JSON.stringify(next) }).then(parseResponse).catch(() => {});
  };

  return (
    <div className="min-h-screen bg-[#F7F4EC] text-[#4A1521] py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="bg-white border-2 border-[#6B1D2F]/20 rounded-2xl p-6 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#E5C158]/20 border border-[#E5C158] flex items-center justify-center">
              <Settings className="w-6 h-6 text-[#5A1827]" />
            </div>
            <div>
              <span className="px-3 py-1 bg-[#E5C158]/20 border border-[#E5C158] text-[#7A6305] font-bold text-[10px] uppercase tracking-wider rounded-full">Hospital Controls</span>
              <h1 className="text-3xl font-black text-[#4A1521] mt-2">System Settings</h1>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[0.9fr_1.1fr] gap-6">
          <div className="bg-white border-2 border-[#6B1D2F]/20 rounded-2xl p-6 shadow-md">
            <div className="flex items-center gap-2 mb-4">
              <Building2 className="w-5 h-5 text-[#990000]" />
              <h2 className="text-xl font-black text-[#4A1521]">Hospital context</h2>
            </div>

            <div className="space-y-4 text-sm text-slate-600">
              <div className="bg-[#FAF9F6] border border-[#6B1D2F]/10 rounded-xl p-3">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Hospital Name</p>
                <p className="mt-1 text-base font-black text-[#4A1521]">{settings.hospitalName || settings.hospitalScope || user.hospitalName || 'Hospital name not set'}</p>
              </div>
              <div className="bg-[#FAF9F6] border border-[#6B1D2F]/10 rounded-xl p-3">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Location</p>
                <p className="mt-1 text-base font-black text-[#4A1521]">{settings.hospitalLocation || user.hospitalLocation || 'Location not set'}</p>
              </div>
            </div>
          </div>

          <div className="bg-white border-2 border-[#6B1D2F]/20 rounded-2xl p-6 shadow-md">
            <div className="flex items-center gap-2 mb-5">
              <DatabaseZap className="w-5 h-5 text-emerald-700" />
              <h2 className="text-xl font-black text-[#4A1521]">Operational preferences</h2>
            </div>

            <div className="space-y-4">
              {[
                { key: 'emergencyAlerts', label: 'Emergency alerts', icon: BellRing },
                { key: 'autoDispatch', label: 'Auto-dispatch guard', icon: ShieldCheck },
                { key: 'donorNotifications', label: 'Donor notifications', icon: Settings },
              ].map(({ key, label, icon: Icon }) => (
                <div key={key} className="flex items-center justify-between border border-[#6B1D2F]/10 rounded-xl p-3 bg-[#FAF9F6]">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#E5C158]/20 flex items-center justify-center border border-[#E5C158]">
                      <Icon className="w-4 h-4 text-[#5A1827]" />
                    </div>
                    <span className="text-sm font-bold text-[#4A1521]">{label}</span>
                  </div>
                  <button
                    onClick={() => updateSetting(key)}
                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition ${settings[key] ? 'bg-[#5A1827]' : 'bg-slate-300'}`}
                  >
                    <span className={`inline-block h-5 w-5 rounded-full bg-white transition ${settings[key] ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HospitalSettings;
