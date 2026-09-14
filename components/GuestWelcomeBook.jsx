"use client";

import React, { useState, useEffect, createContext, useContext } from "react";
import { createClient } from "../lib/supabase/client";
import {
  Home, Compass, Sparkles, Wifi, Clock, MapPin, Phone, X, Check,
  ChevronRight, ArrowLeft, Utensils, Waves, Landmark, ShoppingBag,
  Bike, Car, Star, KeyRound, Link2, MessageCircle, Send, Globe,
  CalendarDays, Briefcase, PartyPopper, UtensilsCrossed, Mountain, FileText,
  Instagram, Facebook, Music2, Link as LinkIcon, Share2, CalendarClock, ParkingCircle, Bell,
  Building2, Map, Cloud, ChevronDown, LogOut, Ticket,
} from "lucide-react";

const INK = "#1B2A41";
const PARCHMENT = "#F6F1E4";
const BRASS = "#D0AC80";
const TEAL = "#2F5D62";
const CLAY = "#C2542E";
const RED = "#B5302B";
const RED_DARK = "#7C1F1C";
const BLUE = "#3F8FCB";
const BLUE_DARK = "#245A87";
const LOGIN_BLUE = "#1F4E79";
const LINE_C = "#E4DAC4";

// Dati di fallback, usati solo se non arriva ancora nessuna struttura reale
// (anteprima isolata del componente, oppure link non valido già gestito a
// monte dalla pagina). Quando GuestWelcomeBook riceve la prop "property"
// dal server (dati reali da Supabase), questi valori vengono sovrascritti.
const DEFAULT_PROPERTY = {
  name: "La tua Reception on line",
  tagline: "Il tuo rifugio sul mare delle Cinque Terre",
  address: "Via del Porto 12, Manarola (SP)",
  checkIn: "15:00",
  checkOut: "10:00",
  wifiSsid: "TerrazzaMare_Guest",
  wifiPass: "OndeBlu2026",
  reception: "+39 0187 123456",
  emergency: "112",
  latitude: null,
  longitude: null,
};

const GuestPropertyContext = createContext(DEFAULT_PROPERTY);
function useGuestProperty() {
  return useContext(GuestPropertyContext);
}

// Trasforma la riga reale della tabella "properties" (Supabase) nella forma
// usata finora dalla UI ospite (mock PROPERTY), così il resto del file non
// deve cambiare struttura.
function propertyRowToViewModel(row) {
  if (!row) return DEFAULT_PROPERTY;
  return {
    name: row.name || DEFAULT_PROPERTY.name,
    tagline: row.description || DEFAULT_PROPERTY.tagline,
    address: row.address || DEFAULT_PROPERTY.address,
    checkIn: row.check_in_time ? row.check_in_time.slice(0, 5) : DEFAULT_PROPERTY.checkIn,
    checkOut: row.check_out_time ? row.check_out_time.slice(0, 5) : DEFAULT_PROPERTY.checkOut,
    wifiSsid: row.wifi_ssid || DEFAULT_PROPERTY.wifiSsid,
    wifiPass: row.wifi_password || DEFAULT_PROPERTY.wifiPass,
    reception: row.contact_phone || DEFAULT_PROPERTY.reception,
    emergency: (Array.isArray(row.emergency_numbers) && row.emergency_numbers[0]?.number) || DEFAULT_PROPERTY.emergency,
    latitude: row.latitude,
    longitude: row.longitude,
    instagramUrl: row.instagram_url || null,
    facebookUrl: row.facebook_url || null,
    tiktokUrl: row.tiktok_url || null,
    websiteUrl: row.website_url || null,
    isLocked: !!row.is_locked,
    noticeActive: !!row.notice_active,
    noticeTitle: row.notice_title || "",
    noticeMessage: row.notice_message || "",
  };
}

// ---------------------------------------------------------------------
// Dati reali della struttura: luoghi, servizi, eventi, escursioni, menù
// e camere, caricati lato server (app/g/[token]/page.jsx) e passati come
// prop. Un unico context li rende disponibili a tutte le schermate senza
// dover rifare il prop-drilling su ognuna.
// ---------------------------------------------------------------------
const GuestDataContext = createContext(null);
function useGuestData() {
  const ctx = useContext(GuestDataContext);
  if (!ctx) throw new Error("useGuestData deve essere usato dentro <GuestDataContext.Provider>");
  return ctx;
}

// La UI usa 4 categorie semplici per i luoghi, il DB un enum più ampio:
// stessa mappatura già usata lato host, per coerenza.
const CATEGORY_FROM_DB = {
  ristorante: "mangiare", bar: "mangiare", spiaggia: "spiagge", attrazione: "vedere",
  shopping: "shopping", prodotto_locale: "shopping", servizio: "vedere", altro: "vedere",
  parco_tematico: "parchi",
};
const CATEGORY_COLOR = { mangiare: CLAY, spiagge: TEAL, vedere: BRASS, shopping: CLAY, parchi: BRASS };
const EVENT_COLOR = { fiera: TEAL, sagra: CLAY, concerto: BRASS, evento_locale: TEAL, sport: BRASS, altro: CLAY };
const DIFFICULTY_LABEL = { facile: "Facile", media: "Media", impegnativa: "Impegnativa" };
const MEAL_LABEL = { colazione: "Colazione", mezza_pensione: "Mezza pensione", pensione_completa: "Pensione completa" };
const ROOM_TYPE_LABEL = { matrimoniale: "Matrimoniale", doppia: "Doppia", singola: "Singola", tripla: "Tripla/Familiare", suite: "Suite", altro: "Altro" };
const SERVICE_ICONS = [Bike, Utensils, Car, Compass, Star, MapPin];

// Distanza in linea d'aria (non un tempo di percorrenza: non abbiamo un
// routing reale) tra la struttura e il luogo, se entrambe le coordinate
// sono disponibili.
function distanceLabel(lat1, lng1, lat2, lng2) {
  if (lat1 == null || lng1 == null || lat2 == null || lng2 == null) return null;
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const d = 2 * R * Math.asin(Math.sqrt(a));
  return d < 1000 ? `${Math.round(d)} m` : `${(d / 1000).toFixed(1)} km`;
}

function fmtShortDate(d) {
  if (!d) return "";
  try {
    return new Date(d).toLocaleDateString("it-IT", { day: "2-digit", month: "short" });
  } catch {
    return d;
  }
}

function placeRowToVM(row, propLat, propLng) {
  const category = CATEGORY_FROM_DB[row.category] || "mangiare";
  return {
    id: row.id,
    category,
    name: row.name,
    tip: row.host_tip,
    address: row.address,
    discount: row.discount_info,
    distance: distanceLabel(propLat, propLng, row.latitude, row.longitude),
    color: CATEGORY_COLOR[category],
    photo: row.photo_urls?.[0] || null,
    officialUrl: row.official_url,
    latitude: row.latitude,
    longitude: row.longitude,
  };
}

function serviceRowToVM(row, i) {
  return {
    id: row.id,
    name: row.name,
    desc: row.description,
    price: row.price != null ? `${row.price} €` : "Su richiesta",
    duration: row.duration_label || "",
    Icon: SERVICE_ICONS[i % SERVICE_ICONS.length],
    photo: row.photo_url || null,
  };
}

function eventRowToVM(row) {
  return {
    id: row.id,
    category: row.category,
    name: row.name,
    venue: row.venue,
    start: fmtShortDate(row.start_date),
    end: row.end_date && row.end_date !== row.start_date ? fmtShortDate(row.end_date) : null,
    color: EVENT_COLOR[row.category] || TEAL,
    url: row.official_url,
  };
}

function excursionRowToVM(row) {
  return {
    id: row.id,
    name: row.name,
    duration: row.duration_hours ? `${row.duration_hours}h` : "",
    difficulty: DIFFICULTY_LABEL[row.difficulty] || row.difficulty || "",
    meetingPoint: row.meeting_point,
    price: row.price != null ? `${row.price} €` : null,
    url: row.official_url,
  };
}

function menuRowsToVM(rows) {
  return (rows || []).map((row) => ({
    id: row.meal_type,
    label: MEAL_LABEL[row.meal_type] || row.meal_type,
    mode: row.mode,
    pdfUrl: row.pdf_url,
    included: row.is_included,
    price: row.price,
    items: (row.menu_items || []).slice().sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)),
  }));
}

function roomRowToVM(row) {
  return {
    id: row.id,
    name: row.name,
    typeLabel: row.room_type ? ROOM_TYPE_LABEL[row.room_type] || row.room_type : null,
    photo: row.photo_urls?.[0] || null,
  };
}

const CATEGORIES = [
  { id: "mangiare", label: "Mangiare", icon: Utensils },
  { id: "spiagge", label: "Spiagge", icon: Waves },
  { id: "vedere", label: "Da vedere", icon: Landmark },
  { id: "shopping", label: "Shopping", icon: ShoppingBag },
  { id: "parchi", label: "Parchi tematici", icon: Ticket },
];

const LANGUAGES = ["IT", "EN", "RU"];

