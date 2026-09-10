import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../api';


const InventoryList = () => {
  const [bloodGroupsData, setBloodGroupsData] = useState([]);
  const [loading, setLoading] = useState(true);

  const ALL_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  useEffect(() => {
    const fetchAndGroupInventory = async () => {
      try {
        let res;
        try {
          res = await axios.get(`${API_URL}/api/donations`);
        } catch {
          res = await axios.get(`${API_URL}/api/donations/history`);
        }

        const rawList = Array.isArray(res.data) ? res.data : res.data.donations || [];

        const grouped = ALL_GROUPS.map((grp) => {
          const groupRecords = rawList.filter(
            (item) => (item.bloodGroup || item.group) === grp
          );

          const totalUnits = groupRecords.reduce((acc, curr) => {
            const qty = Number(curr.units || curr.quantity || 0);
            if (curr.status === 'Dispatched') {
              return acc - Math.abs(qty);
            }
            return acc + qty;
          }, 0);

          const finalStock = Math.max(0, totalUnits);

          return {
            group: grp,
            totalUnits: finalStock,
            totalDonors: groupRecords.length,
            // Critical check strictly less than 5 units (< 5)
            status: finalStock < 5 ? 'Critical' : 'Available'
          };
        });

        setBloodGroupsData(grouped);
      } catch (error) {
        console.error("Error fetching inventory list:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAndGroupInventory();
  }, []);

  return (
    <div className="w-full px-6 py-4 space-y-5 text-[#5A1827] bg-[#FAF9F6] min-h-screen font-sans">
      <div className="flex justify-between items-center bg-white border-2 border-[#6B1D2F] p-6 rounded-2xl shadow-md">
        <div>
          <span className="px-3.5 py-1 bg-[#E5C158]/20 border border-[#E5C158] text-[#7A6305] font-bold text-xs rounded-full uppercase tracking-wider">
            Inventory Status
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-[#5A1827] tracking-wide mt-2">
            Group-wise Inventory Status
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1">
            Real-time collective stock monitoring grouped by blood type.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="bg-white border-2 border-[#6B1D2F] rounded-2xl p-8 text-center text-slate-500 font-medium shadow-md">
          Calculating stock aggregation...
        </div>
      ) : (
        <div className="blood-inventory-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {bloodGroupsData.map((item) => {
            const isCritical = item.status === 'Critical';

            return (
              <div
                key={item.group}
                className={`blood-inventory-card relative group rounded-2xl p-6 transition-all duration-300 overflow-hidden border-2 shadow-md flex flex-col justify-between ${
                  isCritical
                    ? 'bg-rose-50/60 border-rose-400 shadow-rose-100'
                    : 'bg-white border-[#6B1D2F]/30 hover:border-[#6B1D2F]'
                }`}
              >
                {/* Top Border Line for Critical */}
                {isCritical && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-600 via-red-500 to-amber-500 animate-pulse" />
                )}

                <div className="flex justify-between items-start relative z-10">
                  <div>
                    <span className="px-3.5 py-1 font-black text-base text-rose-700 bg-rose-100 border border-rose-300 rounded-lg inline-block">
                      {item.group}
                    </span>
                  </div>

                  {/* Compact Status Badge */}
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      isCritical
                        ? 'bg-rose-100 text-rose-800 border border-rose-300 animate-pulse'
                        : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                    }`}
                  >
                    {item.status}
                  </span>
                </div>

                {/* Stock Units Display */}
                <div className="relative z-10 my-auto">
                  <div className="flex items-baseline gap-1.5">
                    <span
                      className={`text-4xl font-black tracking-tight ${
                        isCritical ? 'text-rose-700' : 'text-[#5A1827]'
                      }`}
                    >
                      {item.totalUnits}
                    </span>
                    <span className="text-xs font-bold text-slate-600 uppercase">
                      Pint(s)
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium mt-1">
                    Total Transactions: <span className="font-bold text-slate-700">{item.totalDonors}</span>
                  </p>
                </div>

                {/* Warning Bar */}
                {isCritical ? (
                  <div className="relative z-10 p-2.5 rounded-xl bg-rose-100 border border-rose-300 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping shrink-0" />
                    <span className="text-[11px] font-bold text-rose-900 truncate">
                      Stock critical (&lt; 5 Pints)
                    </span>
                  </div>
                ) : (
                  <div className="text-[11px] text-slate-500 font-medium">
                    Status: Optimal stock level
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default InventoryList;