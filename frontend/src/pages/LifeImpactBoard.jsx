import React, { useState, useEffect } from 'react';
import axios from 'axios';

const LifeImpactBoard = () => {
  const [impactData, setImpactData] = useState({ stats: {}, logs: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserLifeImpact();
  }, []);

  const fetchUserLifeImpact = async () => {
    try {
      let userEmail = '';
      let userName = '';

      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          userEmail = parsedUser.email || '';
          userName = parsedUser.name || parsedUser.donorName || '';
        } catch (e) {
          userEmail = storedUser;
        }
      }
      
      if (!userEmail) userEmail = localStorage.getItem('userEmail') || '';
      if (!userName) userName = localStorage.getItem('userName') || '';


      const queryParams = new URLSearchParams();
      if (userEmail) queryParams.append('email', userEmail);
      if (userName) queryParams.append('donorName', userName);

      console.log("Fetching impact data with:", queryParams.toString());

      const response = await axios.get(`/api/life-impact?${queryParams.toString()}`);
      console.log("Response received:", response.data);

      const resData = response.data;
      const allRows = resData.impactLogs || [];
      const backendStats = resData.stats || {};

      setImpactData({
        stats: {
          totalContributions: backendStats.totalDonations || allRows.length,
          totalUnits: backendStats.totalUnits || 0,
          livesSaved: backendStats.livesImpactedApprox || (allRows.length * 3)
        },
        logs: allRows
      });
      setLoading(false);
    } catch (err) {
      console.error("Error fetching life impact board:", err);
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto bg-[#FAFAFA] min-h-screen">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-[#800000] tracking-wide">Your Life Impact Dashboard</h2>
        <p className="text-gray-600 mt-1">See how your generous blood donations directly transformed and saved lives.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-[#800000]">
          <p className="text-gray-500 text-sm font-semibold uppercase tracking-wider">Your Contributions</p>
          <h3 className="text-3xl font-extrabold text-[#800000] mt-2">{impactData.stats.totalContributions || 0}</h3>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-[#1B365D]">
          <p className="text-gray-500 text-sm font-semibold uppercase tracking-wider">Units Put to Action</p>
          <h3 className="text-3xl font-extrabold text-[#1B365D] mt-2">{impactData.stats.totalUnits || 0} Pints</h3>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-[#85A32B]">
          <p className="text-gray-500 text-sm font-semibold uppercase tracking-wider">Estimated Lives Saved</p>
          <h3 className="text-3xl font-extrabold text-[#85A32B] mt-2">{impactData.stats.livesSaved || 0}+</h3>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-5 bg-[#1B365D] text-white flex justify-between items-center">
          <h3 className="text-lg font-semibold tracking-wide">Your Beneficiary Match & Impact History</h3>
          <span className="text-xs bg-[#85A32B] text-white px-3 py-1 rounded-full font-medium">Personal Impact</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-500 font-medium">Loading your impact stories...</div>
        ) : impactData.logs.length === 0 ? (
          <div className="p-12 text-center text-gray-500 font-medium">No impact records found for your account yet. Once your donations match with patients, they will appear here.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider border-b border-gray-100">
                  <th className="py-4 px-6 font-semibold">Donor / Source</th>
                  <th className="py-4 px-6 font-semibold">Blood Group</th>
                  <th className="py-4 px-6 font-semibold">Patient Name</th>
                  <th className="py-4 px-6 font-semibold">Hospital / Recipient</th>
                  <th className="py-4 px-6 font-semibold">Units</th>
                  <th className="py-4 px-6 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {impactData.logs.map((item, index) => (
                  <tr key={item._id || index} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-4 px-6 font-medium text-gray-800">{item.donorName || 'Anonymous'}</td>
                    <td className="py-4 px-6 font-semibold text-[#800000]">{item.bloodType || 'N/A'}</td>
                    <td className="py-4 px-6 text-gray-700 font-medium">{item.patientName || 'Pending Allocation'}</td>
                    <td className="py-4 px-6 text-gray-600">{item.recipientName || item.hospitalName || 'N/A'}</td>
                    <td className="py-4 px-6 text-gray-600 font-medium">{item.pints || 0} Pints</td>
                    <td className="py-4 px-6">
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${
                        item.status === 'Approved' || item.status === 'Dispatched' 
                          ? 'bg-emerald-50 text-[#85A32B] border-emerald-200/50' 
                          : 'bg-amber-50 text-amber-600 border-amber-200/50'
                      }`}>
                        {item.status || 'Recorded'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default LifeImpactBoard;