const TRANSLATIONS = {
  IT: { welcome: "BENVENUTI A BORDO", tagline: "Il tuo rifugio sul mare delle Cinque Terre", navHome: "HOME", navGuide: "GUIDA", navServices: "SERVIZI", navChat: "MESSAGGI", guideTitle: "Consigli & luoghi", servicesTitle: "Servizi extra", chatTitle: "Messaggi", feedback: "Com'è andato il soggiorno?", feedbackCta: "Lascia un feedback" },
  EN: { welcome: "WELCOME ABOARD", tagline: "Your refuge by the sea in the Cinque Terre", navHome: "HOME", navGuide: "GUIDE", navServices: "SERVICES", navChat: "CHAT", guideTitle: "Tips & places", servicesTitle: "Extra services", chatTitle: "Messages", feedback: "How was your stay?", feedbackCta: "Leave feedback" },
  RU: { welcome: "ДОБРО ПОЖАЛОВАТЬ", tagline: "Ваше убежище у моря в Чинкве-Терре", navHome: "ГЛАВНАЯ", navGuide: "ГИД", navServices: "УСЛУГИ", navChat: "ЧАТ", guideTitle: "Советы и места", servicesTitle: "Доп. услуги", chatTitle: "Сообщения", feedback: "Как прошло проживание?", feedbackCta: "Оставить отзыв" },
};

function LanguageSwitch({ lang, setLang, light }) {
  return (
    <div className="flex items-center gap-1 rounded-full p-1" style={{ backgroundColor: light ? "#F1EAD9" : "rgba(255,255,255,0.08)" }}>
      {LANGUAGES.map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          className="px-2 py-1 rounded-full"
          style={{ backgroundColor: lang === l ? BRASS : "transparent" }}
        >
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "9.5px", color: lang === l ? INK : (light ? "#8A8371" : "#C9C2AF") }}>{l}</span>
        </button>
      ))}
    </div>
  );
}

function ChatScreen({ t }) {
  const { propertyId, guestStayId } = useGuestData();
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!guestStayId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    fetch(`/api/guest/messages?propertyId=${propertyId}&guestStayId=${guestStayId}`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        setMessages(data.messages || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
    return () => { cancelled = true; };
  }, [propertyId, guestStayId]);

  const send = async () => {
    if (!draft.trim() || !guestStayId) return;
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/guest/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyId, guestStayId, text: draft.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Invio non riuscito");
      setMessages((prev) => [...prev, data.message]);
      setDraft("");
    } catch (err) {
      setError(err.message || "Invio non riuscito, riprovate.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col" style={{ height: "100%" }}>
      <TopBar title={t.chatTitle} />
      {!guestStayId ? (
        <div className="flex-1 flex items-center justify-center p-8 text-center" style={{ backgroundColor: PARCHMENT }}>
          <p style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "12.5px", color: "#8A8371", lineHeight: 1.6 }}>
            I messaggi diretti sono disponibili aprendo l'app dal vostro link personale di soggiorno (nell'email di conferma).
          </p>
        </div>
      ) : loading ? (
        <div className="flex-1 flex items-center justify-center" style={{ backgroundColor: PARCHMENT }}>
          <p style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "12.5px", color: "#8A8371" }}>Caricamento messaggi...</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5" style={{ backgroundColor: PARCHMENT }}>
          {messages.length === 0 && (
            <p style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "12px", color: "#8A8371", textAlign: "center" }}>
              Scrivete pure alla reception per qualsiasi cosa vi serva.
            </p>
          )}
          {messages.map((m) => (
            <div key={m.id} className="flex" style={{ justifyContent: m.sender === "guest" ? "flex-end" : "flex-start" }}>
              <div className="max-w-[75%] px-3.5 py-2 rounded-2xl" style={{ backgroundColor: m.sender === "guest" ? INK : "#FFFDF8", border: m.sender === "guest" ? "none" : "1px solid #E4DAC4" }}>
                <p style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "12.5px", color: m.sender === "guest" ? PARCHMENT : INK }}>{m.body}</p>
              </div>
            </div>
          ))}
        </div>
      )}
      {guestStayId && (
        <div className="flex flex-col gap-1 p-3" style={{ borderTop: "1px solid #E4DAC4", backgroundColor: "#FFFDF8" }}>
          {error && <p style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "11px", color: CLAY }}>{error}</p>}
          <div className="flex items-center gap-2">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Scrivete un messaggio..."
              className="flex-1 px-3.5 py-2.5 rounded-full outline-none"
              style={{ backgroundColor: "#F1EAD9", fontFamily: "'Work Sans', sans-serif", fontSize: "13px", color: INK }}
            />
            <button onClick={send} disabled={sending} className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: CLAY, opacity: sending ? 0.7 : 1 }}>
              <Send size={14} color={PARCHMENT} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function FeedbackSheet({ open, onClose, t }) {
  const { propertyId, guestStayId } = useGuestData();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  const submit = async () => {
    if (rating === 0) return;
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/guest/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyId, guestStayId, rating, comment }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Invio non riuscito");
      setSent(true);
    } catch (err) {
      setError(err.message || "Invio non riuscito, riprovate.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center" style={{ backgroundColor: "rgba(27,42,65,0.55)" }}>
      <div className="w-full max-w-md rounded-t-3xl overflow-hidden" style={{ backgroundColor: "#FFFDF8", maxHeight: "80%", overflowY: "auto" }}>
        {sent ? (
          <div className="p-8 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4 border-2" style={{ borderColor: TEAL, borderStyle: "dashed", transform: "rotate(-6deg)" }}>
              <Check size={26} color={TEAL} />
            </div>
            <p className="italic" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "24px", color: INK }}>Grazie!</p>
            <p className="mt-2" style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "13px", color: "#6B6455" }}>
              Il vostro feedback ci aiuta a migliorare l'ospitalità.
            </p>
            <button onClick={onClose} className="mt-6 w-full py-3 rounded-full" style={{ backgroundColor: INK }}>
              <span style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "13px", fontWeight: 600, color: PARCHMENT }}>Chiudi</span>
            </button>
          </div>
        ) : (
          <div className="p-6">
            <div className="flex items-start justify-between mb-5">
              <p className="italic" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "22px", color: INK }}>{t.feedback}</p>
              <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: "#F1EAD9" }}>
                <X size={15} color={INK} />
              </button>
            </div>
            <div className="flex items-center justify-center gap-2 mb-5">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} onClick={() => setRating(n)}>
                  <Star size={30} color={n <= rating ? BRASS : "#E4DAC4"} fill={n <= rating ? BRASS : "none"} />
                </button>
              ))}
            </div>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Raccontateci qualcosa in più (facoltativo)..."
              rows={3}
              className="w-full px-3 py-2.5 rounded-xl outline-none resize-none"
              style={{ backgroundColor: "#F1EAD9", fontFamily: "'Work Sans', sans-serif", fontSize: "13px", color: INK }}
            />
            {error && <p style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "11.5px", color: CLAY, marginTop: "8px" }}>{error}</p>}
            <button
              onClick={submit}
              disabled={rating === 0 || sending}
              className="w-full py-3 rounded-full mt-4 active:scale-[0.98] transition-transform"
              style={{ backgroundColor: rating > 0 ? CLAY : "#E4DAC4" }}
            >
              <span style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "13px", fontWeight: 600, color: PARCHMENT }}>{sending ? "Invio..." : "Invia"}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function MenuScreen() {
  const { menus, propertyId, guestStayId } = useGuestData();
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [covers, setCovers] = useState(2);
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const canRequest = !!guestStayId;

  const requestTable = async () => {
    if (!date || !time || !canRequest) return;
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/guest/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId,
          guestStayId,
          text: `Richiesta prenotazione tavolo: ${date} alle ${time}, ${covers} coperti.`,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Invio non riuscito");
      setSent(true);
    } catch (err) {
      setError(err.message || "Invio non riuscito, riprovate.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <TopBar title="Menù" />
      <div className="px-4 pt-4 pb-6" style={{ backgroundColor: PARCHMENT }}>
        {menus.length === 0 && (
          <p style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "12.5px", color: "#8A8371", marginBottom: "12px" }}>
            Il menù non è ancora stato pubblicato dall'host.
          </p>
        )}
        {menus.map((m) => (
          <div key={m.id} className="mb-4 rounded-2xl p-4" style={{ backgroundColor: "#FFFDF8", border: "1px solid #E4DAC4" }}>
            <div className="flex items-center gap-2 mb-3">
              <p className="italic" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "19px", color: INK }}>{m.label}</p>
              {m.included === false && (
                <span className="px-2 py-0.5 rounded-full" style={{ backgroundColor: "#FBEFD9" }}>
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "9px", color: BRASS }}>
                    A PAGAMENTO{m.price ? ` · ${m.price} €` : ""}
                  </span>
                </span>
              )}
            </div>
            {m.mode === "pdf" ? (
              m.pdfUrl ? (
                <a href={m.pdfUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                  <FileText size={15} color={CLAY} />
                  <span style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "12.5px", fontWeight: 600, color: CLAY }}>Apri il menù in PDF</span>
                </a>
              ) : (
                <p style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "12px", color: "#8A8371" }}>Non ancora disponibile.</p>
              )
            ) : m.items.length === 0 ? (
              <p style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "12px", color: "#8A8371" }}>Non ancora disponibile.</p>
            ) : (
              m.items.map((it) => (
                <div key={it.id} className="flex items-start gap-2 mb-1.5">
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "9.5px", color: BRASS, marginTop: "2px", width: "62px", flexShrink: 0 }}>
                    {(it.course || "").toUpperCase()}
                  </span>
                  <span style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "12.5px", color: "#4A4437" }}>{it.name}</span>
                </div>
              ))
            )}
          </div>
        ))}

        <div className="rounded-2xl p-4" style={{ backgroundColor: "#FFFDF8", border: "1px dashed #D8CDB2" }}>
          <div className="flex items-center gap-2 mb-3">
            <CalendarClock size={16} color={TEAL} />
            <p className="italic" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "18px", color: INK }}>Prenota un tavolo</p>
          </div>
          {!canRequest ? (
            <p style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "12px", color: "#8A8371", lineHeight: 1.5 }}>
              Per richiedere un tavolo aprite l'app dal vostro link personale di soggiorno (lo trovate nell'email di conferma), oppure scrivete alla reception dalla sezione Struttura.
            </p>
          ) : sent ? (
            <div className="text-center py-3">
              <Check size={22} color={TEAL} className="mx-auto mb-2" />
              <p style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "12.5px", color: INK, fontWeight: 600 }}>Richiesta inviata alla reception</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2.5 mb-2.5">
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="px-3 py-2.5 rounded-xl outline-none"
                  style={{ backgroundColor: "#F1EAD9", fontFamily: "'Work Sans', sans-serif", fontSize: "12.5px", color: INK }}
                />
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="px-3 py-2.5 rounded-xl outline-none"
                  style={{ backgroundColor: "#F1EAD9", fontFamily: "'Work Sans', sans-serif", fontSize: "12.5px", color: INK }}
                />
              </div>
              <div className="flex items-center justify-between mb-3 px-3 py-2.5 rounded-xl" style={{ backgroundColor: "#F1EAD9" }}>
                <span style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "12.5px", color: INK }}>Coperti</span>
                <div className="flex items-center gap-3">
                  <button onClick={() => setCovers(Math.max(1, covers - 1))} className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: "#FFFDF8" }}>
                    <span style={{ color: INK }}>−</span>
                  </button>
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "13px", color: INK }}>{covers}</span>
                  <button onClick={() => setCovers(covers + 1)} className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: "#FFFDF8" }}>
                    <span style={{ color: INK }}>+</span>
                  </button>
                </div>
              </div>
              {error && <p style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "11.5px", color: CLAY, marginBottom: "8px" }}>{error}</p>}
              <button
                onClick={requestTable}
                disabled={!date || !time || sending}
                className="w-full py-2.5 rounded-full active:scale-[0.98] transition-transform"
                style={{ backgroundColor: date && time ? CLAY : "#E4DAC4" }}
              >
                <span style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "12.5px", fontWeight: 600, color: PARCHMENT }}>
                  {sending ? "Invio..." : "Richiedi prenotazione"}
                </span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ExcursionsScreen() {
  const { excursions } = useGuestData();
  return (
    <div>
      <TopBar title="Escursioni & tour" />
      <div className="px-4 pt-4 pb-6" style={{ backgroundColor: PARCHMENT }}>
        {excursions.length === 0 && (
          <p style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "12.5px", color: "#8A8371" }}>Nessuna escursione pubblicata al momento.</p>
        )}
        {excursions.map((ex) => (
          <div key={ex.id} className="mb-3 p-4 rounded-2xl" style={{ backgroundColor: "#FFFDF8", border: "1px solid #E4DAC4" }}>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: TEAL }}>
                <Mountain size={18} color={PARCHMENT} />
              </div>
              <div className="flex-1">
                <p className="italic" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "17px", color: INK }}>{ex.name}</p>
                <p style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "11.5px", color: "#8A8371", marginTop: "2px" }}>
                  {ex.meetingPoint} · {ex.duration} · {ex.difficulty}
                </p>
              </div>
              {ex.price && (
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "11px", color: CLAY, flexShrink: 0 }}>{ex.price}</span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-3 pt-3" style={{ borderTop: "1px dashed #E4DAC4" }}>
              {ex.url && (
                <a href={ex.url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ backgroundColor: "#F1EAD9" }}>
                  <LinkIcon size={11} color={TEAL} />
                  <span style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "11px", fontWeight: 600, color: TEAL }}>Sito ufficiale</span>
                </a>
              )}
              <ShareButton title={ex.name} text={`${ex.name} — ${ex.meetingPoint}`} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const EVENT_ICONS = { fiera: Briefcase, sagra: Utensils, concerto: Sparkles, evento_locale: PartyPopper, sport: Star };

