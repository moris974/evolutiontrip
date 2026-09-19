"use client";

import React, { useState, useEffect, useContext, createContext, useRef } from "react";
import { createClient } from "../lib/supabase/client";
import {
  LayoutGrid, Building2, Compass, Sparkles, CalendarCheck, Mail, Users,
  ChevronDown, Upload, Wifi, Clock, Phone, MapPin, ShieldAlert, Plus, Trash2, Save,
  Utensils, Waves, Landmark, ShoppingBag, Pencil, Tag, CalendarRange, Eye, EyeOff, Search, X,
  MessageCircle, Send, BarChart3, Star, TrendingUp, Globe, ClipboardList, Globe2, Home as HomeIcon,
  Briefcase, PartyPopper, CalendarDays, ExternalLink, Repeat,
  UtensilsCrossed, FileText, Mountain, Timer, Leaf,
  Instagram, Facebook, Music2, Link as LinkIcon, Share2, CalendarClock, ParkingCircle, Car,
  Settings, ToggleRight, RotateCcw, CreditCard, Zap, Crown, Hourglass, Check, Lock, Unlock, AlertTriangle, LogOut, Ticket,
} from "lucide-react";

const INK = "#1B2A41";
const PARCHMENT = "#F6F1E4";
const BRASS = "#D0AC80";
const TEAL = "#2F5D62";
const CLAY = "#C2542E";
const AZURE = "#2F7FB0";
const AZURE_DARK = "#1F5C82";
const PAPER = "#FFFDF8";
const LINE = "#E4DAC4";

const NAV = [
  { id: "overview", label: "Panoramica", Icon: LayoutGrid },
  { id: "property", label: "Dati struttura", Icon: Building2 },
  { id: "places", label: "Consigli & luoghi", Icon: Compass },
  { id: "events", label: "Fiere & eventi", Icon: CalendarDays },
  { id: "excursions", label: "Escursioni", Icon: Mountain },
  { id: "menu", label: "Menù", Icon: UtensilsCrossed },
  { id: "services", label: "Servizi extra", Icon: Sparkles },
  { id: "bookings", label: "Prenotazioni", Icon: CalendarCheck },
  { id: "messages", label: "Messaggi", Icon: MessageCircle },
  { id: "emails", label: "Email & automazioni", Icon: Mail },
  { id: "guests", label: "Ospiti", Icon: Users },
  { id: "appsettings", label: "Impostazioni app", Icon: Settings },
  { id: "subscription", label: "Abbonamento", Icon: CreditCard },
];

// ---------------------------------------------------------------------
// PropertyContext: carica dal DB (tabella "properties") la struttura
// dell'host attualmente autenticato e la mette a disposizione di tutta
// la dashboard, con funzioni reali di refresh/aggiornamento.
// ---------------------------------------------------------------------
const PropertyContext = createContext(null);

function usePropertyContext() {
  const ctx = useContext(PropertyContext);
  if (!ctx) throw new Error("usePropertyContext deve essere usato dentro <PropertyProvider>");
  return ctx;
}

function slugifyName(name) {
  return (
    (name || "struttura")
      .toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") + "-" + Math.random().toString(36).slice(2, 6)
  );
}

function PropertyProvider({ children }) {
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadProperty = async () => {
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      setError("Sessione non trovata: effettuate nuovamente l'accesso.");
      setLoading(false);
      return;
    }

    let { data, error: fetchError } = await supabase
      .from("properties")
      .select("*")
      .eq("owner_id", user.id)
      .limit(1)
      .maybeSingle();

    if (fetchError) {
      setError(fetchError.message);
      setLoading(false);
      return;
    }

    // Nessuna struttura trovata (es. registrazione con conferma email:
    // al momento della signUp non c'era ancora una sessione valida per
    // creare la riga rispettando le policy RLS). La creiamo ora.
    if (!data) {
      const fallbackName = user.user_metadata?.full_name
        ? `Struttura di ${user.user_metadata.full_name}`
        : "La tua struttura";
      const { data: created, error: insertError } = await supabase
        .from("properties")
        .insert({ owner_id: user.id, name: fallbackName, slug: slugifyName(fallbackName) })
        .select("*")
        .single();
      if (insertError) {
        setError(insertError.message);
        setLoading(false);
        return;
      }
      data = created;
    }

    setProperty(data);
    setLoading(false);
  };

  useEffect(() => {
    loadProperty();
  }, []);

  return (
    <PropertyContext.Provider value={{ property, setProperty, reload: loadProperty, loading, error }}>
      {children}
    </PropertyContext.Provider>
  );
}

function Field({ label, children, hint }) {
  return (
    <div>
      <label style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "12.5px", fontWeight: 600, color: INK }}>
        {label}
      </label>
      <div className="mt-1.5">{children}</div>
      {hint && (
        <p style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "11px", color: "#8A8371", marginTop: "4px" }}>
          {hint}
        </p>
      )}
    </div>
  );
}

function inputStyle() {
  return {
    fontFamily: "'Work Sans', sans-serif",
    fontSize: "13px",
    color: INK,
    backgroundColor: PAPER,
    border: `1px solid ${LINE}`,
  };
}

function Section({ title, eyebrow, children }) {
  return (
    <div className="rounded-2xl p-6 mb-5" style={{ backgroundColor: PAPER, border: `1px solid ${LINE}` }}>
      <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "9.5px", letterSpacing: "0.08em", color: BRASS, marginBottom: "3px" }}>
        {eyebrow}
      </p>
      <h2 className="italic mb-5" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "22px", color: INK }}>
        {title}
      </h2>
      {children}
    </div>
  );
}

function Sidebar({ active, setActive }) {
  const { property } = usePropertyContext();
  const structureName = property?.name;
  return (
    <div className="w-56 shrink-0 flex flex-col" style={{ backgroundColor: AZURE }}>
      <div className="px-5 pt-6 pb-5 flex items-center gap-2.5" style={{ borderBottom: `1px solid ${AZURE_DARK}` }}>
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center border-2 shrink-0"
          style={{ borderColor: BRASS, borderStyle: "dashed" }}
        >
          <svg width="17" height="17" viewBox="0 0 26 26" fill="none">
            <path d="M3 20 C 7 20, 6 13, 11 13 C 16 13, 15 6, 21 6" stroke={BRASS} strokeWidth="2.4" strokeLinecap="round" fill="none" />
            <circle cx="3" cy="20" r="2.4" fill={BRASS} />
            <path d="M17.5 3 L21 6 L17.5 9" stroke={BRASS} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </svg>
        </div>
        <div>
          <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "8.5px", letterSpacing: "0.1em", color: BRASS }}>
            HOST DASHBOARD
          </p>
          <p className="italic" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "18px", color: PARCHMENT }}>
            EvolutionTrip
          </p>
        </div>
      </div>

      <button className="flex items-center justify-between mx-4 mt-4 px-3 py-2.5 rounded-xl" style={{ backgroundColor: AZURE_DARK }}>
        <div className="text-left">
          <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "8.5px", color: "#9C9483" }}>STRUTTURA ATTIVA</p>
          <p style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "12.5px", fontWeight: 600, color: PARCHMENT }}>{structureName || "La tua Reception on line"}</p>
        </div>
        <ChevronDown size={14} color="#9C9483" />
      </button>

      <nav className="flex-1 px-3 mt-5 space-y-1">
        {NAV.map(({ id, label, Icon }) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              onClick={() => setActive(id)}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left"
              style={{ backgroundColor: isActive ? AZURE_DARK : "transparent" }}
            >
              <Icon size={16} color={isActive ? BRASS : "#BFDCEC"} />
              <span
                style={{
                  fontFamily: "'Work Sans', sans-serif",
                  fontSize: "13px",
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? PARCHMENT : "#BFDCEC",
                }}
              >
                {label}
              </span>
            </button>
          );
        })}
      </nav>

      <div className="px-4 pb-5 pt-3" style={{ borderTop: `1px solid ${AZURE_DARK}` }}>
        <div className="flex items-center gap-2.5 px-2 mb-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: BRASS }}>
            <span style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "11px", fontWeight: 600, color: INK }}>
              {(structureName || "Host").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
            </span>
          </div>
          <div>
            <p style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "12px", fontWeight: 600, color: PARCHMENT }}>{structureName || "Host"}</p>
            <p style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "10.5px", color: "#BFDCEC" }}>Host</p>
          </div>
        </div>
        <button
          onClick={async () => {
            const supabase = createClient();
            await supabase.auth.signOut();
            if (typeof window !== "undefined") window.location.href = "/";
          }}
          className="w-full flex items-center gap-2 px-2 py-2 rounded-lg"
          style={{ backgroundColor: "transparent" }}
        >
          <LogOut size={14} color="#BFDCEC" />
          <span style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "12px", fontWeight: 600, color: "#BFDCEC" }}>Esci</span>
        </button>
      </div>
    </div>
  );
}

function TopBar({ title, subtitle }) {
  // Nota: il vecchio pulsante "Salva modifiche" qui era puramente
  // decorativo (mostrava solo un'animazione, senza scrivere nulla sul
  // server). È stato rimosso: ogni sezione ora ha il proprio pulsante
  // di salvataggio reale, collegato a Supabase e verificabile.
  return (
    <div className="flex items-center justify-between px-8 py-5" style={{ borderBottom: `1px solid ${LINE}` }}>
      <div>
        <h1 style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "18px", fontWeight: 600, color: INK }}>{title}</h1>
        <p style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "12.5px", color: "#8A8371", marginTop: "2px" }}>{subtitle}</p>
      </div>
    </div>
  );
}

