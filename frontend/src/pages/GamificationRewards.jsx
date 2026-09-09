import React, { useState } from 'react';
import { Award, Gift, Sparkles, Star, Zap, ShieldCheck, Mail } from 'lucide-react';

const GamificationRewards = () => {
  const [points, setPoints] = useState(420);
  const [donorEmail, setDonorEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const rewardOffers = [
    { id: 1, title: '25% Off Complete Blood Count (CBC)', pointsCost: 150, partner: 'Chughtai Lab' },
    { id: 2, title: 'Free Lipid Profile Test', pointsCost: 300, partner: 'Shaukat Khanam Lab' },
    { id: 3, title: 'Rs. 500 Discount on Health Screening', pointsCost: 250, partner: 'Aga Khan Diagnostic Centre' },
  ];

  const handleRedeem = async (offer) => {
    // Validate if the user has entered their email address
    if (!donorEmail) {
      alert('Please enter your email address to receive the voucher!');
      return;
    }

    // Check if the user has sufficient points for the selected reward
    if (points < offer.pointsCost) {
      alert('You do not have sufficient points for this reward!');
      return;
    }

    try {
      setLoading(true);

      // Web3Forms Clean JSON Payload
      const formData = {
        access_key: "086142c1-1ea1-4e42-9ddd-e2aa7c064067",
        subject: `🎉 LifePulse Reward Unlocked: ${offer.title}`,
        from_name: "LifePulse Rewards System",
        message: `A reward has been successfully redeemed!\n\nDonor Email: ${donorEmail}\nReward: ${offer.title}\nPartner Lab: ${offer.partner}\nPoints Deducted: ${offer.pointsCost} PTS\nVoucher Code: LP-VOUCHER-${Math.floor(100000 + Math.random() * 900000)}\n\nShow this code at the lab counter.`
      };

      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to send voucher email.');
      }

      setPoints(points - offer.pointsCost);
      alert(`🎉 Success! ${offer.title} has been redeemed and the voucher has been successfully sent to your email (${donorEmail})!`);
      setDonorEmail('');

    } catch (error) {
      console.error('Web3Forms Error:', error);
      alert('Error sending email: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full px-6 py-6 space-y-6 text-[#5A1827] min-h-screen bg-[#FAF9F6] font-sans">
      
      {/* Header Section */}
      <div className="bg-white border-2 border-[#5A1827]/30 rounded-2xl p-6 shadow-md flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <span className="px-3.5 py-1 bg-[#E5C158]/20 border border-[#E5C158] text-[#7A6305] font-bold text-xs rounded-full uppercase tracking-wider">
            Gamification & Rewards Passport
          </span>
          <h2 className="text-3xl font-black text-[#5A1827] flex items-center gap-2.5 mt-2">
            <Award className="text-[#E5C158] w-8 h-8 fill-[#E5C158]/30" /> Donor Rewards Hub
          </h2>
          <p className="text-sm text-slate-600 font-medium mt-1">
            Earn points with every donation and unlock health lab discounts delivered directly to your email.
          </p>
        </div>

        {/* Live Points Counter */}
        <div className="bg-[#5A1827] text-white px-6 py-4 rounded-2xl shadow-inner border-2 border-[#E5C158]/40 text-center min-w-[160px]">
          <p className="text-xs font-bold text-[#E5C158] uppercase tracking-wider">Your Balance</p>
          <p className="text-3xl font-black flex items-center justify-center gap-1.5 mt-1">
            <Sparkles className="w-6 h-6 text-[#E5C158]" /> {points} PTS
          </p>
        </div>
      </div>

      {/* Email Input Card */}
      <div className="bg-white border-2 border-[#5A1827]/30 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row items-center gap-4">
        <div className="p-3 bg-[#E5C158]/20 text-[#7A6305] rounded-xl">
          <Mail className="w-6 h-6" />
        </div>
        <div className="flex-1 w-full">
          <label className="block text-xs font-black uppercase tracking-wider text-[#5A1827] mb-1">
            Enter Your Real Email Address for Voucher Delivery:
          </label>
          <input
            type="email"
            value={donorEmail}
            onChange={(e) => setDonorEmail(e.target.value)}
            placeholder="e.g. hafsasohail557@gmail.com"
            className="w-full px-4 py-2.5 rounded-xl border-2 border-[#5A1827]/20 focus:border-[#5A1827] outline-none text-sm font-semibold bg-[#FAF9F6]"
          />
        </div>
      </div>

      {/* Stats Cards Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white border-2 border-[#5A1827]/20 p-5 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="p-3 bg-[#E5C158]/20 text-[#7A6305] rounded-xl"><ShieldCheck className="w-7 h-7" /></div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase">Badge Level</p>
            <p className="text-lg font-black text-[#5A1827]">Elite Lifesaver</p>
          </div>
        </div>
        <div className="bg-white border-2 border-[#5A1827]/20 p-5 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="p-3 bg-rose-100 text-rose-700 rounded-xl"><Star className="w-7 h-7" /></div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase">Donation Milestone</p>
            <p className="text-lg font-black text-[#5A1827]">4 Successful Drives</p>
          </div>
        </div>
        <div className="bg-white border-2 border-[#5A1827]/20 p-5 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-100 text-amber-800 rounded-xl"><Zap className="w-7 h-7" /></div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase">Partner Labs</p>
            <p className="text-lg font-black text-[#5A1827]">3 Active Networks</p>
          </div>
        </div>
      </div>

      {/* Redeemable Rewards Section */}
      <div className="bg-white border-2 border-[#5A1827]/30 rounded-2xl p-6 shadow-md space-y-4">
        <h3 className="text-xl font-black text-[#5A1827] flex items-center gap-2">
          <Gift className="text-rose-700 w-6 h-6" /> Partner Diagnostic & Lab Discounts
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-4">
          {rewardOffers.map((offer) => (
            <div key={offer.id} className="border-2 border-[#5A1827]/20 rounded-2xl p-5 flex flex-col justify-between bg-[#FAF9F6] space-y-4">
              <div>
                <span className="text-[11px] font-bold bg-[#E5C158]/30 text-[#7A6305] px-2.5 py-1 rounded-md">
                  {offer.partner}
                </span>
                <h4 className="font-black text-[#5A1827] text-base mt-3">{offer.title}</h4>
              </div>
              
              <div className="flex items-center justify-between pt-3 border-t border-[#5A1827]/10">
                <span className="text-sm font-black text-rose-700">{offer.pointsCost} Points</span>
                <button
                  onClick={() => handleRedeem(offer)}
                  disabled={loading}
                  className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-[#5A1827] hover:bg-[#3D101A] text-white cursor-pointer shadow-md transition"
                >
                  {loading ? 'Processing...' : 'Redeem Offer'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default GamificationRewards;