function ShareButton({ title, text }) {
  const share = () => {
    if (navigator.share) {
      navigator.share({ title, text }).catch(() => {});
    }
  };
  return (
    <button onClick={share} className="p-2 rounded-lg shrink-0" style={{ backgroundColor: "#F1EAD9" }} title="Condividi">
      <Share2 size={13} color={TEAL} />
    </button>
  );
}

function EventsScreen() {
  const { events } = useGuestData();
  return (
    <div>
      <TopBar title="Fiere & eventi" />
      <div className="px-4 pt-4 pb-6" style={{ backgroundColor: PARCHMENT }}>
        <p style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "12px", color: "#6B6455", marginBottom: "14px" }}>
          Cosa succede in zona durante il vostro soggiorno.
        </p>
        {events.length === 0 && (
          <p style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "12.5px", color: "#8A8371" }}>Nessun evento in programma al momento.</p>
        )}
        {events.map((ev) => {
          const Icon = EVENT_ICONS[ev.category] || CalendarDays;
          return (
            <div key={ev.id} className="mb-3 p-4 rounded-2xl" style={{ backgroundColor: "#FFFDF8", border: "1px solid #E4DAC4" }}>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: ev.color }}>
                  <Icon size={18} color={PARCHMENT} />
                </div>
                <div className="flex-1">
                  <p className="italic" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "17px", color: INK }}>{ev.name}</p>
                  <p style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "11.5px", color: "#8A8371", marginTop: "2px" }}>{ev.venue}</p>
                </div>
                <div className="text-right shrink-0">
                  <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "10.5px", color: CLAY }}>{ev.start}</p>
                  {ev.end && <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "10.5px", color: "#B4AC97" }}>→ {ev.end}</p>}
                </div>
              </div>
              <div className="flex items-center gap-2 mt-3 pt-3" style={{ borderTop: "1px dashed #E4DAC4" }}>
                {ev.url && (
                  <a href={ev.url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ backgroundColor: "#F1EAD9" }}>
                    <LinkIcon size={11} color={TEAL} />
                    <span style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "11px", fontWeight: 600, color: TEAL }}>Sito ufficiale</span>
                  </a>
                )}
                <ShareButton title={ev.name} text={`${ev.name} — ${ev.venue}, ${ev.start}`} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StampBadge({ text }) {
  return (
    <div
      className="absolute -top-2 -right-2 flex items-center justify-center text-center px-2 py-1 rounded-full border-2 select-none"
      style={{
        transform: "rotate(-9deg)",
        borderColor: BRASS,
        borderStyle: "dashed",
        backgroundColor: "#FFFDF8",
        color: BRASS,
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: "9px",
        letterSpacing: "0.05em",
        lineHeight: 1.1,
        width: "56px",
        height: "56px",
      }}
    >
      {text}
    </div>
  );
}

function TopBar({ title, onBack }) {
  return (
    <div
      className="flex items-center gap-2 px-4 py-3 sticky top-0 z-20"
      style={{ backgroundColor: INK }}
    >
      {onBack && (
        <button onClick={onBack} className="p-1 -ml-1 rounded-full active:opacity-60">
          <ArrowLeft size={18} color={PARCHMENT} />
        </button>
      )}
      <div>
        <p
          className="uppercase tracking-widest"
          style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "9px", color: BRASS }}
        >
          EvolutionTrip
        </p>
        <p
          className="italic leading-tight"
          style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "19px", color: PARCHMENT }}
        >
          {title}
        </p>
      </div>
    </div>
  );
}

