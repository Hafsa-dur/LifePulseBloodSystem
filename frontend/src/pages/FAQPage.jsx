import { useMemo, useState } from 'react';
import { ChevronDown, HelpCircle, Search } from 'lucide-react';

const faqCategories = [
  {
    title: 'VitalTrack basics',
    questions: [
      ['What is VitalTrack?', 'VitalTrack is a hospital blood-management platform that records donations, manages available blood units, supports donor matching, and connects hospital requests to approval and dispatch records.'],
      ['What is the normal VitalTrack workflow?', 'A hospital submits a patient request, the system checks compatible available donors and inventory, staff review the request, an approved request is allocated, and units are deducted when staff dispatch the blood.'],
      ['Who is VitalTrack designed for?', 'VitalTrack supports hospital administrators, hospital staff, and registered donors. Hospital users manage requests and stock, while donors can review their donation history and donor features.'],
      ['Does VitalTrack replace clinical blood-bank procedures?', 'No. VitalTrack organizes records and workflow. Clinical screening, compatibility testing, storage procedures, and final medical decisions remain the responsibility of authorized healthcare professionals.'],
    ]
  },
  {
    title: 'Donors and donations',
    questions: [
      ['How is a donor recorded?', 'A hospital user records a donor with their name, email, blood group, donation units, donation date, and location. Optional latitude and longitude can also be saved.'],
      ['Who can register as a donor?', 'VitalTrack accepts donor account information, but the application does not replace medical eligibility screening. A healthcare professional must confirm whether a person can safely donate.'],
      ['How often can I donate?', 'The donor profile currently calculates the next eligible date by adding 56 days to the latest recorded donation. This is an application reminder, not medical advice.'],
      ['What is My Donations?', 'My Donations shows donation records and linked impact or dispatch records for the signed-in donor, including blood type, units, dates, patient, hospital, and dispatch status when available.'],
      ['What is the Digital Donor Passport?', 'The Digital Donor Passport is a downloadable QR display containing the donor identity and blood-group information available in the signed-in account.'],
    ]
  },
  {
    title: 'Blood inventory',
    questions: [
      ['What does available blood stock mean?', 'Available stock is the positive number of units recorded for a blood group that has not been dispatched.'],
      ['What is the difference between a donor and inventory?', 'A donor is the person associated with a donation record. Inventory is the blood-unit supply available for fulfillment, whether it is linked to a donor or used as system stock.'],
      ['How are blood units organized?', 'VitalTrack records units by blood group and tracks available, total, and dispatched quantities on donation records.'],
      ['When are units deducted from inventory?', 'Units are deducted when an approved patient request is dispatched. Approval creates an allocation but does not deduct the units yet.'],
      ['What happens when inventory reaches zero?', 'The donation record is marked as dispatched when its available units reach zero, so it is excluded from future matching and stock selection.'],
      ['How does inventory act as a fallback?', 'The system first attempts to identify a compatible available donor. If no suitable donor is found, the request can be allocated to compatible hospital inventory instead.'],
      ['Can hospital staff edit stock?', 'Hospital users with the inventory permission can access the stock-management features. The backend also scopes records to the authorized hospital.']
    ]
  },
  {
    title: 'Donor matching and Location Intelligence',
    questions: [
      ['How does donor matching work?', 'Matching checks the requested blood group, positive available units, donor information, hospital scope, and saved location data. Matching results are ranked by calculated geographic distance when locations can be resolved.'],
      ['What happens if no suitable donor is available?', 'The request is marked for inventory fallback. If no compatible stock is available when staff approve it, the backend rejects the request.'],
      ['What is Location Intelligence?', 'Location Intelligence helps hospital staff compare saved donor and hospital locations and identify nearby matching donor records.'],
      ['What is geocoding?', 'Geocoding converts a text location into latitude and longitude. VitalTrack attempts to resolve locations through its configured public geocoding providers.'],
      ['Why are latitude and longitude used?', 'Coordinates provide a consistent way to compare donor and hospital locations after a text address or place name has been resolved.'],
      ['What is the Haversine formula?', 'VitalTrack uses the Haversine calculation to estimate the straight-line distance between two latitude/longitude points on Earth.'],
      ['Is the displayed distance road distance?', 'No. The matching distance is geographic straight-line distance. It is not driving distance, travel time, or turn-by-turn navigation.'],
      ['Why might a location not match?', 'A location may be too vague, unresolved by the geocoding providers, missing from a donor record, or unavailable as valid coordinates. The request can still use inventory when appropriate.']
    ]
  },
  {
    title: 'Hospital requests and dispatch',
    questions: [
      ['Who can submit a patient request?', 'Authenticated hospital administrators and hospital staff with the requests permission can submit requests for their hospital.'],
      ['What information does a patient request contain?', 'Requests include patient name, blood group, units required, hospital details, contact phone, urgency and department information where supplied, plus matching and allocation fields.'],
      ['What does Pending mean?', 'Pending means the request is waiting for hospital review. Staff can approve or reject it from Request Management.'],
      ['What does Approved mean?', 'Approved means staff accepted the request and the backend created a donor or inventory allocation log. Units are not deducted until dispatch.'],
      ['What does Rejected mean?', 'Rejected means staff declined the request, or approval found that no compatible available stock could fulfill it.'],
      ['What does Dispatched mean?', 'Dispatched means the system recorded issuance of the requested units, reduced available inventory, and updated the request and allocation log.'],
      ['What does Delivered mean?', 'Delivered exists as a supported database value, but the current workflow does not provide a receipt action that sets requests to Delivered.'],
      ['Is In Transit a current backend request status?', 'No. In Transit is not part of the patient-request status enum and is not assigned by the current approval or dispatch endpoints.'],
      ['Does VitalTrack verify hospital receipt?', 'The current implementation records dispatch, but it does not verify physical receipt or provide a hospital confirmation action.'],
      ['What is the Dispatch Log?', 'The Dispatch Log displays donor or inventory source information, blood units, patient and hospital details, matching status, and dispatch status from stored allocation records.'],
      ['Why is approval separate from dispatch?', 'Approval confirms that the request can be fulfilled and reserves an allocation record. Dispatch is the later operational action that actually deducts units and marks the allocation fulfilled.']
    ]
  },
  {
    title: 'Roles, security, rewards, and reports',
    questions: [
      ['What can a Hospital Admin do?', 'A Hospital Admin can manage hospital requests, inventory, dispatch permissions, staff, settings, and reports according to the enabled application routes.'],
      ['What can Hospital Staff do?', 'Hospital Staff access only the hospital functions granted through their permissions, such as requests, dispatch, inventory, or tracking.'],
      ['What can a Donor do?', 'A donor can access donor-facing features such as My Donations, the donor profile, the Digital Donor Passport, rewards, and life-impact information.'],
      ['How do staff invitations work?', 'A Hospital Admin enters a staff member name and email. VitalTrack creates a one-time token, stores its hash, and sends a registration link to the invited address.'],
      ['How long does a staff invitation last?', 'The current invitation endpoint sets the expiry to 24 hours. The invitation is intended for one-time use.'],
      ['How does role-based access work?', 'Frontend routes and backend middleware check authentication, hospital role, and permissions. Backend queries also scope hospital data to the signed-in user.'],
      ['What technology does VitalTrack use?', 'The project uses React and Vite in the frontend, an Express Node.js backend, MongoDB through Mongoose, Socket.IO for selected updates, and Nodemailer for backend email workflows.'],
      ['What are Reports and Analytics?', 'Reports and Analytics summarizes request totals, approved requests, dispatched units, available units, blood-group distribution, and request or matching performance for the selected range.'],
      ['How are estimated lives saved calculated?', 'The Life Impact Board uses linked impact records and presents an approximate figure. It is an engagement metric, not a clinical guarantee.'],
      ['What are rewards and gamification?', 'The donor area provides points and reward-related features based on the records and reward workflows implemented by VitalTrack. Rewards should not be interpreted as medical or financial benefits.']
    ]
  }
];

