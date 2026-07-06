"use client";

import { useState } from 'react';
import { POKEMON_TIMELINE, TimelineEntry } from '@/lib/animeData';
import Image from 'next/image';

export default function TimelinePage() {
  const [selectedEvent, setSelectedEvent] = useState<TimelineEntry | null>(null);

  return (
    <div className="p-4 md:p-8 animate-in fade-in duration-300 min-h-screen relative">
      
      {/* --- HEADER --- */}
      <div className="mb-16 border-b-2 border-slate-800 pb-6 max-w-4xl mx-auto text-center md:text-left flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.6)]">
              <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-white uppercase tracking-wider">
              Continuity Map
            </h2>
          </div>
          <p className="text-slate-400 text-sm mt-2 font-mono">
            // A chronological archive of Ash Ketchum's journey.
          </p>
        </div>
        <div className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 font-mono text-xs text-blue-400 shadow-inner">
          STATUS: <span className="text-emerald-400 font-bold">ONLINE</span>
        </div>
      </div>

      {/* --- THE VISUAL TIMELINE TREE --- */}
      <div className="relative max-w-4xl mx-auto pl-8 md:pl-0 mt-8">
        <div className="absolute left-[15px] md:left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-red-500 via-blue-500 to-slate-900 transform md:-translate-x-1/2 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.3)]" />

        <div className="space-y-16">
          {POKEMON_TIMELINE.map((event, idx) => {
            const isEven = idx % 2 === 0;

            return (
              <div key={idx} className={`relative flex flex-col md:flex-row items-center group ${isEven ? 'md:flex-row-reverse' : ''}`}>
                
                {/* NODE INDICATOR */}
                <div className="absolute left-[-21px] md:left-1/2 top-8 w-8 h-8 bg-slate-900 border-4 border-slate-300 rounded-full z-10 transform md:-translate-x-1/2 flex flex-col overflow-hidden group-hover:border-blue-400 group-hover:shadow-[0_0_15px_rgba(59,130,246,0.8)] transition-all duration-300">
                  <div className="h-1/2 bg-red-500 w-full group-hover:bg-blue-500 transition-colors"></div>
                  <div className="h-1/2 bg-white w-full"></div>
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-slate-900 rounded-full border border-slate-300 group-hover:bg-white transition-colors"></div>
                </div>

                {/* CONTENT CARD */}
                <div className="w-full md:w-[45%]">
                  <div 
                    onClick={() => setSelectedEvent(event)}
                    className="cursor-pointer bg-slate-900 border-2 border-slate-800 rounded-2xl shadow-xl overflow-hidden group-hover:border-blue-500 group-hover:-translate-y-1 transition-all duration-300"
                  >
                    
                    {/* Card Image Banner (Cover) */}
                    <div className="relative h-48 sm:h-56 w-full bg-slate-800 border-b-2 border-slate-800 group-hover:border-blue-500 overflow-hidden transition-colors">
                      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#3b82f6 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
                      <img 
                        src={event.image || '/images/timeline/placeholder.jpg'} 
                        alt={event.title}
                        className="absolute inset-0 w-full h-full object-cover object-center opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/20 to-transparent" />
                      <div className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-sm border border-slate-600 rounded-lg px-3 py-1 flex items-center gap-2">
                         <span className="text-[10px] font-mono font-black uppercase text-blue-400">Date</span>
                         <span className="text-xs font-bold text-white tracking-wide">{event.dateRange}</span>
                      </div>
                    </div>

                    {/* Card Text Content */}
                    <div className="p-6 relative">
                      <div className="absolute top-0 right-4 w-12 h-1 bg-blue-500/20 rounded-b-md" />
                      <div className="absolute top-0 right-10 w-4 h-1 bg-blue-500/40 rounded-b-md" />

                      <h3 className="text-xl font-black text-white group-hover:text-blue-400 transition-colors mb-2 uppercase tracking-wide">
                        {event.title}
                      </h3>
                      
                      <p className="text-sm text-slate-400 leading-relaxed line-clamp-2">
                        {event.description}
                      </p>

                      <div className="mt-4 pt-4 border-t border-slate-800/50 flex items-center justify-between">
                        <span className="text-[10px] font-mono text-slate-500 uppercase flex items-center gap-2">
                          <span className="text-blue-400">►</span> CLICK TO EXPAND
                        </span>
                        <div className="flex gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-700 group-hover:bg-blue-500 transition-colors delay-75"></span>
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-700 group-hover:bg-blue-400 transition-colors delay-100"></span>
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-700 group-hover:bg-blue-300 transition-colors delay-150"></span>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>

                <div className="hidden md:block w-[10%]"></div>
              </div>
            );
          })}
        </div>
      </div>

      {/* --- POKÉDEX MODAL OVERLAY --- */}
      {selectedEvent && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setSelectedEvent(null)}
        >
          {/* Modal Container */}
          <div 
            className="w-full max-w-2xl max-h-[90vh] flex flex-col bg-slate-900 border-4 border-red-500 rounded-3xl overflow-hidden shadow-[0_0_40px_rgba(239,68,68,0.3)] animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            
            {/* Pokédex Header */}
            <div className="bg-red-500 px-6 py-4 flex justify-between items-center border-b-4 border-red-700 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-sky-400 rounded-full border-4 border-slate-200 shadow-[inset_0_0_10px_rgba(0,0,0,0.5)] flex items-center justify-center">
                  <div className="w-3 h-3 bg-white rounded-full opacity-60 absolute top-2 left-2" />
                </div>
                <div className="w-4 h-4 bg-red-400 rounded-full border-2 border-red-800" />
                <div className="w-4 h-4 bg-yellow-400 rounded-full border-2 border-yellow-800" />
                <div className="w-4 h-4 bg-green-400 rounded-full border-2 border-green-800" />
              </div>
              
              <button 
                onClick={() => setSelectedEvent(null)}
                className="w-8 h-8 flex items-center justify-center bg-red-700 hover:bg-red-800 text-white font-black rounded-full transition-colors shadow-inner"
                title="Close"
              >
                ✕
              </button>
            </div>

            {/* Modal Content Body (Scrollable) */}
            <div className="p-2 bg-slate-800 overflow-y-auto">
              <div className="bg-slate-300 p-4 rounded-xl border-b-8 border-slate-400 h-full flex flex-col">
                
                {/* Main Screen (Image) - Changed to object-contain */}
                <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden border-4 border-slate-700 mb-4 shadow-inner shrink-0 flex items-center justify-center">
                  <img 
                    src={selectedEvent.image || '/images/timeline/placeholder.jpg'} 
                    alt={selectedEvent.title}
                    className="absolute inset-0 w-full h-full object-contain" 
                  />
                  {/* Scanline effect overlay */}
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0),rgba(255,255,255,0)_50%,rgba(0,0,0,0.1)_50%,rgba(0,0,0,0.1))] bg-[length:100%_4px] pointer-events-none" />
                </div>

                {/* Data Display */}
                <div className="bg-slate-900 rounded-lg p-4 border-2 border-slate-700 flex-grow">
                  <h2 className="text-2xl font-black text-white uppercase tracking-wider mb-1">
                    {selectedEvent.title}
                  </h2>
                  <div className="inline-block bg-blue-500/20 text-blue-400 font-mono text-xs px-2 py-1 rounded border border-blue-500/40 mb-4">
                    {selectedEvent.dateRange}
                  </div>
                  <p className="text-slate-300 text-sm md:text-base leading-relaxed">
                    {selectedEvent.description}
                  </p>
                </div>
                
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}