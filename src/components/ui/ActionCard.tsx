"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Pencil, X, User, Building2, CalendarCheck, AlertTriangle, ChevronLeft, ChevronRight, Clock, Mail } from "lucide-react";
import type { ActionCard } from "@/lib/extraction-engine";
import { hasMissingRequiredFields, normalizeDate, generateEmailDraft, type Category, type EmailDraftParams } from "@/lib/extraction-engine";
import { toast } from "sonner";

interface Props {
  card: ActionCard;
  // When true, card collapses away (Stack controls the animation)
  collapsing?: boolean;
  onConfirm: (card: ActionCard, edited: Record<string, string>) => void;
  onDismiss: (id: string) => void;
}

// Calendar Task type for collision detection
interface ExistingTask {
  id: string;
  title: string;
  time?: string;
  date: string;
}

// Time slots for visual representation
const TIME_SLOTS = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"];

export const CARD_META: Record<string, { icon: React.ElementType; label: string; color: string; glow: string }> = {
  contact: { icon: User,          label: "Kontakt klienta",  color: "#6366f1", glow: "rgba(99,102,241,0.45)" },
  company: { icon: Building2,     label: "Firemný kontakt",  color: "#8b5cf6", glow: "rgba(139,92,246,0.45)" },
  task:    { icon: CalendarCheck, label: "Termín stretnutia", color: "#22d3ee", glow: "rgba(34,211,238,0.40)" },
};

// Slovak field labels mapping
const FIELD_LABELS: Record<string, string> = {
  "Meno": "Meno klienta",
  "Email": "E-mail",
  "Telefón": "Telefónne číslo",
  "Poznámka": "Poznámka k biznisu",
  "Kategória": "Kategória",
  "Úloha": "Názov úlohy",
  "Dátum": "Dátum",
  "Čas": "Čas",
};

