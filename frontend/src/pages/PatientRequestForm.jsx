import { useState } from 'react';
import { ClipboardPlus, Send } from 'lucide-react';
import { API_URL, authHeaders, parseResponse } from '../api';

const PatientRequestForm = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [formData, setFormData] = useState({
    patientName: '',
    bloodGroup: 'O+',
    unitsRequired: 1,
    urgencyLevel: 'Normal',
    department: '',
    contactPhone: '',
    hospitalName: user.hospitalName || '',
    hospitalLocation: user.hospitalLocation || '',
    hospitalLatitude: '',
    hospitalLongitude: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const updateField = (field, value) => setFormData((current) => ({ ...current, [field]: value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch(`${API_URL}/patient-requests`, {
        method: 'POST',
        headers: { ...authHeaders(true) },
        body: JSON.stringify({ ...formData, unitsRequired: Number(formData.unitsRequired), hospitalLatitude: formData.hospitalLatitude === '' ? undefined : Number(formData.hospitalLatitude), hospitalLongitude: formData.hospitalLongitude === '' ? undefined : Number(formData.hospitalLongitude) })
      });
      const data = await parseResponse(response);
      if (!response.ok) throw new Error(data.message || 'Patient request could not be submitted.');

      setMessage('Patient request submitted successfully. It is now available in the hospital queue.');
      setFormData((current) => ({
        ...current,
        patientName: '',
        unitsRequired: 1,
        urgencyLevel: 'Normal',
        department: '',
        contactPhone: ''
      }));
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full px-4 py-4 text-[#5A1827] min-h-screen bg-[#FAF9F6] font-sans">
      <div className="bg-white border-2 border-[#5A1827]/30 rounded-2xl p-6 shadow-md space-y-6 w-full">
        <div className="border-b-2 border-[#5A1827]/15 pb-4">
          <span className="px-3.5 py-1 bg-[#E5C158]/20 border border-[#E5C158] text-[#7A6305] font-bold text-xs rounded-full uppercase tracking-wider">
            Hospital Patient Request
          </span>
          <h2 className="text-3xl font-black text-[#5A1827] flex items-center gap-2.5 mt-2">
            <ClipboardPlus className="text-rose-600 w-7 h-7" /> Submit Patient Requisition
          </h2>
          <p className="text-sm text-slate-600 font-medium mt-1">
            Submit a patient blood requirement to your hospital queue for approval and dispatch.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <label className="space-y-1.5 text-xs font-black uppercase tracking-wider">
            Patient Name
            <input required value={formData.patientName} onChange={(event) => updateField('patientName', event.target.value)} className="w-full mt-1 bg-[#FAF9F6] border-2 border-[#5A1827]/30 p-3 rounded-xl text-sm normal-case tracking-normal" />
          </label>

          <label className="space-y-1.5 text-xs font-black uppercase tracking-wider">
            Department
            <input required placeholder="e.g. Emergency, ICU, Surgery" value={formData.department} onChange={(event) => updateField('department', event.target.value)} className="w-full mt-1 bg-[#FAF9F6] border-2 border-[#5A1827]/30 p-3 rounded-xl text-sm normal-case tracking-normal" />
          </label>

          <label className="space-y-1.5 text-xs font-black uppercase tracking-wider">
            Blood Group
            <select value={formData.bloodGroup} onChange={(event) => updateField('bloodGroup', event.target.value)} className="w-full mt-1 bg-[#FAF9F6] border-2 border-[#5A1827]/30 p-3 rounded-xl text-sm">
              {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((group) => <option key={group}>{group}</option>)}
            </select>
          </label>

          <label className="space-y-1.5 text-xs font-black uppercase tracking-wider">
            Units Required
            <input required min="1" type="number" value={formData.unitsRequired} onChange={(event) => updateField('unitsRequired', event.target.value)} className="w-full mt-1 bg-[#FAF9F6] border-2 border-[#5A1827]/30 p-3 rounded-xl text-sm" />
          </label>

          <label className="space-y-1.5 text-xs font-black uppercase tracking-wider">
            Urgency
            <select value={formData.urgencyLevel} onChange={(event) => updateField('urgencyLevel', event.target.value)} className="w-full mt-1 bg-[#FAF9F6] border-2 border-[#5A1827]/30 p-3 rounded-xl text-sm">
              <option>Normal</option>
              <option>Urgent</option>
              <option>High</option>
              <option>Critical</option>
            </select>
          </label>

          <label className="space-y-1.5 text-xs font-black uppercase tracking-wider">
            Contact
            <input required type="tel" value={formData.contactPhone} onChange={(event) => updateField('contactPhone', event.target.value)} className="w-full mt-1 bg-[#FAF9F6] border-2 border-[#5A1827]/30 p-3 rounded-xl text-sm" />
          </label>

          <label className="space-y-1.5 text-xs font-black uppercase tracking-wider">
            Hospital Name
            <input required value={formData.hospitalName} onChange={(event) => updateField('hospitalName', event.target.value)} className="w-full mt-1 bg-[#FAF9F6] border-2 border-[#5A1827]/30 p-3 rounded-xl text-sm" />
          </label>

          <label className="space-y-1.5 text-xs font-black uppercase tracking-wider">
            Hospital Location
            <input required value={formData.hospitalLocation} onChange={(event) => updateField('hospitalLocation', event.target.value)} className="w-full mt-1 bg-[#FAF9F6] border-2 border-[#5A1827]/30 p-3 rounded-xl text-sm" />
          </label>

          <label className="space-y-1.5 text-xs font-black uppercase tracking-wider">
            Hospital Latitude (Optional)
            <input type="number" step="any" min="-90" max="90" placeholder="e.g. 34.0074" value={formData.hospitalLatitude} onChange={(event) => updateField('hospitalLatitude', event.target.value)} className="w-full mt-1 bg-[#FAF9F6] border-2 border-[#5A1827]/30 p-3 rounded-xl text-sm" />
          </label>

          <label className="space-y-1.5 text-xs font-black uppercase tracking-wider">
            Hospital Longitude (Optional)
            <input type="number" step="any" min="-180" max="180" placeholder="e.g. 71.5714" value={formData.hospitalLongitude} onChange={(event) => updateField('hospitalLongitude', event.target.value)} className="w-full mt-1 bg-[#FAF9F6] border-2 border-[#5A1827]/30 p-3 rounded-xl text-sm" />
          </label>

          {message && <p className="md:col-span-2 text-sm font-bold text-slate-700">{message}</p>}

          <button type="submit" disabled={loading} className="md:col-span-2 py-3.5 bg-[#5A1827] hover:bg-[#3D101A] disabled:opacity-50 text-white font-black rounded-xl transition shadow-md uppercase tracking-wider text-xs flex items-center justify-center gap-2 border border-[#E5C158]/40">
            <Send className="w-4 h-4 text-[#E5C158]" />
            {loading ? 'Submitting Request...' : 'Submit Patient Request'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PatientRequestForm;