// Carica un file su Supabase Storage (bucket "media", pubblico in lettura)
// dentro una cartella per-utente, e restituisce l'URL pubblico reale.
async function uploadPropertyImage(file, folder) {
  const supabase = createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) throw new Error("Sessione scaduta: effettuate nuovamente l'accesso.");
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const path = `${user.id}/${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error: uploadError } = await supabase.storage.from("media").upload(path, file, { upsert: false });
  if (uploadError) throw uploadError;
  const { data } = supabase.storage.from("media").getPublicUrl(path);
  return data.publicUrl;
}

function ImageUploadBox({ imageUrl, onUploaded, onRemove, folder = "generico", height = "h-28" }) {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const handleChange = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setUploading(true);
    setUploadError("");
    try {
      const url = await uploadPropertyImage(file, folder);
      onUploaded(url);
    } catch (err) {
      setUploadError(err.message || "Caricamento fallito.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return (
    <div className={`relative ${height} rounded-xl overflow-hidden`} style={{ border: `1px dashed ${LINE}`, backgroundColor: "#F1EAD9" }}>
      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleChange} className="hidden" />
      {uploading ? (
        <div className="w-full h-full flex items-center justify-center">
          <span style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "11px", color: "#8A8371" }}>Caricamento...</span>
        </div>
      ) : imageUrl ? (
        <>
          <img src={imageUrl} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 flex items-end justify-end p-2 gap-1.5" style={{ background: "linear-gradient(transparent 50%, rgba(27,42,65,0.35))" }}>
            <button onClick={() => fileInputRef.current.click()} className="px-2 py-1 rounded-full" style={{ backgroundColor: PAPER }}>
              <span style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "10px", fontWeight: 600, color: INK }}>Sostituisci</span>
            </button>
            <button onClick={onRemove} className="p-1.5 rounded-full" style={{ backgroundColor: PAPER }}>
              <X size={11} color={INK} />
            </button>
          </div>
        </>
      ) : (
        <button onClick={() => fileInputRef.current.click()} className="w-full h-full flex flex-col items-center justify-center gap-1.5">
          <Upload size={16} color="#8A8371" />
          <span style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "11px", color: "#8A8371" }}>Carica immagine</span>
        </button>
      )}
      {uploadError && (
        <div className="absolute bottom-0 left-0 right-0 px-2 py-1" style={{ backgroundColor: "rgba(194,84,46,0.9)" }}>
          <span style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "9.5px", color: PARCHMENT }}>{uploadError}</span>
        </div>
      )}
    </div>
  );
}

const ROOM_TYPES = [
  { id: "matrimoniale", label: "Matrimoniale" },
  { id: "doppia", label: "Doppia" },
  { id: "singola", label: "Singola" },
  { id: "tripla", label: "Tripla/Familiare" },
  { id: "suite", label: "Suite" },
  { id: "altro", label: "Altro" },
];

// Slider con più foto per camera: frecce prev/next + pallini, upload e
// rimozione della foto corrente. Le foto sono già URL reali di Supabase
// Storage (uploadPropertyImage), non anteprime locali.
function RoomPhotoSlider({ photos, onAdd, onRemove }) {
  const fileInputRef = useRef(null);
  const [index, setIndex] = useState(0);
  const [uploading, setUploading] = useState(false);
  const safeIndex = photos.length ? Math.min(index, photos.length - 1) : 0;

  const handleFile = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadPropertyImage(file, "rooms");
      onAdd(url);
      setIndex(photos.length);
    } catch (err) {
      alert("Caricamento fallito: " + err.message);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return (
    <div className="relative h-24" style={{ backgroundColor: "#F1EAD9" }}>
      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
      {photos.length > 0 ? (
        <>
          <img src={photos[safeIndex]} alt="" className="w-full h-full object-cover" />
          {photos.length > 1 && (
            <>
              <button
                onClick={() => setIndex((safeIndex - 1 + photos.length) % photos.length)}
                className="absolute left-1 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "rgba(27,42,65,0.55)" }}
              >
                <span style={{ color: "#fff", fontSize: "11px", lineHeight: 1 }}>‹</span>
              </button>
              <button
                onClick={() => setIndex((safeIndex + 1) % photos.length)}
                className="absolute right-1 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "rgba(27,42,65,0.55)" }}
              >
                <span style={{ color: "#fff", fontSize: "11px", lineHeight: 1 }}>›</span>
              </button>
              <div className="absolute bottom-1 left-0 right-0 flex items-center justify-center gap-1">
                {photos.map((_, i) => (
                  <div key={i} className="w-1 h-1 rounded-full" style={{ backgroundColor: i === safeIndex ? "#fff" : "rgba(255,255,255,0.5)" }} />
                ))}
              </div>
            </>
          )}
          <div className="absolute top-1 right-1 flex gap-1">
            <button onClick={() => fileInputRef.current.click()} disabled={uploading} className="w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: PAPER }}>
              <Plus size={10} color={INK} />
            </button>
            <button onClick={() => onRemove(safeIndex)} className="w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: PAPER }}>
              <X size={10} color={INK} />
            </button>
          </div>
        </>
      ) : (
        <button onClick={() => fileInputRef.current.click()} disabled={uploading} className="w-full h-full flex flex-col items-center justify-center gap-1">
          <Upload size={14} color="#8A8371" />
          <span style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "10px", color: "#8A8371" }}>{uploading ? "Caricamento..." : "Carica foto"}</span>
        </button>
      )}
    </div>
  );
}

function PropertySettings() {
  const { property, setProperty, loading: propertyLoading, error: propertyError, reload } = usePropertyContext();

  const [form, setForm] = useState(null);
  const [emergency, setEmergency] = useState([{ label: "Reception", number: "" }]);
  const [geoStatus, setGeoStatus] = useState("idle"); // idle | loading | done | error
  const [geoErrorMsg, setGeoErrorMsg] = useState("");

  const [rooms, setRooms] = useState([]);
  const [roomsLoading, setRoomsLoading] = useState(true);

  const [saveState, setSaveState] = useState("idle"); // idle | saving | saved | error
  const [saveError, setSaveError] = useState("");

  const [linkCopied, setLinkCopied] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);

  // Inizializza il form quando la property arriva dal server.
  useEffect(() => {
    if (!property) return;
    setForm({
      name: property.name || "",
      address: property.address || "",
      description: property.description || "",
      latitude: property.latitude != null ? String(property.latitude) : "",
      longitude: property.longitude != null ? String(property.longitude) : "",
      check_in_time: property.check_in_time ? property.check_in_time.slice(0, 5) : "15:00",
      check_out_time: property.check_out_time ? property.check_out_time.slice(0, 5) : "10:00",
      contact_email: property.contact_email || "",
      contact_phone: property.contact_phone || "",
      wifi_ssid: property.wifi_ssid || "",
      wifi_password: property.wifi_password || "",
      house_rules: property.house_rules || "",
      instagram_url: property.instagram_url || "",
      facebook_url: property.facebook_url || "",
      tiktok_url: property.tiktok_url || "",
      website_url: property.website_url || "",
      brand_color: property.brand_color || "#1B2A41",
      cover_photo_url: property.cover_photo_url || null,
      logo_url: property.logo_url || null,
      notice_title: property.notice_title || "",
      notice_message: property.notice_message || "",
      notice_active: !!property.notice_active,
    });
    setEmergency(
      Array.isArray(property.emergency_numbers) && property.emergency_numbers.length
        ? property.emergency_numbers
        : [{ label: "Reception", number: "" }]
    );
  }, [property?.id]);

  // Carica le camere reali (tabella property_rooms) collegate a questa struttura.
  useEffect(() => {
    if (!property?.id) return;
    let cancelled = false;
    setRoomsLoading(true);
    const supabase = createClient();
    supabase
      .from("property_rooms")
      .select("*")
      .eq("property_id", property.id)
      .order("sort_order", { ascending: true })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (!error) setRooms(data || []);
        setRoomsLoading(false);
      });
    return () => { cancelled = true; };
  }, [property?.id]);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const propertyId = property?.id;
  // Prima puntava a un dominio inventato ("app.evolutiontrip.it") che non
  // è mai esistito: usiamo invece l'indirizzo reale su cui è pubblicata
  // l'app in questo momento (funziona sia in anteprima/locale sia dopo il
  // deploy, senza dover riscrivere nulla quando cambia dominio).
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const guestLink = property?.slug && origin ? `${origin}/g/${property.slug}` : "";

  const detectLocation = () => {
    if (!navigator.geolocation) {
      setGeoStatus("error");
      setGeoErrorMsg("Il browser in uso non supporta la geolocalizzazione: inserite le coordinate a mano.");
      return;
    }
    setGeoStatus("loading");
    setGeoErrorMsg("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        set("latitude", pos.coords.latitude.toFixed(6));
        set("longitude", pos.coords.longitude.toFixed(6));
        setGeoStatus("done");
      },
      (err) => {
        setGeoStatus("error");
        if (err.code === 1) {
          setGeoErrorMsg("Permesso negato: consentite l'accesso alla posizione nelle impostazioni del browser (icona del lucchetto vicino all'indirizzo), poi riprovate. In alternativa inserite le coordinate a mano.");
        } else if (err.code === 2) {
          setGeoErrorMsg("Posizione non disponibile in questo momento: riprovate o inserite le coordinate a mano.");
        } else if (err.code === 3) {
          setGeoErrorMsg("Richiesta scaduta: riprovate o inserite le coordinate a mano.");
        } else {
          setGeoErrorMsg("Non riesco ad accedere alla posizione: inserite le coordinate a mano.");
        }
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const updateEmergency = (i, key, value) => {
    const next = [...emergency];
    next[i] = { ...next[i], [key]: value };
    setEmergency(next);
  };
  const addEmergency = () => setEmergency([...emergency, { label: "", number: "" }]);
  const removeEmergency = (i) => setEmergency(emergency.filter((_, idx) => idx !== i));

  // Camere: aggiunta/rimozione/rinomina scrivono subito su Supabase
  // (tabella property_rooms), non aspettano il pulsante "Salva modifiche".
  const addRoom = async () => {
    if (!propertyId) return;
    const supabase = createClient();
    const { data, error } = await supabase
      .from("property_rooms")
      .insert({ property_id: propertyId, name: "Nuova camera", sort_order: rooms.length })
      .select("*")
      .single();
    if (!error && data) setRooms([...rooms, data]);
  };
  const renameRoom = async (id, name) => {
    setRooms(rooms.map((r) => (r.id === id ? { ...r, name } : r)));
    const supabase = createClient();
    await supabase.from("property_rooms").update({ name }).eq("id", id);
  };
  const updateRoomPhotos = async (id, photo_urls) => {
    setRooms(rooms.map((r) => (r.id === id ? { ...r, photo_urls } : r)));
    const supabase = createClient();
    await supabase.from("property_rooms").update({ photo_urls }).eq("id", id);
  };
  const updateRoomType = async (id, room_type) => {
    setRooms(rooms.map((r) => (r.id === id ? { ...r, room_type } : r)));
    const supabase = createClient();
    await supabase.from("property_rooms").update({ room_type }).eq("id", id);
  };
  const removeRoom = async (id) => {
    setRooms(rooms.filter((r) => r.id !== id));
    const supabase = createClient();
    await supabase.from("property_rooms").delete().eq("id", id);
  };

  const handleSave = async () => {
    if (!propertyId || !form) return;
    setSaveState("saving");
    setSaveError("");
    const supabase = createClient();
    const payload = {
      name: form.name.trim() || "Struttura senza nome",
      address: form.address.trim() || null,
      description: form.description.trim() || null,
      latitude: form.latitude ? parseFloat(form.latitude) : null,
      longitude: form.longitude ? parseFloat(form.longitude) : null,
      check_in_time: form.check_in_time || null,
      check_out_time: form.check_out_time || null,
      contact_email: form.contact_email.trim() || null,
      contact_phone: form.contact_phone.trim() || null,
      wifi_ssid: form.wifi_ssid.trim() || null,
      wifi_password: form.wifi_password.trim() || null,
      house_rules: form.house_rules.trim() || null,
      instagram_url: form.instagram_url.trim() || null,
      facebook_url: form.facebook_url.trim() || null,
      tiktok_url: form.tiktok_url.trim() || null,
      website_url: form.website_url.trim() || null,
      brand_color: form.brand_color,
      cover_photo_url: form.cover_photo_url || null,
      logo_url: form.logo_url || null,
      notice_title: form.notice_title.trim() || null,
      notice_message: form.notice_message.trim() || null,
      notice_active: !!form.notice_active,
      emergency_numbers: emergency.filter((e) => e.label.trim() || e.number.trim()),
    };
    const { data, error } = await supabase
      .from("properties")
      .update(payload)
      .eq("id", propertyId)
      .select("*")
      .single();
    if (error) {
      setSaveState("error");
      setSaveError(error.message);
      return;
    }
    setProperty(data);
    setSaveState("saved");
    setTimeout(() => setSaveState("idle"), 2200);
  };

  if (propertyError) {
    return (
      <div className="max-w-3xl">
        <p style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "13px", color: CLAY }}>
          Non riesco a caricare la struttura: {propertyError}
        </p>
        <button onClick={reload} className="mt-3 px-4 py-2 rounded-full" style={{ border: `1px solid ${LINE}` }}>
          <span style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "12.5px", fontWeight: 600, color: INK }}>Riprova</span>
        </button>
      </div>
    );
  }

  if (propertyLoading || !form) {
    return (
      <div className="max-w-3xl">
        <p style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "13px", color: "#8A8371" }}>Caricamento dati struttura...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6 sticky top-0 z-10 -mx-1 px-1 py-2" style={{ backgroundColor: "#EDE7D8" }}>
        <div>
          <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", color: "#8A8371" }}>
            {saveState === "error" ? saveError : "Le modifiche vengono scritte sul database quando premete Salva."}
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saveState === "saving"}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full active:scale-[0.98] transition-transform shrink-0"
          style={{ backgroundColor: saveState === "saved" ? TEAL : saveState === "error" ? "#B33A2E" : CLAY, opacity: saveState === "saving" ? 0.7 : 1 }}
        >
          {saveState === "saved" ? <Check size={14} color={PARCHMENT} /> : <Save size={14} color={PARCHMENT} />}
          <span style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "12.5px", fontWeight: 600, color: PARCHMENT }}>
            {saveState === "saving" ? "Salvataggio..." : saveState === "saved" ? "Salvato ✓" : saveState === "error" ? "Riprova" : "Salva modifiche"}
          </span>
        </button>
      </div>

      <Section eyebrow="ACCESSO OSPITI" title="Link della vostra struttura">
        <p style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "11.5px", color: "#8A8371", marginBottom: "12px", lineHeight: 1.5 }}>
          Ogni struttura ha un link unico e permanente: apritelo o condividetelo per vedere esattamente cosa vedrà l'ospite (la Home, i consigli, gli orari...). Lo stesso link lo trovate già pronto per QR code, email e WhatsApp.
        </p>
        <div className="flex items-center gap-2 mb-3">
          <span
            className="flex-1 px-3 py-2.5 rounded-xl"
            style={{ backgroundColor: "#F1EAD9", border: `1px solid ${LINE}`, fontFamily: "'IBM Plex Mono', monospace", fontSize: "11.5px", color: "#6B6455", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
          >
            {guestLink}
          </span>
          <button
            onClick={() => { setLinkCopied(true); setTimeout(() => setLinkCopied(false), 2000); if (navigator.clipboard) navigator.clipboard.writeText(guestLink); }}
            className="px-3.5 py-2.5 rounded-xl shrink-0"
            style={{ backgroundColor: linkCopied ? TEAL : CLAY }}
          >
            <span style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "12px", fontWeight: 600, color: PARCHMENT }}>
              {linkCopied ? "Copiato ✓" : "Copia link"}
            </span>
          </button>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <a
            href={guestLink || undefined}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 rounded-full"
            style={{ border: `1px solid ${LINE}`, opacity: guestLink ? 1 : 0.5, pointerEvents: guestLink ? "auto" : "none" }}
          >
            <ExternalLink size={12} color={INK} />
            <span style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "11.5px", fontWeight: 600, color: INK }}>Apri come ospite</span>
          </a>
          <button
            onClick={() => setQrOpen(true)}
            disabled={!guestLink}
            className="flex items-center gap-1.5 px-3 py-2 rounded-full"
            style={{ border: `1px solid ${LINE}`, opacity: guestLink ? 1 : 0.5 }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="7" height="7" stroke={INK} strokeWidth="2" /><rect x="14" y="3" width="7" height="7" stroke={INK} strokeWidth="2" /><rect x="3" y="14" width="7" height="7" stroke={INK} strokeWidth="2" /><rect x="14" y="14" width="3" height="3" fill={INK} /><rect x="18" y="18" width="3" height="3" fill={INK} /></svg>
            <span style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "11.5px", fontWeight: 600, color: INK }}>Genera QR code</span>
          </button>
        </div>
        {qrOpen && guestLink && (
          <div className="mt-4 flex items-center gap-4 p-4 rounded-xl" style={{ backgroundColor: "#F1EAD9", border: `1px solid ${LINE}` }}>
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(guestLink)}`}
              alt="QR code del link struttura"
              width={110}
              height={110}
              className="rounded-lg shrink-0"
              style={{ backgroundColor: "#fff" }}
            />
            <div>
              <p style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "12px", color: "#8A8371", lineHeight: 1.5, marginBottom: "8px" }}>
                Inquadrando questo QR code si apre direttamente la Home dell'app per gli ospiti di questa struttura. Potete stamparlo o inserirlo in una locandina.
              </p>
              <button onClick={() => setQrOpen(false)} className="px-3 py-1.5 rounded-full" style={{ border: `1px solid ${LINE}` }}>
                <span style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "11px", fontWeight: 600, color: INK }}>Chiudi</span>
              </button>
            </div>
          </div>
        )}
      </Section>

      <Section eyebrow="ANAGRAFICA" title="Informazioni generali">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <Field label="Nome struttura">
            <input value={form.name} onChange={(e) => set("name", e.target.value)} className="w-full px-3 py-2.5 rounded-xl outline-none" style={inputStyle()} />
          </Field>
          <Field label="Indirizzo">
            <input value={form.address} onChange={(e) => set("address", e.target.value)} className="w-full px-3 py-2.5 rounded-xl outline-none" style={inputStyle()} />
          </Field>
        </div>
        <Field label="Descrizione (visibile agli ospiti)">
          <textarea
            rows={3}
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl outline-none resize-none"
            style={inputStyle()}
          />
        </Field>
      </Section>

      <Section eyebrow="POSIZIONE" title="Dove si trova la struttura">
        <p style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "11.5px", color: "#8A8371", marginBottom: "12px", lineHeight: 1.5 }}>
          Obbligatoria per ogni struttura: serve a calcolare le distanze dei consigli e a mostrare la posizione nell'app ospite.
        </p>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <Field label="Latitudine">
            <input
              value={form.latitude}
              onChange={(e) => set("latitude", e.target.value)}
              placeholder="Es. 44.1069"
              className="w-full px-3 py-2.5 rounded-xl outline-none"
              style={{ ...inputStyle(), fontFamily: "'IBM Plex Mono', monospace" }}
            />
          </Field>
          <Field label="Longitudine">
            <input
              value={form.longitude}
              onChange={(e) => set("longitude", e.target.value)}
              placeholder="Es. 9.7307"
              className="w-full px-3 py-2.5 rounded-xl outline-none"
              style={{ ...inputStyle(), fontFamily: "'IBM Plex Mono', monospace" }}
            />
          </Field>
        </div>
        <button
          onClick={detectLocation}
          disabled={geoStatus === "loading"}
          className="flex items-center gap-1.5 mb-2 px-3.5 py-2 rounded-full"
          style={{ border: `1px solid ${LINE}`, opacity: geoStatus === "loading" ? 0.7 : 1 }}
        >
          <MapPin size={13} color={TEAL} />
          <span style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "12px", fontWeight: 600, color: INK }}>
            {geoStatus === "loading" ? "Rilevamento in corso..." : "Rileva la mia posizione attuale"}
          </span>
        </button>
        {geoStatus === "done" && (
          <p style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "11px", color: TEAL, marginBottom: "12px" }}>
            ✓ Posizione rilevata dal browser (ricordate di premere "Salva modifiche")
          </p>
        )}
        {geoStatus === "error" && (
          <p style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "11px", color: CLAY, marginBottom: "12px", lineHeight: 1.5 }}>
            {geoErrorMsg || "Non riesco ad accedere alla posizione: inserite le coordinate a mano."}
          </p>
        )}
        {geoStatus !== "done" && geoStatus !== "error" && <div style={{ marginBottom: "4px" }} />}
        {(() => {
          const lat = parseFloat(form.latitude);
          const lng = parseFloat(form.longitude);
          const valid = Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
          if (!valid) {
            return (
              <div
                className="relative rounded-xl h-40 overflow-hidden flex items-center justify-center"
                style={{ backgroundColor: "#EFE7D3", border: `1px dashed ${LINE}` }}
              >
                <span style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "11.5px", color: "#8A8371" }}>
                  Inserite coordinate valide per vedere l'anteprima della mappa.
                </span>
              </div>
            );
          }
          const delta = 0.01;
          const bbox = `${lng - delta}%2C${lat - delta}%2C${lng + delta}%2C${lat + delta}`;
          const osmSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lng}`;
          const gmapsHref = `https://www.google.com/maps?q=${lat},${lng}`;
          return (
            <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${LINE}` }}>
              <iframe
                title="Anteprima posizione struttura"
                src={osmSrc}
                className="w-full h-40 block"
                style={{ border: 0 }}
                loading="lazy"
              />
              <div className="flex items-center justify-between px-3 py-2" style={{ backgroundColor: PAPER }}>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", color: "#8A8371" }}>{lat.toFixed(5)}, {lng.toFixed(5)}</span>
                <a href={gmapsHref} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1">
                  <ExternalLink size={11} color={TEAL} />
                  <span style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "11px", fontWeight: 600, color: TEAL }}>Apri in Google Maps</span>
                </a>
              </div>
            </div>
          );
        })()}
      </Section>

      <Section eyebrow="SOGGIORNO" title="Orari e contatti">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <Field label="Orario check-in">
            <div className="relative">
              <Clock size={14} color="#8A8371" className="absolute left-3 top-1/2 -translate-y-1/2" />
              <input value={form.check_in_time} onChange={(e) => set("check_in_time", e.target.value)} className="w-full pl-9 pr-3 py-2.5 rounded-xl outline-none" style={inputStyle()} />
            </div>
          </Field>
          <Field label="Orario check-out">
            <div className="relative">
              <Clock size={14} color="#8A8371" className="absolute left-3 top-1/2 -translate-y-1/2" />
              <input value={form.check_out_time} onChange={(e) => set("check_out_time", e.target.value)} className="w-full pl-9 pr-3 py-2.5 rounded-xl outline-none" style={inputStyle()} />
            </div>
          </Field>
          <Field label="Email di contatto">
            <input value={form.contact_email} onChange={(e) => set("contact_email", e.target.value)} className="w-full px-3 py-2.5 rounded-xl outline-none" style={inputStyle()} />
          </Field>
          <Field label="Telefono">
            <div className="relative">
              <Phone size={14} color="#8A8371" className="absolute left-3 top-1/2 -translate-y-1/2" />
              <input value={form.contact_phone} onChange={(e) => set("contact_phone", e.target.value)} className="w-full pl-9 pr-3 py-2.5 rounded-xl outline-none" style={inputStyle()} />
            </div>
          </Field>
        </div>
      </Section>

      <Section eyebrow="CONNETTIVITÀ" title="Wi-Fi e regole della casa">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <Field label="Nome rete (SSID)">
            <div className="relative">
              <Wifi size={14} color="#8A8371" className="absolute left-3 top-1/2 -translate-y-1/2" />
              <input value={form.wifi_ssid} onChange={(e) => set("wifi_ssid", e.target.value)} className="w-full pl-9 pr-3 py-2.5 rounded-xl outline-none" style={inputStyle()} />
            </div>
          </Field>
          <Field label="Password Wi-Fi">
            <input value={form.wifi_password} onChange={(e) => set("wifi_password", e.target.value)} className="w-full px-3 py-2.5 rounded-xl outline-none" style={inputStyle()} />
          </Field>
        </div>
        <Field label="Regole della casa">
          <textarea
            rows={3}
            value={form.house_rules}
            onChange={(e) => set("house_rules", e.target.value)}
            placeholder="Es. Non fumare in camera, silenzio dopo le 23:00, animali ammessi su richiesta..."
            className="w-full px-3 py-2.5 rounded-xl outline-none resize-none"
            style={inputStyle()}
          />
        </Field>
      </Section>

      <Section eyebrow="SICUREZZA" title="Numeri di emergenza">
        <div className="space-y-2.5">
          {emergency.map((row, i) => (
            <div key={i} className="flex items-center gap-2.5">
              <ShieldAlert size={14} color={CLAY} className="shrink-0" />
              <input
                value={row.label}
                onChange={(e) => updateEmergency(i, "label", e.target.value)}
                placeholder="Etichetta"
                className="w-40 px-3 py-2 rounded-xl outline-none"
                style={inputStyle()}
              />
              <input
                value={row.number}
                onChange={(e) => updateEmergency(i, "number", e.target.value)}
                placeholder="Numero"
                className="flex-1 px-3 py-2 rounded-xl outline-none"
                style={{ ...inputStyle(), fontFamily: "'IBM Plex Mono', monospace" }}
              />
              <button onClick={() => removeEmergency(i)} className="p-2 rounded-lg" style={{ backgroundColor: "#F1EAD9" }}>
                <Trash2 size={14} color="#8A8371" />
              </button>
            </div>
          ))}
          <button onClick={addEmergency} className="flex items-center gap-1.5 mt-1 px-3 py-2 rounded-xl" style={{ border: `1px dashed ${LINE}` }}>
            <Plus size={13} color={TEAL} />
            <span style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "12px", color: TEAL, fontWeight: 600 }}>Aggiungi numero</span>
          </button>
        </div>
      </Section>

      <Section eyebrow="COMUNICAZIONI" title="Avviso in evidenza">
        <p style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "11.5px", color: "#8A8371", marginBottom: "12px", lineHeight: 1.5 }}>
          Un messaggio ben visibile in cima alla Home dell'app ospite — utile per manutenzioni, chiusure temporanee di servizi o avvisi importanti.
        </p>
        <div className="flex items-center gap-2 mb-4">
          <button onClick={() => set("notice_active", !form.notice_active)} className="flex items-center gap-2">
            <div className="w-9 h-5 rounded-full flex items-center px-0.5" style={{ backgroundColor: form.notice_active ? TEAL : "#D8CDB2", justifyContent: form.notice_active ? "flex-end" : "flex-start" }}>
              <div className="w-4 h-4 rounded-full bg-white" />
            </div>
          </button>
          <span style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "12.5px", fontWeight: 600, color: INK }}>
            {form.notice_active ? "Avviso visibile agli ospiti" : "Avviso nascosto"}
          </span>
        </div>
        <div className="grid grid-cols-1 gap-4">
          <Field label="Titolo" hint="Es. Manutenzione piscina">
            <input value={form.notice_title} onChange={(e) => set("notice_title", e.target.value)} placeholder="Es. Manutenzione piscina" className="w-full px-3 py-2.5 rounded-xl outline-none" style={inputStyle()} />
          </Field>
          <Field label="Messaggio">
            <textarea
              rows={2}
              value={form.notice_message}
              onChange={(e) => set("notice_message", e.target.value)}
              placeholder="Es. La piscina non sarà agibile dalle 8:00 alle 10:00 per manutenzione. Grazie per la collaborazione."
              className="w-full px-3 py-2.5 rounded-xl outline-none resize-none"
              style={inputStyle()}
            />
          </Field>
        </div>
      </Section>

      <Section eyebrow="ASPETTO" title="Foto e branding">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <Field label="Foto di copertina">
            <ImageUploadBox imageUrl={form.cover_photo_url} onUploaded={(url) => set("cover_photo_url", url)} onRemove={() => set("cover_photo_url", null)} folder="cover" />
          </Field>
          <Field label="Logo struttura" hint="Comparirà nell'app ospite di questa struttura.">
            <ImageUploadBox imageUrl={form.logo_url} onUploaded={(url) => set("logo_url", url)} onRemove={() => set("logo_url", null)} folder="logo" />
          </Field>
        </div>
        <p style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "10.5px", color: "#8A8371", marginBottom: "12px" }}>
          Le foto vengono caricate subito su Supabase Storage; per collegarle alla struttura ricordate comunque di premere "Salva modifiche" qui sopra.
        </p>
        <Field label="Colore del brand" hint="Usato per pulsanti e accenti nell'app ospite.">
          <div className="flex items-center gap-2.5">
            {["#1B2A41", "#C2542E", "#2F5D62", "#D0AC80"].map((c) => (
              <button
                key={c}
                onClick={() => set("brand_color", c)}
                className="w-8 h-8 rounded-full"
                style={{ backgroundColor: c, border: form.brand_color === c ? `2px solid ${CLAY}` : "1px solid transparent" }}
              />
            ))}
          </div>
        </Field>
      </Section>

      <Section eyebrow="CAMERE" title="Camere">
        {roomsLoading ? (
          <p style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "12px", color: "#8A8371" }}>Caricamento camere...</p>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {rooms.map((room) => (
              <div key={room.id} className="rounded-xl overflow-hidden" style={{ border: `1px solid ${LINE}` }}>
                <RoomPhotoSlider
                  photos={room.photo_urls || []}
                  onAdd={(url) => updateRoomPhotos(room.id, [...(room.photo_urls || []), url])}
                  onRemove={(i) => updateRoomPhotos(room.id, (room.photo_urls || []).filter((_, idx) => idx !== i))}
                />
                <div className="p-2 space-y-1.5" style={{ backgroundColor: PAPER }}>
                  <div className="flex flex-wrap gap-1">
                    {ROOM_TYPES.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => updateRoomType(room.id, t.id)}
                        className="px-1.5 py-0.5 rounded-full"
                        style={{ backgroundColor: room.room_type === t.id ? INK : "#F1EAD9", border: `1px solid ${room.room_type === t.id ? INK : LINE}` }}
                      >
                        <span style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "8.5px", fontWeight: 600, color: room.room_type === t.id ? PARCHMENT : INK }}>
                          {t.label}
                        </span>
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-1">
                    <input
                      value={room.name}
                      onChange={(e) => renameRoom(room.id, e.target.value)}
                      placeholder="Nome camera (facoltativo)"
                      className="flex-1 min-w-0 outline-none"
                      style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "11.5px", fontWeight: 600, color: INK, backgroundColor: "transparent" }}
                    />
                    <button onClick={() => removeRoom(room.id)} className="p-1 rounded-full shrink-0" style={{ backgroundColor: "#F1EAD9" }}>
                      <X size={10} color="#8A8371" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            <button onClick={addRoom} className="rounded-xl flex flex-col items-center justify-center gap-1.5 h-full min-h-[92px]" style={{ border: `1px dashed ${LINE}` }}>
              <Plus size={16} color={TEAL} />
              <span style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "11px", color: TEAL, fontWeight: 600 }}>Aggiungi camera</span>
            </button>
          </div>
        )}
        <p style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "10.5px", color: "#8A8371", marginTop: "8px" }}>
          Nome, foto, aggiunta e rimozione camere si salvano subito, in automatico (non serve premere "Salva modifiche" qui sopra).
        </p>
      </Section>

      <Section eyebrow="SOCIAL" title="Canali social e sito web">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Instagram">
            <div className="relative">
              <Instagram size={14} color="#8A8371" className="absolute left-3 top-1/2 -translate-y-1/2" />
              <input value={form.instagram_url} onChange={(e) => set("instagram_url", e.target.value)} placeholder="https://instagram.com/..." className="w-full pl-9 pr-3 py-2.5 rounded-xl outline-none" style={inputStyle()} />
            </div>
          </Field>
          <Field label="Facebook">
            <div className="relative">
              <Facebook size={14} color="#8A8371" className="absolute left-3 top-1/2 -translate-y-1/2" />
              <input value={form.facebook_url} onChange={(e) => set("facebook_url", e.target.value)} placeholder="https://facebook.com/..." className="w-full pl-9 pr-3 py-2.5 rounded-xl outline-none" style={inputStyle()} />
            </div>
          </Field>
          <Field label="TikTok">
            <div className="relative">
              <Music2 size={14} color="#8A8371" className="absolute left-3 top-1/2 -translate-y-1/2" />
              <input value={form.tiktok_url} onChange={(e) => set("tiktok_url", e.target.value)} placeholder="https://tiktok.com/@..." className="w-full pl-9 pr-3 py-2.5 rounded-xl outline-none" style={inputStyle()} />
            </div>
          </Field>
          <Field label="Sito web">
            <div className="relative">
              <LinkIcon size={14} color="#8A8371" className="absolute left-3 top-1/2 -translate-y-1/2" />
              <input value={form.website_url} onChange={(e) => set("website_url", e.target.value)} placeholder="https://..." className="w-full pl-9 pr-3 py-2.5 rounded-xl outline-none" style={inputStyle()} />
            </div>
          </Field>
        </div>
      </Section>
    </div>
  );
}


const CATEGORIES = [
  { id: "mangiare", label: "Mangiare", Icon: Utensils },
  { id: "spiagge", label: "Spiagge", Icon: Waves },
  { id: "vedere", label: "Da vedere", Icon: Landmark },
  { id: "shopping", label: "Shopping", Icon: ShoppingBag },
  { id: "parchi", label: "Parchi tematici", Icon: Ticket },
];

// La UI usa 5 categorie semplici, ma la tabella "places" nel DB usa un
// enum più ampio (place_category): mappiamo le due cose in entrambe le
// direzioni, senza dover cambiare né lo schema né la UI esistente.
const CATEGORY_TO_DB = { mangiare: "ristorante", spiagge: "spiaggia", vedere: "attrazione", shopping: "shopping", parchi: "parco_tematico" };
const CATEGORY_FROM_DB = {
  ristorante: "mangiare", bar: "mangiare", spiaggia: "spiagge", attrazione: "vedere",
  shopping: "shopping", prodotto_locale: "shopping", servizio: "vedere", altro: "vedere",
  parco_tematico: "parchi",
};

function placeRowToForm(row) {
  return {
    id: row.id,
    category: CATEGORY_FROM_DB[row.category] || "mangiare",
    name: row.name || "",
    tip: row.host_tip || "",
    discount: row.discount_info || "",
    address: row.address || "",
    phone: row.phone || "",
    officialUrl: row.official_url || "",
    published: row.is_published,
    seasonal: !!row.season_start,
    photos: row.photo_urls || [],
  };
}

function CategoryBadge({ category }) {
  const meta = CATEGORIES.find((c) => c.id === category);
  if (!meta) return null;
  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full w-fit" style={{ backgroundColor: "#F1EAD9" }}>
      <meta.Icon size={11} color={TEAL} />
      <span style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "11px", fontWeight: 600, color: INK }}>{meta.label}</span>
    </div>
  );
}

function PlaceEditor({ place, onClose, onSave, saving }) {
  const [form, setForm] = useState(
    place || { category: "mangiare", name: "", tip: "", discount: "", address: "", phone: "", officialUrl: "", published: true, seasonal: false, photos: [] }
  );

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center px-6" style={{ backgroundColor: "rgba(27,42,65,0.5)" }}>
      <div className="w-full max-w-lg rounded-2xl overflow-hidden" style={{ backgroundColor: PAPER, maxHeight: "88vh", overflowY: "auto" }}>
        <div className="flex items-center justify-between px-6 pt-5 pb-4" style={{ borderBottom: `1px solid ${LINE}` }}>
          <h2 className="italic" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "22px", color: INK }}>
            {place ? "Modifica luogo" : "Nuovo luogo"}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-full" style={{ backgroundColor: "#F1EAD9" }}>
            <X size={15} color={INK} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <Field label="Categoria">
            <div className="flex gap-2 flex-wrap">
              {CATEGORIES.map(({ id, label, Icon }) => (
                <button
                  key={id}
                  onClick={() => setForm({ ...form, category: id })}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-full"
                  style={{
                    backgroundColor: form.category === id ? INK : "#F1EAD9",
                    border: `1px solid ${form.category === id ? INK : LINE}`,
                  }}
                >
                  <Icon size={13} color={form.category === id ? BRASS : TEAL} />
                  <span style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "12px", fontWeight: 600, color: form.category === id ? PARCHMENT : INK }}>
                    {label}
                  </span>
                </button>
              ))}
            </div>
          </Field>

          <Field label="Nome del luogo">
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Es. Trattoria del Porto" className="w-full px-3 py-2.5 rounded-xl outline-none" style={inputStyle()} />
          </Field>

          <Field label="Indirizzo">
            <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Es. Via Roma 4" className="w-full px-3 py-2.5 rounded-xl outline-none" style={inputStyle()} />
          </Field>

          <Field label="Telefono" hint="Facoltativo — mostrato nella scheda che vede l'ospite.">
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Es. +39 0187 123456" className="w-full px-3 py-2.5 rounded-xl outline-none" style={inputStyle()} />
          </Field>

          <Field label="Consiglio personalizzato" hint="Il tocco personale che gli ospiti leggeranno sulla scheda.">
            <textarea rows={2} value={form.tip} onChange={(e) => setForm({ ...form, tip: e.target.value })} placeholder="Es. Chiedete il pesto fatto in casa da Maria..." className="w-full px-3 py-2.5 rounded-xl outline-none resize-none" style={inputStyle()} />
          </Field>

          <Field label="Sconto o convenzione" hint="Lasciate vuoto se non prevista.">
            <input value={form.discount} onChange={(e) => setForm({ ...form, discount: e.target.value })} placeholder="Es. -10% ospiti" className="w-full px-3 py-2.5 rounded-xl outline-none" style={inputStyle()} />
          </Field>

          <Field label="Link ufficiale" hint="Sito, menù online o pagina social del luogo (facoltativo).">
            <div className="relative">
              <LinkIcon size={14} color="#8A8371" className="absolute left-3 top-1/2 -translate-y-1/2" />
              <input value={form.officialUrl || ""} onChange={(e) => setForm({ ...form, officialUrl: e.target.value })} placeholder="https://..." className="w-full pl-9 pr-3 py-2.5 rounded-xl outline-none" style={inputStyle()} />
            </div>
          </Field>

          <PhotoAttachField
            photos={form.photos || []}
            onAdd={(url) => setForm({ ...form, photos: [...(form.photos || []), url] })}
            onRemove={(i) => setForm({ ...form, photos: form.photos.filter((_, idx) => idx !== i) })}
            folder="places"
          />

          <div className="flex items-center gap-6 pt-1">
            <button onClick={() => setForm({ ...form, published: !form.published })} className="flex items-center gap-2">
              <div className="w-9 h-5 rounded-full flex items-center px-0.5" style={{ backgroundColor: form.published ? TEAL : "#D8CDB2", justifyContent: form.published ? "flex-end" : "flex-start" }}>
                <div className="w-4 h-4 rounded-full bg-white" />
              </div>
              <span style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "12.5px", color: INK }}>Pubblicato</span>
            </button>
            <button onClick={() => setForm({ ...form, seasonal: !form.seasonal })} className="flex items-center gap-2">
              <div className="w-9 h-5 rounded-full flex items-center px-0.5" style={{ backgroundColor: form.seasonal ? TEAL : "#D8CDB2", justifyContent: form.seasonal ? "flex-end" : "flex-start" }}>
                <div className="w-4 h-4 rounded-full bg-white" />
              </div>
              <span style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "12.5px", color: INK }}>Calendarizzato stagionalmente</span>
            </button>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4" style={{ borderTop: `1px solid ${LINE}` }}>
          <button onClick={onClose} className="px-4 py-2.5 rounded-full" style={{ border: `1px solid ${LINE}` }}>
            <span style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "12.5px", fontWeight: 600, color: INK }}>Annulla</span>
          </button>
          <button
            onClick={() => onSave(form)}
            disabled={saving}
            className="px-4 py-2.5 rounded-full active:scale-[0.98] transition-transform"
            style={{ backgroundColor: CLAY, opacity: saving ? 0.7 : 1 }}
          >
            <span style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "12.5px", fontWeight: 600, color: PARCHMENT }}>
              {saving ? "Salvataggio..." : "Salva luogo"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

function PlacesManager() {
  const { property } = usePropertyContext();
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState("tutti");
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);

  const load = async () => {
    if (!property?.id) return;
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { data, error: fetchError } = await supabase
      .from("places")
      .select("*")
      .eq("property_id", property.id)
      .order("sort_order", { ascending: true });
    if (fetchError) setError(fetchError.message);
    else setPlaces((data || []).map(placeRowToForm));
    setLoading(false);
  };

  useEffect(() => { load(); }, [property?.id]);

  const filtered = filter === "tutti" ? places : places.filter((p) => p.category === filter);

  const save = async (form) => {
    if (!property?.id) return;
    setSaving(true);
    setError("");
    const supabase = createClient();
    const payload = {
      property_id: property.id,
      category: CATEGORY_TO_DB[form.category] || "altro",
      name: form.name.trim() || "Luogo senza nome",
      host_tip: form.tip?.trim() || null,
      discount_info: form.discount?.trim() || null,
      address: form.address?.trim() || null,
      phone: form.phone?.trim() || null,
      official_url: form.officialUrl?.trim() || null,
      is_published: !!form.published,
      photo_urls: form.photos || [],
      season_start: form.seasonal ? new Date().toISOString().slice(0, 10) : null,
      season_end: null,
    };
    const query = form.id
      ? supabase.from("places").update(payload).eq("id", form.id).select("*").single()
      : supabase.from("places").insert(payload).select("*").single();
    const { data, error: saveError } = await query;
    setSaving(false);
    if (saveError) {
      setError(saveError.message);
      return;
    }
    const saved = placeRowToForm(data);
    setPlaces((prev) => (prev.some((p) => p.id === saved.id) ? prev.map((p) => (p.id === saved.id ? saved : p)) : [...prev, saved]));
    setEditing(null);
    setCreating(false);
  };

  const togglePublished = async (id) => {
    const target = places.find((p) => p.id === id);
    if (!target) return;
    const next = !target.published;
    setPlaces(places.map((p) => (p.id === id ? { ...p, published: next } : p)));
    const supabase = createClient();
    const { error: updateError } = await supabase.from("places").update({ is_published: next }).eq("id", id);
    if (updateError) setError(updateError.message);
  };

  return (
    <div className="max-w-4xl">
      {error && <p style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "12px", color: CLAY, marginBottom: "10px" }}>{error}</p>}
      <div className="flex items-center justify-between mb-5">
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFilter("tutti")}
            className="px-3.5 py-2 rounded-full"
            style={{ backgroundColor: filter === "tutti" ? INK : PAPER, border: `1px solid ${filter === "tutti" ? INK : LINE}` }}
          >
            <span style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "12px", fontWeight: 600, color: filter === "tutti" ? PARCHMENT : INK }}>
              Tutti ({places.length})
            </span>
          </button>
          {CATEGORIES.map(({ id, label, Icon }) => {
            const count = places.filter((p) => p.category === id).length;
            const active = filter === id;
            return (
              <button
                key={id}
                onClick={() => setFilter(id)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-full"
                style={{ backgroundColor: active ? INK : PAPER, border: `1px solid ${active ? INK : LINE}` }}
              >
                <Icon size={12} color={active ? BRASS : TEAL} />
                <span style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "12px", fontWeight: 600, color: active ? PARCHMENT : INK }}>
                  {label} ({count})
                </span>
              </button>
            );
          })}
        </div>
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-full shrink-0 active:scale-[0.98] transition-transform"
          style={{ backgroundColor: CLAY }}
        >
          <Plus size={14} color={PARCHMENT} />
          <span style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "12.5px", fontWeight: 600, color: PARCHMENT }}>Nuovo luogo</span>
        </button>
      </div>

      {loading ? (
        <p style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "13px", color: "#8A8371" }}>Caricamento luoghi...</p>
      ) : (
        <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${LINE}` }}>
          {filtered.map((p, i) => (
            <div
              key={p.id}
              className="flex items-center gap-4 px-5 py-4"
              style={{ backgroundColor: PAPER, borderTop: i === 0 ? "none" : `1px solid ${LINE}` }}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <p style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "13.5px", fontWeight: 600, color: INK }}>{p.name}</p>
                  {p.discount && (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ backgroundColor: "#F1EAD9" }}>
                      <Tag size={9} color={CLAY} />
                      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "9.5px", color: CLAY }}>{p.discount}</span>
                    </span>
                  )}
                  {p.seasonal && (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ backgroundColor: "#F1EAD9" }}>
                      <CalendarRange size={9} color={TEAL} />
                      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "9.5px", color: TEAL }}>stagionale</span>
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <CategoryBadge category={p.category} />
                  <span style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "11.5px", color: "#8A8371" }}>{p.address}</span>
                </div>
              </div>

              <button onClick={() => togglePublished(p.id)} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg shrink-0">
                {p.published ? <Eye size={14} color={TEAL} /> : <EyeOff size={14} color="#B4AC97" />}
                <span style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "11.5px", color: p.published ? TEAL : "#B4AC97" }}>
                  {p.published ? "Pubblicato" : "Bozza"}
                </span>
              </button>

              <button onClick={() => setEditing(p)} className="p-2 rounded-lg shrink-0" style={{ backgroundColor: "#F1EAD9" }}>
                <Pencil size={13} color={INK} />
              </button>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="py-10 text-center" style={{ backgroundColor: PAPER }}>
              <span style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "12.5px", color: "#8A8371" }}>Nessun luogo in questa categoria.</span>
            </div>
          )}
        </div>
      )}

      {(editing || creating) && (
        <PlaceEditor
          place={editing}
          saving={saving}
          onClose={() => { setEditing(null); setCreating(false); }}
          onSave={save}
        />
      )}
    </div>
  );
}


