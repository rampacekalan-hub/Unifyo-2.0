"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Plus, Clock, MapPin, Phone } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";

interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  duration: number;
  type: "meeting" | "call" | "task" | "reminder";
  contact?: string;
  location?: string;
  description?: string;
}

const D = {
  indigo: "#6366f1",
  sky: "#22d3ee",
  violet: "#8b5cf6",
  emerald: "#10b981",
  amber: "#f59e0b",
  rose: "#f43f5e",
  indigoBorder: "rgba(99,102,241,0.22)",
  indigoDim: "rgba(99,102,241,0.08)",
  text: "#eef2ff",
  muted: "#94a3b8",
  mutedDark: "#64748b",
};

const MONTHS = ["Január", "Február", "Marec", "Apríl", "Máj", "Jún", "Júl", "August", "September", "Október", "November", "December"];

const MOCK_EVENTS: Event[] = [
  { id: "1", title: "Stretnutie s Petrom", date: "2024-01-16", time: "14:00", duration: 60, type: "meeting", contact: "Peter Vittek", location: "Kancelária", description: "Konzultácia ohľadom hypotéky" },
  { id: "2", title: "Telefonát Mária", date: "2024-01-17", time: "10:30", duration: 30, type: "call", contact: "Mária Nováková" },
  { id: "3", title: "Deadline dokumentácie", date: "2024-01-19", time: "16:00", duration: 120, type: "task" },
];

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const startingDay = firstDay === 0 ? 6 : firstDay - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  const getEventsForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return MOCK_EVENTS.filter(e => e.date === dateStr);
  };

  const getTypeColor = (type: Event["type"]) => {
    switch (type) {
      case "meeting": return "#6366f1";
      case "call": return "#10b981";
      case "task": return "#f59e0b";
      case "reminder": return "#f43f5e";
    }
  };

  const getTypeLabel = (type: Event["type"]) => {
    switch (type) {
      case "meeting": return "Stretnutie";
      case "call": return "Hovor";
      case "task": return "Úloha";
      case "reminder": return "Pripomienka";
    }
  };

  return (
    <AppLayout title="Kalendár">
      <div className="flex h-full p-6 gap-6">
        {/* Calendar */}
        <div className="flex-1">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
                className="p-2 rounded-xl transition-colors hover:bg-white/10"
                style={{ background: D.indigoDim, border: `1px solid ${D.indigoBorder}` }}
              >
                <ChevronLeft className="w-5 h-5" style={{ color: D.text }} />
              </button>
              <h2 className="text-2xl font-bold" style={{ color: D.text }}>
                {MONTHS[month]} {year}
              </h2>
              <button 
                onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
                className="p-2 rounded-xl transition-colors hover:bg-white/10"
                style={{ background: D.indigoDim, border: `1px solid ${D.indigoBorder}` }}
              >
                <ChevronRight className="w-5 h-5" style={{ color: D.text }} />
              </button>
            </div>
            <button className="px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-medium" style={{ background: D.indigo, color: "white" }}>
              <Plus className="w-4 h-4" />
              Nová udalosť
            </button>
          </div>

          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {["Po", "Ut", "St", "Št", "Pi", "So", "Ne"].map((day) => (
              <div key={day} className="text-center py-2 text-sm font-medium" style={{ color: D.muted }}>
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Empty cells */}
            {Array.from({ length: startingDay }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square rounded-xl" style={{ background: "rgba(99,102,241,0.02)", border: `1px solid ${D.indigoBorder}` }} />
            ))}
            
            {/* Days */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const events = getEventsForDay(day);
              const isToday = today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
              
              return (
                <motion.div
                  key={day}
                  className="aspect-square rounded-xl p-2 cursor-pointer relative overflow-hidden"
                  style={{
                    background: isToday ? "rgba(99,102,241,0.2)" : "rgba(99,102,241,0.05)",
                    border: `1px solid ${isToday ? D.indigo : D.indigoBorder}`,
                  }}
                  whileHover={{ background: "rgba(99,102,241,0.1)" }}
                  onClick={() => events.length > 0 && setSelectedEvent(events[0])}
                >
                  <span 
                    className="text-sm font-medium"
                    style={{ color: isToday ? D.indigo : D.text }}
                  >
                    {day}
                  </span>
                  
                  {/* Events */}
                  <div className="mt-1 space-y-1">
                    {events.slice(0, 2).map((event) => (
                      <div
                        key={event.id}
                        className="text-[10px] truncate px-1 py-0.5 rounded"
                        style={{ background: getTypeColor(event.type) + "40", color: getTypeColor(event.type) }}
                      >
                        {event.time}
                      </div>
                    ))}
                    {events.length > 2 && (
                      <div className="text-[10px]" style={{ color: D.muted }}>+{events.length - 2}</div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Event Detail Panel */}
        <div className="w-[320px] rounded-2xl p-5" style={{ background: "rgba(99,102,241,0.05)", border: `1px solid ${D.indigoBorder}` }}>
          <h3 className="font-semibold mb-4" style={{ color: D.text }}>Detail udalosti</h3>
          
          {selectedEvent ? (
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: getTypeColor(selectedEvent.type) + "30" }}
                >
                  <div className="w-3 h-3 rounded-full" style={{ background: getTypeColor(selectedEvent.type) }} />
                </div>
                <div>
                  <h4 className="font-medium" style={{ color: D.text }}>{selectedEvent.title}</h4>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: getTypeColor(selectedEvent.type) + "30", color: getTypeColor(selectedEvent.type) }}>
                    {getTypeLabel(selectedEvent.type)}
                  </span>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2" style={{ color: D.muted }}>
                  <Clock className="w-4 h-4" />
                  <span>{selectedEvent.date} o {selectedEvent.time}</span>
                </div>
                {selectedEvent.duration && (
                  <div className="flex items-center gap-2" style={{ color: D.muted }}>
                    <Clock className="w-4 h-4" />
                    <span>{selectedEvent.duration} minút</span>
                  </div>
                )}
                {selectedEvent.location && (
                  <div className="flex items-center gap-2" style={{ color: D.muted }}>
                    <MapPin className="w-4 h-4" />
                    <span>{selectedEvent.location}</span>
                  </div>
                )}
              </div>

              {selectedEvent.description && (
                <div className="p-3 rounded-xl text-sm" style={{ background: D.indigoDim, border: `1px solid ${D.indigoBorder}`, color: D.text }}>
                  {selectedEvent.description}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm" style={{ background: D.indigoDim, border: `1px solid ${D.indigoBorder}`, color: D.text }}>
                  <Phone className="w-4 h-4" />
                  Zavolať
                </button>
                <Link href="/crm" className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm" style={{ background: D.indigo, color: "white" }}>
                  Kontakt
                </Link>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center" style={{ background: D.indigoDim, border: `1px solid ${D.indigoBorder}` }}>
                <Clock className="w-8 h-8" style={{ color: D.mutedDark }} />
              </div>
              <p className="text-sm" style={{ color: D.muted }}>Vyberte udalosť pre zobrazenie detailov</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