export default function ActionCardUI({ card, collapsing = false, onConfirm, onDismiss }: Props) {
  const [editing, setEditing] = useState(false);
  const [fields, setFields] = useState<Record<string, string>>(card.fields);
  const [isExpanded, setIsExpanded] = useState(false); // Compact accordion state

  // Interactive calendar state for task cards
  const [selectedDate, setSelectedDate] = useState<string>(fields["Dátum"] || new Date().toISOString().split('T')[0]);
  const [selectedTime, setSelectedTime] = useState<string>(fields["Čas"] || "10:00");
  const [existingTasks, setExistingTasks] = useState<ExistingTask[]>([]);

  const meta = CARD_META[card.type] ?? CARD_META.contact;
  const Icon = meta.icon;
  const isTaskCard = card.type === "task";
  const hasMoreFields = Object.keys(fields).length > 2; // Check if accordion needed
  
  // Fetch existing tasks for collision detection when date changes
  useEffect(() => {
    if (isTaskCard && selectedDate) {
      fetch(`/api/calendar/tasks?date=${selectedDate}`)
        .then(res => res.json())
        .then((tasks: ExistingTask[]) => {
          setExistingTasks(tasks.filter(t => t.date === selectedDate));
        })
        .catch(() => setExistingTasks([]));
    }
  }, [isTaskCard, selectedDate]);
  
  // Update fields when date/time changes
  useEffect(() => {
    if (isTaskCard) {
      setFields(prev => ({
        ...prev,
        "Dátum": selectedDate,
        "Čas": selectedTime
      }));
    }
  }, [isTaskCard, selectedDate, selectedTime]);
  
  // Navigation functions
  const navigateDay = (direction: number) => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + direction);
    setSelectedDate(date.toISOString().split('T')[0]);
  };
  
  const navigateTime = (direction: number) => {
    const [hours, minutes] = selectedTime.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes);
    date.setMinutes(date.getMinutes() + (direction * 30)); // 30 min increments
    const newTime = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    setSelectedTime(newTime);
  };
  
  // Check for collision
  const hasCollision = (time: string): boolean => {
    return existingTasks.some(task => {
      if (!task.time) return false;
      const [taskHour, taskMin] = task.time.split(':').map(Number);
      const [newHour, newMin] = time.split(':').map(Number);
      // Consider it a collision if within 30 minutes
      const taskMinutes = taskHour * 60 + taskMin;
      const newMinutes = newHour * 60 + newMin;
      return Math.abs(taskMinutes - newMinutes) < 30;
    });
  };
  
  const collisionDetected = hasCollision(selectedTime);

  return (
    <AnimatePresence mode="wait">
      {!collapsing && (
        <motion.div
          key="card"
          initial={{ opacity: 0, y: 10, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{
            opacity: 0,
            scale: 0.05,
            y: -24,
            filter: "blur(6px) brightness(3)",
            transition: { duration: 0.32, ease: [0.4, 0, 0.2, 1] },
          }}
          transition={{ duration: 0.22 }}
          className="rounded-2xl p-4 mt-1 mb-1 max-w-sm"
          style={{
            background: "transparent",
            border: `1px solid ${meta.color}28`,
          }}
        >
          {/* Compact Header with Accordion Toggle */}
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: `${meta.color}18`, border: `1px solid ${meta.color}35` }}>
              <Icon className="w-3 h-3" style={{ color: meta.color }} />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[0.7rem] font-bold tracking-wide block truncate" style={{ color: meta.color }}>
                {fields["Meno"] || fields["Úloha"] || meta.label}
              </span>
              {isTaskCard && (
                <span className="text-[0.6rem] block truncate" style={{ color: "#64748b" }}>
                  {new Date(selectedDate).toLocaleDateString('sk-SK', { weekday: 'short', day: 'numeric' })} · {selectedTime}
                </span>
              )}
            </div>

            {/* Validation Warning */}
            {hasMissingRequiredFields(card) && (
              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[0.6rem] font-medium"
                style={{ background: "rgba(239,68,68,0.12)", color: "#fca5a5" }}>
                <AlertTriangle className="w-2.5 h-2.5" />
                {card.missingRequiredFields?.includes("Meno") ? "Chýba meno" : "Chýba"}
              </div>
            )}

            {/* Expand/Collapse Toggle */}
            {hasMoreFields && (
              <button
                onClick={() => setIsExpanded(v => !v)}
                className="p-1 rounded hover:bg-white/10 transition-colors"
              >
                <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                  <ChevronLeft className="w-3.5 h-3.5 rotate-[-90deg]" style={{ color: "#94a3b8" }} />
                </motion.div>
              </button>
            )}

            <button onClick={() => onDismiss(card.id)} className="p-1 opacity-40 hover:opacity-80 transition-colors">
              <X className="w-3.5 h-3.5" style={{ color: "#94a3b8" }} />
            </button>
          </div>

          {/* Fields - Expandable */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="space-y-1.5 mt-3 mb-3">
                  {Object.entries(fields).map(([key, val]) => {
                    // Skip Dátum and Čas for task cards - they're shown in interactive calendar
                    if (isTaskCard && (key === "Dátum" || key === "Čas")) return null;

                    return (
                      <div key={key} className="flex items-center gap-2">
                        <span className="text-[0.6rem] w-16 flex-shrink-0 tracking-wider uppercase" style={{ color: "#475569" }}>{FIELD_LABELS[key] || key}</span>
                        {editing ? (
                          <input
                            className="flex-1 bg-transparent text-xs outline-none border-b py-0.5"
                            style={{ color: "#eef2ff", borderColor: `${meta.color}40`, caretColor: meta.color }}
                            value={val}
                            onChange={e => setFields(f => ({ ...f, [key]: e.target.value }))}
                          />
                        ) : (
                          <span className="text-xs font-medium truncate" style={{ color: "#cbd5e1" }}>{val || <span style={{ color: "#334155" }}>—</span>}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Compact Mini-Timeline for Task Cards - Mobile First */}
          {isTaskCard && isExpanded && (
            <div className="mt-2 mb-2 p-2.5 rounded-lg border border-white/10 bg-white/5">
              {/* Date Navigation */}
              <div className="flex items-center justify-between mb-2">
                <button onClick={() => navigateDay(-1)} className="p-1 rounded hover:bg-white/10">
                  <ChevronLeft className="w-3.5 h-3.5" style={{ color: "#94a3b8" }} />
                </button>
                <span className="text-[0.7rem] font-medium" style={{ color: "#cbd5e1" }}>
                  {new Date(selectedDate).toLocaleDateString('sk-SK', { weekday: 'short', day: 'numeric', month: 'short' })}
                </span>
                <button onClick={() => navigateDay(1)} className="p-1 rounded hover:bg-white/10">
                  <ChevronRight className="w-3.5 h-3.5" style={{ color: "#94a3b8" }} />
                </button>
              </div>

              {/* Mini Timeline - 3 hours before/after */}
              <div className="relative py-2">
                <div className="flex items-center justify-between">
                  {(() => {
                    const baseHour = parseInt(selectedTime.split(':')[0]);
                    const slots = [];
                    for (let i = -3; i <= 3; i++) {
                      const hour = baseHour + i;
                      if (hour >= 8 && hour <= 19) {
                        const timeStr = `${String(hour).padStart(2, '0')}:00`;
                        const isSelected = timeStr === selectedTime || (i === 0);
                        const collides = existingTasks.some(t => {
                          if (!t.time) return false;
                          const taskHour = parseInt(t.time.split(':')[0]);
                          return Math.abs(taskHour - hour) < 1;
                        });
                        slots.push({ hour, timeStr, isSelected, collides });
                      }
                    }
                    return slots.map((slot, idx) => (
                      <button
                        key={idx}
                        onClick={() => !slot.collides && setSelectedTime(slot.timeStr)}
                        className="flex flex-col items-center gap-1 transition-all duration-200"
                      >
                        {/* Dot or Line */}
                        <div
                          className="rounded-full transition-all duration-200"
                          style={{
                            width: slot.isSelected ? '12px' : slot.collides ? '8px' : '6px',
                            height: slot.isSelected ? '12px' : slot.collides ? '2px' : '6px',
                            borderRadius: slot.collides ? '1px' : '50%',
                            background: slot.isSelected ? meta.color : slot.collides ? '#ef4444' : 'rgba(255,255,255,0.3)',
                            boxShadow: slot.isSelected ? `0 0 8px ${meta.color}` : 'none',
                          }}
                        />
                        {/* Time label */}
                        {slot.isSelected && (
                          <span className="text-[0.6rem] font-medium" style={{ color: meta.color }}>
                            {slot.timeStr}
                          </span>
                        )}
                      </button>
                    ));
                  })()}
                </div>

                {/* Connection line */}
                <div className="absolute top-1/2 left-0 right-0 h-px bg-white/10 -translate-y-1/2 -z-10" />
              </div>

              {/* Quick time adjust */}
              <div className="flex gap-1 mt-2">
                {["-30m", "+30m"].map((label, i) => (
                  <button
                    key={label}
                    onClick={() => {
                      const [h, m] = selectedTime.split(':').map(Number);
                      const newMin = i === 0 ? m - 30 : m + 30;
                      const newHour = i === 0 ? (newMin < 0 ? h - 1 : h) : (newMin >= 60 ? h + 1 : h);
                      const finalMin = ((newMin % 60) + 60) % 60;
                      const finalHour = ((newHour % 24) + 24) % 24;
                      setSelectedTime(`${String(finalHour).padStart(2, '0')}:${String(finalMin).padStart(2, '0')}`);
                    }}
                    className="flex-1 py-1 rounded text-[0.65rem] font-medium transition-colors"
                    style={{ background: 'rgba(255,255,255,0.05)', color: '#94a3b8' }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2" style={{ borderTop: `1px solid rgba(255,255,255,0.06)` }}>
            <button
              onClick={() => {
                // Prevent confirm if required fields are missing
                if (hasMissingRequiredFields(card)) {
                  // Force edit mode so user can fill in missing fields
                  setEditing(true);
                  return;
                }
                onConfirm(card, fields);
              }}
              disabled={hasMissingRequiredFields(card) && !editing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ 
                background: hasMissingRequiredFields(card) ? "rgba(239,68,68,0.15)" : `${meta.color}20`, 
                border: hasMissingRequiredFields(card) ? "1px solid rgba(239,68,68,0.4)" : `1px solid ${meta.color}50`, 
                color: hasMissingRequiredFields(card) ? "#ef4444" : meta.color 
              }}
              onMouseEnter={e => {
                if (!hasMissingRequiredFields(card)) {
                  e.currentTarget.style.background = `${meta.color}35`;
                }
              }}
              onMouseLeave={e => {
                if (!hasMissingRequiredFields(card)) {
                  e.currentTarget.style.background = `${meta.color}20`;
                }
              }}
            >
              <Check className="w-3 h-3" /> 
              {hasMissingRequiredFields(card) ? "Doplniť povinné polia" : "Potvrdiť"}
            </button>
            <button
              onClick={() => setEditing(v => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-200"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.10)", color: "#64748b" }}
              onMouseEnter={e => (e.currentTarget.style.color = "#94a3b8")}
              onMouseLeave={e => (e.currentTarget.style.color = "#64748b")}
            >
              <Pencil className="w-3 h-3" /> {editing ? "Hotovo" : "Upraviť"}
            </button>
            
            {/* Email draft button for contact cards with email */}
            {(card.type === "contact" || card.type === "company") && fields["Email"] && (
              <button
                onClick={async () => {
                  try {
                    const rawCategory = fields["Kategória"]?.toLowerCase() || "";
                    const validIntent: EmailDraftParams["intent"] = 
                      rawCategory === "hypo" ? "hypo" :
                      rawCategory === "poistenie" ? "poistenie" :
                      rawCategory === "investície" ? "investicie" : "default";
                    const draft = await generateEmailDraft({
                      recipientName: fields["Meno"] || fields["Firma"] || "Klient",
                      recipientEmail: fields["Email"],
                      context: fields["Poznámka"] || "",
                      intent: validIntent,
                    });
                    
                    // Copy to clipboard
                    const emailText = `Predmet: ${draft.subject}\n\n${draft.body}`;
                    navigator.clipboard.writeText(emailText);
                    toast.success("Email skopírovaný do schránky");
                  } catch {
                    toast.error("Nepodarilo sa vygenerovať email");
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-200"
                style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.25)", color: "#818cf8" }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(99,102,241,0.2)")}
                onMouseLeave={e => (e.currentTarget.style.background = "rgba(99,102,241,0.1)")}
              >
                <Mail className="w-3 h-3" /> Email
              </button>
            )}
          </div>
          
          {/* Processing status — subtle indicator when AI is still working */}
          {card.extractionDebug && card.extractionDebug.confidence === 0 && !fields["Meno"] && (
            <div className="mt-2 pt-2 border-t border-white/5 text-[0.6rem] font-medium opacity-50"
              style={{ color: "#94a3b8" }}>
              Čaká sa na doplnenie údajov...
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