function serviceRowToForm(row) {
  return {
    id: row.id,
    name: row.name || "",
    desc: row.description || "",
    price: row.price != null ? String(row.price) : "",
    duration: row.duration_label || "",
    bookable: row.is_bookable,
    active: row.is_active,
    photos: row.photo_url ? [row.photo_url] : [],
  };
}

function ServiceEditor({ service, onClose, onSave, saving }) {
  const [form, setForm] = useState(service || { name: "", desc: "", price: "", duration: "", bookable: true, active: true, photos: [] });
  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center px-6" style={{ backgroundColor: "rgba(27,42,65,0.5)" }}>
      <div className="w-full max-w-lg rounded-2xl overflow-hidden" style={{ backgroundColor: PAPER, maxHeight: "88vh", overflowY: "auto" }}>
        <div className="flex items-center justify-between px-6 pt-5 pb-4" style={{ borderBottom: `1px solid ${LINE}` }}>
          <h2 className="italic" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "22px", color: INK }}>
            {service ? "Modifica servizio" : "Nuovo servizio"}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-full" style={{ backgroundColor: "#F1EAD9" }}>
            <X size={15} color={INK} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <Field label="Nome del servizio">
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Es. Noleggio bici elettriche" className="w-full px-3 py-2.5 rounded-xl outline-none" style={inputStyle()} />
          </Field>
          <Field label="Descrizione">
            <textarea rows={2} value={form.desc} onChange={(e) => setForm({ ...form, desc: e.target.value })} className="w-full px-3 py-2.5 rounded-xl outline-none resize-none" style={inputStyle()} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Prezzo (€)">
              <input value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="25" className="w-full px-3 py-2.5 rounded-xl outline-none" style={{ ...inputStyle(), fontFamily: "'IBM Plex Mono', monospace" }} />
            </Field>
            <Field label="Durata">
              <input value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} placeholder="Es. 2 ore" className="w-full px-3 py-2.5 rounded-xl outline-none" style={inputStyle()} />
            </Field>
          </div>
          <PhotoAttachField
            photos={form.photos || []}
            onAdd={(url) => setForm({ ...form, photos: [url] })}
            onRemove={(i) => setForm({ ...form, photos: form.photos.filter((_, idx) => idx !== i) })}
            folder="services"
          />
          <button onClick={() => setForm({ ...form, active: !form.active })} className="flex items-center gap-2">
            <div className="w-9 h-5 rounded-full flex items-center px-0.5" style={{ backgroundColor: form.active ? TEAL : "#D8CDB2", justifyContent: form.active ? "flex-end" : "flex-start" }}>
              <div className="w-4 h-4 rounded-full bg-white" />
            </div>
            <span style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "12.5px", color: INK }}>Attivo e visibile agli ospiti</span>
          </button>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4" style={{ borderTop: `1px solid ${LINE}` }}>
          <button onClick={onClose} className="px-4 py-2.5 rounded-full" style={{ border: `1px solid ${LINE}` }}>
            <span style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "12.5px", fontWeight: 600, color: INK }}>Annulla</span>
          </button>
          <button onClick={() => onSave(form)} disabled={saving} className="px-4 py-2.5 rounded-full active:scale-[0.98] transition-transform" style={{ backgroundColor: CLAY, opacity: saving ? 0.7 : 1 }}>
            <span style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "12.5px", fontWeight: 600, color: PARCHMENT }}>{saving ? "Salvataggio..." : "Salva servizio"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function ServicesManager() {
  const { property } = usePropertyContext();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);

  const load = async () => {
    if (!property?.id) return;
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { data, error: fetchError } = await supabase
      .from("services")
      .select("*")
      .eq("property_id", property.id)
      .order("sort_order", { ascending: true });
    if (fetchError) setError(fetchError.message);
    else setServices((data || []).map(serviceRowToForm));
    setLoading(false);
  };

  useEffect(() => { load(); }, [property?.id]);

  const save = async (form) => {
    if (!property?.id) return;
    setSaving(true);
    setError("");
    const supabase = createClient();
    const payload = {
      property_id: property.id,
      name: form.name.trim() || "Servizio senza nome",
      description: form.desc?.trim() || null,
      price: form.price ? parseFloat(form.price) : null,
      duration_label: form.duration?.trim() || null,
      is_bookable: form.bookable !== false,
      is_active: !!form.active,
      photo_url: (form.photos && form.photos[0]) || null,
    };
    const query = form.id
      ? supabase.from("services").update(payload).eq("id", form.id).select("*").single()
      : supabase.from("services").insert(payload).select("*").single();
    const { data, error: saveError } = await query;
    setSaving(false);
    if (saveError) {
      setError(saveError.message);
      return;
    }
    const saved = serviceRowToForm(data);
    setServices((prev) => (prev.some((s) => s.id === saved.id) ? prev.map((s) => (s.id === saved.id ? saved : s)) : [...prev, saved]));
    setEditing(null);
    setCreating(false);
  };

  return (
    <div className="max-w-4xl">
      {error && <p style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "12px", color: CLAY, marginBottom: "10px" }}>{error}</p>}
      <div className="flex justify-end mb-5">
        <button onClick={() => setCreating(true)} className="flex items-center gap-1.5 px-4 py-2.5 rounded-full active:scale-[0.98] transition-transform" style={{ backgroundColor: CLAY }}>
          <Plus size={14} color={PARCHMENT} />
          <span style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "12.5px", fontWeight: 600, color: PARCHMENT }}>Nuovo servizio</span>
        </button>
      </div>
      {loading ? (
        <p style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "13px", color: "#8A8371" }}>Caricamento servizi...</p>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {services.map((s) => (
            <div key={s.id} className="rounded-2xl p-5" style={{ backgroundColor: PAPER, border: `1px solid ${LINE}` }}>
              <div className="flex items-start justify-between mb-2">
                <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "19px", color: INK }}>{s.name}</p>
                <span
                  className="px-2 py-0.5 rounded-full shrink-0"
                  style={{ backgroundColor: s.active ? "#E4EEE9" : "#F1EAD9" }}
                >
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "9px", color: s.active ? TEAL : "#8A8371" }}>
                    {s.active ? "ATTIVO" : "DISATTIVO"}
                  </span>
                </span>
              </div>
              <p style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "12px", color: "#8A8371", lineHeight: 1.5, marginBottom: "12px" }}>{s.desc}</p>
              <div className="flex items-center justify-between">
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "11px", color: CLAY }}>{s.price} € · {s.duration}</span>
                <button onClick={() => setEditing(s)} className="p-2 rounded-lg" style={{ backgroundColor: "#F1EAD9" }}>
                  <Pencil size={13} color={INK} />
                </button>
              </div>
            </div>
          ))}
          {services.length === 0 && (
            <div className="col-span-2 py-10 text-center rounded-2xl" style={{ backgroundColor: PAPER, border: `1px solid ${LINE}` }}>
              <span style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "12.5px", color: "#8A8371" }}>Nessun servizio configurato.</span>
            </div>
          )}
        </div>
      )}
      {(editing || creating) && (
        <ServiceEditor service={editing} saving={saving} onClose={() => { setEditing(null); setCreating(false); }} onSave={save} />
      )}
    </div>
  );
}


const STATUS_META = {
  pending: { label: "In attesa", bg: "#F1EAD9", text: BRASS },
  confirmed: { label: "Confermata", bg: "#E4EEE9", text: TEAL },
  declined: { label: "Rifiutata", bg: "#F7E3DB", text: CLAY },
  cancelled: { label: "Annullata", bg: "#F7E3DB", text: CLAY },
  completed: { label: "Completata", bg: "#E4EEE9", text: TEAL },
};