function BottomNav({ tab, setTab, t }) {
  const items = [
    { id: "home", label: t.navHome, Icon: Home },
    { id: "guide", label: t.navGuide, Icon: Compass },
    { id: "itinerary", label: "ITINERARIO", Icon: Map },
    { id: "struttura", label: "STRUTTURA", Icon: Building2 },
  ];
  return (
    <div
      className="flex sticky bottom-0 z-20 border-t"
      style={{ backgroundColor: "#FFFDF8", borderColor: "#E4DAC4" }}
    >
      {items.map(({ id, label, Icon }) => {
        const active = tab === id;
        return (
          <button
            key={id}
            onClick={() => setTab(id)}
            className="flex-1 flex flex-col items-center gap-1 py-2.5"
          >
            <Icon size={20} color={active ? CLAY : "#9C9483"} strokeWidth={active ? 2.4 : 1.8} />
            <span
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: "9px",
                letterSpacing: "0.04em",
                color: active ? CLAY : "#9C9483",
              }}
            >
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
function TopAppBar({ goChat, lang, setLang }) {
  return (
    <div className="flex items-center justify-between px-4 py-3" style={{ backgroundColor: "#FFFDF8", borderBottom: "1px solid #E4DAC4" }}>
      <button onClick={goChat} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: "#F1EAD9" }}>
        <MessageCircle size={17} color={BLUE} />
      </button>
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-full flex items-center justify-center border" style={{ borderColor: BLUE }}>
          <Compass size={13} color={BLUE} />
        </div>
        <span className="italic" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "15px", color: INK }}>EvolutionTrip</span>
      </div>
      <LanguageSwitch lang={lang} setLang={setLang} light />
    </div>
  );
}

function CheckInBanner() {
  const { checkInDate, checkOutDate } = useGuestData();
  if (!checkInDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const checkIn = new Date(checkInDate + "T00:00:00");
  const daysToCheckIn = Math.round((checkIn - today) / 86400000);

  // Prima del check-in: banner con il conto alla rovescia all'arrivo.
  if (daysToCheckIn > 0) {
    return (
      <div className="px-4 pt-3">
        <div className="flex items-center gap-3 p-3.5 rounded-2xl" style={{ backgroundColor: "#FFFDF8", border: `1.5px solid ${BLUE}` }}>
          <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: BLUE }}>
            <Clock size={18} color="#FFFFFF" />
          </div>
          <div>
            <p style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "13.5px", fontWeight: 700, color: INK }}>
              {daysToCheckIn === 1 ? "Manca 1 giorno al check-in" : `Mancano ${daysToCheckIn} giorni al check-in`}
            </p>
            <p style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "11.5px", color: "#6B6455", marginTop: "1px" }}>
              Vi aspettiamo il {checkIn.toLocaleDateString("it-IT", { day: "2-digit", month: "long" })}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Dal giorno del check-in in poi: banner con il conto alla rovescia alla partenza.
  if (!checkOutDate) return null;
  const checkOut = new Date(checkOutDate + "T00:00:00");
  const daysToCheckOut = Math.round((checkOut - today) / 86400000);
  if (daysToCheckOut < 0) return null;

  return (
    <div className="px-4 pt-3">
      <div className="flex items-center gap-3 p-3.5 rounded-2xl" style={{ backgroundColor: "#FFFDF8", border: `1.5px solid ${CLAY}` }}>
        <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: CLAY }}>
          <Clock size={18} color="#FFFFFF" />
        </div>
        <div>
          <p style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "13.5px", fontWeight: 700, color: INK }}>
            {daysToCheckOut === 0
              ? "Oggi è il vostro check-out"
              : daysToCheckOut === 1
              ? "Manca 1 giorno al check-out"
              : `Mancano ${daysToCheckOut} giorni al check-out`}
          </p>
          <p style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "11.5px", color: "#6B6455", marginTop: "1px" }}>
            {daysToCheckOut === 0 ? "Vi auguriamo un buon rientro!" : `Partenza prevista il ${checkOut.toLocaleDateString("it-IT", { day: "2-digit", month: "long" })}`}
          </p>
        </div>
      </div>
    </div>
  );
}

function HomeScreen({ goGuide, goServices, goEvents, goMenu, goExcursions, goStruttura, goItinerary, goChat, openFeedback, lang, setLang, t }) {
  const PROPERTY = useGuestProperty();
  const { places } = useGuestData();
  return (
    <div style={{ backgroundColor: PARCHMENT, minHeight: "100%" }}>
      <TopAppBar goChat={goChat} lang={lang} setLang={setLang} />
      <CheckInBanner />

      <button
        className="w-full flex items-center justify-center gap-2 py-3"
        style={{ backgroundColor: BLUE }}
      >
        <Cloud size={15} color={PARCHMENT} />
        <span style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "12.5px", fontWeight: 700, color: PARCHMENT, letterSpacing: "0.03em" }}>
          SCARICA APP
        </span>
      </button>

      {PROPERTY.noticeActive && PROPERTY.noticeMessage && (
        <div className="px-4 pt-4">
          <div
            className="flex items-start gap-3 p-3.5 rounded-2xl"
            style={{
              backgroundColor: "#FFFDF8",
              border: `1px solid ${LINE_C}`,
              backgroundImage: "repeating-linear-gradient(135deg, transparent, transparent 6px, #F1EAD9 6px, #F1EAD9 7px)",
            }}
          >
            <Bell size={17} color={BRASS} className="shrink-0 mt-0.5" />
            <div>
              {PROPERTY.noticeTitle && (
                <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", letterSpacing: "0.06em", color: BRASS }}>
                  {PROPERTY.noticeTitle.toUpperCase()}
                </p>
              )}
              <p style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "11.5px", color: "#6B6455", marginTop: "3px", lineHeight: 1.5 }}>
                {PROPERTY.noticeMessage}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="px-4 pt-4">
        <button onClick={goStruttura} className="w-full flex items-center justify-between py-3 text-left" style={{ borderBottom: `1px solid ${LINE_C}` }}>
          <div className="flex items-center gap-3">
            <Building2 size={18} color={INK} />
            <div>
              <p className="italic" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "17px", color: BLUE }}>{PROPERTY.name}</p>
              <p style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "11px", color: "#8A8371", marginTop: "1px" }}>{PROPERTY.address}</p>
            </div>
          </div>
          <ChevronRight size={16} color="#9C9483" />
        </button>

        <button onClick={goStruttura} className="w-full flex items-center justify-between py-3 text-left" style={{ borderBottom: `1px solid ${LINE_C}` }}>
          <div className="flex items-center gap-3">
            <Clock size={17} color={INK} />
            <div>
              <p style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "13px", fontWeight: 600, color: INK }}>Orari</p>
              <p style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "11px", color: "#8A8371", marginTop: "1px" }}>check-in {PROPERTY.checkIn} · check-out {PROPERTY.checkOut}</p>
            </div>
          </div>
          <ChevronRight size={16} color="#9C9483" />
        </button>

        <button onClick={goServices} className="w-full flex items-center justify-between py-3 text-left" style={{ borderBottom: `1px solid ${LINE_C}` }}>
          <div className="flex items-center gap-3">
            <Star size={17} color={INK} />
            <p style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "13px", fontWeight: 600, color: INK }}>Servizi</p>
          </div>
          <ChevronRight size={16} color="#9C9483" />
        </button>

        <button onClick={goStruttura} className="w-full flex items-center justify-between py-3 text-left" style={{ borderBottom: `1px solid ${LINE_C}` }}>
          <div className="flex items-center gap-3">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke={INK} strokeWidth="1.6" /><path d="M12 11v5" stroke={INK} strokeWidth="1.6" strokeLinecap="round" /><circle cx="12" cy="8" r="0.9" fill={INK} /></svg>
            <p style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "13px", fontWeight: 600, color: INK }}>Informazioni utili</p>
          </div>
          <ChevronRight size={16} color="#9C9483" />
        </button>
      </div>

      <div className="px-4 pt-4">
        <button
          onClick={goGuide}
          className="w-full flex items-center gap-3 p-4 rounded-2xl text-left"
          style={{ backgroundColor: "#F1EAD9" }}
        >
          <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: BLUE }}>
            <Compass size={20} color={PARCHMENT} />
          </div>
          <div className="flex-1">
            <p className="italic" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "17px", color: INK }}>{t.guideTitle}</p>
            <p style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "11px", color: "#8A8371", marginTop: "1px" }}>
              Scoprite i nostri consigli per il territorio e la sua cultura
            </p>
          </div>
          <ChevronRight size={16} color="#8A8371" />
        </button>
      </div>

      <div className="px-4 pt-5 pb-3">
        <div className="flex items-center justify-between mb-3">
          <p style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "13px", fontWeight: 700, color: INK }}>Alcuni dei nostri consigli</p>
          <button onClick={goGuide} className="flex items-center gap-0.5">
            <span style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "11.5px", fontWeight: 600, color: BLUE }}>Vedi tutti</span>
            <ChevronRight size={13} color={BLUE} />
          </button>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-1">
          {places.slice(0, 4).map((p) => (
            <button key={p.id} onClick={goGuide} className="rounded-2xl overflow-hidden shrink-0" style={{ width: "140px", border: `1px solid ${LINE_C}` }}>
              <div
                className="h-20"
                style={{
                  backgroundColor: p.color,
                  backgroundImage: p.photo ? `url(${p.photo})` : undefined,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              />
              <div className="px-2.5 py-2" style={{ backgroundColor: "#FFFDF8" }}>
                <span style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "11px", fontWeight: 600, color: INK }}>{p.name}</span>
              </div>
            </button>
          ))}
          {places.length === 0 && (
            <p style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "11.5px", color: "#8A8371" }}>Nessun consiglio pubblicato ancora.</p>
          )}
        </div>
      </div>

      <div className="px-4 pb-6">
        <div className="grid grid-cols-2 gap-3">
          <button onClick={goItinerary} className="rounded-2xl p-3.5 text-left" style={{ backgroundColor: "#FFFDF8", border: `1px solid ${LINE_C}` }}>
            <Map size={16} color={BLUE} />
            <p style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "12px", fontWeight: 600, color: INK, marginTop: "6px" }}>Itinerario</p>
            <p style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "10px", color: "#8A8371" }}>Tour, eventi, menù</p>
          </button>
          <button onClick={openFeedback} className="rounded-2xl p-3.5 text-left" style={{ backgroundColor: "#FFFDF8", border: `1px solid ${LINE_C}` }}>
            <Star size={16} color={BRASS} />
            <p style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "12px", fontWeight: 600, color: INK, marginTop: "6px" }}>{t.feedbackCta}</p>
          </button>
        </div>
      </div>
    </div>
  );
}

