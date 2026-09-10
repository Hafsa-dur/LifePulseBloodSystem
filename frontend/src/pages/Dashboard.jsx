import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../styles/Dashboard.css';
import { 
  Droplet, Users, AlertTriangle, Clock, Plus, ArrowRight, 
  Activity, CheckCircle2, Clock3, TrendingDown, Send, Truck
} from 'lucide-react';
import DispatchModal from './DispatchModal';
import StockAlertModal from '../components/StockAlertModal';
import { API_URL, parseResponse } from '../api';

const Dashboard = () => {
  // State management for dashboard analytics and metrics
  const [stats, setStats] = useState({
    totalDonations: 0,
    activeDonors: 0,
    criticalSupply: 0,
    pendingRequests: 0,
    totalDistributed: 0,
  });

  const [inventory, setInventory] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [isDispatchOpen, setIsDispatchOpen] = useState(false);
  
  // Dynamic Alert and Stock Status States
  const [isStockAlertOpen, setIsStockAlertOpen] = useState(false);
  const [lowStockGroups, setLowStockGroups] = useState([]);
  
  // State to check if any blood transport/dispatch is currently active
  const [activeTransit, setActiveTransit] = useState(false);
  
  const location = useLocation();

  // Fetch real-time dashboard metrics and inventory status from backend APIs
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const donationsRes = await fetch(`${API_URL}/donations/dashboard`);
        let donationsData = [];
        let groupDonationUnits = { 'A+': 0, 'A-': 0, 'B+': 0, 'B-': 0, 'O+': 0, 'O-': 0, 'AB+': 0, 'AB-': 0 };
        let totalUnits = 0;
        let uniqueDonors = 0;

        if (donationsRes.ok) {
          donationsData = await parseResponse(donationsRes);
          
          // Calculate total units and group-wise donations securely
          donationsData.forEach((item) => {
            const bg = item.bloodGroup;
            const units = Number(item.units) || 1;
            if (groupDonationUnits[bg] !== undefined) {
              groupDonationUnits[bg] += units;
            }
            totalUnits += units;
          });

          // Strictly counting unique donors from donation database only (Isolated from patient requests/dispatches)
          uniqueDonors = new Set(donationsData.map((item) => item.donorName)).size;
        }

        const requestsRes = await fetch(`${API_URL}/patient-requests`);
        let pendingCount = 0;
        let distributedUnits = 0;

        if (requestsRes.ok) {
          const requestsData = await parseResponse(requestsRes);
          
          const pendingItems = requestsData.filter(
            (req) => req.status === 'Pending' || !req.status
          );
          pendingCount = pendingItems.length;

          // Approved requests reserve nothing. Only completed dispatches affect
          // the inventory shown in System Overview.
          const dispatchedItems = requestsData.filter((req) => req.status === 'Dispatched');
          
          distributedUnits = dispatchedItems.reduce((sum, req) => sum + (Number(req.unitsRequired) || 0), 0);
          
          // Check if there are any active dispatches/transports in transit
          const inTransitItems = requestsData.filter(
            (req) => req.status === 'Dispatched' || req.isInTransit === true
          );
          setActiveTransit(inTransitItems.length > 0);
        }

        // The dashboard inventory endpoint returns the remaining positive stock.
        // Dispatch already decrements those donation rows in the backend, so do
        // not subtract dispatched requests a second time here.
        const groups = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
        const groupCounts = groups.map((g) => {
          const donated = groupDonationUnits[g] || 0;
          const netUnits = Math.max(0, donated);
          const progressLevel = netUnits > 0 ? Math.min((netUnits / 20) * 100, 100) : 0;

          return {
            group: g,
            units: netUnits,
            status: netUnits < 5 ? 'Critical' : 'Available',
            level: progressLevel,
          };
        });

        const criticalItems = groupCounts.filter((g) => g.units < 5);

        if (criticalItems.length > 0) {
          setLowStockGroups(criticalItems);
          setIsStockAlertOpen(true);
        }

        setStats({
          totalDonations: totalUnits,
          activeDonors: uniqueDonors, // Only unique registered donors counted here
          criticalSupply: criticalItems.length,
          pendingRequests: pendingCount,
          totalDistributed: distributedUnits,
        });

        setInventory(groupCounts);
        setRecentActivities(donationsData.slice(-5).reverse());

      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      }
    };

    fetchDashboardData();
  }, [location]);

  return (
    <div className="min-h-screen bg-[#F7F4EC] text-[#4A1521] py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Top Header Section with Action Buttons aligned in a single line */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b-2 border-[#6B1D2F]/20 pb-6">
          <div>
            <h1 className="text-3xl font-black text-[#4A1521] tracking-tight flex items-center gap-3">
              <Activity className="w-8 h-8 text-[#990000] animate-pulse" />
              System Overview
            </h1>
            <p className="text-slate-600 text-sm mt-1 font-medium">
              Live monitoring of blood reserves, donor updates, inflow/outflow, and dispatch requests.
            </p>
          </div>

          {/* Buttons Group aligned in a single responsive row without wrapping issues */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0">
            
            {/* Conditional Live Transport Button */}
            {activeTransit && (
              <Link
                to="/tracking"
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-[#FCD34D] via-[#F59E0B] to-[#D97706] hover:from-[#F59E0B] hover:to-[#B45309] text-[#5A1827] font-black text-[11px] uppercase tracking-wider rounded-xl transition-all shadow-lg active:scale-95 cursor-pointer border-2 border-[#5A1827] whitespace-nowrap overflow-hidden relative"
              >
                <Truck className="w-4 h-4 text-[#5A1827] animate-bounce shrink-0" />
                <span className="inline-block animate-pulse tracking-wide font-black">
                  LIVE TRANSPORT: IN TRANSIT...
                </span>
              </Link>
            )}

            {/* Trigger Emergency WhatsApp Dispatch Modal Button */}
            <button
              onClick={() => setIsDispatchOpen(true)}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-gradient-to-r from-[#5A1827] to-[#802035] hover:from-[#3D101A] hover:to-[#5A1827] text-white font-black text-[11px] uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-95 cursor-pointer border border-[#E5C158]/50 whitespace-nowrap"
            >
              <span className="relative flex h-2 w-2 items-center justify-center">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500"></span>
              </span>
              Trigger Alert
            </button>

            {/* Log New Donation Entry Button */}
            <Link
              to="/add-blood"
              className="inline-flex items-center justify-center gap-1 px-3 py-2 bg-gradient-to-r from-[#FCD34D] to-[#F59E0B] hover:from-[#F59E0B] hover:to-[#D97706] text-amber-950 font-black text-[11px] uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-95 cursor-pointer border border-[#D97706] whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3] text-amber-950" />
              Log Donation
            </Link>
          </div>
        </div>

        {/* 5 Compact Metric Cards Grid Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          
          {/* Card 1: Total Units Collected (Inflow) */}
          <div className="bg-white p-5 rounded-2xl border-2 border-[#6B1D2F]/20 shadow-md hover:border-[#6B1D2F] hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center justify-between text-slate-600 mb-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-[#5A1827]">Total Collected</span>
              <Droplet className="w-4 h-4 text-[#990000]" />
            </div>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl font-black text-[#4A1521]">{stats.totalDonations}</span>
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-1.5 py-0.5 rounded-lg flex items-center gap-0.5 shadow-sm">
                <CheckCircle2 className="w-2.5 h-2.5" /> Inflow
              </span>
            </div>
          </div>

          {/* Card 2: Registered Donors (Isolated strictly to unique active donors, no patient/dispatch mixing) */}
          <div className="bg-white p-5 rounded-2xl border-2 border-[#6B1D2F]/20 shadow-md hover:border-[#6B1D2F] hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center justify-between text-slate-600 mb-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-[#5A1827]">Registered Donors</span>
              <Users className="w-4 h-4 text-blue-700" />
            </div>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl font-black text-[#4A1521]">{stats.activeDonors}</span>
              <span className="text-[10px] font-bold text-blue-800 bg-blue-100 border border-blue-300 px-1.5 py-0.5 rounded-lg shadow-sm">
                Active Donors
              </span>
            </div>
          </div>

          {/* Card 3: Critical Low Blood Groups */}
          <div className="bg-white p-5 rounded-2xl border-2 border-[#6B1D2F]/20 shadow-md hover:border-[#6B1D2F] hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center justify-between text-slate-600 mb-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-[#5A1827]">Critical Low</span>
              <AlertTriangle className="w-4 h-4 text-[#990000] animate-bounce" />
            </div>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl font-black text-[#990000]">{stats.criticalSupply}</span>
              <span className="text-[10px] font-bold text-rose-800 bg-rose-100 border border-rose-300 px-1.5 py-0.5 rounded-lg shadow-sm">
                Action Needed
              </span>
            </div>
          </div>

          {/* Card 4: Pending Patient Requests */}
          <div className="bg-white p-5 rounded-2xl border-2 border-[#6B1D2F]/20 shadow-md hover:border-[#6B1D2F] hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center justify-between text-slate-600 mb-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-[#5A1827]">Pending Requests</span>
              <Clock className="w-4 h-4 text-amber-700" />
            </div>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl font-black text-[#4A1521]">{stats.pendingRequests}</span>
              <span className="text-[10px] font-bold text-amber-900 bg-amber-100 border border-amber-300 px-1.5 py-0.5 rounded-lg shadow-sm">
                In Review
              </span>
            </div>
          </div>

          {/* Card 5: Total Distributed (Outflow) */}
          <div className="bg-white p-5 rounded-2xl border-2 border-[#6B1D2F]/20 shadow-md hover:border-[#6B1D2F] hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center justify-between text-slate-600 mb-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-[#5A1827]">Total Distributed</span>
              <Send className="w-4 h-4 text-purple-700" />
            </div>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl font-black text-[#4A1521]">{stats.totalDistributed}</span>
              <span className="text-[10px] font-bold text-purple-800 bg-purple-100 border border-purple-300 px-1.5 py-0.5 rounded-lg shadow-sm flex items-center gap-0.5">
                <TrendingDown className="w-2.5 h-2.5" /> Outflow
              </span>
            </div>
          </div>

        </div>

        {/* Inventory Status & Recent Activity Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white rounded-2xl border-2 border-[#6B1D2F]/20 p-6 shadow-md">
            <div className="flex justify-between items-center mb-6 border-b border-[#6B1D2F]/15 pb-4">
              <div>
                <h2 className="text-lg font-black text-[#4A1521]">Inventory Status by Group</h2>
                <p className="text-xs text-slate-600 font-medium">Live reserves in main storage</p>
              </div>
              <Link to="/blood-list" className="text-xs font-black text-[#5A1827] hover:text-[#990000] flex items-center gap-1 transition-colors">
                View Detailed List <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {inventory.map((item) => {
                const isLow = item.units < 5;
                return (
                  <div 
                    key={item.group} 
                    className={`p-4 rounded-xl border-2 transition-all hover:scale-[1.02] ${
                      isLow 
                        ? 'bg-rose-50/70 border-rose-400 shadow-sm' 
                        : 'border-[#6B1D2F]/15 bg-[#FDFBF7] hover:border-[#6B1D2F]'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-black text-xl text-[#4A1521]">{item.group}</span>
                      <span className={`text-xs px-2.5 py-1 font-black rounded-lg border shadow-sm ${
                        isLow 
                          ? 'bg-rose-100 text-[#990000] border-rose-300 animate-pulse' 
                          : 'text-amber-950 bg-gradient-to-r from-[#FCD34D] to-[#F59E0B] border-[#D97706]'
                      }`}>
                        {item.units} Pints ({item.status})
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden mt-3 shadow-inner">
                      <div
                        className={`h-2.5 rounded-full transition-all duration-700 ${
                          isLow ? 'bg-[#990000]' : 'bg-gradient-to-r from-[#800020] to-[#5A1827]'
                        }`}
                        style={{ width: `${item.level}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Activity Section */}
          <div className="bg-white rounded-2xl border-2 border-[#6B1D2F]/20 p-6 shadow-md flex flex-col justify-between">
            <div>
              <h2 className="text-lg font-black text-[#4A1521] mb-4 flex items-center gap-2">
                <Clock3 className="w-5 h-5 text-[#990000]" />
                Recent Activity
              </h2>
              <div className="space-y-3">
                {recentActivities.length > 0 ? (
                  recentActivities.map((act) => (
                    <div key={act._id} className="flex items-start justify-between p-3.5 rounded-xl border border-[#6B1D2F]/15 bg-[#FDFBF7] hover:border-[#6B1D2F] transition-all">
                      <div>
                        <p className="text-sm font-black text-[#4A1521]">{act.donorName}</p>
                        <p className="text-xs text-slate-600 font-medium">Donated <strong className="text-amber-800">{act.units} Pints</strong> of <strong className="text-[#990000]">{act.bloodGroup}</strong></p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 italic py-4 text-center">No recent activity recorded.</p>
                )}
              </div>
            </div>
          </div>
        </div>

      </div>

      <DispatchModal isOpen={isDispatchOpen} onClose={() => setIsDispatchOpen(false)} />
      
      {/* Real-time Dynamic Stock Alert Modal Component */}
      <StockAlertModal 
        isOpen={isStockAlertOpen} 
        onClose={() => setIsStockAlertOpen(false)} 
        lowStockGroups={lowStockGroups} 
      />
    </div>
  );
};

export default Dashboard;