function formatBookingWhen(iso) {
  if (!iso) return "Data da confermare";
  try {
    return new Date(iso).toLocaleString("it-IT", { weekday: "short", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
  } catch {
    return iso;
  }
}

function BookingsManager() {
  const { property } = usePropertyContext();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    if (!property?.id) return;
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { data, error: fetchError } = await supabase
      .from("bookings")
      .select("*, services(name)")
      .eq("property_id", property.id)
      .order("created_at", { ascending: false });
    if (fetchError) {
      setError(fetchError.message);
    } else {
      setBookings(data || []);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [property?.id]);

  const setStatus = async (id, status) => {
    const previous = bookings;
    setBookings(bookings.map((b) => (b.id === id ? { ...b, status } : b)));
    const supabase = createClient();
    const { error: updateError } = await supabase.from("bookings").update({ status }).eq("id", id);
    if (updateError) {
      setBookings(previous);
      setError(updateError.message);
    }
  };

  if (loading) {
    return <p style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "13px", color: "#8A8371" }}>Caricamento prenotazioni...</p>;
  }

  return (
    <div className="max-w-4xl">
      {error && <p style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "12px", color: CLAY, marginBottom: "10px" }}>{error}</p>}
      <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${LINE}` }}>
        {bookings.map((b, i) => {
          const meta = STATUS_META[b.status] || STATUS_META.pending;
          return (
            <div key={b.id} className="flex items-center gap-4 px-5 py-4" style={{ backgroundColor: PAPER, borderTop: i === 0 ? "none" : `1px solid ${LINE}` }}>
              <div className="flex-1 min-w-0">
                <p style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "13.5px", fontWeight: 600, color: INK }}>{b.services?.name || "Servizio"}</p>
                <p style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "11.5px", color: "#8A8371", marginTop: "2px" }}>
                  {b.guest_name}{b.guest_contact ? ` (${b.guest_contact})` : ""} · {formatBookingWhen(b.requested_datetime)}
                </p>
                {b.notes && (
                  <p style={{ fontFamily: "'Work Sans', sans-serif", fontStyle: "italic", fontSize: "11px", color: "#6B6455", marginTop: "3px" }}>
                    “{b.notes}”
                  </p>
                )}
              </div>
              <span className="px-2.5 py-1 rounded-full shrink-0" style={{ backgroundColor: meta.bg }}>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "9.5px", color: meta.text }}>{meta.label.toUpperCase()}</span>
              </span>
              <button className="p-2 rounded-lg shrink-0" style={{ backgroundColor: "#E7F7EC" }} title="Contatta su WhatsApp">
                <MessageCircle size={14} color="#25D366" />
              </button>
              {b.status === "pending" && (
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => setStatus(b.id, "confirmed")} className="px-3 py-1.5 rounded-full" style={{ backgroundColor: TEAL }}>
                    <span style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "11.5px", fontWeight: 600, color: PARCHMENT }}>Conferma</span>
                  </button>
                  <button onClick={() => setStatus(b.id, "declined")} className="px-3 py-1.5 rounded-full" style={{ border: `1px solid ${LINE}` }}>
                    <span style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "11.5px", fontWeight: 600, color: INK }}>Rifiuta</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
        {bookings.length === 0 && (
          <div className="py-10 text-center" style={{ backgroundColor: PAPER }}>
            <span style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "12.5px", color: "#8A8371" }}>Nessuna prenotazione ricevuta finora.</span>
          </div>
        )}
      </div>
    </div>
  );
}

const TRIGGER_META = {
  pre_checkin: { label: "Pre check-in" },
  during_stay: { label: "Durante il soggiorno" },
  post_checkout: { label: "Post check-out" },
  custom: { label: "Personalizzato" },
};

function offsetLabel(hours) {
  const h = Number(hours) || 0;
  if (h === 0) return "Al momento dell'evento";
  if (h < 0) return `${Math.abs(h)}h prima`;
  return `${h}h dopo`;
}

function emailRowToForm(row) {
  return {
    id: row.id,
    trigger_type: row.trigger_type,
    subject: row.subject || "",
    body_html: row.body_html || "",
    active: row.is_active,
    offsetHours: row.send_offset_hours ?? 0,
  };
}

function EmailEditor({ template, onClose, onSave, saving }) {
  const [form, setForm] = useState(template || { trigger_type: "pre_checkin", subject: "", body_html: "", active: true, offsetHours: -24 });
  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center px-6" style={{ backgroundColor: "rgba(27,42,65,0.5)" }}>
      <div className="w-full max-w-lg rounded-2xl overflow-hidden" style={{ backgroundColor: PAPER, maxHeight: "88vh", overflowY: "auto" }}>
        <div className="flex items-center justify-between px-6 pt-5 pb-4" style={{ borderBottom: `1px solid ${LINE}` }}>
          <h2 className="italic" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "22px", color: INK }}>
            {template ? "Modifica modello email" : "Nuovo modello email"}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-full" style={{ backgroundColor: "#F1EAD9" }}>
            <X size={15} color={INK} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <Field label="Momento di invio">
            <select value={form.trigger_type} onChange={(e) => setForm({ ...form, trigger_type: e.target.value })} className="w-full px-3 py-2.5 rounded-xl outline-none" style={inputStyle()}>
              {Object.entries(TRIGGER_META).map(([id, m]) => <option key={id} value={id}>{m.label}</option>)}
            </select>
          </Field>
          <Field label="Oggetto email">
            <input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Es. Il vostro arrivo a..." className="w-full px-3 py-2.5 rounded-xl outline-none" style={inputStyle()} />
          </Field>
          <Field label="Testo dell'email">
            <textarea rows={5} value={form.body_html} onChange={(e) => setForm({ ...form, body_html: e.target.value })} placeholder="Scrivete qui il contenuto dell'email..." className="w-full px-3 py-2.5 rounded-xl outline-none resize-none" style={inputStyle()} />
          </Field>
          <Field label="Ore rispetto al check-in/check-out" hint="Negativo = prima (es. -24 = un giorno prima). Positivo = dopo.">
            <input
              type="number"
              value={form.offsetHours}
              onChange={(e) => setForm({ ...form, offsetHours: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl outline-none"
              style={{ ...inputStyle(), fontFamily: "'IBM Plex Mono', monospace" }}
            />
          </Field>
          <button onClick={() => setForm({ ...form, active: !form.active })} className="flex items-center gap-2">
            <div className="w-9 h-5 rounded-full flex items-center px-0.5" style={{ backgroundColor: form.active ? TEAL : "#D8CDB2", justifyContent: form.active ? "flex-end" : "flex-start" }}>
              <div className="w-4 h-4 rounded-full bg-white" />
            </div>
            <span style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "12.5px", color: INK }}>Attivo</span>
          </button>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4" style={{ borderTop: `1px solid ${LINE}` }}>
          <button onClick={onClose} className="px-4 py-2.5 rounded-full" style={{ border: `1px solid ${LINE}` }}>
            <span style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "12.5px", fontWeight: 600, color: INK }}>Annulla</span>
          </button>
          <button onClick={() => onSave(form)} disabled={saving || !form.subject.trim() || !form.body_html.trim()} className="px-4 py-2.5 rounded-full active:scale-[0.98] transition-transform" style={{ backgroundColor: CLAY, opacity: saving ? 0.7 : 1 }}>
            <span style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "12.5px", fontWeight: 600, color: PARCHMENT }}>{saving ? "Salvataggio..." : "Salva modello"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function EmailsManager() {
  const { property } = usePropertyContext();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);

  const load = async () => {
    if (!property?.id) return;
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { data, error: fetchError } = await supabase
      .from("email_templates")
      .select("*")
      .eq("property_id", property.id)
      .order("created_at", { ascending: true });
    if (fetchError) setError(fetchError.message);
    else setTemplates((data || []).map(emailRowToForm));
    setLoading(false);
  };

  useEffect(() => { load(); }, [property?.id]);

  const toggle = async (id) => {
    const target = templates.find((t) => t.id === id);
    if (!target) return;
    const next = !target.active;
    setTemplates(templates.map((t) => (t.id === id ? { ...t, active: next } : t)));
    const supabase = createClient();
    const { error: updateError } = await supabase.from("email_templates").update({ is_active: next }).eq("id", id);
    if (updateError) setError(updateError.message);
  };

  const save = async (form) => {
    if (!property?.id) return;
    setSaving(true);
    setError("");
    const supabase = createClient();
    const payload = {
      property_id: property.id,
      trigger_type: form.trigger_type,
      subject: form.subject.trim(),
      body_html: form.body_html.trim(),
      is_active: !!form.active,
      send_offset_hours: form.offsetHours === "" ? 0 : parseInt(form.offsetHours, 10),
    };
    const query = form.id
      ? supabase.from("email_templates").update(payload).eq("id", form.id).select("*").single()
      : supabase.from("email_templates").insert(payload).select("*").single();
    const { data, error: saveError } = await query;
    setSaving(false);
    if (saveError) {
      setError(saveError.message);
      return;
    }
    const saved = emailRowToForm(data);
    setTemplates((prev) => (prev.some((t) => t.id === saved.id) ? prev.map((t) => (t.id === saved.id ? saved : t)) : [...prev, saved]));
    setEditing(null);
    setCreating(false);
  };

  return (
    <div className="max-w-4xl">
      {error && <p style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "12px", color: CLAY, marginBottom: "10px" }}>{error}</p>}
      {loading ? (
        <p style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "13px", color: "#8A8371" }}>Caricamento modelli email...</p>
      ) : (
        <div className="space-y-3">
          {templates.map((t) => (
            <div key={t.id} className="flex items-center gap-4 rounded-2xl px-5 py-4" style={{ backgroundColor: PAPER, border: `1px solid ${LINE}` }}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: "#F1EAD9" }}>
                <Mail size={16} color={TEAL} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "13.5px", fontWeight: 600, color: INK }}>{TRIGGER_META[t.trigger_type]?.label || t.trigger_type}</p>
                  <span className="px-2 py-0.5 rounded-full" style={{ backgroundColor: "#F1EAD9" }}>
                    <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "9px", color: BRASS }}>{offsetLabel(t.offsetHours).toUpperCase()}</span>
                  </span>
                </div>
                <p style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "12px", color: "#8A8371", marginTop: "2px" }}>{t.subject}</p>
              </div>
              <button onClick={() => toggle(t.id)} className="flex items-center gap-2 shrink-0">
                <div className="w-9 h-5 rounded-full flex items-center px-0.5" style={{ backgroundColor: t.active ? TEAL : "#D8CDB2", justifyContent: t.active ? "flex-end" : "flex-start" }}>
                  <div className="w-4 h-4 rounded-full bg-white" />
                </div>
              </button>
              <button onClick={() => setEditing(t)} className="p-2 rounded-lg shrink-0" style={{ backgroundColor: "#F1EAD9" }}>
                <Pencil size={13} color={INK} />
              </button>
            </div>
          ))}
          <button onClick={() => setCreating(true)} className="w-full flex items-center justify-center gap-1.5 py-3 rounded-2xl" style={{ border: `1px dashed ${LINE}` }}>
            <Plus size={14} color={TEAL} />
            <span style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "12.5px", fontWeight: 600, color: TEAL }}>Nuovo modello email</span>
          </button>
        </div>
      )}
      {(editing || creating) && (
        <EmailEditor template={editing} saving={saving} onClose={() => { setEditing(null); setCreating(false); }} onSave={save} />
      )}
    </div>
  );
}

const PURPOSE_META = {
  fiera_lavoro: { label: "Fiera / Lavoro", bg: "#DCEAFB", text: "#1A5FB4", Icon: Briefcase },
  famiglia: { label: "Famiglia", bg: "#E4EEE9", text: TEAL, Icon: Users },
  coppia: { label: "Coppia", bg: "#FDE3E9", text: "#C4265E", Icon: Star },
  gruppo_amici: { label: "Gruppo amici", bg: "#F1EAD9", text: BRASS, Icon: PartyPopper },
  sport: { label: "Sport", bg: "#F1EAD9", text: "#8A8371", Icon: TrendingUp },
  altro: { label: "Altro", bg: "#F1EAD9", text: "#8A8371", Icon: Star },
};

const CHANNEL_META = {
  booking_com: { label: "Booking.com", bg: "#DCEAFB", text: "#1A5FB4" },
  airbnb: { label: "Airbnb", bg: "#FDE3E9", text: "#C4265E" },
  website: { label: "Sito web", bg: "#E4EEE9", text: TEAL },
  direct: { label: "Diretta", bg: "#F1EAD9", text: BRASS },
  other_ota: { label: "Altro portale", bg: "#F1EAD9", text: "#8A8371" },
  phone_email: { label: "Telefono/Email", bg: "#F1EAD9", text: "#8A8371" },
};

function fmtGuestDate(d) {
  if (!d) return "?";
  try {
    return new Date(d).toLocaleDateString("it-IT", { day: "2-digit", month: "short" });
  } catch {
    return d;
  }
}

function GuestEditor({ onClose, onSave, saving }) {
  const [form, setForm] = useState({
    guest_name: "", guest_surname: "", guest_email: "", guest_phone: "", booking_number: "",
    check_in_date: "", check_out_date: "", channel: "direct", stay_purpose: "famiglia",
  });
  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center px-6" style={{ backgroundColor: "rgba(27,42,65,0.5)" }}>
      <div className="w-full max-w-lg rounded-2xl overflow-hidden" style={{ backgroundColor: PAPER, maxHeight: "88vh", overflowY: "auto" }}>
        <div className="flex items-center justify-between px-6 pt-5 pb-4" style={{ borderBottom: `1px solid ${LINE}` }}>
          <h2 className="italic" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "22px", color: INK }}>Nuovo ospite</h2>
          <button onClick={onClose} className="p-1.5 rounded-full" style={{ backgroundColor: "#F1EAD9" }}>
            <X size={15} color={INK} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Nome e cognome (completo)">
              <input value={form.guest_name} onChange={(e) => setForm({ ...form, guest_name: e.target.value })} placeholder="Es. Anna Bianchi" className="w-full px-3 py-2.5 rounded-xl outline-none" style={inputStyle()} />
            </Field>
            <Field label="Solo cognome" hint="Serve per l'accesso ospite con numero prenotazione.">
              <input value={form.guest_surname} onChange={(e) => setForm({ ...form, guest_surname: e.target.value })} placeholder="Es. Bianchi" className="w-full px-3 py-2.5 rounded-xl outline-none" style={inputStyle()} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Email"><input value={form.guest_email} onChange={(e) => setForm({ ...form, guest_email: e.target.value })} className="w-full px-3 py-2.5 rounded-xl outline-none" style={inputStyle()} /></Field>
            <Field label="Telefono"><input value={form.guest_phone} onChange={(e) => setForm({ ...form, guest_phone: e.target.value })} className="w-full px-3 py-2.5 rounded-xl outline-none" style={inputStyle()} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Check-in"><input type="date" value={form.check_in_date} onChange={(e) => setForm({ ...form, check_in_date: e.target.value })} className="w-full px-3 py-2.5 rounded-xl outline-none" style={inputStyle()} /></Field>
            <Field label="Check-out"><input type="date" value={form.check_out_date} onChange={(e) => setForm({ ...form, check_out_date: e.target.value })} className="w-full px-3 py-2.5 rounded-xl outline-none" style={inputStyle()} /></Field>
          </div>
          <Field label="Numero di prenotazione" hint="Usato dall'ospite per accedere anche con cognome + numero.">
            <input value={form.booking_number} onChange={(e) => setForm({ ...form, booking_number: e.target.value })} className="w-full px-3 py-2.5 rounded-xl outline-none" style={{ ...inputStyle(), fontFamily: "'IBM Plex Mono', monospace" }} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Provenienza">
              <select value={form.channel} onChange={(e) => setForm({ ...form, channel: e.target.value })} className="w-full px-3 py-2.5 rounded-xl outline-none" style={inputStyle()}>
                {Object.entries(CHANNEL_META).map(([id, m]) => <option key={id} value={id}>{m.label}</option>)}
              </select>
            </Field>
            <Field label="Motivo del soggiorno">
              <select value={form.stay_purpose} onChange={(e) => setForm({ ...form, stay_purpose: e.target.value })} className="w-full px-3 py-2.5 rounded-xl outline-none" style={inputStyle()}>
                {Object.entries(PURPOSE_META).map(([id, m]) => <option key={id} value={id}>{m.label}</option>)}
              </select>
            </Field>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4" style={{ borderTop: `1px solid ${LINE}` }}>
          <button onClick={onClose} className="px-4 py-2.5 rounded-full" style={{ border: `1px solid ${LINE}` }}>
            <span style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "12.5px", fontWeight: 600, color: INK }}>Annulla</span>
          </button>
          <button onClick={() => onSave(form)} disabled={saving || !form.guest_name.trim()} className="px-4 py-2.5 rounded-full active:scale-[0.98] transition-transform" style={{ backgroundColor: CLAY, opacity: saving ? 0.7 : 1 }}>
            <span style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "12.5px", fontWeight: 600, color: PARCHMENT }}>{saving ? "Salvataggio..." : "Crea ospite"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function GuestsManager() {
  const { property } = usePropertyContext();
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  const load = async () => {
    if (!property?.id) return;
    setLoading(true);
    setError("");
    const supabase = createClient();
    const [{ data: stays, error: staysError }, { data: loyalty }] = await Promise.all([
      supabase.from("guest_stays").select("*").eq("property_id", property.id).order("check_in_date", { ascending: false }),
      supabase.from("guest_loyalty").select("*").eq("property_id", property.id),
    ]);
    if (staysError) {
      setError(staysError.message);
      setLoading(false);
      return;
    }
    const loyaltyMap = new Map((loyalty || []).map((l) => [l.guest_email, l.stays_count]));
    setGuests((stays || []).map((s) => ({ ...s, returning: s.guest_email ? (loyaltyMap.get(s.guest_email) || 0) > 1 : false })));
    setLoading(false);
  };

  useEffect(() => { load(); }, [property?.id]);

  const save = async (form) => {
    if (!property?.id) return;
    setSaving(true);
    setError("");
    const supabase = createClient();
    const payload = {
      property_id: property.id,
      guest_name: form.guest_name.trim(),
      guest_surname: form.guest_surname.trim() || null,
      guest_email: form.guest_email.trim() || null,
      guest_phone: form.guest_phone.trim() || null,
      booking_number: form.booking_number.trim() || null,
      check_in_date: form.check_in_date || null,
      check_out_date: form.check_out_date || null,
      channel: form.channel,
      stay_purpose: form.stay_purpose,
    };
    const { data, error: insertError } = await supabase.from("guest_stays").insert(payload).select("*").single();
    setSaving(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }
    setGuests((prev) => [{ ...data, returning: false }, ...prev]);
    setCreating(false);
  };

  const copyLink = (guest) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const link = `${origin}/g/${guest.access_token}`;
    if (navigator.clipboard) navigator.clipboard.writeText(link);
    setCopiedId(guest.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="max-w-4xl">
      {error && <p style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "12px", color: CLAY, marginBottom: "10px" }}>{error}</p>}
      <div className="flex justify-end mb-5">
        <button onClick={() => setCreating(true)} className="flex items-center gap-1.5 px-4 py-2.5 rounded-full active:scale-[0.98] transition-transform" style={{ backgroundColor: CLAY }}>
          <Plus size={14} color={PARCHMENT} />
          <span style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "12.5px", fontWeight: 600, color: PARCHMENT }}>Invita ospite</span>
        </button>
      </div>
      {loading ? (
        <p style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "13px", color: "#8A8371" }}>Caricamento ospiti...</p>
      ) : (
        <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${LINE}` }}>
          {guests.map((g, i) => (
            <div key={g.id} className="flex items-center gap-4 px-5 py-4" style={{ backgroundColor: PAPER, borderTop: i === 0 ? "none" : `1px solid ${LINE}` }}>
              <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: BRASS }}>
                <span style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "11px", fontWeight: 600, color: INK }}>
                  {(g.guest_name || "?").split(" ").map((n) => n[0]).join("").slice(0, 2)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "13.5px", fontWeight: 600, color: INK }}>{g.guest_name}</p>
                  <span className="px-2 py-0.5 rounded-full" style={{ backgroundColor: CHANNEL_META[g.channel]?.bg || "#F1EAD9" }}>
                    <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "9px", color: CHANNEL_META[g.channel]?.text || "#8A8371" }}>
                      {(CHANNEL_META[g.channel]?.label || g.channel || "").toUpperCase()}
                    </span>
                  </span>
                  {g.stay_purpose && PURPOSE_META[g.stay_purpose] && (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ backgroundColor: PURPOSE_META[g.stay_purpose].bg }}>
                      {React.createElement(PURPOSE_META[g.stay_purpose].Icon, { size: 9, color: PURPOSE_META[g.stay_purpose].text })}
                      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "9px", color: PURPOSE_META[g.stay_purpose].text }}>
                        {PURPOSE_META[g.stay_purpose].label.toUpperCase()}
                      </span>
                    </span>
                  )}
                  {g.returning && (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ backgroundColor: "#FBEFD9" }}>
                      <Repeat size={9} color={CLAY} />
                      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "9px", color: CLAY }}>CLIENTE FEDELE</span>
                    </span>
                  )}
                </div>
                <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "10.5px", color: "#8A8371", marginTop: "2px" }}>
                  {g.booking_number || "—"} · {fmtGuestDate(g.check_in_date)} → {fmtGuestDate(g.check_out_date)}
                </p>
              </div>
              <button onClick={() => copyLink(g)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full shrink-0" style={{ border: `1px solid ${LINE}` }}>
                <span style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "11.5px", fontWeight: 600, color: INK }}>
                  {copiedId === g.id ? "Copiato ✓" : "Copia link"}
                </span>
              </button>
            </div>
          ))}
          {guests.length === 0 && (
            <div className="py-10 text-center" style={{ backgroundColor: PAPER }}>
              <span style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "12.5px", color: "#8A8371" }}>Nessun ospite ancora registrato.</span>
            </div>
          )}
        </div>
      )}
      {creating && <GuestEditor saving={saving} onClose={() => setCreating(false)} onSave={save} />}
    </div>
  );
}

function fmtMsgTime(iso) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

