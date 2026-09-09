import React, { useState, useEffect } from 'react';

const DonorRecipientDispatchLog = () => {
  const [combinedLogs, setCombinedLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLogs = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/donor-recipient-logs/combined');
      if (!res.ok) {
        throw new Error('Failed to fetch combined dispatch logs.');
      }
      const data = await res.json();
      setCombinedLogs(data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching combined logs:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full min-h-screen bg-white m-0 p-6 shadow-none font-sans">
      <div className="mb-6 pt-2 border-b pb-4 border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div>
          <h2 className="text-2xl font-extrabold text-rose-950 tracking-tight">Donor & Recipient Dispatch Log</h2>
          <p className="text-sm text-gray-500 mt-1">Sequential 1-to-1 matching of donors to patients, with system stock inventory fulfillment.</p>
        </div>
        <span className="px-3 py-1 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold rounded-full">
          Sequential Lock & Inventory Active
        </span>
      </div>

      {loading ? (
        <div className="p-6 text-center text-gray-500 font-medium">Loading dispatch records...</div>
      ) : error ? (
        <div className="p-6 text-center text-red-500 font-medium">Error: {error}</div>
      ) : (
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-rose-950 text-sm font-bold border-b border-gray-200">
                <th className="p-4">Donor / Source Name</th>
                <th className="p-4">Source Type</th>
                <th className="p-4">Last Donation Date</th>
                <th className="p-4">Source Blood & Units</th>
                <th className="p-4">Received Blood & Units</th>
                <th className="p-4">Recipient / Hospital</th>
                <th className="p-4">Status</th>
                <th className="p-4">Dispatch</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {combinedLogs.length > 0 ? (
                combinedLogs.map((item, index) => (
                  <tr key={item._id || index} className="hover:bg-gray-50 transition-colors">
                    
                    <td className="p-4 font-bold text-rose-950 text-base">
                      {item.donorName || 'Inventory'}
                    </td>
                    <td className="p-4 uppercase text-xs font-bold">{item.sourceType || 'donor'}</td>
                    
                    <td className="p-4 font-medium text-rose-600">{item.lastDonationDate}</td>
                    
                    <td className="p-4">
                      <span className="text-xs text-rose-500 font-medium block">Source Units:</span>
                      <span className="font-extrabold text-amber-600 text-base">{item.bloodType}</span> 
                      <span className="text-amber-700 font-semibold ml-1.5">({item.pints} Pints)</span>
                    </td>

                    <td className="p-4">
                      {item.receivedBloodType ? (
                        <>
                          <span className="text-xs text-rose-500 font-medium block">Received:</span>
                          <span className="font-extrabold text-amber-600 text-base">{item.receivedBloodType}</span> 
                          <span className="text-amber-700 font-semibold ml-1.5">({item.receivedUnits} Pints)</span>
                        </>
                      ) : (
                        <span className="p-4 text-gray-400 italic text-xs">Not Dispatched Yet</span>
                      )}
                    </td>

                    <td className="p-4 font-medium">
                      {item.recipientName && item.patientName && item.recipientName !== 'Pending Allocation' ? (
                        <div>
                          <span className="text-blue-600 font-semibold">{item.recipientName}</span>
                          <span className="text-gray-400 mx-1.5">/</span>
                          <span className="text-rose-900 font-bold">{item.patientName}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">Pending Allocation</span>
                      )}
                    </td>

                    <td className="p-4">
                      {item.matchStatus === 'Fulfilled' || item.status === 'Dispatched' ? (
                        <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-semibold">
                          Fulfilled
                        </span>
                      ) : item.matchStatus === 'Matched' ? (
                        <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold border border-blue-200">
                          Matched
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 bg-amber-50 text-amber-800 rounded-full text-xs font-semibold border border-amber-200">
                          {item.matchStatus || item.status || 'Matched'}
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      {item.dispatchStatus === 'Dispatched' || item.status === 'Dispatched' ? (
                        <span className="px-2.5 py-1 bg-red-50 text-red-700 rounded-full text-xs font-semibold">
                          Dispatched
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold border border-blue-200">
                          Pending
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="p-6 text-center text-gray-400 font-medium">
                    No dispatch logs found in the database yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default DonorRecipientDispatchLog;