import React, { useState } from 'react';
import { HelpCircle, ChevronDown } from 'lucide-react';


const FAQPage = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      q: "How fast is a quick blood request processed?",
      a: "Once submitted via our Quick Request form, your requisition is instantly synced to the Admin Dashboard and nearby registered donors."
    },
    {
      q: "Who is eligible to donate blood?",
      a: "Any healthy individual between 18 and 65 years of age, weighing at least 50kg, and clear of blood-borne illnesses can donate."
    },
    {
      q: "How often can I donate blood?",
      a: "Whole blood donation can be done once every 3 months (90 days) for male donors and 4 months for female donors."
    },
    {
      q: "Is LifePulse free for emergency patients?",
      a: "Yes, LifePulse is a non-profit open initiative connecting donors directly with hospital care units without any fee."
    }
  ];

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="bg-[#FAF9F6] min-h-screen text-[#5A1827] flex flex-col justify-between selection:bg-[#E5C158] selection:text-[#5A1827]">
      <div className="py-20 max-w-4xl mx-auto px-6 w-full space-y-10">
        
        {/* Modern Centered Banner Layout matching LifePulse theme */}
        <div className="bg-gradient-to-br from-[#5A1827] to-[#4A121F] border-2 border-[#E5C158]/30 rounded-[2rem] p-10 text-center space-y-4 shadow-2xl">
          <div className="inline-flex p-4 bg-[#E5C158]/10 border border-[#E5C158]/30 rounded-2xl text-[#E5C158] shadow-inner">
            <HelpCircle className="w-8 h-8" />
          </div>
          <div className="space-y-2 max-w-xl mx-auto">
            <span className="text-xs font-black text-[#E5C158] uppercase tracking-widest bg-white/10 px-3 py-1 rounded-full border border-white/10 inline-block">Support Center</span>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white uppercase">Frequently Asked Questions</h1>
            <p className="text-xs sm:text-sm text-rose-100 font-bold">Everything you need to know about blood donation & platform usage.</p>
          </div>
        </div>

        {/* Clean Stacked Layout */}
        <div className="grid grid-cols-1 gap-4">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div 
                key={index} 
                className={`border-2 rounded-2xl overflow-hidden transition-all duration-300 shadow-lg ${
                  isOpen 
                    ? 'bg-white border-[#5A1827]/40 shadow-xl' 
                    : 'bg-white/80 border-[#5A1827]/15 hover:border-[#5A1827]/30'
                }`}
              >
                <button
                  onClick={() => toggleFAQ(index)}
                  className="w-full text-left p-6 flex justify-between items-center gap-4 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-mono font-black text-[#5A1827] bg-[#E5C158]/20 px-3 py-1.5 rounded-xl border border-[#E5C158]/40">
                      0{index + 1}
                    </span>
                    <h3 className={`font-black text-sm sm:text-base tracking-wide ${isOpen ? 'text-[#5A1827]' : 'text-[#5A1827]/90'}`}>
                      {faq.q}
                    </h3>
                  </div>
                  
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
                    isOpen ? 'bg-[#5A1827] text-[#E5C158] shadow-md rotate-180 border border-[#E5C158]/30' : 'bg-[#FAF9F6] border border-[#5A1827]/20 text-[#5A1827]'
                  }`}>
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-6 pb-6 pt-2 border-t border-[#5A1827]/10 ml-14 mr-6">
                    <p className="text-slate-600 text-xs sm:text-sm font-medium leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
};

export default FAQPage;