function MessagesManager() {
  const { property } = usePropertyContext();
  const [threads, setThreads] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  const load = async () => {
    if (!property?.id) return;
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { data: msgs, error: fetchError } = await supabase
      .from("messages")
      .select("*, guest_stays(guest_name), bookings(services(name))")
      .eq("property_id", property.id)
      .order("created_at", { ascending: true });
    if (fetchError) {
      setError(fetchError.message);
      setLoading(false);
      return;
    }
    const byStay = new Map();
    for (const m of msgs || []) {
      const key = m.guest_stay_id || "senza-soggiorno";
      if (!byStay.has(key)) {
        byStay.set(key, {
          id: key,
          guest: m.guest_stays?.guest_name || "Ospite",
          messages: [],
        });
      }
      byStay.get(key).messages.push(m);
    }
    const list = Array.from(byStay.values()).map((t) => {
      const last = t.messages[t.messages.length - 1];
      const context = last?.is_bell ? "🔔 Campanello reception" : last?.bookings?.services?.name || "Messaggio diretto";
      const unread = t.messages.some((m) => m.sender === "guest" && !m.read_at);
      return { ...t, context, unread };
    });
    list.sort((a, b) => {
      const ta = a.messages[a.messages.length - 1]?.created_at || "";
      const tb = b.messages[b.messages.length - 1]?.created_at || "";
      return tb.localeCompare(ta);
    });
    setThreads(list);
    setActiveId((prev) => prev || list[0]?.id || null);
    setLoading(false);
  };

  useEffect(() => { load(); }, [property?.id]);

  const thread = threads.find((t) => t.id === activeId);

  const openThread = async (id) => {
    setActiveId(id);
    const t = threads.find((x) => x.id === id);
    const unreadGuestMsgIds = (t?.messages || []).filter((m) => m.sender === "guest" && !m.read_at).map((m) => m.id);
    if (unreadGuestMsgIds.length === 0) return;
    setThreads((prev) => prev.map((x) => (x.id === id ? { ...x, unread: false, messages: x.messages.map((m) => (unreadGuestMsgIds.includes(m.id) ? { ...m, read_at: new Date().toISOString() } : m)) } : x)));
    const supabase = createClient();
    await supabase.from("messages").update({ read_at: new Date().toISOString() }).in("id", unreadGuestMsgIds);
  };

  const sendReply = async () => {
    if (!draft.trim() || !thread || thread.id === "senza-soggiorno") return;
    setSending(true);
    setError("");
    const supabase = createClient();
    const payload = { property_id: property.id, guest_stay_id: thread.id, sender: "host", body: draft.trim() };
    const { data, error: sendError } = await supabase.from("messages").insert(payload).select("*").single();
    setSending(false);
    if (sendError) {
      setError(sendError.message);
      return;
    }
    setThreads((prev) => prev.map((t) => (t.id === thread.id ? { ...t, messages: [...t.messages, data] } : t)));
    setDraft("");
  };

  if (loading) {
    return <p style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "13px", color: "#8A8371" }}>Caricamento messaggi...</p>;
  }

  if (threads.length === 0) {
    return (
      <div className="max-w-4xl rounded-2xl p-10 text-center" style={{ border: `1px solid ${LINE}`, backgroundColor: PAPER }}>
        <span style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "12.5px", color: "#8A8371" }}>Nessun messaggio ricevuto finora.</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl flex rounded-2xl overflow-hidden" style={{ border: `1px solid ${LINE}`, height: "520px" }}>
      {error && <p style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "12px", color: CLAY, position: "absolute" }}>{error}</p>}
      <div className="w-64 shrink-0 overflow-y-auto" style={{ backgroundColor: PAPER, borderRight: `1px solid ${LINE}` }}>
        {threads.map((t) => (
          <button
            key={t.id}
            onClick={() => openThread(t.id)}
            className="w-full text-left px-4 py-3.5"
            style={{ backgroundColor: t.id === activeId ? "#F1EAD9" : "transparent", borderBottom: `1px solid ${LINE}` }}
          >
            <div className="flex items-center justify-between">
              <span style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "13px", fontWeight: 600, color: INK }}>{t.guest}</span>
              {t.unread && <span className="w-2 h-2 rounded-full" style={{ backgroundColor: CLAY }} />}
            </div>
            <p style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "11px", color: "#8A8371", marginTop: "2px" }}>{t.context}</p>
          </button>
        ))}
      </div>
      {thread && (
        <div className="flex-1 flex flex-col" style={{ backgroundColor: PARCHMENT }}>
          <div className="px-5 py-3.5" style={{ borderBottom: `1px solid ${LINE}`, backgroundColor: PAPER }}>
            <p style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "13.5px", fontWeight: 600, color: INK }}>{thread.guest}</p>
            <p style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "11px", color: "#8A8371" }}>{thread.context}</p>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
            {thread.messages.map((m) => (
              <div key={m.id} className="flex" style={{ justifyContent: m.sender === "host" ? "flex-end" : "flex-start" }}>
                <div
                  className="max-w-[70%] px-3.5 py-2 rounded-2xl"
                  style={{ backgroundColor: m.sender === "host" ? INK : PAPER, border: m.sender === "host" ? "none" : `1px solid ${LINE}` }}
                >
                  <p style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "12.5px", color: m.sender === "host" ? PARCHMENT : INK }}>{m.body}</p>
                  <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "9px", color: m.sender === "host" ? "#9C9483" : "#B4AC97", marginTop: "3px" }}>{fmtMsgTime(m.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 p-3" style={{ borderTop: `1px solid ${LINE}`, backgroundColor: PAPER }}>
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") sendReply(); }}
              placeholder={thread.id === "senza-soggiorno" ? "Soggiorno non collegato: risposta non disponibile" : "Scrivi una risposta..."}
              disabled={thread.id === "senza-soggiorno"}
              className="flex-1 px-3.5 py-2.5 rounded-full outline-none"
              style={inputStyle()}
            />
            <button onClick={sendReply} disabled={sending || thread.id === "senza-soggiorno"} className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: CLAY, opacity: sending ? 0.7 : 1 }}>
              <Send size={14} color={PARCHMENT} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, Icon }) {
  return (
    <div className="rounded-2xl p-5 flex flex-col items-center text-center gap-2" style={{ backgroundColor: PAPER, border: `1px solid ${LINE}` }}>
      <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: "#F1EAD9" }}>
        <Icon size={18} color={TEAL} />
      </div>
      <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "26px", color: INK }}>{value}</p>
      <p style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "11px", color: "#8A8371", textAlign: "center" }}>{label}</p>
    </div>
  );
}

const CHANNEL_CONNECT_INFO = {
  booking_com: {
    label: "Booking.com",
    note: "Booking.com non offre connessioni dirette a piccole app indipendenti: serve passare da un channel manager certificato (es. Smoobu, Octorate, Beds24...) che inoltra qui le prenotazioni.",
    fields: [
      { key: "channelManager", label: "Channel manager utilizzato", placeholder: "Es. Smoobu, Octorate..." },
      { key: "propertyId", label: "ID struttura su Booking.com", placeholder: "Es. 123456" },
    ],
  },
  airbnb: {
    label: "Airbnb",
    note: "Come Booking.com, richiede un channel manager per ricevere le prenotazioni complete. In alternativa potete collegare solo il calendario (iCal) per sincronizzare le disponibilità, senza dati ospite.",
    fields: [
      { key: "channelManager", label: "Channel manager utilizzato", placeholder: "Es. Smoobu, Octorate..." },
      { key: "icalUrl", label: "Link calendario iCal (opzionale)", placeholder: "https://www.airbnb.it/calendar/ical/..." },
    ],
  },
  website: {
    label: "Sito web diretto",
    note: "Questo lo colleghiamo senza intermediari: incollate questo indirizzo nel motore di prenotazione del vostro sito, così ogni nuova prenotazione arriva qui automaticamente.",
    fields: [
      { key: "webhookUrl", label: "URL webhook (già pronto, da incollare nel sito)", placeholder: "", readOnly: true, value: "https://app.evolutiontrip.it/api/webhooks/pms/la-tua-reception-online" },
    ],
  },
  other_ota: {
    label: "Altra agenzia",
    note: "Per agenzie, tour operator o portali diversi da Booking.com e Airbnb: indicate il nome e come volete ricevere le prenotazioni (channel manager, iCal o webhook dedicato).",
    fields: [
      { key: "agencyName", label: "Nome agenzia / portale", placeholder: "Es. Expedia, TravelClick, agenzia locale..." },
      { key: "channelManager", label: "Channel manager (se previsto)", placeholder: "Es. Smoobu, Octorate... o lasciate vuoto" },
      { key: "contactEmail", label: "Email di riferimento agenzia", placeholder: "prenotazioni@agenzia.it" },
    ],
  },
};

function ChannelConnectModal({ channelId, onClose, onConnect }) {
  const info = CHANNEL_CONNECT_INFO[channelId];
  const [values, setValues] = useState({});
  if (!info) return null;

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center px-6" style={{ backgroundColor: "rgba(27,42,65,0.5)" }}>
      <div className="w-full max-w-md rounded-2xl overflow-hidden" style={{ backgroundColor: PAPER }}>
        <div className="flex items-center justify-between px-6 pt-5 pb-4" style={{ borderBottom: `1px solid ${LINE}` }}>
          <h2 className="italic" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "21px", color: INK }}>
            Collega {info.label}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-full" style={{ backgroundColor: "#F1EAD9" }}>
            <X size={15} color={INK} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <p style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "12px", color: "#8A8371", lineHeight: 1.5 }}>{info.note}</p>
          {info.fields.map((f) => (
            <Field key={f.key} label={f.label}>
              <input
                readOnly={f.readOnly}
                value={f.readOnly ? f.value : (values[f.key] || "")}
                onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
                placeholder={f.placeholder}
                onFocus={(e) => f.readOnly && e.target.select()}
                className="w-full px-3 py-2.5 rounded-xl outline-none"
                style={{ ...inputStyle(), fontFamily: f.readOnly ? "'IBM Plex Mono', monospace" : "'Work Sans', sans-serif", fontSize: f.readOnly ? "11.5px" : "13px" }}
              />
            </Field>
          ))}
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4" style={{ borderTop: `1px solid ${LINE}` }}>
          <button onClick={onClose} className="px-4 py-2.5 rounded-full" style={{ border: `1px solid ${LINE}` }}>
            <span style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "12.5px", fontWeight: 600, color: INK }}>Annulla</span>
          </button>
          <button onClick={() => { onConnect(channelId); onClose(); }} className="px-4 py-2.5 rounded-full active:scale-[0.98] transition-transform" style={{ backgroundColor: CLAY }}>
            <span style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "12.5px", fontWeight: 600, color: PARCHMENT }}>
              {channelId === "website" ? "Fatto" : "Salva e collega"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

function ChannelsSection() {
  const [channels, setChannels] = useState({ booking_com: false, airbnb: false, website: false, other_ota: false });
  const [open, setOpen] = useState(null);

  return (
    <Section eyebrow="CANALI DI PRENOTAZIONE" title="Sorgenti collegate">
      <div className="grid grid-cols-2 gap-3">
        {Object.entries(CHANNEL_CONNECT_INFO).map(([id, info]) => {
          const connected = channels[id];
          return (
            <button
              key={id}
              onClick={() => setOpen(id)}
              className="text-left rounded-xl p-3.5 active:scale-[0.98] transition-transform"
              style={{ backgroundColor: "#F1EAD9", border: `1px solid ${LINE}` }}
            >
              <p style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "12.5px", fontWeight: 600, color: INK }}>{info.label}</p>
              <div className="flex items-center gap-1.5 mt-1">
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: connected ? TEAL : "#B4AC97" }} />
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "9.5px", color: connected ? TEAL : "#8A8371" }}>
                  {connected ? "CONNESSO" : "NON COLLEGATO"}
                </span>
              </div>
              <span style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "10.5px", color: CLAY, marginTop: "4px", display: "block" }}>
                {connected ? "Gestisci →" : "Collega →"}
              </span>
            </button>
          );
        })}
      </div>
      <p style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "11px", color: "#8A8371", marginTop: "10px" }}>
        Toccate una sorgente per collegarla: Booking.com e Airbnb richiedono un channel manager, il sito diretto usa un webhook già pronto.
      </p>
      {open && (
        <ChannelConnectModal
          channelId={open}
          onClose={() => setOpen(null)}
          onConnect={(id) => setChannels({ ...channels, [id]: true })}
        />
      )}
    </Section>
  );
}

const SECTION_LABELS = {
  guide: "Consigli & luoghi", events: "Fiere & eventi", excursions: "Escursioni",
  menu: "Menù", services: "Servizi extra", chat: "Messaggi/Chat",
  feedback: "Feedback ospiti", social: "Icone social in Home",
};
const DEFAULT_VISIBLE_SECTIONS = Object.fromEntries(Object.keys(SECTION_LABELS).map((k) => [k, true]));

function AppSettingsManager() {
  const { property, setProperty, loading: propertyLoading, error: propertyError } = usePropertyContext();
  const [homeColor, setHomeColor] = useState("#2A5C8A");
  const [accentColor, setAccentColor] = useState("#D0AC80");
  const [sections, setSections] = useState(DEFAULT_VISIBLE_SECTIONS);
  const [saveState, setSaveState] = useState("idle");
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    if (!property) return;
    setHomeColor(property.home_color || "#2A5C8A");
    setAccentColor(property.accent_color || "#D0AC80");
    setSections({ ...DEFAULT_VISIBLE_SECTIONS, ...(property.visible_sections || {}) });
  }, [property?.id]);

  const toggleSection = (key) => setSections({ ...sections, [key]: !sections[key] });

  const handleSave = async () => {
    if (!property?.id) return;
    setSaveState("saving");
    setSaveError("");
    const supabase = createClient();
    const { data, error } = await supabase
      .from("properties")
      .update({ home_color: homeColor, accent_color: accentColor, visible_sections: sections })
      .eq("id", property.id)
      .select("*")
      .single();
    if (error) {
      setSaveState("error");
      setSaveError(error.message);
      return;
    }
    setProperty(data);
    setSaveState("saved");
    setTimeout(() => setSaveState("idle"), 2200);
  };

  const resetDefaults = () => {
    setHomeColor("#2A5C8A");
    setAccentColor("#D0AC80");
    setSections(DEFAULT_VISIBLE_SECTIONS);
  };

  if (propertyError) {
    return <p style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "13px", color: CLAY }}>Non riesco a caricare le impostazioni: {propertyError}</p>;
  }
  if (propertyLoading) {
    return <p style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "13px", color: "#8A8371" }}>Caricamento impostazioni...</p>;
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6 sticky top-0 z-10 -mx-1 px-1 py-2" style={{ backgroundColor: "#EDE7D8" }}>
        <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", color: saveState === "error" ? CLAY : "#8A8371" }}>
          {saveState === "error" ? saveError : "Nome struttura e logo si gestiscono in \"Dati struttura\"."}
        </p>
        <button
          onClick={handleSave}
          disabled={saveState === "saving"}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full active:scale-[0.98] transition-transform shrink-0"
          style={{ backgroundColor: saveState === "saved" ? TEAL : saveState === "error" ? "#B33A2E" : CLAY, opacity: saveState === "saving" ? 0.7 : 1 }}
        >
          {saveState === "saved" ? <Check size={14} color={PARCHMENT} /> : <Save size={14} color={PARCHMENT} />}
          <span style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "12.5px", fontWeight: 600, color: PARCHMENT }}>
            {saveState === "saving" ? "Salvataggio..." : saveState === "saved" ? "Salvato ✓" : saveState === "error" ? "Riprova" : "Salva modifiche"}
          </span>
        </button>
      </div>

      <Section eyebrow="TEMA" title="Colori dell'app ospite">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Colore header Home" hint="Es. blu, rosso... qualunque colore per la copertina.">
            <div className="flex items-center gap-2.5">
              {["#2A5C8A", "#B5302B", "#2F5D62", "#1B2A41"].map((c) => (
                <button key={c} onClick={() => setHomeColor(c)} className="w-8 h-8 rounded-full" style={{ backgroundColor: c, border: homeColor === c ? "2px solid #C2542E" : "1px solid transparent" }} />
              ))}
            </div>
          </Field>
          <Field label="Colore accento" hint="Bottoni, badge e dettagli.">
            <div className="flex items-center gap-2.5">
              {["#D0AC80", "#C2542E", "#2F5D62", "#B8925A"].map((c) => (
                <button key={c} onClick={() => setAccentColor(c)} className="w-8 h-8 rounded-full" style={{ backgroundColor: c, border: accentColor === c ? "2px solid #1B2A41" : "1px solid transparent" }} />
              ))}
            </div>
          </Field>
        </div>
      </Section>

      <Section eyebrow="STRUTTURA APP" title="Sezioni visibili agli ospiti">
        <div className="space-y-2.5">
          {Object.entries(SECTION_LABELS).map(([key, label]) => (
            <div key={key} className="flex items-center justify-between px-4 py-3 rounded-xl" style={{ backgroundColor: "#F1EAD9" }}>
              <span style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "12.5px", fontWeight: 600, color: INK }}>{label}</span>
              <button onClick={() => toggleSection(key)} className="flex items-center gap-2">
                <div className="w-9 h-5 rounded-full flex items-center px-0.5" style={{ backgroundColor: sections[key] ? TEAL : "#D8CDB2", justifyContent: sections[key] ? "flex-end" : "flex-start" }}>
                  <div className="w-4 h-4 rounded-full bg-white" />
                </div>
              </button>
            </div>
          ))}
        </div>
        <p style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "11px", color: "#8A8371", marginTop: "10px" }}>
          Disattivando una sezione, la relativa voce sparisce dalla Home e dalla barra di navigazione dell'app ospite — i contenuti restano salvati, potete riattivarla quando volete. Ricordate di premere "Salva modifiche" qui sopra.
        </p>
      </Section>

      <button onClick={resetDefaults} className="flex items-center gap-2 px-4 py-2.5 rounded-full" style={{ border: `1px solid ${LINE}` }}>
        <RotateCcw size={13} color={INK} />
        <span style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "12px", fontWeight: 600, color: INK }}>Ripristina impostazioni predefinite</span>
      </button>
    </div>
  );
}

const PLANS = [
  { id: "base", name: "Base", price: "19", features: ["1 struttura", "Consigli & luoghi illimitati", "Email automatiche", "Chat con gli ospiti"], active: true },
  { id: "pro", name: "Pro", price: "39", features: ["Tutto il piano Base", "Escursioni, eventi e menù", "Statistiche e feedback", "Canali Booking.com/Airbnb"], highlight: true, active: true },
  { id: "multi_struttura", name: "Multistruttura", price: "89", features: ["Tutto il piano Pro", "Fino a 5 strutture", "Gestione centralizzata ospiti", "Supporto prioritario"], active: true },
];

const PAYMENT_HISTORY = [
  { id: 1, period: "Lug 2026", amount: "39", status: "paid", date: "01 lug 2026" },
  { id: 2, period: "Giu 2026", amount: "39", status: "paid", date: "01 giu 2026" },
  { id: 3, period: "Mag 2026", amount: "39", status: "paid", date: "01 mag 2026" },
  { id: 4, period: "Ago 2026", amount: "39", status: "upcoming", date: "in scadenza il 12 ago 2026" },
];

const PAYMENT_STATUS_META = {
  paid: { label: "Pagato", bg: "#E4EEE9", text: "#2F5D62" },
  upcoming: { label: "In scadenza", bg: "#FBEFD9", text: "#B8925A" },
  past_due: { label: "Scaduto", bg: "#F7E3DB", text: "#C2542E" },
  failed: { label: "Fallito", bg: "#F7E3DB", text: "#C2542E" },
};

function PaymentHistorySection() {
  return (
    <Section eyebrow="STORICO" title="Abbonamenti pagati, in scadenza e scaduti">
      <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${LINE}` }}>
        {PAYMENT_HISTORY.map((p, i) => {
          const meta = PAYMENT_STATUS_META[p.status];
          return (
            <div key={p.id} className="flex items-center justify-between px-4 py-3" style={{ backgroundColor: PAPER, borderTop: i === 0 ? "none" : `1px solid ${LINE}` }}>
              <div>
                <p style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "12.5px", fontWeight: 600, color: INK }}>{p.period}</p>
                <p style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "11px", color: "#8A8371", marginTop: "1px" }}>{p.date}</p>
              </div>
              <div className="flex items-center gap-2.5">
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "11.5px", color: INK }}>{p.amount} €</span>
                <span className="px-2.5 py-1 rounded-full" style={{ backgroundColor: meta.bg }}>
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "9px", color: meta.text }}>{meta.label.toUpperCase()}</span>
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </Section>
  );
}

const MOCK_PROPERTIES = [
  { id: 1, name: "La tua Reception on line", locked: false },
  { id: 2, name: "Villa Ligure", locked: false },
  { id: 3, name: "Appartamento Vernazza", locked: false },
];

function LockSection({ isMultiProperty }) {
  const { property, setProperty } = usePropertyContext();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const locked = !!property?.is_locked;

  const toggleLocked = async () => {
    if (!property?.id) return;
    setSaving(true);
    setError("");
    const supabase = createClient();
    const nextLocked = !locked;
    const payload = nextLocked
      ? { is_locked: true, locked_reason: "Bloccata manualmente dall'host", locked_at: new Date().toISOString() }
      : { is_locked: false, locked_reason: null, locked_at: null };
    const { data, error: updateError } = await supabase.from("properties").update(payload).eq("id", property.id).select("*").single();
    setSaving(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    setProperty(data);
  };

  return (
    <Section eyebrow="SICUREZZA ABBONAMENTO" title="Blocco per mancato rinnovo">
      <div className="flex items-start gap-2.5 p-3.5 rounded-xl mb-3" style={{ backgroundColor: "#F1EAD9" }}>
        <AlertTriangle size={14} color="#8A8371" className="shrink-0 mt-0.5" />
        <p style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "11px", color: "#8A8371", lineHeight: 1.5 }}>
          Il blocco automatico dopo mancato pagamento è gestito da un processo lato server (non da un interruttore qui) e richiede l'integrazione reale dei pagamenti (Stripe), non ancora collegata. Qui sotto potete comunque bloccare/sbloccare manualmente la struttura in qualsiasi momento — questo interruttore scrive davvero sul database.
        </p>
      </div>

      {error && <p style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "12px", color: CLAY, marginBottom: "10px" }}>{error}</p>}

      {isMultiProperty ? (
        <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${LINE}` }}>
          <div className="px-4 py-2.5" style={{ backgroundColor: "#F1EAD9", borderBottom: `1px solid ${LINE}` }}>
            <p style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "11px", color: "#8A8371" }}>
              Il piano Multistruttura permetterebbe di bloccare/sbloccare ogni struttura singolarmente — questa dashboard però gestisce al momento una sola struttura per account, quindi qui sotto trovate solo quella collegata.
            </p>
          </div>
          <div className="flex items-center justify-between px-4 py-3" style={{ backgroundColor: locked ? "#F7E3DB" : PAPER }}>
            <div>
              <p style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "12.5px", fontWeight: 600, color: INK }}>{property?.name}</p>
              <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "9.5px", color: locked ? CLAY : TEAL, marginTop: "1px" }}>
                {locked ? "BLOCCATA" : "ATTIVA"}
              </p>
            </div>
            <button
              onClick={toggleLocked}
              disabled={saving}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full shrink-0"
              style={{ backgroundColor: locked ? TEAL : CLAY, opacity: saving ? 0.7 : 1 }}
            >
              {locked ? <Unlock size={12} color={PARCHMENT} /> : <Lock size={12} color={PARCHMENT} />}
              <span style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "11px", fontWeight: 600, color: PARCHMENT }}>
                {locked ? "Sblocca" : "Blocca"}
              </span>
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between p-4 rounded-xl" style={{ backgroundColor: locked ? "#F7E3DB" : "#F1EAD9" }}>
          <div>
            <p style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "12.5px", fontWeight: 600, color: INK }}>
              Stato struttura: {locked ? "bloccata" : "attiva"}
            </p>
            <p style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "11px", color: "#8A8371", marginTop: "1px" }}>
              {locked ? "L'app ospite mostra un avviso al posto dei contenuti." : "Pulsante di emergenza, indipendente dal blocco automatico."}
            </p>
          </div>
          <button
            onClick={toggleLocked}
            disabled={saving}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-full shrink-0"
            style={{ backgroundColor: locked ? TEAL : CLAY, opacity: saving ? 0.7 : 1 }}
          >
            {locked ? <Unlock size={13} color={PARCHMENT} /> : <Lock size={13} color={PARCHMENT} />}
            <span style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "11.5px", fontWeight: 600, color: PARCHMENT }}>
              {saving ? "Salvataggio..." : locked ? "Sblocca struttura" : "Blocca struttura"}
            </span>
          </button>
        </div>
      )}
    </Section>
  );
}

