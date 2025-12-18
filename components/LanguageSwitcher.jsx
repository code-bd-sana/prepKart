'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useState } from 'react';

export default function LanguageSwitcher({ currentLocale }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isChanging, setIsChanging] = useState(false);

  const switchLanguage = (newLocale) => {
    setIsChanging(true);
    
    // Remove current locale from pathname
    const pathWithoutLocale = pathname.replace(/^\/(en|fr)/, '') || '/';
    
    // Navigate to new locale
    router.push(`/${newLocale}${pathWithoutLocale}`);
    
    // Simulate loading state
    setTimeout(() => setIsChanging(false), 500);
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => switchLanguage('en')}
        className={`px-3 py-1 rounded text-sm ${currentLocale === 'en' 
          ? 'bg-blue-600 text-white' 
          : 'bg-gray-100 hover:bg-gray-200 text-gray-800'}`}
        disabled={isChanging}
      >
        English
      </button>
      <button
        onClick={() => switchLanguage('fr')}
        className={`px-3 py-1 rounded text-sm ${currentLocale === 'fr' 
          ? 'bg-blue-600 text-white' 
          : 'bg-gray-100 hover:bg-gray-200 text-gray-800'}`}
        disabled={isChanging}
      >
        Français
      </button>
    </div>
  );
}