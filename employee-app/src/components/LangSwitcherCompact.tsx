import React from 'react';
import { useTranslation } from '../context/LanguageContext';

export const LangSwitcherCompact: React.FC = () => {
  const { language, setLanguage } = useTranslation();

  return (
    <div className="flex gap-1.5">
      {(['ca', 'es', 'en'] as const).map((l) => (
        <button
          key={l}
          onClick={() => setLanguage(l)}
          className={`px-1.5 py-0.5 text-[10px] font-bold rounded transition-colors ${
            language === l ? 'bg-[#22d3ee] text-[#07090f]' : 'text-[#8b9bb8] hover:text-[#f0f4fc]'
          }`}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
};