function SubscriptionManager() {
  const [trialEnabled, setTrialEnabled] = useState(true);
  const [trialTotal, setTrialTotal] = useState(14);
  const [trialDaysLeft] = useState(9);
  const [selectedPlan, setSelectedPlan] = useState("pro");
  const [plans, setPlans] = useState(PLANS);
  const updatePlanPrice = (id, price) => setPlans(plans.map((p) => (p.id === id ? { ...p, price } : p)));
  const updatePlanName = (id, name) => setPlans(plans.map((p) => (p.id === id ? { ...p, name } : p)));
  const togglePlanActive = (id) => setPlans(plans.map((p) => (p.id === id ? { ...p, active: !p.active } : p)));
  const [paymentClicked, setPaymentClicked] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const inTrial = trialEnabled && trialDaysLeft > 0;
  const trialLink = `https://app.evolutiontrip.it/prova/${trialTotal}-giorni`;

  return (
    <div className="max-w-3xl">
      <Section eyebrow="PROVA GRATUITA" title="Periodo di prova">
        <div className="flex items-center justify-between p-4 rounded-xl mb-3" style={{ backgroundColor: "#F1EAD9" }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: trialEnabled ? BRASS : "#D8CDB2" }}>
              <Hourglass size={16} color={INK} />
            </div>
            <div>
              <p style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "12.5px", fontWeight: 600, color: INK }}>Prova gratuita attiva</p>
              <p style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "11px", color: "#8A8371", marginTop: "1px" }}>
                Se disattivata, i nuovi host passano direttamente alla scelta del piano a pagamento.
              </p>
            </div>
          </div>
          <button onClick={() => setTrialEnabled(!trialEnabled)} className="shrink-0">
            <div className="w-9 h-5 rounded-full flex items-center px-0.5" style={{ backgroundColor: trialEnabled ? TEAL : "#D8CDB2", justifyContent: trialEnabled ? "flex-end" : "flex-start" }}>
              <div className="w-4 h-4 rounded-full bg-white" />
            </div>
          </button>
        </div>

        <div className="flex items-center justify-between p-4 rounded-xl mb-3" style={{ backgroundColor: "#F1EAD9" }}>
          <span style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "12.5px", fontWeight: 600, color: INK }}>Durata prova</span>
          <div className="flex items-center gap-3">
            <button onClick={() => setTrialTotal(Math.max(1, trialTotal - 1))} className="w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: PAPER, border: `1px solid ${LINE}` }}>
              <span style={{ color: INK }}>−</span>
            </button>
            <input
              value={trialTotal}
              onChange={(e) => setTrialTotal(Math.max(1, Number(e.target.value.replace(/\D/g, "")) || 1))}
              className="w-14 text-center py-1 rounded-lg outline-none"
              style={{ backgroundColor: PAPER, border: `1px solid ${LINE}`, fontFamily: "'IBM Plex Mono', monospace", fontSize: "13px", color: INK }}
            />
            <span style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "12px", color: "#8A8371" }}>giorni</span>
            <button onClick={() => setTrialTotal(trialTotal + 1)} className="w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: PAPER, border: `1px solid ${LINE}` }}>
              <span style={{ color: INK }}>+</span>
            </button>
          </div>
        </div>

        <div className="p-4 rounded-xl" style={{ backgroundColor: "#F1EAD9" }}>
          <p style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "12.5px", fontWeight: 600, color: INK, marginBottom: "8px" }}>
            Link da inviare per iniziare la prova
          </p>
          <div className="flex items-center gap-2">
            <span
              className="flex-1 px-3 py-2 rounded-lg"
              style={{ backgroundColor: PAPER, border: `1px solid ${LINE}`, fontFamily: "'IBM Plex Mono', monospace", fontSize: "11px", color: "#6B6455", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
            >
              {trialLink}
            </span>
            <button
              onClick={() => { setLinkCopied(true); setTimeout(() => setLinkCopied(false), 2000); }}
              className="px-3 py-2 rounded-lg shrink-0"
              style={{ backgroundColor: linkCopied ? TEAL : PAPER, border: `1px solid ${linkCopied ? TEAL : LINE}` }}
            >
              <span style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "11px", fontWeight: 600, color: linkCopied ? PARCHMENT : INK }}>
                {linkCopied ? "Copiato ✓" : "Copia link"}
              </span>
            </button>
          </div>
        </div>
      </Section>

      {inTrial && (
        <div className="rounded-2xl p-5 mb-5 flex items-center gap-4" style={{ backgroundColor: "#F1EAD9", border: `1px solid ${LINE}` }}>
          <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: BRASS }}>
            <Hourglass size={20} color={INK} />
          </div>
          <div className="flex-1">
            <p style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "14px", fontWeight: 600, color: INK }}>
              Siete in prova gratuita — {trialDaysLeft} giorni rimasti su {trialTotal}
            </p>
            <p style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "12px", color: "#8A8371", marginTop: "2px" }}>
              Alla scadenza l'app resterà attiva in sola lettura finché non scegliete un piano.
            </p>
            <div className="w-full h-1.5 rounded-full mt-3" style={{ backgroundColor: "#E4DAC4" }}>
              <div className="h-full rounded-full" style={{ width: `${(trialDaysLeft / trialTotal) * 100}%`, backgroundColor: CLAY }} />
            </div>
          </div>
        </div>
      )}

      <Section eyebrow="PIANI" title="Scegliete il vostro abbonamento">
        <p style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "11px", color: "#8A8371", marginBottom: "10px" }}>
          Toccate un prezzo per modificarlo.
        </p>
        <div className="grid grid-cols-3 gap-3">
          {plans.map((p) => {
            const selected = selectedPlan === p.id;
            return (
              <div
                key={p.id}
                onClick={() => setSelectedPlan(p.id)}
                className="text-left rounded-2xl p-4 relative cursor-pointer"
                style={{
                  backgroundColor: selected ? INK : "#F1EAD9",
                  border: `1px solid ${selected ? INK : LINE}`,
                  opacity: p.active ? 1 : 0.6,
                }}
              >
                {p.highlight && (
                  <span className="absolute -top-2 right-3 px-2 py-0.5 rounded-full" style={{ backgroundColor: CLAY }}>
                    <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "8.5px", color: PARCHMENT }}>PIÙ SCELTO</span>
                  </span>
                )}
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    {p.id === "pro" && <Zap size={13} color={selected ? BRASS : CLAY} />}
                    {p.id === "multi_struttura" && <Crown size={13} color={selected ? BRASS : CLAY} />}
                    <input
                      value={p.name}
                      onChange={(e) => updatePlanName(p.id, e.target.value)}
                      className="outline-none"
                      style={{
                        fontFamily: "'Cormorant Garamond', serif",
                        fontStyle: "italic",
                        fontSize: "18px",
                        color: selected ? PARCHMENT : INK,
                        backgroundColor: "transparent",
                        width: "100px",
                      }}
                    />
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); togglePlanActive(p.id); }} className="shrink-0">
                    <div className="w-8 h-4.5 rounded-full flex items-center px-0.5" style={{ backgroundColor: p.active ? TEAL : "#D8CDB2", justifyContent: p.active ? "flex-end" : "flex-start" }}>
                      <div className="w-3.5 h-3.5 rounded-full bg-white" />
                    </div>
                  </button>
                </div>
                {!p.active && (
                  <span
                    className="inline-block px-2 py-0.5 rounded-full mb-1.5"
                    style={{ backgroundColor: "#F7E3DB" }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "8.5px", color: CLAY }}>NON IN VENDITA</span>
                  </span>
                )}
                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  <input
                    value={p.price}
                    onChange={(e) => updatePlanPrice(p.id, e.target.value.replace(/\D/g, ""))}
                    className="w-12 py-0.5 rounded-lg outline-none"
                    style={{
                      backgroundColor: selected ? "#24374F" : PAPER,
                      border: `1px solid ${selected ? "#33465D" : LINE}`,
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontSize: "16px",
                      color: selected ? BRASS : CLAY,
                      textAlign: "center",
                    }}
                  />
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "16px", color: selected ? BRASS : CLAY }}>€</span>
                  <span style={{ fontSize: "10px", color: selected ? "#9C9483" : "#8A8371" }}>/mese</span>
                </div>
                <div className="mt-3 space-y-1.5">
                  {p.features.map((f) => (
                    <div key={f} className="flex items-start gap-1.5">
                      <Check size={11} color={selected ? BRASS : TEAL} className="mt-0.5 shrink-0" />
                      <span style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "10.5px", color: selected ? "#C9C2AF" : "#6B6455" }}>{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        <button
          onClick={() => setPaymentClicked(true)}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-full mt-5 active:scale-[0.98] transition-transform"
          style={{ backgroundColor: CLAY }}
        >
          <CreditCard size={14} color={PARCHMENT} />
          <span style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "13px", fontWeight: 600, color: PARCHMENT }}>
            {inTrial ? "Attiva l'abbonamento ora" : "Aggiorna metodo di pagamento"}
          </span>
        </button>
        {paymentClicked && (
          <p style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "11px", color: TEAL, marginTop: "8px" }}>
            ✓ In produzione questo pulsante aprirebbe il checkout di pagamento su checkout.evolutiontrip.it
          </p>
        )}
        <div className="flex items-center justify-between mt-3 px-4 py-2.5 rounded-xl" style={{ backgroundColor: "#F1EAD9" }}>
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "10.5px", color: "#8A8371", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            checkout.evolutiontrip.it/pay/{selectedPlan}
          </span>
          <button className="px-2.5 py-1 rounded-full shrink-0 ml-2" style={{ backgroundColor: PAPER, border: `1px solid ${LINE}` }}>
            <span style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "10.5px", fontWeight: 600, color: INK }}>Copia link</span>
          </button>
        </div>
      </Section>

      <PaymentHistorySection />
      <LockSection isMultiProperty={selectedPlan === "multi_struttura"} />

      <Section eyebrow="FATTURAZIONE" title="Metodo di pagamento">
        <div className="flex items-center justify-between p-4 rounded-xl" style={{ backgroundColor: "#F1EAD9" }}>
          <div className="flex items-center gap-2.5">
            <CreditCard size={16} color="#8A8371" />
            <span style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "12.5px", color: "#8A8371" }}>Nessun metodo di pagamento salvato</span>
          </div>
          <button
            onClick={() => setPaymentClicked(true)}
            className="px-3 py-1.5 rounded-full"
            style={{ border: `1px solid ${LINE}` }}
          >
            <span style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "11.5px", fontWeight: 600, color: INK }}>Aggiungi carta</span>
          </button>
        </div>
      </Section>
    </div>
  );
}

function OverviewManager() {
  const { property } = usePropertyContext();
  const [stats, setStats] = useState(null);
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!property?.id) return;
    let cancelled = false;
    setLoading(true);
    setError("");
    const supabase = createClient();
    Promise.all([
      supabase.from("property_stats").select("*").eq("property_id", property.id).maybeSingle(),
      supabase.from("feedback").select("*").eq("property_id", property.id).order("created_at", { ascending: false }).limit(10),
    ]).then(([statsRes, feedbackRes]) => {
      if (cancelled) return;
      if (statsRes.error) setError(statsRes.error.message);
      else setStats(statsRes.data);
      if (!feedbackRes.error) setFeedback(feedbackRes.data || []);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [property?.id]);

  if (loading) {
    return <p style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "13px", color: "#8A8371" }}>Caricamento statistiche...</p>;
  }

  return (
    <div className="max-w-4xl">
      {error && <p style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "12px", color: CLAY, marginBottom: "10px" }}>{error}</p>}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard label="Luoghi pubblicati" value={String(stats?.places_published ?? 0)} Icon={Compass} />
        <StatCard label="Prenotazioni totali" value={String(stats?.bookings_total ?? 0)} Icon={CalendarCheck} />
        <StatCard label="Email inviate" value={String(stats?.emails_sent ?? 0)} Icon={Mail} />
        <StatCard label="Valutazione media" value={stats?.avg_rating != null ? String(stats.avg_rating) : "—"} Icon={Star} />
      </div>

      <ChannelsSection />

      <Section eyebrow="GRADIMENTO OSPITI" title="Feedback ricevuti">
        <div className="space-y-3">
          {feedback.map((f) => (
            <div key={f.id} className="flex items-start gap-3 pb-3" style={{ borderBottom: `1px solid ${LINE}` }}>
              <div className="flex items-center gap-0.5 shrink-0 pt-0.5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star key={n} size={12} color={n <= (f.rating || 0) ? BRASS : "#E4DAC4"} fill={n <= (f.rating || 0) ? BRASS : "none"} />
                ))}
              </div>
              <div>
                <p style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "12.5px", fontWeight: 600, color: INK }}>{f.guest_name || "Ospite"}</p>
                {f.comment && <p style={{ fontFamily: "'Work Sans', sans-serif", fontStyle: "italic", fontSize: "12px", color: "#6B6455", marginTop: "2px" }}>"{f.comment}"</p>}
              </div>
            </div>
          ))}
          {feedback.length === 0 && (
            <p style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "12.5px", color: "#8A8371" }}>Nessun feedback ricevuto finora.</p>
          )}
        </div>
      </Section>

      <Section eyebrow="CONTENUTI" title="Lingue disponibili">
        <div className="flex items-center gap-2 flex-wrap">
          {[{ code: "IT", full: true }, { code: "EN", full: true }, { code: "RU", full: true }, { code: "FR", full: false }, { code: "DE", full: false }].map((l) => (
            <div key={l.code} className="flex items-center gap-2 px-3.5 py-2 rounded-full" style={{ backgroundColor: l.full ? "#E4EEE9" : "#F1EAD9" }}>
              <Globe size={13} color={l.full ? TEAL : "#8A8371"} />
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "11px", color: l.full ? TEAL : "#8A8371" }}>{l.code}</span>
              <span style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "10.5px", color: l.full ? TEAL : "#8A8371" }}>
                {l.full ? "completo" : "da tradurre"}
              </span>
            </div>
          ))}
        </div>
        <p style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "10.5px", color: "#8A8371", marginTop: "10px" }}>
          Nota: la traduzione automatica dei contenuti non è ancora collegata — è un prossimo passo del progetto.
        </p>
      </Section>
    </div>
  );
}

const EVENT_CATEGORIES = [
  { id: "fiera", label: "Fiera", Icon: Briefcase },
  { id: "evento_locale", label: "Evento locale", Icon: PartyPopper },
  { id: "sagra", label: "Sagra", Icon: Utensils },
  { id: "concerto", label: "Concerto", Icon: Sparkles },
  { id: "sport", label: "Sport", Icon: TrendingUp },
];

function eventRowToForm(row) {
  return {
    id: row.id,
    category: row.category || "evento_locale",
    name: row.name || "",
    venue: row.venue || "",
    start: row.start_date || "",
    end: row.end_date || "",
    published: row.is_published,
    officialUrl: row.official_url || "",
    photos: row.photo_urls || [],
  };
}

function PhotoAttachField({ photos, onAdd, onRemove, folder = "extra" }) {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const handleFile = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setUploading(true);
    setUploadError("");
    try {
      const url = await uploadPropertyImage(file, folder);
      onAdd(url);
    } catch (err) {
      setUploadError(err.message || "Caricamento fallito.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return (
    <Field label="Foto" hint="Allegate una o più immagini (facoltativo).">
      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
      <div className="flex gap-2.5 flex-wrap">
        {photos.map((url, i) => (
          <div key={i} className="relative w-16 h-16 rounded-xl overflow-hidden" style={{ backgroundColor: "#F1EAD9", border: `1px solid ${LINE}` }}>
            {url && url.startsWith("http") ? (
              <img src={url} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <FileText size={14} color="#8A8371" />
              </div>
            )}
            <button onClick={() => onRemove(i)} className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(27,42,65,0.7)" }}>
              <X size={9} color="#fff" />
            </button>
          </div>
        ))}
        <button onClick={() => fileInputRef.current.click()} disabled={uploading} className="w-16 h-16 rounded-xl flex flex-col items-center justify-center gap-1" style={{ border: `1px dashed ${LINE}`, backgroundColor: "#F1EAD9" }}>
          <Upload size={14} color="#8A8371" />
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "8px", color: "#8A8371" }}>{uploading ? "..." : "ADD"}</span>
        </button>
      </div>
      {uploadError && <p style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "10.5px", color: CLAY, marginTop: "6px" }}>{uploadError}</p>}
    </Field>
  );
}