const FAQPage = () => {
  const [openKey, setOpenKey] = useState(null);
  const [query, setQuery] = useState('');
  const normalizedQuery = query.trim().toLowerCase();
  const visibleCategories = useMemo(() => faqCategories.map((category) => ({
    ...category,
    questions: category.questions.filter(([question, answer]) => !normalizedQuery || `${question} ${answer}`.toLowerCase().includes(normalizedQuery))
  })).filter((category) => category.questions.length > 0), [normalizedQuery]);
  const questionCount = faqCategories.reduce((total, category) => total + category.questions.length, 0);

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#5A1827] selection:bg-[#E5C158] selection:text-[#5A1827]">
      <div className="mx-auto w-full max-w-5xl space-y-8 px-6 py-16">
        <div className="space-y-4 rounded-[2rem] border-2 border-[#E5C158]/30 bg-gradient-to-br from-[#5A1827] to-[#4A121F] p-8 text-center shadow-2xl sm:p-10">
          <div className="inline-flex rounded-2xl border border-[#E5C158]/30 bg-[#E5C158]/10 p-4 text-[#E5C158]"><HelpCircle className="h-8 w-8" /></div>
          <span className="inline-block rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-black uppercase tracking-widest text-[#E5C158]">Support Center</span>
          <h1 className="text-3xl font-black uppercase tracking-tight text-white sm:text-4xl">Frequently Asked Questions</h1>
          <p className="mx-auto max-w-2xl text-sm font-bold text-rose-100">Verified answers about VitalTrack&apos;s donation, inventory, hospital request, and dispatch workflows.</p>
          <div className="mx-auto flex max-w-xl items-center gap-3 rounded-2xl border-2 border-white/20 bg-white/10 px-4 py-3 text-left">
            <Search className="h-5 w-5 shrink-0 text-[#E5C158]" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Search ${questionCount} questions...`} aria-label="Search frequently asked questions" className="w-full bg-transparent text-sm font-bold text-white outline-none placeholder:text-rose-100/70" />
          </div>
        </div>

        <div className="space-y-8">
          {visibleCategories.map((category) => (
            <section key={category.title} className="space-y-3">
              <div className="flex items-center gap-3"><span className="h-2 w-2 rounded-full bg-[#E5C158]" /><h2 className="text-lg font-black uppercase tracking-wide">{category.title}</h2><span className="rounded-full bg-[#E5C158]/20 px-2.5 py-1 text-[10px] font-black">{category.questions.length}</span></div>
              <div className="grid grid-cols-1 gap-3">
                {category.questions.map(([question, answer]) => {
                  const key = `${category.title}-${question}`;
                  const isOpen = openKey === key;
                  return <div key={key} className={`overflow-hidden rounded-2xl border-2 bg-white shadow-sm transition-all ${isOpen ? 'border-[#5A1827]/40 shadow-lg' : 'border-[#5A1827]/15 hover:border-[#5A1827]/30'}`}>
                    <button type="button" onClick={() => setOpenKey(isOpen ? null : key)} className="flex w-full items-center justify-between gap-4 p-5 text-left">
                      <span className="flex items-center gap-3 text-sm font-black sm:text-base"><span className="rounded-xl border border-[#E5C158]/40 bg-[#E5C158]/20 px-2.5 py-1 text-xs font-mono">{String(faqCategories.flatMap((item) => item.questions).findIndex((item) => item[0] === question) + 1).padStart(2, '0')}</span>{question}</span>
                      <ChevronDown className={`h-5 w-5 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isOpen && <p className="border-t border-[#5A1827]/10 px-5 pb-5 pt-4 text-sm font-medium leading-relaxed text-slate-600 sm:pl-20">{answer}</p>}
                  </div>;
                })}
              </div>
            </section>
          ))}
          {!visibleCategories.length && <div className="rounded-2xl border-2 border-[#5A1827]/15 bg-white p-8 text-center text-sm font-bold text-slate-600">No FAQ matches that search.</div>}
        </div>
      </div>
    </div>
  );
};

export default FAQPage;