function ItineraryScreen({ goExcursions, goEvents, goMenu }) {
  const cards = [
    { label: "Escursioni & tour", desc: "Sentieri, gite in barca e attività organizzate", Icon: Mountain, color: TEAL, onClick: goExcursions },
    { label: "Fiere & eventi", desc: "Cosa succede in zona durante il soggiorno", Icon: CalendarDays, color: BRASS, onClick: goEvents },
    { label: "Menù & prenotazioni", desc: "Colazione, mezza pensione e tavolo al ristorante", Icon: UtensilsCrossed, color: CLAY, onClick: goMenu },
  ];
  return (
    <div>
      <TopBar title="Itinerario" />
      <div className="px-4 pt-4 pb-6" style={{ backgroundColor: PARCHMENT }}>
        <p style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "12px", color: "#6B6455", marginBottom: "14px" }}>
          Tutto quello che potete organizzare durante il soggiorno, in un unico posto.
        </p>
        {cards.map((c) => (
          <button
            key={c.label}
            onClick={c.onClick}
            className="w-full flex items-center gap-3 mb-3 p-4 rounded-2xl text-left"
            style={{ backgroundColor: "#FFFDF8", border: "1px solid #E4DAC4" }}
          >
            <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: c.color }}>
              <c.Icon size={18} color={PARCHMENT} />
            </div>
            <div className="flex-1">
              <p className="italic" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "17px", color: INK }}>{c.label}</p>
              <p style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "11.5px", color: "#8A8371", marginTop: "1px" }}>{c.desc}</p>
            </div>
            <ChevronRight size={16} color="#9C9483" />
          </button>
        ))}
      </div>
    </div>
  );
}

function StructureScreen({ openFeedback }) {
  const PROPERTY = useGuestProperty();
  const { rooms, propertyId, guestStayId, propertySlug } = useGuestData();
  const [bellRung, setBellRung] = useState(false);
  const [bellSending, setBellSending] = useState(false);
  const hasCoords = PROPERTY.latitude != null && PROPERTY.longitude != null;

  const ringBell = async () => {
    if (!guestStayId || bellSending) return;
    setBellSending(true);
    try {
      const res = await fetch("/api/guest/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyId, guestStayId, isBell: true }),
      });
      if (res.ok) {
        setBellRung(true);
        setTimeout(() => setBellRung(false), 3000);
      }
    } finally {
      setBellSending(false);
    }
  };

  const socialLinks = [
    { url: PROPERTY.instagramUrl, Icon: Instagram },
    { url: PROPERTY.facebookUrl, Icon: Facebook },
    { url: PROPERTY.tiktokUrl, Icon: Music2 },
    { url: PROPERTY.websiteUrl, Icon: LinkIcon },
  ].filter((s) => s.url);

  return (
    <div>
      <TopBar title="La struttura" />
      <div className="px-4 pt-4 pb-6" style={{ backgroundColor: PARCHMENT }}>
        <div className="rounded-2xl p-4 mb-4" style={{ backgroundColor: "#FFFDF8", border: "1px solid #E4DAC4" }}>
          <div className="flex items-center gap-2 mb-3 pb-3" style={{ borderBottom: "1px dashed #D8CDB2" }}>
            <MapPin size={15} color={TEAL} />
            <span style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "12px", color: INK }}>{PROPERTY.address}</span>
          </div>
          {hasCoords ? (
            <div className="rounded-xl h-32 mb-3 overflow-hidden">
              <iframe
                title="Mappa struttura"
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${PROPERTY.longitude - 0.01}%2C${PROPERTY.latitude - 0.01}%2C${PROPERTY.longitude + 0.01}%2C${PROPERTY.latitude + 0.01}&layer=mapnik&marker=${PROPERTY.latitude}%2C${PROPERTY.longitude}`}
                className="w-full h-full block"
                style={{ border: 0 }}
                loading="lazy"
              />
            </div>
          ) : (
            <div
              className="relative rounded-xl h-24 mb-3 overflow-hidden flex items-center justify-center"
              style={{ backgroundColor: "#EFE7D3", border: "1px dashed #D8CDB2" }}
            >
              <span style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "11px", color: "#8A8371" }}>Posizione non ancora indicata dall'host</span>
            </div>
          )}
          <a
            href={hasCoords ? `https://www.google.com/maps/dir/?api=1&destination=${PROPERTY.latitude},${PROPERTY.longitude}` : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(PROPERTY.address)}`}
            target="_blank"
            rel="noreferrer"
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-full mb-3"
            style={{ backgroundColor: INK }}
          >
            <span style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "12.5px", fontWeight: 600, color: PARCHMENT }}>Ottieni indicazioni</span>
          </a>
          <div className="grid grid-cols-2 gap-3 pb-3 mb-3" style={{ borderBottom: "1px dashed #D8CDB2" }}>
            <div>
              <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "9px", color: "#9C9483" }}>CHECK-IN</p>
              <span style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "13px", fontWeight: 600, color: INK }}>{PROPERTY.checkIn}</span>
            </div>
            <div>
              <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "9px", color: "#9C9483" }}>CHECK-OUT</p>
              <span style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "13px", fontWeight: 600, color: INK }}>{PROPERTY.checkOut}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Wifi size={15} color={TEAL} />
            <span style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "12px", color: INK }}>{PROPERTY.wifiSsid}</span>
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "11px", color: "#9C9483" }}> · {PROPERTY.wifiPass}</span>
          </div>
        </div>

        {rooms.length > 0 && (
          <>
            <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "9.5px", letterSpacing: "0.06em", color: "#8A8371", marginBottom: "8px" }}>
              LE NOSTRE CAMERE
            </p>
            <div className="flex gap-2.5 overflow-x-auto pb-1 mb-4">
              {rooms.map((room, i) => (
                <div key={room.id} className="rounded-xl overflow-hidden shrink-0" style={{ width: "120px", border: "1px solid #E4DAC4" }}>
                  <div
                    className="h-16"
                    style={{
                      backgroundColor: [TEAL, BRASS, CLAY][i % 3],
                      backgroundImage: room.photo ? `url(${room.photo})` : undefined,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  />
                  <div className="px-2 py-1.5" style={{ backgroundColor: "#FFFDF8" }}>
                    <span style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "10.5px", fontWeight: 600, color: INK }}>
                      {room.name || room.typeLabel || "Camera"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="flex gap-3 mb-3">
          <a href={`tel:${PROPERTY.reception}`} className="flex-1 flex items-center gap-3 rounded-2xl p-4" style={{ backgroundColor: "#FFFDF8", border: "1px solid #E4DAC4" }}>
            <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: "#EFE7D3" }}>
              <Phone size={16} color={INK} />
            </div>
            <div>
              <p style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "12.5px", fontWeight: 600, color: INK }}>Chiama</p>
              <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", color: "#9C9483" }}>{PROPERTY.reception}</p>
            </div>
          </a>
          <button
            onClick={ringBell}
            disabled={!guestStayId || bellSending}
            className="flex-1 flex items-center gap-3 rounded-2xl p-4"
            style={{ backgroundColor: bellRung ? "#E4EEE9" : "#FFFDF8", border: `1px solid ${bellRung ? TEAL : "#E4DAC4"}`, opacity: guestStayId ? 1 : 0.6 }}
          >
            <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: bellRung ? TEAL : "#EFE7D3" }}>
              <Bell size={16} color={bellRung ? PARCHMENT : INK} />
            </div>
            <div>
              <p style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "12.5px", fontWeight: 600, color: bellRung ? TEAL : INK }}>
                {bellRung ? "Avvisata!" : "Campanello"}
              </p>
              <p style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "10px", color: "#9C9483" }}>
                {!guestStayId ? "Serve il link personale" : bellRung ? "Reception in arrivo" : "Chiamata silenziosa"}
              </p>
            </div>
          </button>
        </div>

        {guestStayId && propertySlug && (
          <button
            onClick={() => { if (typeof window !== "undefined") window.location.href = `/g/${propertySlug}`; }}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-full mb-3"
            style={{ border: "1px solid #E4DAC4" }}
          >
            <LogOut size={13} color="#8A8371" />
            <span style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "12px", fontWeight: 600, color: "#8A8371" }}>Esci dal soggiorno</span>
          </button>
        )}

        {socialLinks.length > 0 && (
          <div className="flex items-center gap-2.5 mb-4">
            {socialLinks.map(({ url, Icon }, i) => (
              <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: "#FFFDF8", border: "1px solid #E4DAC4" }}>
                <Icon size={15} color={INK} />
              </a>
            ))}
          </div>
        )}

        <button
          onClick={openFeedback}
          className="w-full flex items-center justify-between rounded-2xl p-4"
          style={{ backgroundColor: "#FFFDF8", border: "1px dashed #D8CDB2" }}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: "#F1EAD9" }}>
              <Star size={15} color={BRASS} />
            </div>
            <p style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "13px", fontWeight: 600, color: INK }}>Lascia un feedback</p>
          </div>
          <ChevronRight size={16} color="#9C9483" />
        </button>
      </div>
    </div>
  );
}