function EventEditor({ event, onClose, onSave, saving }) {
  const [form, setForm] = useState(event || { category: "evento_locale", name: "", venue: "", start: "", end: "", published: true, officialUrl: "", photos: [] });
  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center px-6" style={{ backgroundColor: "rgba(27,42,65,0.5)" }}>
      <div className="w-full max-w-lg rounded-2xl overflow-hidden" style={{ backgroundColor: PAPER, maxHeight: "88vh", overflowY: "auto" }}>
        <div className="flex items-center justify-between px-6 pt-5 pb-4" style={{ borderBottom: `1px solid ${LINE}` }}>
          <h2 className="italic" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "22px", color: INK }}>
            {event ? "Modifica evento" : "Nuovo evento o fiera"}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-full" style={{ backgroundColor: "#F1EAD9" }}>
            <X size={15} color={INK} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <Field label="Categoria">
            <div className="flex gap-2 flex-wrap">
              {EVENT_CATEGORIES.map(({ id, label, Icon }) => (
                <button
                  key={id}
                  onClick={() => setForm({ ...form, category: id })}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-full"
                  style={{ backgroundColor: form.category === id ? INK : "#F1EAD9", border: `1px solid ${form.category === id ? INK : LINE}` }}
                >
                  <Icon size={13} color={form.category === id ? BRASS : TEAL} />
                  <span style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "12px", fontWeight: 600, color: form.category === id ? PARCHMENT : INK }}>{label}</span>
                </button>
              ))}
            </div>
          </Field>
          <Field label="Nome evento">
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Es. Genova Boat Show" className="w-full px-3 py-2.5 rounded-xl outline-none" style={inputStyle()} />
          </Field>
          <Field label="Luogo">
            <input value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} placeholder="Es. Fiera di Genova" className="w-full px-3 py-2.5 rounded-xl outline-none" style={inputStyle()} />
          </Field>
          <Field label="Link ufficiale">
            <div className="relative">
              <LinkIcon size={14} color="#8A8371" className="absolute left-3 top-1/2 -translate-y-1/2" />
              <input value={form.officialUrl || ""} onChange={(e) => setForm({ ...form, officialUrl: e.target.value })} placeholder="https://..." className="w-full pl-9 pr-3 py-2.5 rounded-xl outline-none" style={inputStyle()} />
            </div>
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Data inizio">
              <input type="date" value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} className="w-full px-3 py-2.5 rounded-xl outline-none" style={inputStyle()} />
            </Field>
            <Field label="Data fine">
              <input type="date" value={form.end} onChange={(e) => setForm({ ...form, end: e.target.value })} className="w-full px-3 py-2.5 rounded-xl outline-none" style={inputStyle()} />
            </Field>
          </div>
          <PhotoAttachField
            photos={form.photos || []}
            onAdd={(url) => setForm({ ...form, photos: [...(form.photos || []), url] })}
            onRemove={(i) => setForm({ ...form, photos: form.photos.filter((_, idx) => idx !== i) })}
            folder="events"
          />
          <button onClick={() => setForm({ ...form, published: !form.published })} className="flex items-center gap-2">
            <div className="w-9 h-5 rounded-full flex items-center px-0.5" style={{ backgroundColor: form.published ? TEAL : "#D8CDB2", justifyContent: form.published ? "flex-end" : "flex-start" }}>
              <div className="w-4 h-4 rounded-full bg-white" />
            </div>
            <span style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "12.5px", color: INK }}>Pubblicato agli ospiti</span>
          </button>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4" style={{ borderTop: `1px solid ${LINE}` }}>
          <button onClick={onClose} className="px-4 py-2.5 rounded-full" style={{ border: `1px solid ${LINE}` }}>
            <span style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "12.5px", fontWeight: 600, color: INK }}>Annulla</span>
          </button>
          <button onClick={() => onSave(form)} disabled={saving} className="px-4 py-2.5 rounded-full active:scale-[0.98] transition-transform" style={{ backgroundColor: CLAY, opacity: saving ? 0.7 : 1 }}>
            <span style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "12.5px", fontWeight: 600, color: PARCHMENT }}>{saving ? "Salvataggio..." : "Salva evento"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function EventsManager() {
  const { property } = usePropertyContext();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);

  const load = async () => {
    if (!property?.id) return;
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { data, error: fetchError } = await supabase
      .from("events")
      .select("*")
      .eq("property_id", property.id)
      .order("start_date", { ascending: true });
    if (fetchError) setError(fetchError.message);
    else setEvents((data || []).map(eventRowToForm));
    setLoading(false);
  };

  useEffect(() => { load(); }, [property?.id]);

  const save = async (form) => {
    if (!property?.id) return;
    if (!form.start) {
      setError("La data di inizio è obbligatoria.");
      return;
    }
    setSaving(true);
    setError("");
    const supabase = createClient();
    const payload = {
      property_id: property.id,
      category: form.category || "evento_locale",
      name: form.name.trim() || "Evento senza nome",
      venue: form.venue?.trim() || null,
      start_date: form.start,
      end_date: form.end || null,
      official_url: form.officialUrl?.trim() || null,
      is_published: !!form.published,
      photo_urls: form.photos || [],
    };
    const query = form.id
      ? supabase.from("events").update(payload).eq("id", form.id).select("*").single()
      : supabase.from("events").insert(payload).select("*").single();
    const { data, error: saveError } = await query;
    setSaving(false);
    if (saveError) {
      setError(saveError.message);
      return;
    }
    const saved = eventRowToForm(data);
    setEvents((prev) => (prev.some((e) => e.id === saved.id) ? prev.map((e) => (e.id === saved.id ? saved : e)) : [...prev, saved]));
    setEditing(null);
    setCreating(false);
  };

  const fmt = (d) => d ? new Date(d).toLocaleDateString("it-IT", { day: "2-digit", month: "short" }) : "";

  return (
    <div className="max-w-4xl">
      {error && <p style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "12px", color: CLAY, marginBottom: "10px" }}>{error}</p>}
      <div className="flex justify-end mb-5">
        <button onClick={() => setCreating(true)} className="flex items-center gap-1.5 px-4 py-2.5 rounded-full active:scale-[0.98] transition-transform" style={{ backgroundColor: CLAY }}>
          <Plus size={14} color={PARCHMENT} />
          <span style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "12.5px", fontWeight: 600, color: PARCHMENT }}>Nuovo evento</span>
        </button>
      </div>
      {loading ? (
        <p style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "13px", color: "#8A8371" }}>Caricamento eventi...</p>
      ) : (
        <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${LINE}` }}>
          {events.map((e, i) => {
            const cat = EVENT_CATEGORIES.find((c) => c.id === e.category);
            return (
              <div key={e.id} className="flex items-center gap-4 px-5 py-4" style={{ backgroundColor: PAPER, borderTop: i === 0 ? "none" : `1px solid ${LINE}` }}>
                <div className="w-11 h-11 rounded-xl flex flex-col items-center justify-center shrink-0" style={{ backgroundColor: "#F1EAD9" }}>
                  <CalendarDays size={16} color={TEAL} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "13.5px", fontWeight: 600, color: INK }}>{e.name}</p>
                    {cat && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ backgroundColor: "#F1EAD9" }}>
                        <cat.Icon size={9} color={TEAL} />
                        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "9px", color: TEAL }}>{cat.label.toUpperCase()}</span>
                      </span>
                    )}
                  </div>
                  <p style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "11.5px", color: "#8A8371", marginTop: "2px" }}>
                    {e.venue} · {fmt(e.start)}{e.end && e.end !== e.start ? ` → ${fmt(e.end)}` : ""}
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full shrink-0" style={{ backgroundColor: e.published ? "#E4EEE9" : "#F1EAD9" }}>
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "9px", color: e.published ? TEAL : "#8A8371" }}>
                    {e.published ? "PUBBLICATO" : "BOZZA"}
                  </span>
                </span>
                <button onClick={() => setEditing(e)} className="p-2 rounded-lg shrink-0" style={{ backgroundColor: "#F1EAD9" }}>
                  <Pencil size={13} color={INK} />
                </button>
              </div>
            );
          })}
          {events.length === 0 && (
            <div className="py-10 text-center" style={{ backgroundColor: PAPER }}>
              <span style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "12.5px", color: "#8A8371" }}>Nessun evento in programma.</span>
            </div>
          )}
        </div>
      )}
      {(editing || creating) && (
        <EventEditor event={editing} saving={saving} onClose={() => { setEditing(null); setCreating(false); }} onSave={save} />
      )}
    </div>
  );
}

const MEAL_TYPES = [
  { id: "colazione", label: "Colazione" },
  { id: "mezza_pensione", label: "Mezza pensione" },
  { id: "pensione_completa", label: "Pensione completa" },
];

function emptyMenuState() {
  return { id: null, mode: "pdf", pdf_url: null, active: true, items: [], included: true, price: "" };
}

function MenuManager() {
  const { property } = usePropertyContext();
  const [meal, setMeal] = useState("colazione");
  const [menus, setMenus] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const pdfInputRef = useRef(null);

  const load = async () => {
    if (!property?.id) return;
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { data: menuRows, error: menuError } = await supabase
      .from("property_menus")
      .select("*, menu_items(*)")
      .eq("property_id", property.id);
    if (menuError) {
      setError(menuError.message);
      setLoading(false);
      return;
    }
    const next = {};
    for (const mt of MEAL_TYPES) {
      const row = (menuRows || []).find((r) => r.meal_type === mt.id);
      next[mt.id] = row
        ? {
            id: row.id,
            mode: row.mode,
            pdf_url: row.pdf_url,
            active: row.is_active,
            included: row.is_included,
            price: row.price != null ? String(row.price) : "",
            items: (row.menu_items || []).slice().sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)),
          }
        : emptyMenuState();
    }
    setMenus(next);
    setLoading(false);
  };

  useEffect(() => { load(); }, [property?.id]);

  const current = menus[meal] || emptyMenuState();

  const ensureMenuRow = async (patch) => {
    if (!property?.id) return null;
    const supabase = createClient();
    const payload = {
      property_id: property.id,
      meal_type: meal,
      mode: patch.mode ?? current.mode,
      pdf_url: patch.pdf_url !== undefined ? patch.pdf_url : current.pdf_url,
      is_active: patch.active !== undefined ? patch.active : current.active,
      is_included: patch.included !== undefined ? patch.included : current.included,
      price: patch.price !== undefined ? (patch.price === "" ? null : parseFloat(patch.price)) : (current.price === "" ? null : parseFloat(current.price)),
    };
    const { data, error: upsertError } = await supabase
      .from("property_menus")
      .upsert(payload, { onConflict: "property_id,meal_type" })
      .select("*")
      .single();
    if (upsertError) {
      setError(upsertError.message);
      return null;
    }
    setMenus((prev) => ({
      ...prev,
      [meal]: {
        ...(prev[meal] || emptyMenuState()),
        id: data.id,
        mode: data.mode,
        pdf_url: data.pdf_url,
        active: data.is_active,
        included: data.is_included,
        price: data.price != null ? String(data.price) : "",
      },
    }));
    return data;
  };

  const setMode = (mode) => { ensureMenuRow({ mode }); };
  const toggleActive = () => { ensureMenuRow({ active: !current.active }); };
  const toggleIncluded = () => { ensureMenuRow({ included: !current.included }); };
  const savePrice = (price) => { ensureMenuRow({ price }); };

  const handlePdfChange = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const url = await uploadPropertyImage(file, "menus");
      await ensureMenuRow({ pdf_url: url });
    } catch (err) {
      setError(err.message || "Caricamento fallito.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const addItem = async () => {
    let menuId = current.id;
    if (!menuId) {
      const row = await ensureMenuRow({});
      if (!row) return;
      menuId = row.id;
    }
    const supabase = createClient();
    const { data, error: insertError } = await supabase
      .from("menu_items")
      .insert({ property_menu_id: menuId, course: "Primi", name: "", sort_order: current.items.length })
      .select("*")
      .single();
    if (insertError) {
      setError(insertError.message);
      return;
    }
    setMenus((prev) => ({ ...prev, [meal]: { ...prev[meal], items: [...prev[meal].items, data] } }));
  };

  const updateItem = async (id, dbKey, value) => {
    setMenus((prev) => ({ ...prev, [meal]: { ...prev[meal], items: prev[meal].items.map((it) => (it.id === id ? { ...it, [dbKey]: value } : it)) } }));
    const supabase = createClient();
    await supabase.from("menu_items").update({ [dbKey]: value }).eq("id", id);
  };

  const removeItem = async (id) => {
    setMenus((prev) => ({ ...prev, [meal]: { ...prev[meal], items: prev[meal].items.filter((it) => it.id !== id) } }));
    const supabase = createClient();
    await supabase.from("menu_items").delete().eq("id", id);
  };

  if (loading) {
    return <p style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "13px", color: "#8A8371" }}>Caricamento menù...</p>;
  }

  const pdfFileName = current.pdf_url ? current.pdf_url.split("/").pop() : null;

  return (
    <div className="max-w-3xl">
      {error && <p style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "12px", color: CLAY, marginBottom: "10px" }}>{error}</p>}
      <div className="flex gap-2 mb-5 flex-wrap">
        {MEAL_TYPES.map((m) => (
          <button
            key={m.id}
            onClick={() => setMeal(m.id)}
            className="px-3.5 py-2 rounded-full"
            style={{ backgroundColor: meal === m.id ? INK : PAPER, border: `1px solid ${meal === m.id ? INK : LINE}` }}
          >
            <span style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "12px", fontWeight: 600, color: meal === m.id ? PARCHMENT : INK }}>
              {m.label}
            </span>
          </button>
        ))}
      </div>

      <Section eyebrow="MODALITÀ" title={MEAL_TYPES.find((m) => m.id === meal).label}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex gap-2">
            <button
              onClick={() => setMode("pdf")}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-full"
              style={{ backgroundColor: current.mode === "pdf" ? BRASS : "#F1EAD9" }}
            >
              <FileText size={13} color={current.mode === "pdf" ? INK : "#8A8371"} />
              <span style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "12px", fontWeight: 600, color: current.mode === "pdf" ? INK : "#8A8371" }}>
                Carica PDF
              </span>
            </button>
            <button
              onClick={() => setMode("builder")}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-full"
              style={{ backgroundColor: current.mode === "builder" ? BRASS : "#F1EAD9" }}
            >
              <UtensilsCrossed size={13} color={current.mode === "builder" ? INK : "#8A8371"} />
              <span style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "12px", fontWeight: 600, color: current.mode === "builder" ? INK : "#8A8371" }}>
                Crea piatto per piatto
              </span>
            </button>
          </div>
          <button onClick={toggleActive} className="flex items-center gap-2">
            <div className="w-9 h-5 rounded-full flex items-center px-0.5" style={{ backgroundColor: current.active ? TEAL : "#D8CDB2", justifyContent: current.active ? "flex-end" : "flex-start" }}>
              <div className="w-4 h-4 rounded-full bg-white" />
            </div>
            <span style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "12px", color: INK }}>Attivo</span>
          </button>
        </div>

        <div className="flex items-center gap-3 mb-5">
          <button onClick={toggleIncluded} className="flex items-center gap-2">
            <div className="w-9 h-5 rounded-full flex items-center px-0.5" style={{ backgroundColor: !current.included ? BRASS : "#D8CDB2", justifyContent: !current.included ? "flex-end" : "flex-start" }}>
              <div className="w-4 h-4 rounded-full bg-white" />
            </div>
            <span style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "12px", color: INK }}>A pagamento (non incluso nel soggiorno)</span>
          </button>
          {!current.included && (
            <div className="flex items-center gap-1.5">
              <input
                value={current.price}
                onChange={(e) => setMenus((prev) => ({ ...prev, [meal]: { ...prev[meal], price: e.target.value } }))}
                onBlur={(e) => savePrice(e.target.value)}
                placeholder="0"
                className="w-20 px-2.5 py-1.5 rounded-lg outline-none"
                style={{ ...inputStyle(), fontFamily: "'IBM Plex Mono', monospace" }}
              />
              <span style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "12px", color: "#8A8371" }}>€ a persona</span>
            </div>
          )}
        </div>

        {current.mode === "pdf" ? (
          <div>
            <input ref={pdfInputRef} type="file" accept="application/pdf" onChange={handlePdfChange} className="hidden" />
            {uploading ? (
              <div className="h-28 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#F1EAD9" }}>
                <span style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "11px", color: "#8A8371" }}>Caricamento...</span>
              </div>
            ) : pdfFileName ? (
              <div className="flex items-center justify-between p-4 rounded-xl" style={{ backgroundColor: "#F1EAD9" }}>
                <a href={current.pdf_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 min-w-0">
                  <FileText size={18} color={CLAY} className="shrink-0" />
                  <span className="truncate" style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "13px", fontWeight: 600, color: INK }}>{pdfFileName}</span>
                </a>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => pdfInputRef.current.click()} className="px-3 py-1.5 rounded-full" style={{ border: `1px solid ${LINE}` }}>
                    <span style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "11.5px", fontWeight: 600, color: INK }}>Sostituisci</span>
                  </button>
                  <button onClick={() => ensureMenuRow({ pdf_url: null })} className="p-2 rounded-full" style={{ backgroundColor: "#F7E3DB" }} title="Elimina PDF">
                    <Trash2 size={14} color={CLAY} />
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={() => pdfInputRef.current.click()} className="w-full h-28 rounded-xl flex flex-col items-center justify-center gap-1.5" style={{ border: `1px dashed ${LINE}`, backgroundColor: "#F1EAD9" }}>
                <Upload size={16} color="#8A8371" />
                <span style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "11px", color: "#8A8371" }}>Carica il PDF del menù</span>
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2.5">
            {current.items.map((it) => (
              <div key={it.id} className="flex items-center gap-2.5">
                <select
                  value={it.course}
                  onChange={(e) => updateItem(it.id, "course", e.target.value)}
                  className="px-2.5 py-2 rounded-xl outline-none"
                  style={{ ...inputStyle(), width: "110px" }}
                >
                  {["Antipasti", "Primi", "Secondi", "Contorni", "Dolci"].map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <input
                  value={it.name}
                  onChange={(e) => updateItem(it.id, "name", e.target.value)}
                  placeholder="Nome piatto"
                  className="flex-1 px-3 py-2 rounded-xl outline-none"
                  style={inputStyle()}
                />
                <button
                  onClick={() => updateItem(it.id, "is_vegetarian", !it.is_vegetarian)}
                  className="p-2 rounded-lg shrink-0"
                  style={{ backgroundColor: it.is_vegetarian ? "#E4EEE9" : "#F1EAD9" }}
                  title="Vegetariano"
                >
                  <Leaf size={14} color={it.is_vegetarian ? TEAL : "#B4AC97"} />
                </button>
                <button onClick={() => removeItem(it.id)} className="p-2 rounded-lg shrink-0" style={{ backgroundColor: "#F1EAD9" }}>
                  <Trash2 size={14} color="#8A8371" />
                </button>
              </div>
            ))}
            <button onClick={addItem} className="flex items-center gap-1.5 mt-1 px-3 py-2 rounded-xl" style={{ border: `1px dashed ${LINE}` }}>
              <Plus size={13} color={TEAL} />
              <span style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "12px", color: TEAL, fontWeight: 600 }}>Aggiungi piatto</span>
            </button>
          </div>
        )}
      </Section>
    </div>
  );
}


const DIFFICULTY_META = {
  facile: { label: "Facile", bg: "#E4EEE9", text: TEAL },
  media: { label: "Media", bg: "#FBEFD9", text: BRASS },
  impegnativa: { label: "Impegnativa", bg: "#F7E3DB", text: CLAY },
};

function excursionRowToForm(row) {
  return {
    id: row.id,
    name: row.name || "",
    duration: row.duration_hours != null ? String(row.duration_hours) : "",
    difficulty: row.difficulty || "facile",
    meetingPoint: row.meeting_point || "",
    price: row.price != null ? String(row.price) : "",
    bookable: row.is_bookable,
    published: row.is_published,
    officialUrl: row.official_url || "",
    photos: row.photo_urls || [],
  };
}

function ExcursionEditor({ excursion, onClose, onSave, saving }) {
  const [form, setForm] = useState(excursion || { name: "", duration: "", difficulty: "facile", meetingPoint: "", price: "", bookable: false, published: true, officialUrl: "", photos: [] });
  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center px-6" style={{ backgroundColor: "rgba(27,42,65,0.5)" }}>
      <div className="w-full max-w-lg rounded-2xl overflow-hidden" style={{ backgroundColor: PAPER, maxHeight: "88vh", overflowY: "auto" }}>
        <div className="flex items-center justify-between px-6 pt-5 pb-4" style={{ borderBottom: `1px solid ${LINE}` }}>
          <h2 className="italic" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "22px", color: INK }}>
            {excursion ? "Modifica escursione" : "Nuova escursione"}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-full" style={{ backgroundColor: "#F1EAD9" }}>
            <X size={15} color={INK} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <Field label="Nome escursione">
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Es. Trekking Sentiero Azzurro" className="w-full px-3 py-2.5 rounded-xl outline-none" style={inputStyle()} />
          </Field>
          <Field label="Punto di ritrovo">
            <input value={form.meetingPoint} onChange={(e) => setForm({ ...form, meetingPoint: e.target.value })} placeholder="Es. Piazza principale, ore 9:00" className="w-full px-3 py-2.5 rounded-xl outline-none" style={inputStyle()} />
          </Field>
          <Field label="Link ufficiale">
            <div className="relative">
              <LinkIcon size={14} color="#8A8371" className="absolute left-3 top-1/2 -translate-y-1/2" />
              <input value={form.officialUrl || ""} onChange={(e) => setForm({ ...form, officialUrl: e.target.value })} placeholder="https://..." className="w-full pl-9 pr-3 py-2.5 rounded-xl outline-none" style={inputStyle()} />
            </div>
          </Field>
          <div className="grid grid-cols-3 gap-4">
            <Field label="Durata (h)">
              <input value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} placeholder="3.5" className="w-full px-3 py-2.5 rounded-xl outline-none" style={{ ...inputStyle(), fontFamily: "'IBM Plex Mono', monospace" }} />
            </Field>
            <Field label="Difficoltà">
              <select value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })} className="w-full px-3 py-2.5 rounded-xl outline-none" style={inputStyle()}>
                {Object.entries(DIFFICULTY_META).map(([id, m]) => <option key={id} value={id}>{m.label}</option>)}
              </select>
            </Field>
            <Field label="Prezzo (€)">
              <input value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="0" className="w-full px-3 py-2.5 rounded-xl outline-none" style={{ ...inputStyle(), fontFamily: "'IBM Plex Mono', monospace" }} />
            </Field>
          </div>
          <PhotoAttachField
            photos={form.photos || []}
            onAdd={(url) => setForm({ ...form, photos: [...(form.photos || []), url] })}
            onRemove={(i) => setForm({ ...form, photos: form.photos.filter((_, idx) => idx !== i) })}
            folder="excursions"
          />
          <div className="flex items-center gap-6">
            <button onClick={() => setForm({ ...form, bookable: !form.bookable })} className="flex items-center gap-2">
              <div className="w-9 h-5 rounded-full flex items-center px-0.5" style={{ backgroundColor: form.bookable ? TEAL : "#D8CDB2", justifyContent: form.bookable ? "flex-end" : "flex-start" }}>
                <div className="w-4 h-4 rounded-full bg-white" />
              </div>
              <span style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "12.5px", color: INK }}>Prenotabile</span>
            </button>
            <button onClick={() => setForm({ ...form, published: !form.published })} className="flex items-center gap-2">
              <div className="w-9 h-5 rounded-full flex items-center px-0.5" style={{ backgroundColor: form.published ? TEAL : "#D8CDB2", justifyContent: form.published ? "flex-end" : "flex-start" }}>
                <div className="w-4 h-4 rounded-full bg-white" />
              </div>
              <span style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "12.5px", color: INK }}>Pubblicata</span>
            </button>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4" style={{ borderTop: `1px solid ${LINE}` }}>
          <button onClick={onClose} className="px-4 py-2.5 rounded-full" style={{ border: `1px solid ${LINE}` }}>
            <span style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "12.5px", fontWeight: 600, color: INK }}>Annulla</span>
          </button>
          <button onClick={() => onSave(form)} disabled={saving} className="px-4 py-2.5 rounded-full active:scale-[0.98] transition-transform" style={{ backgroundColor: CLAY, opacity: saving ? 0.7 : 1 }}>
            <span style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "12.5px", fontWeight: 600, color: PARCHMENT }}>{saving ? "Salvataggio..." : "Salva escursione"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function ExcursionsManager() {
  const { property } = usePropertyContext();
  const [excursions, setExcursions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);

  const load = async () => {
    if (!property?.id) return;
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { data, error: fetchError } = await supabase
      .from("excursions")
      .select("*")
      .eq("property_id", property.id)
      .order("sort_order", { ascending: true });
    if (fetchError) setError(fetchError.message);
    else setExcursions((data || []).map(excursionRowToForm));
    setLoading(false);
  };

  useEffect(() => { load(); }, [property?.id]);

  const save = async (form) => {
    if (!property?.id) return;
    setSaving(true);
    setError("");
    const supabase = createClient();
    const payload = {
      property_id: property.id,
      name: form.name.trim() || "Escursione senza nome",
      meeting_point: form.meetingPoint?.trim() || null,
      official_url: form.officialUrl?.trim() || null,
      duration_hours: form.duration ? parseFloat(form.duration) : null,
      difficulty: form.difficulty || "facile",
      price: form.price ? parseFloat(form.price) : null,
      is_bookable: !!form.bookable,
      is_published: !!form.published,
      photo_urls: form.photos || [],
    };
    const query = form.id
      ? supabase.from("excursions").update(payload).eq("id", form.id).select("*").single()
      : supabase.from("excursions").insert(payload).select("*").single();
    const { data, error: saveError } = await query;
    setSaving(false);
    if (saveError) {
      setError(saveError.message);
      return;
    }
    const saved = excursionRowToForm(data);
    setExcursions((prev) => (prev.some((x) => x.id === saved.id) ? prev.map((x) => (x.id === saved.id ? saved : x)) : [...prev, saved]));
    setEditing(null);
    setCreating(false);
  };

  return (
    <div className="max-w-4xl">
      {error && <p style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "12px", color: CLAY, marginBottom: "10px" }}>{error}</p>}
      <div className="flex justify-end mb-5">
        <button onClick={() => setCreating(true)} className="flex items-center gap-1.5 px-4 py-2.5 rounded-full active:scale-[0.98] transition-transform" style={{ backgroundColor: CLAY }}>
          <Plus size={14} color={PARCHMENT} />
          <span style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "12.5px", fontWeight: 600, color: PARCHMENT }}>Nuova escursione</span>
        </button>
      </div>
      {loading ? (
        <p style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "13px", color: "#8A8371" }}>Caricamento escursioni...</p>
      ) : (
        <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${LINE}` }}>
          {excursions.map((e, i) => {
            const diff = DIFFICULTY_META[e.difficulty];
            return (
              <div key={e.id} className="flex items-center gap-4 px-5 py-4" style={{ backgroundColor: PAPER, borderTop: i === 0 ? "none" : `1px solid ${LINE}` }}>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: "#F1EAD9" }}>
                  <Mountain size={17} color={TEAL} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "13.5px", fontWeight: 600, color: INK }}>{e.name}</p>
                    <span className="px-2 py-0.5 rounded-full" style={{ backgroundColor: diff.bg }}>
                      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "9px", color: diff.text }}>{diff.label.toUpperCase()}</span>
                    </span>
                    {Number(e.price) > 0 && (
                      <span className="px-2 py-0.5 rounded-full" style={{ backgroundColor: "#F1EAD9" }}>
                        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "9px", color: CLAY }}>{e.price} €</span>
                      </span>
                    )}
                    {!e.published && (
                      <span className="px-2 py-0.5 rounded-full" style={{ backgroundColor: "#F1EAD9" }}>
                        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "9px", color: "#8A8371" }}>BOZZA</span>
                      </span>
                    )}
                  </div>
                  <p style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "11.5px", color: "#8A8371", marginTop: "2px" }}>
                    {e.meetingPoint} · {e.duration}h
                  </p>
                </div>
                <button onClick={() => setEditing(e)} className="p-2 rounded-lg shrink-0" style={{ backgroundColor: "#F1EAD9" }}>
                  <Pencil size={13} color={INK} />
                </button>
              </div>
            );
          })}
          {excursions.length === 0 && (
            <div className="py-10 text-center" style={{ backgroundColor: PAPER }}>
              <span style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "12.5px", color: "#8A8371" }}>Nessuna escursione configurata.</span>
            </div>
          )}
        </div>
      )}
      {(editing || creating) && (
        <ExcursionEditor excursion={editing} saving={saving} onClose={() => { setEditing(null); setCreating(false); }} onSave={save} />
      )}
    </div>
  );
}

