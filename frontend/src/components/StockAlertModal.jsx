import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { socket } from '../socket';
import { AlertTriangle, Radio, X, ShieldAlert } from 'lucide-react';

const StockAlertModal = ({ isOpen: propsIsOpen, onClose: propsOnClose, lowStockGroups = [] }) => {
  const navigate = useNavigate();
  const [socketAlert, setSocketAlert] = useState(null);
  const [internalOpen, setInternalOpen] = useState(false);

  useEffect(() => {
    // Listen for incoming low stock notifications
    const handleLowStock = (data) => {
      console.log('Stock alert event detected:', data);
      setSocketAlert(data);
      setInternalOpen(true);
    };

    if (socket && !socket.connected) {
      socket.connect();
    }

    if (socket) {
      socket.on('low_stock_alert', handleLowStock);
    }

    return () => {
      if (socket) {
        socket.off('low_stock_alert', handleLowStock);
      }
    };
  }, []);

  const isModalVisible = propsIsOpen || internalOpen;

  if (!isModalVisible) return null;

  const handleClose = () => {
    setInternalOpen(false);
    if (propsOnClose) propsOnClose();
  };

  const handleNavigateToRadar = (group) => {
    handleClose();
    navigate(`/geopulse-radar?group=${encodeURIComponent(group)}`);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#FAF9F6] border-2 border-[#5A1827] rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 text-[#5A1827] font-sans">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-[#5A1827]/15 pb-3">
          <div className="flex items-center gap-2.5 text-[#990000]">
            <AlertTriangle className="w-6 h-6 animate-pulse" />
            <h3 className="text-lg font-black text-[#5A1827]">Critical Stock Alert</h3>
          </div>
          <button 
            onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl bg-white border border-[#5A1827]/30 text-[#5A1827] hover:bg-rose-100 hover:text-[#990000] transition font-black cursor-pointer shadow-sm"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Real-Time Socket Event Card */}
        {socketAlert && (
          <div className="p-3.5 bg-rose-50/80 border-2 border-rose-300 rounded-2xl space-y-2 shadow-sm">
            <p className="text-slate-700 text-xs font-semibold">{socketAlert.message}</p>
            <div className="flex justify-between items-center bg-white p-2.5 rounded-xl border border-[#5A1827]/30 shadow-inner">
              <span className="text-sm font-black text-[#990000]">{socketAlert.bloodGroup}</span>
              <span className="text-xs font-bold text-[#5A1827]">{socketAlert.remainingUnits} Units</span>
              <button
                onClick={() => handleNavigateToRadar(socketAlert.bloodGroup)}
                className="px-3 py-1.5 bg-gradient-to-r from-[#5A1827] to-[#802035] hover:from-[#3D101A] hover:to-[#5A1827] text-white text-[11px] font-bold rounded-xl flex items-center gap-1 transition shadow-md cursor-pointer border border-[#E5C158]/40"
              >
                <Radio className="w-3 h-3 text-amber-400" /> Radar & SMS
              </button>
            </div>
          </div>
        )}

        {/* Low Stock Inventory Items */}
        {lowStockGroups.length > 0 && (
          <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
            <div className="bg-rose-50/80 border-2 border-rose-300/60 p-2.5 rounded-xl flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-[#990000] shrink-0" />
              <p className="text-xs font-bold text-rose-900">
                The following blood categories require immediate replenishment:
              </p>
            </div>
            {lowStockGroups.map((item) => (
              <div 
                key={item.group}
                className="flex items-center justify-between bg-white p-3.5 rounded-2xl border-2 border-[#5A1827]/30 shadow-sm hover:border-[#5A1827] transition-all"
              >
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 text-xs font-black text-white bg-gradient-to-r from-[#5A1827] to-[#802035] border border-[#E5C158]/40 rounded-lg shadow-sm">
                    {item.group}
                  </span>
                  <div>
                    <span className="text-xs font-black text-[#5A1827] block">{item.units} Pints Remaining</span>
                    <span className="text-[10px] text-[#990000] uppercase font-black tracking-wider">Critical Status</span>
                  </div>
                </div>

                <button
                  onClick={() => handleNavigateToRadar(item.group)}
                  className="px-3 py-1.5 bg-gradient-to-r from-[#5A1827] to-[#802035] hover:from-[#3D101A] hover:to-[#5A1827] text-white text-[11px] font-black rounded-xl flex items-center gap-1 transition shadow-md cursor-pointer border border-[#E5C158]/40"
                >
                  <Radio className="w-3 h-3 text-amber-400" /> Radar & SMS
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={handleClose}
          className="w-full py-3 bg-gradient-to-r from-[#5A1827] to-[#802035] hover:from-[#3D101A] hover:to-[#5A1827] text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-lg active:scale-95 cursor-pointer border border-[#E5C158]/50 text-center"
        >
          Acknowledge & Dismiss Alert
        </button>
      </div>
    </div>
  );
};

export default StockAlertModal;