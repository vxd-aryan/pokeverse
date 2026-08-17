"use client";

import './globals.css'
import { useUserStore } from '@/store/userStore'
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// --- Explore Dropdown Component ---
function ExploreDropdown() {
  const [isOpen, setIsOpen] = useState(false);

  const exploreLinks = [
    { name: 'Regions', href: '/explore/regions' },
    { name: 'Pokémon by habitat', href: '/explore/habitat' },
    { name: 'Pokémon by type', href: '/explore/type' },
    { name: 'Legendary Pokémon', href: '/explore/legendary' },
    { name: 'Mythical Pokémon', href: '/explore/mythical' },
    { name: 'Evolution Trees', href: '/explore/evolution' },
    { name: 'Moves & Attacks', href: '/explore/moves' },
    { name: 'Abilities Database', href: '/explore/abilities' },
    { name: "Items Database", href: "/explore/items" },
  ];

  return (
    <div 
      className="relative inline-block text-left z-50"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button className="flex items-center gap-2 text-slate-300 hover:text-blue-400 font-black uppercase tracking-widest text-sm transition-colors focus:outline-none py-2">
        <span>🧭</span>
        Explore
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-0 w-56 origin-top-left bg-slate-800 rounded-md shadow-xl ring-1 ring-slate-700 border border-slate-700 focus:outline-none overflow-hidden">
          <div className="py-1 flex flex-col" role="menu" aria-orientation="vertical">
            {exploreLinks.map((link) => (
              <Link 
                key={link.name} 
                href={link.href}
                className="block px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                role="menuitem"
              >
                {link.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// --- New User Profile Dropdown Component ---
function UserProfileDropdown({ user, logout }: { user: any, logout: () => void }) {
  const [isOpen, setIsOpen] = useState(false);

  const handleDeleteAccount = async () => {
    if (!confirm("Are you absolutely sure you want to delete your profile? This cannot be undone.")) {
      return;
    }

    const token = localStorage.getItem('trainer_token');
    
    try {
      const res = await fetch(`https://pokeverse-backend-0o6t.onrender.com/api/users/me`, { 
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (res.ok) {
        alert("Profile permanently deleted.");
      } else {
        console.warn("Account was missing on server, cleaning up local storage anyway.");
      }
    } catch (err) {
      console.error("Could not contact server to delete account:", err);
    } finally {
      logout();
    }
  };

  return (
    <div 
      className="relative inline-block text-left z-50 cursor-pointer"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <div className="flex items-center gap-3 p-1 pr-3 rounded-full hover:bg-slate-700/50 transition-colors">
        {user && (
          <>
            <div className="h-12 w-12 rounded-full bg-slate-700 border-2 border-red-500 flex items-center justify-center overflow-hidden shadow-md">
              <span className="text-xl font-bold text-red-500">{user.username ? user.username.charAt(0) : 'T'}</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-wide leading-tight">
                {user.username}
              </h1>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                {user.title || 'Novice Trainer'}
              </p>
            </div>
          </>
        )}
      </div>

      {/* Account Menu */}
      {isOpen && user && (
        <div className="absolute left-0 mt-1 w-48 origin-top-left bg-slate-800 rounded-md shadow-xl ring-1 ring-slate-700 border border-slate-700 focus:outline-none overflow-hidden">
          <div className="py-1 flex flex-col" role="menu">
            <button 
              onClick={logout}
              className="w-full text-left px-4 py-2 text-sm font-bold text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
            >
              Sign Out
            </button>
            <button 
              onClick={handleDeleteAccount}
              className="w-full text-left px-4 py-2 text-sm font-bold text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
            >
              Delete Account
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Main Layout ---
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, setUser, clearUser } = useUserStore() as any; 
  const router = useRouter();
  
  const [mounted, setMounted] = useState(false);

  // 1. Initial Session Fetch
  useEffect(() => {
    setMounted(true);

    const token = localStorage.getItem('trainer_token');
    
    if (token && !user) {
      fetch('https://pokeverse-backend-0o6t.onrender.com/api/users/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      .then(res => {
        if (res.ok) return res.json();
        throw new Error("Session expired");
      })
      .then(userData => {
        setUser(userData);
      })
      .catch(err => {
        console.error("Failed to restore session:", err);
        localStorage.removeItem('trainer_token');
        clearUser();
      });
    }
  }, [user, setUser, clearUser]);

  // 2. Global Event Listener for Battle XP Updates
  useEffect(() => {
    const handleXpUpdate = (event: CustomEvent<{ xpChange: number }>) => {
      if (!user) return; // Ignore if not logged in

      let newXp = user.current_xp + event.detail.xpChange;
      let newLevel = user.level;

      // Prevent dropping below 0 XP
      if (newXp < 0) {
        newXp = 0;
      }

      // Handle Level Up logic (Dynamic threshold: Level * 100)
      let currentThreshold = newLevel * 100;
      while (newXp >= currentThreshold) {
        newLevel += 1;
        newXp -= currentThreshold;
        currentThreshold = newLevel * 100; 
      }

      // Update the user store
      setUser({
        ...user,
        current_xp: newXp,
        level: newLevel
      });
    };

    window.addEventListener('update-trainer-xp', handleXpUpdate as EventListener);
    
    // Cleanup listener on unmount
    return () => {
      window.removeEventListener('update-trainer-xp', handleXpUpdate as EventListener);
    };
  }, [user, setUser]); // Re-bind if user object changes

  const logout = () => {
    localStorage.clear();
    clearUser();
    window.location.href = '/';
  };

  const xpThreshold = user ? user.level * 100 : 100;
  const currentXP = user ? user.current_xp : 0;
  const currentLevel = user ? user.level : 1;
  const xpPercentage = Math.min(100, Math.max(0, (currentXP / xpThreshold) * 100));

  return (
    <html lang="en">
      <body>
        {mounted && user && (
          <nav className="sticky top-0 z-50 bg-slate-800 border-b-4 border-slate-700 shadow-lg">
            <div className="max-w-6xl mx-auto px-4 py-3">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                
                {/* Left Side: User Info & Navigation */}
                <div className="flex flex-wrap items-center gap-6">
                  
                  <UserProfileDropdown user={user} logout={logout} />

                  {/* Desktop Navigation Tabs */}
                  <div className="hidden sm:flex items-center gap-6 border-l border-slate-600 pl-6">
                    <ExploreDropdown />
                    
                    <Link 
                      href="/dashboard" 
                      className="flex items-center gap-2 text-slate-300 hover:text-blue-400 font-black uppercase tracking-widest text-sm transition-colors"
                    >
                      <span>🎛️</span>
                      Dashboard
                    </Link>

                    <Link 
                      href="/pokedex" 
                      className="flex items-center gap-2 text-slate-300 hover:text-blue-400 font-black uppercase tracking-widest text-sm transition-colors"
                    >
                      <span>📖</span>
                      Pokédex
                    </Link>

                    <Link 
                      href="/quiz" 
                      className="flex items-center gap-2 text-slate-300 hover:text-blue-400 font-black uppercase tracking-widest text-sm transition-colors"
                    >
                      <span>🎓</span>
                      Academy
                    </Link>

                    <Link 
                      href="/watch" 
                      className="flex items-center gap-2 text-slate-300 hover:text-blue-400 font-black uppercase tracking-widest text-sm transition-colors"
                    >
                      <span>📺</span>
                      Watch
                    </Link>

                    {/* BATTLE ARENA LINK */}
                    <Link 
                      href="/battle" 
                      className="flex items-center gap-2 text-red-400 hover:text-red-300 font-black uppercase tracking-widest text-sm transition-colors"
                    >
                      <span>⚔️</span>
                      Battle
                    </Link>
                  </div>
                </div>

                {/* Right Side: Level & XP Progress */}
                <div className="flex-1 max-w-md flex items-center gap-4 opacity-90">
                  <div className="flex flex-col items-center justify-center bg-slate-900 rounded-lg px-3 py-1 border border-slate-600">
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Level</span>
                    <span className="text-xl font-black text-yellow-400 leading-none">{currentLevel}</span>
                  </div>

                  <div className="flex-1">
                    <div className="flex justify-between text-xs font-bold text-slate-300 mb-1">
                      <span>XP: {currentXP}</span>
                      <span>{xpThreshold} XP</span>
                    </div>
                    <div className="h-4 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-700 shadow-inner">
                      <div 
                        className="h-full bg-yellow-400 bg-stripes animate-stripes transition-all duration-700 ease-out"
                        style={{ width: `${xpPercentage}%` }}
                      />
                    </div>
                  </div>
                </div>
                
                {/* Mobile Navigation Tab */}
                <div className="sm:hidden flex flex-wrap items-center gap-4 w-full mt-2">
                   <ExploreDropdown />
                   <Link 
                     href="/dashboard" 
                     className="flex items-center gap-2 text-slate-300 hover:text-blue-400 font-black uppercase tracking-widest text-sm transition-colors"
                   >
                     <span>🎛️</span>
                     Dashboard
                   </Link>
                   <Link 
                      href="/pokedex" 
                      className="flex items-center gap-2 text-slate-300 hover:text-blue-400 font-black uppercase tracking-widest text-sm transition-colors"
                    >
                      <span>📖</span>
                      Pokédex
                    </Link>
                    <Link 
                      href="/quiz" 
                      className="flex items-center gap-2 text-slate-300 hover:text-blue-400 font-black uppercase tracking-widest text-sm transition-colors"
                    >
                      <span>🎓</span>
                      Academy
                    </Link>
                    <Link 
                      href="/watch" 
                      className="flex items-center gap-2 text-slate-300 hover:text-blue-400 font-black uppercase tracking-widest text-sm transition-colors"
                    >
                      <span>📺</span>
                      Watch
                    </Link>

                    {/* BATTLE ARENA LINK - MOBILE */}
                    <Link 
                      href="/battle" 
                      className="flex items-center gap-2 text-red-400 hover:text-red-300 font-black uppercase tracking-widest text-sm transition-colors"
                    >
                      <span>⚔️</span>
                      Battle
                    </Link>
                </div>

              </div>
            </div>
          </nav>
        )}

        {/* Main Content Area */}
        <main className="max-w-5xl mx-auto p-4 mt-6">
          {children}
        </main>
      </body>
    </html>
  )
}