function HostAuthScreen({ onSuccess }) {
  const [mode, setMode] = useState("login"); // "register" | "login" | "forgot"
  const [remember, setRemember] = useState(true);
  const [form, setForm] = useState({ structureName: "", fullName: "", email: "", password: "", confirm: "" });
  const [resetEmail, setResetEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Trasforma "La Terrazza sul Mare" in "la-terrazza-sul-mare-8k2p" (slug
  // univoco usato nell'URL pubblico della struttura, es. /g/[slug]).
  const slugify = (name) =>
    name
      .toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") + "-" + Math.random().toString(36).slice(2, 6);

  const submit = async (e) => {
    e.preventDefault();
    if (mode === "register") {
      if (!form.structureName.trim() || !form.fullName.trim() || !form.email.trim() || !form.password.trim()) {
        setError("Compilate tutti i campi per continuare.");
        return;
      }
      if (form.password.length < 6) {
        setError("La password deve avere almeno 6 caratteri.");
        return;
      }
      if (form.password !== form.confirm) {
        setError("Le password non coincidono.");
        return;
      }
    } else {
      if (!form.email.trim() || !form.password.trim()) {
        setError("Inserite email e password.");
        return;
      }
    }

    setError("");
    setLoading(true);
    const supabase = createClient();

    try {
      if (mode === "register") {
        // 1. Crea l'utente Supabase Auth. Il trigger handle_new_user (vedi
        //    supabase/migrations/0004_guest_accounts.sql) crea automaticamente
        //    la riga in "profiles" con ruolo 'host'.
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: form.email.trim(),
          password: form.password,
          options: { data: { full_name: form.fullName, role: "host" } },
        });
        if (signUpError) throw signUpError;

        const userId = signUpData.user?.id;
        if (!userId) {
          setLoading(false);
          setError("");
          alert("Controllate la vostra email per confermare l'account, poi tornate qui ad accedere.");
          setMode("login");
          return;
        }

        // 2. Crea la struttura collegata a questo host — SOLO se esiste già
        //    una sessione attiva: se la conferma email è obbligatoria,
        //    signUp non crea una sessione e un insert qui verrebbe
        //    bloccato dalla RLS (auth.uid() sarebbe null). In quel caso la
        //    struttura viene creata automaticamente da PropertyProvider al
        //    primo accesso reale, dopo la conferma.
        if (signUpData.session) {
          const { error: propertyError } = await supabase.from("properties").insert({
            owner_id: userId,
            name: form.structureName.trim(),
            slug: slugifyName(form.structureName.trim()),
          });
          if (propertyError) throw propertyError;
          onSuccess();
        } else {
          setLoading(false);
          setError("");
          alert("Account creato. Controllate la vostra email per confermare l'account, poi tornate qui ad accedere.");
          setMode("login");
          return;
        }
      } else {
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: form.email.trim(),
          password: form.password,
        });
        if (signInError) throw signInError;
        onSuccess();
      }
    } catch (err) {
      setError(
        err.message?.includes("already registered") ? "Questa email è già registrata: provate ad accedere." :
        err.message?.includes("Invalid login") ? "Email o password non corrette." :
        err.message || "Si è verificato un errore, riprovate."
      );
    } finally {
      setLoading(false);
    }
  };

  const submitReset = async (e) => {
    e.preventDefault();
    if (!resetEmail.trim()) {
      setError("Inserite l'email del vostro account.");
      return;
    }
    setError("");
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.resetPasswordForEmail(resetEmail.trim(), {
      redirectTo: typeof window !== "undefined" ? `${window.location.origin}/reset-password` : undefined,
    });
    setLoading(false);
    setResetSent(true);
  };

  return (
    <div className="w-full min-h-screen flex" style={{ backgroundColor: INK }}>
      <style>{`
        @import url(https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;1,500;1,600&family=Work+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap);
      `}</style>

      <div className="flex-1 flex items-center justify-center py-10 px-4">
      <div className="w-full max-w-md rounded-3xl overflow-hidden" style={{ backgroundColor: PAPER, boxShadow: "0 20px 60px rgba(0,0,0,0.35)" }}>
        <div className="px-8 pt-8 pb-6 text-center" style={{ backgroundColor: AZURE_DARK }}>
          <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 border-2" style={{ borderColor: BRASS, borderStyle: "dashed" }}>
            <svg width="20" height="20" viewBox="0 0 26 26" fill="none">
              <path d="M3 20 C 7 20, 6 13, 11 13 C 16 13, 15 6, 21 6" stroke={BRASS} strokeWidth="2.4" strokeLinecap="round" fill="none" />
              <circle cx="3" cy="20" r="2.4" fill={BRASS} />
              <path d="M17.5 3 L21 6 L17.5 9" stroke={BRASS} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
          </div>
          <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "9px", letterSpacing: "0.12em", color: BRASS }}>
            EVOLUTIONTRIP HOST
          </p>
          <p className="italic mt-1" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "22px", color: PARCHMENT }}>
            {mode === "register" ? "Create il vostro account gratuito" : mode === "forgot" ? "Reimpostate la password" : "Consigli per i tuoi ospiti"}
          </p>
        </div>

        {mode === "forgot" ? (
          <form onSubmit={submitReset} noValidate className="px-6 pt-6 pb-6 space-y-3">
            {resetSent ? (
              <div className="text-center py-2">
                <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 border-2" style={{ borderColor: TEAL, borderStyle: "dashed" }}>
                  <Check size={20} color={TEAL} />
                </div>
                <p style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "13px", color: INK, fontWeight: 600 }}>Email inviata</p>
                <p style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "11.5px", color: "#8A8371", marginTop: "4px" }}>
                  Controllate {resetEmail} per il link di reimpostazione password.
                </p>
                <button
                  type="button"
                  onClick={() => { setMode("login"); setResetSent(false); }}
                  className="w-full py-3 rounded-full mt-4"
                  style={{ backgroundColor: INK }}
                >
                  <span style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "13px", fontWeight: 600, color: PARCHMENT }}>Torna al login</span>
                </button>
              </div>
            ) : (
              <>
                <p style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "11.5px", color: "#8A8371", marginBottom: "2px" }}>
                  Inserite l'email con cui avete registrato la struttura: vi invieremo un link per reimpostare la password.
                </p>
                <Field label="Email">
                  <input
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="nome@struttura.it"
                    className="w-full px-3 py-2.5 rounded-xl outline-none"
                    style={inputStyle()}
                  />
                </Field>
                {error && <p style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "11.5px", color: CLAY }}>{error}</p>}
                <button type="submit" className="w-full py-3 rounded-full mt-2 active:scale-[0.98] transition-transform" style={{ backgroundColor: CLAY }}>
                  <span style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "13px", fontWeight: 600, color: PARCHMENT }}>Invia link di reset</span>
                </button>
                <button type="button" onClick={() => { setMode("login"); setError(""); }} className="w-full py-2">
                  <span style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "11.5px", color: "#8A8371" }}>← Torna indietro</span>
                </button>
              </>
            )}
          </form>
        ) : (
        <form onSubmit={submit} noValidate className="px-6 pt-6 pb-6 space-y-3">
          {mode === "register" && (
            <>
              <Field label="Nome della struttura">
                <input
                  value={form.structureName}
                  onChange={(e) => setForm({ ...form, structureName: e.target.value })}
                  placeholder="Es. La tua Reception on line"
                  className="w-full px-3 py-2.5 rounded-xl outline-none"
                  style={inputStyle()}
                />
              </Field>
              <Field label="Il vostro nome">
                <input
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  placeholder="Nome e cognome"
                  className="w-full px-3 py-2.5 rounded-xl outline-none"
                  style={inputStyle()}
                />
              </Field>
            </>
          )}
          <Field label={mode === "register" ? "Email" : "Nome utente"}>
            <input
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="nome@struttura.it"
              className="w-full px-3 py-2.5 rounded-xl outline-none"
              style={inputStyle()}
            />
          </Field>
          <Field label="Password">
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder={mode === "register" ? "Almeno 6 caratteri" : "La vostra password"}
              className="w-full px-3 py-2.5 rounded-xl outline-none"
              style={inputStyle()}
            />
          </Field>
          {mode === "login" && (
            <button type="button" onClick={() => setRemember(!remember)} className="flex items-center gap-2">
              <div className="w-4 h-4 rounded flex items-center justify-center" style={{ border: `1.5px solid ${LINE}`, backgroundColor: remember ? CLAY : "transparent" }}>
                {remember && <Check size={11} color={PARCHMENT} />}
              </div>
              <span style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "12px", color: INK }}>Ricordami</span>
            </button>
          )}
          {mode === "register" && (
            <Field label="Conferma password">
              <input
                type="password"
                value={form.confirm}
                onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                placeholder="Ripetete la password"
                className="w-full px-3 py-2.5 rounded-xl outline-none"
                style={inputStyle()}
              />
            </Field>
          )}

          {error && <p style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "11.5px", color: CLAY }}>{error}</p>}

          <button type="submit" className="w-full py-3 rounded-full mt-2 active:scale-[0.98] transition-transform" style={{ backgroundColor: CLAY }}>
            <span style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "13px", fontWeight: 600, color: PARCHMENT }}>
              {mode === "register" ? "Inizia la prova gratuita di 14 giorni" : "Accedi"}
            </span>
          </button>

          {mode === "login" && (
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => { setMode("register"); setError(""); }}
                className="flex-1 py-2.5 rounded-full"
                style={{ border: `1px solid ${LINE}` }}
              >
                <span style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "12px", fontWeight: 600, color: INK }}>Registrati</span>
              </button>
              <button
                type="button"
                onClick={() => { setMode("forgot"); setError(""); }}
                className="flex-1 py-2.5 rounded-full"
                style={{ border: `1px solid ${LINE}` }}
              >
                <span style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "12px", fontWeight: 600, color: INK }}>Password dimenticata</span>
              </button>
            </div>
          )}

          {mode === "register" && (
            <>
              <p style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "10.5px", color: "#8A8371", textAlign: "center" }}>
                Nessuna carta richiesta ora. Creando l'account accettate termini e informativa privacy.
              </p>
              <button type="button" onClick={() => { setMode("login"); setError(""); }} className="w-full py-1">
                <span style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "11.5px", color: TEAL }}>Avete già un account? Accedi</span>
              </button>
            </>
          )}
        </form>
        )}
      </div>
      </div>

      <div className="hidden lg:flex flex-1 items-center justify-center relative overflow-hidden" style={{ backgroundColor: "#FFFFFF" }}>
        <svg width="70%" height="70%" viewBox="0 0 400 500" fill="none" style={{ maxWidth: "420px" }}>
          <path d="M60 380 C 110 380, 100 300, 150 300" stroke={LINE} strokeWidth="2" strokeDasharray="5 5" fill="none" />
          <path d="M60 380 C 90 340, 160 260, 210 220" stroke={LINE} strokeWidth="2" strokeDasharray="5 5" fill="none" />
          <path d="M60 380 C 140 360, 220 300, 280 190" stroke={LINE} strokeWidth="2" strokeDasharray="5 5" fill="none" />
          <path d="M60 380 C 150 400, 230 420, 300 400" stroke={LINE} strokeWidth="2" strokeDasharray="5 5" fill="none" />

          <rect x="140" y="70" width="180" height="360" rx="28" fill={PAPER} stroke={LINE} strokeWidth="2" />
          <rect x="156" y="94" width="148" height="290" rx="6" fill="#F1EAD9" />
          <line x1="156" y1="140" x2="304" y2="140" stroke="#E4DAC4" strokeWidth="1.5" />
          <line x1="156" y1="190" x2="304" y2="190" stroke="#E4DAC4" strokeWidth="1.5" />
          <line x1="156" y1="240" x2="304" y2="240" stroke="#E4DAC4" strokeWidth="1.5" />
          <line x1="156" y1="290" x2="304" y2="290" stroke="#E4DAC4" strokeWidth="1.5" />
          <line x1="156" y1="340" x2="304" y2="340" stroke="#E4DAC4" strokeWidth="1.5" />
          <line x1="200" y1="94" x2="200" y2="384" stroke="#E4DAC4" strokeWidth="1.5" />
          <line x1="245" y1="94" x2="245" y2="384" stroke="#E4DAC4" strokeWidth="1.5" />

          <g>
            <circle cx="60" cy="380" r="20" fill={CLAY} opacity="0.12" />
            <path d="M60 366 C 71 366, 79 374, 79 384 C 79 397, 60 412, 60 412 C 60 412, 41 397, 41 384 C 41 374, 49 366, 60 366 Z" fill={CLAY} />
            <circle cx="60" cy="384" r="6" fill="#FFFFFF" />
          </g>
          <g>
            <circle cx="210" cy="220" r="20" fill={TEAL} opacity="0.12" />
            <path d="M210 206 C 221 206, 229 214, 229 224 C 229 237, 210 252, 210 252 C 210 252, 191 237, 191 224 C 191 214, 199 206, 210 206 Z" fill={TEAL} />
            <circle cx="210" cy="224" r="6" fill="#FFFFFF" />
          </g>
          <g>
            <circle cx="280" cy="190" r="24" fill={BRASS} opacity="0.15" />
            <path d="M280 172 C 293 172, 302 181, 302 193 C 302 208, 280 227, 280 227 C 280 227, 258 208, 258 193 C 258 181, 267 172, 280 172 Z" fill={BRASS} />
            <text x="280" y="199" textAnchor="middle" fontSize="17" fontWeight="700" fill={INK}>!</text>
          </g>
          <g>
            <circle cx="300" cy="400" r="18" fill={TEAL} opacity="0.12" />
            <path d="M300 388 C 309 388, 316 395, 316 403 C 316 414, 300 427, 300 427 C 300 427, 284 414, 284 403 C 284 395, 291 388, 300 388 Z" fill={TEAL} />
            <circle cx="300" cy="403" r="5" fill="#FFFFFF" />
          </g>
        </svg>
      </div>
    </div>
  );
}

export default function HostDashboard() {
  // Stato di sessione REALE: verificato all'avvio con getSession() e poi
  // tenuto aggiornato da onAuthStateChange, così un refresh della pagina
  // non butta più fuori l'host che ha già una sessione valida.
  const [authState, setAuthState] = useState("checking"); // checking | out | in
  const [active, setActive] = useState("property");

  useEffect(() => {
    const supabase = createClient();
    let mounted = true;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted) setAuthState(session ? "in" : "out");
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthState(session ? "in" : "out");
    });
    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  if (authState === "checking") {
    return (
      <div className="w-full min-h-screen flex items-center justify-center" style={{ backgroundColor: "#EDE7D8" }}>
        <p style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "13px", color: "#8A8371" }}>Verifica sessione in corso...</p>
      </div>
    );
  }

  if (authState === "out") {
    return <HostAuthScreen onSuccess={() => setAuthState("in")} />;
  }

  return (
    <PropertyProvider>
      <HostDashboardShell active={active} setActive={setActive} />
    </PropertyProvider>
  );
}

function HostDashboardShell({ active, setActive }) {
  const headers = {
    property: { title: "Dati struttura", subtitle: "Queste informazioni saranno visibili ai vostri ospiti nella app di benvenuto." },
    places: { title: "Consigli & luoghi", subtitle: "I punti d'interesse che comporranno la guida digitale per i vostri ospiti." },
    events: { title: "Fiere & eventi", subtitle: "Fiere, sagre e appuntamenti locali da segnalare agli ospiti in soggiorno." },
    excursions: { title: "Escursioni", subtitle: "I percorsi e le uscite che proponete ai vostri ospiti." },
    menu: { title: "Menù", subtitle: "Colazione, mezza pensione e pensione completa: PDF o creato piatto per piatto." },
    services: { title: "Servizi extra", subtitle: "I servizi prenotabili in struttura, mostrati nella app ospite." },
    bookings: { title: "Prenotazioni", subtitle: "Le richieste di prenotazione inviate dagli ospiti." },
    messages: { title: "Messaggi", subtitle: "Le conversazioni con i vostri ospiti, per soggiorno o richiesta servizio." },
    emails: { title: "Email & automazioni", subtitle: "I messaggi automatici inviati prima, durante e dopo il soggiorno." },
    guests: { title: "Ospiti", subtitle: "I soggiorni attivi e i link di accesso alla app di benvenuto." },
    appsettings: { title: "Impostazioni app", subtitle: "Nome, logo, colori e sezioni attive dell'app ospite — modificabili in ogni momento." },
    subscription: { title: "Abbonamento", subtitle: "Il vostro piano, la prova gratuita e il metodo di pagamento." },
    overview: { title: "Panoramica", subtitle: "Statistiche, feedback e lingue disponibili per la vostra struttura." },
  };
  const header = headers[active] || { title: "Prossimo passo", subtitle: "Questa sezione arriva nel prossimo step della Fase 2." };

  return (
    <div className="w-full min-h-screen flex" style={{ backgroundColor: "#EDE7D8" }}>
      <style>{`
        @import url(https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;1,500;1,600&family=Work+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap);
      `}</style>
      <Sidebar active={active} setActive={setActive} />
      <div className="flex-1 flex flex-col">
        <TopBar title={header.title} subtitle={header.subtitle} />
        <div className="flex-1 overflow-y-auto p-8">
          {active === "property" && <PropertySettings />}
          {active === "places" && <PlacesManager />}
          {active === "events" && <EventsManager />}
          {active === "excursions" && <ExcursionsManager />}
          {active === "menu" && <MenuManager />}
          {active === "services" && <ServicesManager />}
          {active === "bookings" && <BookingsManager />}
          {active === "messages" && <MessagesManager />}
          {active === "emails" && <EmailsManager />}
          {active === "guests" && <GuestsManager />}
          {active === "appsettings" && <AppSettingsManager />}
          {active === "subscription" && <SubscriptionManager />}
          {active === "overview" && <OverviewManager />}
        </div>
      </div>
    </div>
  );
}