function GuideScreen({ onOpenPlace, t, goExcursions, goEvents }) {
  const { places } = useGuestData();
  const [cat, setCat] = useState("mangiare");
  const filtered = places.filter((p) => p.category === cat);

  return (
    <div>
      <TopBar title={t.guideTitle} />
      <div className="flex gap-2 px-4 pt-4 pb-2 overflow-x-auto" style={{ backgroundColor: PARCHMENT }}>
        {CATEGORIES.map(({ id, label, icon: Icon }) => {
          const active = cat === id;
          return (
            <button
              key={id}
              onClick={() => setCat(id)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-full whitespace-nowrap shrink-0"
              style={{
                backgroundColor: active ? INK : "#FFFDF8",
                border: `1px solid ${active ? INK : "#E4DAC4"}`,
              }}
            >
              <Icon size={13} color={active ? BRASS : TEAL} />
              <span style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "12px", fontWeight: 600, color: active ? PARCHMENT : INK }}>
                {label}
              </span>
            </button>
          );
        })}
        <button
          onClick={goExcursions}
          className="flex items-center gap-1.5 px-3 py-2 rounded-full whitespace-nowrap shrink-0"
          style={{ backgroundColor: "#FFFDF8", border: "1px solid #E4DAC4" }}
        >
          <Mountain size={13} color={TEAL} />
          <span style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "12px", fontWeight: 600, color: INK }}>Tour & escursioni</span>
        </button>
        <button
          onClick={goEvents}
          className="flex items-center gap-1.5 px-3 py-2 rounded-full whitespace-nowrap shrink-0"
          style={{ backgroundColor: "#FFFDF8", border: "1px solid #E4DAC4" }}
        >
          <CalendarDays size={13} color={TEAL} />
          <span style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "12px", fontWeight: 600, color: INK }}>Fiere & eventi</span>
        </button>
      </div>

      <div className="px-4 pb-6 pt-2" style={{ backgroundColor: PARCHMENT }}>
        {filtered.length === 0 && (
          <p style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "12.5px", color: "#8A8371", padding: "8px 2px" }}>
            Nessun consiglio pubblicato in questa categoria.
          </p>
        )}
        {filtered.map((place) => (
          <button
            key={place.id}
            onClick={() => onOpenPlace(place)}
            className="w-full text-left relative mb-4 rounded-2xl overflow-hidden active:scale-[0.99] transition-transform"
            style={{ backgroundColor: "#FFFDF8", border: "1px solid #E4DAC4" }}
          >
            {place.discount && <StampBadge text={place.discount} />}
            <div
              className="h-20"
              style={{
                backgroundColor: place.color,
                backgroundImage: place.photo ? `url(${place.photo})` : undefined,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />
            <div className="p-4">
              <p className="italic" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "20px", color: INK }}>
                {place.name}
              </p>
              {place.tip && (
                <p
                  className="mt-1"
                  style={{ fontFamily: "'Work Sans', sans-serif", fontStyle: "italic", fontSize: "12px", color: "#6B6455", lineHeight: 1.5 }}
                >
                  “{place.tip}”
                </p>
              )}
              <div className="flex items-center gap-3 mt-3">
                {place.distance && (
                  <div className="flex items-center gap-1">
                    <MapPin size={11} color="#9C9483" />
                    <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", color: "#9C9483" }}>{place.distance}</span>
                  </div>
                )}
                {place.address && !place.distance && (
                  <div className="flex items-center gap-1">
                    <MapPin size={11} color="#9C9483" />
                    <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", color: "#9C9483" }}>{place.address}</span>
                  </div>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function PlaceDetail({ place, onClose }) {
  if (!place) return null;
  const hasCoords = place.latitude != null && place.longitude != null;
  const directionsHref = hasCoords
    ? `https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name + " " + (place.address || ""))}`;
  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center" style={{ backgroundColor: "rgba(27,42,65,0.55)" }}>
      <div className="w-full max-w-md rounded-t-3xl overflow-hidden" style={{ backgroundColor: "#FFFDF8", maxHeight: "88%", overflowY: "auto" }}>
        <div
          className="h-28 relative"
          style={{
            backgroundColor: place.color,
            backgroundImage: place.photo ? `url(${place.photo})` : undefined,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <button onClick={onClose} className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.25)" }}>
            <X size={16} color="#fff" />
          </button>
          {place.discount && (
            <div className="absolute -bottom-6 left-5">
              <StampBadge text={place.discount} />
            </div>
          )}
        </div>
        <div className="p-5 pt-8">
          <p className="italic" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "26px", color: INK }}>{place.name}</p>
          <div className="flex items-center gap-1 mt-1 mb-4">
            <MapPin size={12} color="#9C9483" />
            <span style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "12px", color: "#6B6455" }}>
              {place.address}{place.distance ? ` · ${place.distance}` : ""}
            </span>
          </div>

          {place.tip && (
            <div className="rounded-xl p-3 mb-4" style={{ backgroundColor: "#F1EAD9", borderLeft: `3px solid ${BRASS}` }}>
              <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "9px", letterSpacing: "0.06em", color: BRASS, marginBottom: "4px" }}>
                CONSIGLIO DELL'HOST
              </p>
              <p style={{ fontFamily: "'Work Sans', sans-serif", fontStyle: "italic", fontSize: "13px", color: INK, lineHeight: 1.5 }}>
                “{place.tip}”
              </p>
            </div>
          )}

          {hasCoords ? (
            <div className="rounded-xl h-32 mb-4 overflow-hidden">
              <iframe
                title={`Mappa ${place.name}`}
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${place.longitude - 0.006}%2C${place.latitude - 0.006}%2C${place.longitude + 0.006}%2C${place.latitude + 0.006}&layer=mapnik&marker=${place.latitude}%2C${place.longitude}`}
                className="w-full h-full block"
                style={{ border: 0 }}
                loading="lazy"
              />
            </div>
          ) : (
            <div
              className="relative rounded-xl h-24 mb-4 overflow-hidden flex items-center justify-center"
              style={{ backgroundColor: "#EFE7D3", border: "1px dashed #D8CDB2" }}
            >
              <span style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "11px", color: "#8A8371" }}>Posizione non ancora indicata dall'host</span>
            </div>
          )}

          {place.officialUrl && (
            <a
              href={place.officialUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 mb-2.5 py-2 rounded-full"
              style={{ border: "1px solid #E4DAC4" }}
            >
              <LinkIcon size={13} color={TEAL} />
              <span style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "12.5px", fontWeight: 600, color: TEAL }}>Sito ufficiale</span>
            </a>
          )}

          <a
            href={directionsHref}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 rounded-full flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
            style={{ backgroundColor: INK }}
          >
            <span style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "13px", fontWeight: 600, color: PARCHMENT }}>Ottieni indicazioni</span>
          </a>
        </div>
      </div>
    </div>
  );
}

function ServicesScreen({ onOpenService, t }) {
  const { services } = useGuestData();
  return (
    <div>
      <TopBar title={t.servicesTitle} />
      <div className="px-4 pt-4 pb-6" style={{ backgroundColor: PARCHMENT }}>
        <p style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "12px", color: "#6B6455", marginBottom: "14px" }}>
          Selezionate un servizio: la richiesta arriva direttamente alla reception.
        </p>
        {services.length === 0 && (
          <p style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "12.5px", color: "#8A8371" }}>Nessun servizio extra disponibile al momento.</p>
        )}
        {services.map((s) => (
          <button
            key={s.id}
            onClick={() => onOpenService(s)}
            className="w-full text-left flex items-center gap-3 mb-3 p-4 rounded-2xl active:scale-[0.99] transition-transform"
            style={{ backgroundColor: "#FFFDF8", border: "1px dashed #D8CDB2" }}
          >
            <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 overflow-hidden" style={{ backgroundColor: "#F1EAD9" }}>
              {s.photo ? <img src={s.photo} alt="" className="w-full h-full object-cover" /> : <s.Icon size={18} color={TEAL} />}
            </div>
            <div className="flex-1">
              <p style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "14px", fontWeight: 600, color: INK }}>{s.name}</p>
              <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", color: "#9C9483", marginTop: "2px" }}>
                {s.price}{s.duration ? ` · ${s.duration}` : ""}
              </p>
            </div>
            <ChevronRight size={16} color="#9C9483" />
          </button>
        ))}
      </div>
    </div>
  );
}

function BookingSheet({ service, onClose }) {
  const { propertyId, guestStayId } = useGuestData();
  const [form, setForm] = useState({ name: "", contact: "", when: "", notes: "" });
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  if (!service) return null;

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.contact.trim()) return;
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/guest/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId,
          serviceId: service.id,
          guestStayId,
          guestName: form.name,
          guestContact: form.contact,
          when: form.when,
          notes: form.notes,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Invio non riuscito");
      setSent(true);
    } catch (err) {
      setError(err.message || "Invio non riuscito, riprovate.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center" style={{ backgroundColor: "rgba(27,42,65,0.55)" }}>
      <div className="w-full max-w-md rounded-t-3xl overflow-hidden" style={{ backgroundColor: "#FFFDF8", maxHeight: "90%", overflowY: "auto" }}>
        {sent ? (
          <div className="p-8 flex flex-col items-center text-center">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mb-4 border-2"
              style={{ borderColor: TEAL, borderStyle: "dashed", transform: "rotate(-6deg)" }}
            >
              <Check size={26} color={TEAL} />
            </div>
            <p className="italic" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "24px", color: INK }}>Richiesta inviata</p>
            <p className="mt-2" style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "13px", color: "#6B6455" }}>
              La reception vi risponderà a breve per confermare {service.name.toLowerCase()}.
            </p>
            <button
              onClick={onClose}
              className="mt-6 w-full py-3 rounded-full"
              style={{ backgroundColor: INK }}
            >
              <span style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "13px", fontWeight: 600, color: PARCHMENT }}>Chiudi</span>
            </button>
          </div>
        ) : (
          <form onSubmit={submit} noValidate className="p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "9px", letterSpacing: "0.06em", color: BRASS }}>RICHIESTA DI PRENOTAZIONE</p>
                <p className="italic" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "22px", color: INK }}>{service.name}</p>
              </div>
              <button type="button" onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: "#F1EAD9" }}>
                <X size={15} color={INK} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "11px", color: "#6B6455" }}>Nome</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Come vi chiamate?"
                  className="w-full mt-1 px-3 py-2.5 rounded-xl outline-none"
                  style={{ backgroundColor: "#F1EAD9", fontFamily: "'Work Sans', sans-serif", fontSize: "13px", color: INK }}
                />
              </div>
              <div>
                <label style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "11px", color: "#6B6455" }}>Contatto</label>
                <input
                  required
                  value={form.contact}
                  onChange={(e) => setForm({ ...form, contact: e.target.value })}
                  placeholder="Numero di camera o telefono"
                  className="w-full mt-1 px-3 py-2.5 rounded-xl outline-none"
                  style={{ backgroundColor: "#F1EAD9", fontFamily: "'Work Sans', sans-serif", fontSize: "13px", color: INK }}
                />
              </div>
              <div>
                <label style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "11px", color: "#6B6455" }}>Data e ora preferite</label>
                <input
                  value={form.when}
                  onChange={(e) => setForm({ ...form, when: e.target.value })}
                  placeholder="Es. domani sera, ore 20:00"
                  className="w-full mt-1 px-3 py-2.5 rounded-xl outline-none"
                  style={{ backgroundColor: "#F1EAD9", fontFamily: "'Work Sans', sans-serif", fontSize: "13px", color: INK }}
                />
              </div>
              <div>
                <label style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "11px", color: "#6B6455" }}>Note (opzionale)</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Allergie, preferenze, richieste particolari..."
                  rows={2}
                  className="w-full mt-1 px-3 py-2.5 rounded-xl outline-none resize-none"
                  style={{ backgroundColor: "#F1EAD9", fontFamily: "'Work Sans', sans-serif", fontSize: "13px", color: INK }}
                />
              </div>
            </div>

            {error && <p style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "11.5px", color: CLAY, marginTop: "10px" }}>{error}</p>}

            <button
              type="submit"
              disabled={sending}
              className="w-full py-3 rounded-full mt-5 active:scale-[0.98] transition-transform"
              style={{ backgroundColor: CLAY, opacity: sending ? 0.7 : 1 }}
            >
              <span style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "13px", fontWeight: 600, color: PARCHMENT }}>{sending ? "Invio..." : "Invia richiesta"}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function LoginScreen({ propertySlug }) {
  const PROPERTY = useGuestProperty();
  const [mode, setMode] = useState("booking"); // "booking" | "byemail"
  const [surname, setSurname] = useState("");
  const [bookingNumber, setBookingNumber] = useState("");
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const redirectWithToken = (token) => {
    if (typeof window !== "undefined") window.location.href = `/g/${token}`;
  };

  const submitBooking = async (e) => {
    e.preventDefault();
    if (!surname.trim() || !bookingNumber.trim()) {
      setError("Compilate entrambi i campi per continuare.");
      return;
    }
    setError("");
    setLoading(true);
    const supabase = createClient();
    const { data: token, error: rpcError } = await supabase.rpc("verify_guest_login", {
      p_property_slug: propertySlug,
      p_booking_number: bookingNumber.trim(),
      p_surname: surname.trim(),
    });
    setLoading(false);
    if (rpcError || !token) {
      setError("Cognome o numero di prenotazione non corretti.");
      return;
    }
    redirectWithToken(token);
  };

  const submitByEmail = async (e) => {
    e.preventDefault();
    if (!guestName.trim() || !guestEmail.trim()) {
      setError("Inserite nome e email per continuare.");
      return;
    }
    setError("");
    setLoading(true);
    const supabase = createClient();
    const { data: token, error: rpcError } = await supabase.rpc("verify_guest_login_by_email", {
      p_property_slug: propertySlug,
      p_guest_name: guestName.trim(),
      p_guest_email: guestEmail.trim(),
    });
    setLoading(false);
    if (rpcError || !token) {
      setError("Non troviamo un soggiorno con questo nome ed email.");
      return;
    }
    redirectWithToken(token);
  };

  return (
    <div className="w-full h-full flex flex-col" style={{ backgroundColor: LOGIN_BLUE }}>
      <div className="flex-1 flex flex-col justify-center px-7">
        <div className="flex justify-center mb-6">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center border-2 relative"
            style={{ borderColor: PARCHMENT, borderStyle: "dashed" }}
          >
            <Compass size={24} color={PARCHMENT} />
          </div>
        </div>
        <p
          className="text-center uppercase tracking-widest mb-1"
          style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "9px", letterSpacing: "0.14em", color: BRASS }}
        >
          EvolutionTrip
        </p>
        <h1
          className="italic text-center mb-1"
          style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "28px", color: PARCHMENT }}
        >
          {PROPERTY.name}
        </h1>
        <p className="text-center mb-6" style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "12px", color: "#9C9483" }}>
          Accedete al vostro soggiorno
        </p>

        <div className="flex gap-1 rounded-full p-1 mb-5" style={{ backgroundColor: "#24374F" }}>
          <button
            onClick={() => { setMode("booking"); setError(""); }}
            className="flex-1 py-2 rounded-full"
            style={{ backgroundColor: mode === "booking" ? BRASS : "transparent" }}
          >
            <span style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "12px", fontWeight: 600, color: mode === "booking" ? INK : "#9C9483" }}>
              Numero prenotazione
            </span>
          </button>
          <button
            onClick={() => { setMode("byemail"); setError(""); }}
            className="flex-1 py-2 rounded-full"
            style={{ backgroundColor: mode === "byemail" ? BRASS : "transparent" }}
          >
            <span style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "12px", fontWeight: 600, color: mode === "byemail" ? INK : "#9C9483" }}>
              Nome ed email
            </span>
          </button>
        </div>

        {mode === "booking" ? (
          <form onSubmit={submitBooking} noValidate className="space-y-3">
            <div>
              <label style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "11px", color: "#9C9483" }}>Cognome</label>
              <input
                value={surname}
                onChange={(e) => setSurname(e.target.value)}
                placeholder="Es. Rossi"
                className="w-full mt-1 px-3 py-2.5 rounded-xl outline-none"
                style={{ backgroundColor: "#24374F", fontFamily: "'Work Sans', sans-serif", fontSize: "13px", color: PARCHMENT }}
              />
            </div>
            <div>
              <label style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "11px", color: "#9C9483" }}>Numero di prenotazione</label>
              <input
                value={bookingNumber}
                onChange={(e) => setBookingNumber(e.target.value)}
                placeholder="Es. TM-20260812"
                className="w-full mt-1 px-3 py-2.5 rounded-xl outline-none"
                style={{
                  backgroundColor: "#24374F",
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: "13px",
                  color: PARCHMENT,
                  letterSpacing: "0.03em",
                }}
              />
              <p style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "10.5px", color: "#7D7768", marginTop: "5px" }}>
                Lo trovate nell'email di conferma della prenotazione.
              </p>
            </div>
            {error && <p style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "11.5px", color: "#E28A6A" }}>{error}</p>}
            <button type="submit" disabled={loading} className="w-full py-3 rounded-full mt-2 active:scale-[0.98] transition-transform" style={{ backgroundColor: BLUE, opacity: loading ? 0.7 : 1 }}>
              <span style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "13px", fontWeight: 600, color: PARCHMENT }}>{loading ? "Verifica..." : "Accedi"}</span>
            </button>
          </form>
        ) : (
          <form onSubmit={submitByEmail} noValidate className="space-y-3">
            <p style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "11.5px", color: "#9C9483", marginBottom: "2px" }}>
              Senza numero di prenotazione: inserite lo stesso nome ed email lasciati all'host al momento della prenotazione.
            </p>
            <div>
              <label style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "11px", color: "#9C9483" }}>Nome e cognome</label>
              <input
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="Es. Anna Bianchi"
                className="w-full mt-1 px-3 py-2.5 rounded-xl outline-none"
                style={{ backgroundColor: "#24374F", fontFamily: "'Work Sans', sans-serif", fontSize: "13px", color: PARCHMENT }}
              />
            </div>
            <div>
              <label style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "11px", color: "#9C9483" }}>Email</label>
              <input
                type="email"
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                placeholder="nome@esempio.it"
                className="w-full mt-1 px-3 py-2.5 rounded-xl outline-none"
                style={{ backgroundColor: "#24374F", fontFamily: "'Work Sans', sans-serif", fontSize: "13px", color: PARCHMENT }}
              />
            </div>
            {error && <p style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "11.5px", color: "#E28A6A" }}>{error}</p>}
            <button type="submit" disabled={loading} className="w-full py-3 rounded-full mt-2 active:scale-[0.98] transition-transform" style={{ backgroundColor: BLUE, opacity: loading ? 0.7 : 1 }}>
              <span style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "13px", fontWeight: 600, color: PARCHMENT }}>{loading ? "Verifica..." : "Accedi"}</span>
            </button>
          </form>
        )}

        <div className="flex items-center gap-2 mt-6">
          <div className="flex-1 h-px" style={{ backgroundColor: "#33465D" }} />
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "9px", color: "#7D7768" }}>OPPURE</span>
          <div className="flex-1 h-px" style={{ backgroundColor: "#33465D" }} />
        </div>

        <div className="flex items-center gap-2 justify-center mt-4">
          <Link2 size={13} color="#9C9483" />
          <span style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "11.5px", color: "#9C9483" }}>
            Aprite il link ricevuto via email o WhatsApp
          </span>
        </div>
      </div>
    </div>
  );
}

function LockedScreen({ onUnlock }) {
  const PROPERTY = useGuestProperty();
  return (
    <div className="w-full h-full flex flex-col items-center justify-center px-8 text-center" style={{ backgroundColor: INK }}>
      <div className="w-16 h-16 rounded-full flex items-center justify-center mb-5 border-2" style={{ borderColor: BRASS, borderStyle: "dashed" }}>
        <Bell size={26} color={BRASS} style={{ opacity: 0.5 }} />
      </div>
      <p
        className="uppercase tracking-widest mb-2"
        style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "9px", letterSpacing: "0.14em", color: BRASS }}
      >
        Struttura non raggiungibile
      </p>
      <p className="italic mb-3" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "22px", color: PARCHMENT }}>
        {PROPERTY.name}
      </p>
      <p style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "12.5px", color: "#9C9483", lineHeight: 1.6, maxWidth: "280px" }}>
        Questa app di benvenuto non è al momento disponibile. Per assistenza contattate direttamente la struttura.
      </p>
      <a
        href={`tel:${PROPERTY.reception}`}
        className="flex items-center gap-2 mt-6 px-5 py-3 rounded-full"
        style={{ backgroundColor: "#24374F" }}
      >
        <Phone size={14} color={PARCHMENT} />
        <span style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "12.5px", fontWeight: 600, color: PARCHMENT }}>{PROPERTY.reception}</span>
      </a>
      <button onClick={onUnlock} className="mt-8">
        <span style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "10.5px", color: "#5A6B80" }}>(anteprima: torna all'app)</span>
      </button>
    </div>
  );
}

export default function GuestWelcomeBook({ accessToken, property, notFound, guestStay, rooms, places, services, events, excursions, menus }) {
  const [authed, setAuthed] = useState(!!guestStay);
  const [tab, setTab] = useState("home");
  const [place, setPlace] = useState(null);
  const [service, setService] = useState(null);
  const [lang, setLang] = useState("IT");
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [structureLocked, setStructureLocked] = useState(!!property?.is_locked);
  const t = TRANSLATIONS[lang];
  const propertyViewModel = propertyRowToViewModel(property);

  if (notFound) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center py-8 px-6" style={{ backgroundColor: "#E9E3D3" }}>
        <div className="max-w-sm text-center">
          <p className="italic mb-2" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "22px", color: INK }}>Link non valido</p>
          <p style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "13px", color: "#8A8371", lineHeight: 1.6 }}>
            Questo link non corrisponde a nessuna struttura attiva. Controllate di averlo copiato per intero, oppure chiedete un nuovo link all'host.
          </p>
        </div>
      </div>
    );
  }

  const propLat = property?.latitude;
  const propLng = property?.longitude;
  const guestData = {
    propertyId: property?.id,
    propertySlug: property?.slug || null,
    guestStayId: guestStay?.id || null,
    checkInDate: guestStay?.check_in_date || null,
    checkOutDate: guestStay?.check_out_date || null,
    places: (places || []).map((p) => placeRowToVM(p, propLat, propLng)),
    services: (services || []).map(serviceRowToVM),
    events: (events || []).map(eventRowToVM),
    excursions: (excursions || []).map(excursionRowToVM),
    menus: menuRowsToVM(menus),
    rooms: (rooms || []).map(roomRowToVM),
  };

  return (
    <GuestPropertyContext.Provider value={propertyViewModel}>
    <GuestDataContext.Provider value={guestData}>
    <div className="w-full min-h-screen flex items-center justify-center py-8" style={{ backgroundColor: "#E9E3D3" }}>
      <style>{`
        @import url(https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;1,500;1,600&family=Work+Sans:wght@400;600&family=IBM+Plex+Mono:wght@400;500&display=swap);
      `}</style>
      <div
        className="w-full max-w-md rounded-[2rem] overflow-hidden flex flex-col"
        style={{ height: "820px", boxShadow: "0 20px 60px rgba(27,42,65,0.25)", border: "1px solid #D8CDB2" }}
      >
        <div className="flex-1 overflow-y-auto" style={{ backgroundColor: authed ? PARCHMENT : INK }}>
          {structureLocked ? (
            <LockedScreen onUnlock={() => setStructureLocked(false)} />
          ) : (
            <>
          {!authed && <LoginScreen propertySlug={property?.slug} />}
          {authed && tab === "home" && (
            <HomeScreen
              goGuide={() => setTab("guide")}
              goServices={() => setTab("services")}
              goEvents={() => setTab("events")}
              goExcursions={() => setTab("excursions")}
              goMenu={() => setTab("menu")}
              goStruttura={() => setTab("struttura")}
              goItinerary={() => setTab("itinerary")}
              goChat={() => setTab("chat")}
              openFeedback={() => setFeedbackOpen(true)}
              lang={lang}
              setLang={setLang}
              t={t}
            />
          )}
          {authed && tab === "guide" && <GuideScreen onOpenPlace={setPlace} t={t} goExcursions={() => setTab("excursions")} goEvents={() => setTab("events")} />}
          {authed && tab === "services" && <ServicesScreen onOpenService={setService} t={t} />}
          {authed && tab === "events" && <EventsScreen />}
          {authed && tab === "excursions" && <ExcursionsScreen />}
          {authed && tab === "menu" && <MenuScreen />}
          {authed && tab === "chat" && <ChatScreen t={t} />}
          {authed && tab === "itinerary" && <ItineraryScreen goExcursions={() => setTab("excursions")} goEvents={() => setTab("events")} goMenu={() => setTab("menu")} />}
          {authed && tab === "struttura" && <StructureScreen openFeedback={() => setFeedbackOpen(true)} />}
            </>
          )}
        </div>
        {authed && !structureLocked && <BottomNav tab={tab} setTab={setTab} t={t} />}
      </div>

      {authed && !structureLocked && <PlaceDetail place={place} onClose={() => setPlace(null)} />}
      {authed && !structureLocked && <BookingSheet service={service} onClose={() => { setService(null); }} />}
      {authed && !structureLocked && <FeedbackSheet open={feedbackOpen} onClose={() => setFeedbackOpen(false)} t={t} />}

      {!structureLocked && (
        <button
          onClick={() => setStructureLocked(true)}
          className="fixed bottom-3 right-3 px-3 py-1.5 rounded-full"
          style={{ backgroundColor: "rgba(27,42,65,0.8)" }}
        >
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "9px", color: "#C9C2AF" }}>
            anteprima: struttura bloccata
          </span>
        </button>
      )}
    </div>
    </GuestDataContext.Provider>
    </GuestPropertyContext.Provider>
  );
}
