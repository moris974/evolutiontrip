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

const INK = "#2E2E2E";
const PARCHMENT = "#FFFFFF";
const BRASS = "#DC6E8B";
const TEAL = "#3E9A45";
const CLAY = "#46149F";
const AZURE = "#44109B";
const AZURE_DARK = "rgba(255,255,255,0.35)";
const PAPER = "#FFFFFF";
const LINE = "#D8D8D8";

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
      <label style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "12.5px", fontWeight: 600, color: INK }}>
        {label}
      </label>
      <div className="mt-1.5">{children}</div>
      {hint && (
        <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "11px", color: "#6E6E6E", marginTop: "4px" }}>
          {hint}
        </p>
      )}
    </div>
  );
}

function inputStyle() {
  return {
    fontFamily: "'Montserrat', sans-serif",
    fontSize: "13px",
    color: INK,
    backgroundColor: PAPER,
    border: `1px solid ${LINE}`,
  };
}

function Section({ title, eyebrow, children }) {
  return (
    <div className="rounded-2xl p-6 mb-5" style={{ backgroundColor: PAPER, border: `1px solid ${LINE}` }}>
      <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "9.5px", letterSpacing: "0.08em", color: BRASS, marginBottom: "3px" }}>
        {eyebrow}
      </p>
      <h2 className="mb-5" style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: "20px", color: INK }}>
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
        <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 overflow-hidden" style={{ backgroundColor: "#fff" }}>
          <img src="/logo-icon.png" alt="" className="w-7 h-7 object-contain" />
        </div>
        <div>
          <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "8.5px", letterSpacing: "0.1em", color: BRASS }}>
            HOST DASHBOARD
          </p>
          <p style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: "19px", lineHeight: 1, letterSpacing: "-0.01em" }}>
            <span style={{ color: PARCHMENT }}>Evolution</span><span style={{ color: BRASS }}>Trip</span>
          </p>
        </div>
      </div>

      <button className="flex items-center justify-between mx-4 mt-4 px-3 py-2.5 rounded-xl" style={{ backgroundColor: BRASS }}>
        <div className="text-left">
          <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "8.5px", color: "rgba(255,255,255,0.75)" }}>STRUTTURA ATTIVA</p>
          <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "12.5px", fontWeight: 600, color: PARCHMENT }}>{structureName || "La tua Reception on line"}</p>
        </div>
        <ChevronDown size={14} color="rgba(255,255,255,0.75)" />
      </button>

      <nav className="flex-1 px-3 mt-5 space-y-1">
        {NAV.map(({ id, label, Icon }) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              onClick={() => setActive(id)}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left"
              style={{ backgroundColor: isActive ? BRASS : "transparent" }}
            >
              <Icon size={16} color={isActive ? PARCHMENT : "rgba(255,255,255,0.65)"} />
              <span
                style={{
                  fontFamily: "'Montserrat', sans-serif",
                  fontSize: "13px",
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? PARCHMENT : "rgba(255,255,255,0.65)",
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
            <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "11px", fontWeight: 600, color: INK }}>
              {(structureName || "Host").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
            </span>
          </div>
          <div>
            <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "12px", fontWeight: 600, color: PARCHMENT }}>{structureName || "Host"}</p>
            <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "10.5px", color: "rgba(255,255,255,0.65)" }}>Host</p>
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
          <LogOut size={14} color="rgba(255,255,255,0.65)" />
          <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "12px", fontWeight: 600, color: "rgba(255,255,255,0.65)" }}>Esci</span>
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
        <h1 style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "18px", fontWeight: 600, color: INK }}>{title}</h1>
        <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "12.5px", color: "#6E6E6E", marginTop: "2px" }}>{subtitle}</p>
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
    <div className={`relative ${height} rounded-xl overflow-hidden`} style={{ border: `1px dashed ${LINE}`, backgroundColor: "#F0EDF7" }}>
      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleChange} className="hidden" />
      {uploading ? (
        <div className="w-full h-full flex items-center justify-center">
          <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "11px", color: "#6E6E6E" }}>Caricamento...</span>
        </div>
      ) : imageUrl ? (
        <>
          <img src={imageUrl} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 flex items-end justify-end p-2 gap-1.5" style={{ background: "linear-gradient(transparent 50%, rgba(27,42,65,0.35))" }}>
            <button onClick={() => fileInputRef.current.click()} className="px-2 py-1 rounded-full" style={{ backgroundColor: PAPER }}>
              <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "10px", fontWeight: 600, color: INK }}>Sostituisci</span>
            </button>
            <button onClick={onRemove} className="p-1.5 rounded-full" style={{ backgroundColor: PAPER }}>
              <X size={11} color={INK} />
            </button>
          </div>
        </>
      ) : (
        <button onClick={() => fileInputRef.current.click()} className="w-full h-full flex flex-col items-center justify-center gap-1.5">
          <Upload size={16} color="#6E6E6E" />
          <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "11px", color: "#6E6E6E" }}>Carica immagine</span>
        </button>
      )}
      {uploadError && (
        <div className="absolute bottom-0 left-0 right-0 px-2 py-1" style={{ backgroundColor: "rgba(194,84,46,0.9)" }}>
          <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "9.5px", color: PARCHMENT }}>{uploadError}</span>
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
    <div className="relative h-24" style={{ backgroundColor: "#F0EDF7" }}>
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
          <Upload size={14} color="#6E6E6E" />
          <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "10px", color: "#6E6E6E" }}>{uploading ? "Caricamento..." : "Carica foto"}</span>
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
        <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "13px", color: CLAY }}>
          Non riesco a caricare la struttura: {propertyError}
        </p>
        <button onClick={reload} className="mt-3 px-4 py-2 rounded-full" style={{ border: `1px solid ${LINE}` }}>
          <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "12.5px", fontWeight: 600, color: INK }}>Riprova</span>
        </button>
      </div>
    );
  }

  if (propertyLoading || !form) {
    return (
      <div className="max-w-3xl">
        <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "13px", color: "#6E6E6E" }}>Caricamento dati struttura...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6 sticky top-0 z-10 -mx-1 px-1 py-2" style={{ backgroundColor: "#F5F3FA" }}>
        <div>
          <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "10px", color: "#6E6E6E" }}>
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
          <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "12.5px", fontWeight: 600, color: PARCHMENT }}>
            {saveState === "saving" ? "Salvataggio..." : saveState === "saved" ? "Salvato ✓" : saveState === "error" ? "Riprova" : "Salva modifiche"}
          </span>
        </button>
      </div>

      <Section eyebrow="ACCESSO OSPITI" title="Link della vostra struttura">
        <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "11.5px", color: "#6E6E6E", marginBottom: "12px", lineHeight: 1.5 }}>
          Ogni struttura ha un link unico e permanente: apritelo o condividetelo per vedere esattamente cosa vedrà l'ospite (la Home, i consigli, gli orari...). Lo stesso link lo trovate già pronto per QR code, email e WhatsApp.
        </p>
        <div className="flex items-center gap-2 mb-3">
          <span
            className="flex-1 px-3 py-2.5 rounded-xl"
            style={{ backgroundColor: "#F0EDF7", border: `1px solid ${LINE}`, fontFamily: "'Montserrat', sans-serif", fontSize: "11.5px", color: "#6B6455", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
          >
            {guestLink}
          </span>
          <button
            onClick={() => { setLinkCopied(true); setTimeout(() => setLinkCopied(false), 2000); if (navigator.clipboard) navigator.clipboard.writeText(guestLink); }}
            className="px-3.5 py-2.5 rounded-xl shrink-0"
            style={{ backgroundColor: linkCopied ? TEAL : CLAY }}
          >
            <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "12px", fontWeight: 600, color: PARCHMENT }}>
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
            <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "11.5px", fontWeight: 600, color: INK }}>Apri come ospite</span>
          </a>
          <button
            onClick={() => setQrOpen(true)}
            disabled={!guestLink}
            className="flex items-center gap-1.5 px-3 py-2 rounded-full"
            style={{ border: `1px solid ${LINE}`, opacity: guestLink ? 1 : 0.5 }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="7" height="7" stroke={INK} strokeWidth="2" /><rect x="14" y="3" width="7" height="7" stroke={INK} strokeWidth="2" /><rect x="3" y="14" width="7" height="7" stroke={INK} strokeWidth="2" /><rect x="14" y="14" width="3" height="3" fill={INK} /><rect x="18" y="18" width="3" height="3" fill={INK} /></svg>
            <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "11.5px", fontWeight: 600, color: INK }}>Genera QR code</span>
          </button>
        </div>
        {qrOpen && guestLink && (
          <div className="mt-4 flex items-center gap-4 p-4 rounded-xl" style={{ backgroundColor: "#F0EDF7", border: `1px solid ${LINE}` }}>
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(guestLink)}`}
              alt="QR code del link struttura"
              width={110}
              height={110}
              className="rounded-lg shrink-0"
              style={{ backgroundColor: "#fff" }}
            />
            <div>
              <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "12px", color: "#6E6E6E", lineHeight: 1.5, marginBottom: "8px" }}>
                Inquadrando questo QR code si apre direttamente la Home dell'app per gli ospiti di questa struttura. Potete stamparlo o inserirlo in una locandina.
              </p>
              <button onClick={() => setQrOpen(false)} className="px-3 py-1.5 rounded-full" style={{ border: `1px solid ${LINE}` }}>
                <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "11px", fontWeight: 600, color: INK }}>Chiudi</span>
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
        <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "11.5px", color: "#6E6E6E", marginBottom: "12px", lineHeight: 1.5 }}>
          Obbligatoria per ogni struttura: serve a calcolare le distanze dei consigli e a mostrare la posizione nell'app ospite.
        </p>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <Field label="Latitudine">
            <input
              value={form.latitude}
              onChange={(e) => set("latitude", e.target.value)}
              placeholder="Es. 44.1069"
              className="w-full px-3 py-2.5 rounded-xl outline-none"
              style={{ ...inputStyle(), fontFamily: "'Montserrat', sans-serif" }}
            />
          </Field>
          <Field label="Longitudine">
            <input
              value={form.longitude}
              onChange={(e) => set("longitude", e.target.value)}
              placeholder="Es. 9.7307"
              className="w-full px-3 py-2.5 rounded-xl outline-none"
              style={{ ...inputStyle(), fontFamily: "'Montserrat', sans-serif" }}
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
          <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "12px", fontWeight: 600, color: INK }}>
            {geoStatus === "loading" ? "Rilevamento in corso..." : "Rileva la mia posizione attuale"}
          </span>
        </button>
        {geoStatus === "done" && (
          <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "11px", color: TEAL, marginBottom: "12px" }}>
            ✓ Posizione rilevata dal browser (ricordate di premere "Salva modifiche")
          </p>
        )}
        {geoStatus === "error" && (
          <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "11px", color: CLAY, marginBottom: "12px", lineHeight: 1.5 }}>
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
                <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "11.5px", color: "#6E6E6E" }}>
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
                <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "10px", color: "#6E6E6E" }}>{lat.toFixed(5)}, {lng.toFixed(5)}</span>
                <a href={gmapsHref} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1">
                  <ExternalLink size={11} color={TEAL} />
                  <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "11px", fontWeight: 600, color: TEAL }}>Apri in Google Maps</span>
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
              <Clock size={14} color="#6E6E6E" className="absolute left-3 top-1/2 -translate-y-1/2" />
              <input value={form.check_in_time} onChange={(e) => set("check_in_time", e.target.value)} className="w-full pl-9 pr-3 py-2.5 rounded-xl outline-none" style={inputStyle()} />
            </div>
          </Field>
          <Field label="Orario check-out">
            <div className="relative">
              <Clock size={14} color="#6E6E6E" className="absolute left-3 top-1/2 -translate-y-1/2" />
              <input value={form.check_out_time} onChange={(e) => set("check_out_time", e.target.value)} className="w-full pl-9 pr-3 py-2.5 rounded-xl outline-none" style={inputStyle()} />
            </div>
          </Field>
          <Field label="Email di contatto">
            <input value={form.contact_email} onChange={(e) => set("contact_email", e.target.value)} className="w-full px-3 py-2.5 rounded-xl outline-none" style={inputStyle()} />
          </Field>
          <Field label="Telefono">
            <div className="relative">
              <Phone size={14} color="#6E6E6E" className="absolute left-3 top-1/2 -translate-y-1/2" />
              <input value={form.contact_phone} onChange={(e) => set("contact_phone", e.target.value)} className="w-full pl-9 pr-3 py-2.5 rounded-xl outline-none" style={inputStyle()} />
            </div>
          </Field>
        </div>
      </Section>

      <Section eyebrow="CONNETTIVITÀ" title="Wi-Fi e regole della casa">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <Field label="Nome rete (SSID)">
            <div className="relative">
              <Wifi size={14} color="#6E6E6E" className="absolute left-3 top-1/2 -translate-y-1/2" />
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
                style={{ ...inputStyle(), fontFamily: "'Montserrat', sans-serif" }}
              />
              <button onClick={() => removeEmergency(i)} className="p-2 rounded-lg" style={{ backgroundColor: "#F0EDF7" }}>
                <Trash2 size={14} color="#6E6E6E" />
              </button>
            </div>
          ))}
          <button onClick={addEmergency} className="flex items-center gap-1.5 mt-1 px-3 py-2 rounded-xl" style={{ border: `1px dashed ${LINE}` }}>
            <Plus size={13} color={TEAL} />
            <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "12px", color: TEAL, fontWeight: 600 }}>Aggiungi numero</span>
          </button>
        </div>
      </Section>

      <Section eyebrow="COMUNICAZIONI" title="Avviso in evidenza">
        <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "11.5px", color: "#6E6E6E", marginBottom: "12px", lineHeight: 1.5 }}>
          Un messaggio ben visibile in cima alla Home dell'app ospite — utile per manutenzioni, chiusure temporanee di servizi o avvisi importanti.
        </p>
        <div className="flex items-center gap-2 mb-4">
          <button onClick={() => set("notice_active", !form.notice_active)} className="flex items-center gap-2">
            <div className="w-9 h-5 rounded-full flex items-center px-0.5" style={{ backgroundColor: form.notice_active ? TEAL : "#D8CDB2", justifyContent: form.notice_active ? "flex-end" : "flex-start" }}>
              <div className="w-4 h-4 rounded-full bg-white" />
            </div>
          </button>
          <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "12.5px", fontWeight: 600, color: INK }}>
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
        <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "10.5px", color: "#6E6E6E", marginBottom: "12px" }}>
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
          <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "12px", color: "#6E6E6E" }}>Caricamento camere...</p>
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
                        style={{ backgroundColor: room.room_type === t.id ? INK : "#F0EDF7", border: `1px solid ${room.room_type === t.id ? INK : LINE}` }}
                      >
                        <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "8.5px", fontWeight: 600, color: room.room_type === t.id ? PARCHMENT : INK }}>
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
                      style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "11.5px", fontWeight: 600, color: INK, backgroundColor: "transparent" }}
                    />
                    <button onClick={() => removeRoom(room.id)} className="p-1 rounded-full shrink-0" style={{ backgroundColor: "#F0EDF7" }}>
                      <X size={10} color="#6E6E6E" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            <button onClick={addRoom} className="rounded-xl flex flex-col items-center justify-center gap-1.5 h-full min-h-[92px]" style={{ border: `1px dashed ${LINE}` }}>
              <Plus size={16} color={TEAL} />
              <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "11px", color: TEAL, fontWeight: 600 }}>Aggiungi camera</span>
            </button>
          </div>
        )}
        <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "10.5px", color: "#6E6E6E", marginTop: "8px" }}>
          Nome, foto, aggiunta e rimozione camere si salvano subito, in automatico (non serve premere "Salva modifiche" qui sopra).
        </p>
      </Section>

      <Section eyebrow="SOCIAL" title="Canali social e sito web">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Instagram">
            <div className="relative">
              <Instagram size={14} color="#6E6E6E" className="absolute left-3 top-1/2 -translate-y-1/2" />
              <input value={form.instagram_url} onChange={(e) => set("instagram_url", e.target.value)} placeholder="https://instagram.com/..." className="w-full pl-9 pr-3 py-2.5 rounded-xl outline-none" style={inputStyle()} />
            </div>
          </Field>
          <Field label="Facebook">
            <div className="relative">
              <Facebook size={14} color="#6E6E6E" className="absolute left-3 top-1/2 -translate-y-1/2" />
              <input value={form.facebook_url} onChange={(e) => set("facebook_url", e.target.value)} placeholder="https://facebook.com/..." className="w-full pl-9 pr-3 py-2.5 rounded-xl outline-none" style={inputStyle()} />
            </div>
          </Field>
          <Field label="TikTok">
            <div className="relative">
              <Music2 size={14} color="#6E6E6E" className="absolute left-3 top-1/2 -translate-y-1/2" />
              <input value={form.tiktok_url} onChange={(e) => set("tiktok_url", e.target.value)} placeholder="https://tiktok.com/@..." className="w-full pl-9 pr-3 py-2.5 rounded-xl outline-none" style={inputStyle()} />
            </div>
          </Field>
          <Field label="Sito web">
            <div className="relative">
              <LinkIcon size={14} color="#6E6E6E" className="absolute left-3 top-1/2 -translate-y-1/2" />
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
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full w-fit" style={{ backgroundColor: "#F0EDF7" }}>
      <meta.Icon size={11} color={TEAL} />
      <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "11px", fontWeight: 600, color: INK }}>{meta.label}</span>
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
          <h2 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: "20px", color: INK }}>
            {place ? "Modifica luogo" : "Nuovo luogo"}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-full" style={{ backgroundColor: "#F0EDF7" }}>
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
                    backgroundColor: form.category === id ? INK : "#F0EDF7",
                    border: `1px solid ${form.category === id ? INK : LINE}`,
                  }}
                >
                  <Icon size={13} color={form.category === id ? BRASS : TEAL} />
                  <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "12px", fontWeight: 600, color: form.category === id ? PARCHMENT : INK }}>
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
              <LinkIcon size={14} color="#6E6E6E" className="absolute left-3 top-1/2 -translate-y-1/2" />
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
              <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "12.5px", color: INK }}>Pubblicato</span>
            </button>
            <button onClick={() => setForm({ ...form, seasonal: !form.seasonal })} className="flex items-center gap-2">
              <div className="w-9 h-5 rounded-full flex items-center px-0.5" style={{ backgroundColor: form.seasonal ? TEAL : "#D8CDB2", justifyContent: form.seasonal ? "flex-end" : "flex-start" }}>
                <div className="w-4 h-4 rounded-full bg-white" />
              </div>
              <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "12.5px", color: INK }}>Calendarizzato stagionalmente</span>
            </button>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4" style={{ borderTop: `1px solid ${LINE}` }}>
          <button onClick={onClose} className="px-4 py-2.5 rounded-full" style={{ border: `1px solid ${LINE}` }}>
            <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "12.5px", fontWeight: 600, color: INK }}>Annulla</span>
          </button>
          <button
            onClick={() => onSave(form)}
            disabled={saving}
            className="px-4 py-2.5 rounded-full active:scale-[0.98] transition-transform"
            style={{ backgroundColor: CLAY, opacity: saving ? 0.7 : 1 }}
          >
            <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "12.5px", fontWeight: 600, color: PARCHMENT }}>
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
      {error && <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "12px", color: CLAY, marginBottom: "10px" }}>{error}</p>}
      <div className="flex items-center justify-between mb-5">
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFilter("tutti")}
            className="px-3.5 py-2 rounded-full"
            style={{ backgroundColor: filter === "tutti" ? INK : PAPER, border: `1px solid ${filter === "tutti" ? INK : LINE}` }}
          >
            <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "12px", fontWeight: 600, color: filter === "tutti" ? PARCHMENT : INK }}>
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
                <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "12px", fontWeight: 600, color: active ? PARCHMENT : INK }}>
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
          <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "12.5px", fontWeight: 600, color: PARCHMENT }}>Nuovo luogo</span>
        </button>
      </div>

      {loading ? (
        <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "13px", color: "#6E6E6E" }}>Caricamento luoghi...</p>
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
                  <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "13.5px", fontWeight: 600, color: INK }}>{p.name}</p>
                  {p.discount && (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ backgroundColor: "#F0EDF7" }}>
                      <Tag size={9} color={CLAY} />
                      <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "9.5px", color: CLAY }}>{p.discount}</span>
                    </span>
                  )}
                  {p.seasonal && (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ backgroundColor: "#F0EDF7" }}>
                      <CalendarRange size={9} color={TEAL} />
                      <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "9.5px", color: TEAL }}>stagionale</span>
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <CategoryBadge category={p.category} />
                  <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "11.5px", color: "#6E6E6E" }}>{p.address}</span>
                </div>
              </div>

              <button onClick={() => togglePublished(p.id)} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg shrink-0">
                {p.published ? <Eye size={14} color={TEAL} /> : <EyeOff size={14} color="#B4AC97" />}
                <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "11.5px", color: p.published ? TEAL : "#B4AC97" }}>
                  {p.published ? "Pubblicato" : "Bozza"}
                </span>
              </button>

              <button onClick={() => setEditing(p)} className="p-2 rounded-lg shrink-0" style={{ backgroundColor: "#F0EDF7" }}>
                <Pencil size={13} color={INK} />
              </button>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="py-10 text-center" style={{ backgroundColor: PAPER }}>
              <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "12.5px", color: "#6E6E6E" }}>Nessun luogo in questa categoria.</span>
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
          <h2 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: "20px", color: INK }}>
            {service ? "Modifica servizio" : "Nuovo servizio"}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-full" style={{ backgroundColor: "#F0EDF7" }}>
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
              <input value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="25" className="w-full px-3 py-2.5 rounded-xl outline-none" style={{ ...inputStyle(), fontFamily: "'Montserrat', sans-serif" }} />
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
            <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "12.5px", color: INK }}>Attivo e visibile agli ospiti</span>
          </button>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4" style={{ borderTop: `1px solid ${LINE}` }}>
          <button onClick={onClose} className="px-4 py-2.5 rounded-full" style={{ border: `1px solid ${LINE}` }}>
            <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "12.5px", fontWeight: 600, color: INK }}>Annulla</span>
          </button>
          <button onClick={() => onSave(form)} disabled={saving} className="px-4 py-2.5 rounded-full active:scale-[0.98] transition-transform" style={{ backgroundColor: CLAY, opacity: saving ? 0.7 : 1 }}>
            <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "12.5px", fontWeight: 600, color: PARCHMENT }}>{saving ? "Salvataggio..." : "Salva servizio"}</span>
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
      {error && <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "12px", color: CLAY, marginBottom: "10px" }}>{error}</p>}
      <div className="flex justify-end mb-5">
        <button onClick={() => setCreating(true)} className="flex items-center gap-1.5 px-4 py-2.5 rounded-full active:scale-[0.98] transition-transform" style={{ backgroundColor: CLAY }}>
          <Plus size={14} color={PARCHMENT} />
          <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "12.5px", fontWeight: 600, color: PARCHMENT }}>Nuovo servizio</span>
        </button>
      </div>
      {loading ? (
        <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "13px", color: "#6E6E6E" }}>Caricamento servizi...</p>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {services.map((s) => (
            <div key={s.id} className="rounded-2xl p-5" style={{ backgroundColor: PAPER, border: `1px solid ${LINE}` }}>
              <div className="flex items-start justify-between mb-2">
                <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: "17px", color: INK }}>{s.name}</p>
                <span
                  className="px-2 py-0.5 rounded-full shrink-0"
                  style={{ backgroundColor: s.active ? "#E4EEE9" : "#F0EDF7" }}
                >
                  <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "9px", color: s.active ? TEAL : "#6E6E6E" }}>
                    {s.active ? "ATTIVO" : "DISATTIVO"}
                  </span>
                </span>
              </div>
              <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "12px", color: "#6E6E6E", lineHeight: 1.5, marginBottom: "12px" }}>{s.desc}</p>
              <div className="flex items-center justify-between">
                <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "11px", color: CLAY }}>{s.price} € · {s.duration}</span>
                <button onClick={() => setEditing(s)} className="p-2 rounded-lg" style={{ backgroundColor: "#F0EDF7" }}>
                  <Pencil size={13} color={INK} />
                </button>
              </div>
            </div>
          ))}
          {services.length === 0 && (
            <div className="col-span-2 py-10 text-center rounded-2xl" style={{ backgroundColor: PAPER, border: `1px solid ${LINE}` }}>
              <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "12.5px", color: "#6E6E6E" }}>Nessun servizio configurato.</span>
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
  pending: { label: "In attesa", bg: "#F0EDF7", text: BRASS },
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
    return <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "13px", color: "#6E6E6E" }}>Caricamento prenotazioni...</p>;
  }

  return (
    <div className="max-w-4xl">
      {error && <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "12px", color: CLAY, marginBottom: "10px" }}>{error}</p>}
      <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${LINE}` }}>
        {bookings.map((b, i) => {
          const meta = STATUS_META[b.status] || STATUS_META.pending;
          return (
            <div key={b.id} className="flex items-center gap-4 px-5 py-4" style={{ backgroundColor: PAPER, borderTop: i === 0 ? "none" : `1px solid ${LINE}` }}>
              <div className="flex-1 min-w-0">
                <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "13.5px", fontWeight: 600, color: INK }}>{b.services?.name || "Servizio"}</p>
                <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "11.5px", color: "#6E6E6E", marginTop: "2px" }}>
                  {b.guest_name}{b.guest_contact ? ` (${b.guest_contact})` : ""} · {formatBookingWhen(b.requested_datetime)}
                </p>
                {b.notes && (
                  <p style={{ fontFamily: "'Montserrat', sans-serif", fontStyle: "italic", fontSize: "11px", color: "#6B6455", marginTop: "3px" }}>
                    “{b.notes}”
                  </p>
                )}
              </div>
              <span className="px-2.5 py-1 rounded-full shrink-0" style={{ backgroundColor: meta.bg }}>
                <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "9.5px", color: meta.text }}>{meta.label.toUpperCase()}</span>
              </span>
              <button className="p-2 rounded-lg shrink-0" style={{ backgroundColor: "#E7F7EC" }} title="Contatta su WhatsApp">
                <MessageCircle size={14} color="#25D366" />
              </button>
              {b.status === "pending" && (
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => setStatus(b.id, "confirmed")} className="px-3 py-1.5 rounded-full" style={{ backgroundColor: TEAL }}>
                    <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "11.5px", fontWeight: 600, color: PARCHMENT }}>Conferma</span>
                  </button>
                  <button onClick={() => setStatus(b.id, "declined")} className="px-3 py-1.5 rounded-full" style={{ border: `1px solid ${LINE}` }}>
                    <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "11.5px", fontWeight: 600, color: INK }}>Rifiuta</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
        {bookings.length === 0 && (
          <div className="py-10 text-center" style={{ backgroundColor: PAPER }}>
            <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "12.5px", color: "#6E6E6E" }}>Nessuna prenotazione ricevuta finora.</span>
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
          <h2 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: "20px", color: INK }}>
            {template ? "Modifica modello email" : "Nuovo modello email"}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-full" style={{ backgroundColor: "#F0EDF7" }}>
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
              style={{ ...inputStyle(), fontFamily: "'Montserrat', sans-serif" }}
            />
          </Field>
          <button onClick={() => setForm({ ...form, active: !form.active })} className="flex items-center gap-2">
            <div className="w-9 h-5 rounded-full flex items-center px-0.5" style={{ backgroundColor: form.active ? TEAL : "#D8CDB2", justifyContent: form.active ? "flex-end" : "flex-start" }}>
              <div className="w-4 h-4 rounded-full bg-white" />
            </div>
            <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "12.5px", color: INK }}>Attivo</span>
          </button>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4" style={{ borderTop: `1px solid ${LINE}` }}>
          <button onClick={onClose} className="px-4 py-2.5 rounded-full" style={{ border: `1px solid ${LINE}` }}>
            <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "12.5px", fontWeight: 600, color: INK }}>Annulla</span>
          </button>
          <button onClick={() => onSave(form)} disabled={saving || !form.subject.trim() || !form.body_html.trim()} className="px-4 py-2.5 rounded-full active:scale-[0.98] transition-transform" style={{ backgroundColor: CLAY, opacity: saving ? 0.7 : 1 }}>
            <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "12.5px", fontWeight: 600, color: PARCHMENT }}>{saving ? "Salvataggio..." : "Salva modello"}</span>
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
      {error && <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "12px", color: CLAY, marginBottom: "10px" }}>{error}</p>}
      {loading ? (
        <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "13px", color: "#6E6E6E" }}>Caricamento modelli email...</p>
      ) : (
        <div className="space-y-3">
          {templates.map((t) => (
            <div key={t.id} className="flex items-center gap-4 rounded-2xl px-5 py-4" style={{ backgroundColor: PAPER, border: `1px solid ${LINE}` }}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: "#F0EDF7" }}>
                <Mail size={16} color={TEAL} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "13.5px", fontWeight: 600, color: INK }}>{TRIGGER_META[t.trigger_type]?.label || t.trigger_type}</p>
                  <span className="px-2 py-0.5 rounded-full" style={{ backgroundColor: "#F0EDF7" }}>
                    <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "9px", color: BRASS }}>{offsetLabel(t.offsetHours).toUpperCase()}</span>
                  </span>
                </div>
                <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "12px", color: "#6E6E6E", marginTop: "2px" }}>{t.subject}</p>
              </div>
              <button onClick={() => toggle(t.id)} className="flex items-center gap-2 shrink-0">
                <div className="w-9 h-5 rounded-full flex items-center px-0.5" style={{ backgroundColor: t.active ? TEAL : "#D8CDB2", justifyContent: t.active ? "flex-end" : "flex-start" }}>
                  <div className="w-4 h-4 rounded-full bg-white" />
                </div>
              </button>
              <button onClick={() => setEditing(t)} className="p-2 rounded-lg shrink-0" style={{ backgroundColor: "#F0EDF7" }}>
                <Pencil size={13} color={INK} />
              </button>
            </div>
          ))}
          <button onClick={() => setCreating(true)} className="w-full flex items-center justify-center gap-1.5 py-3 rounded-2xl" style={{ border: `1px dashed ${LINE}` }}>
            <Plus size={14} color={TEAL} />
            <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "12.5px", fontWeight: 600, color: TEAL }}>Nuovo modello email</span>
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
  gruppo_amici: { label: "Gruppo amici", bg: "#F0EDF7", text: BRASS, Icon: PartyPopper },
  sport: { label: "Sport", bg: "#F0EDF7", text: "#6E6E6E", Icon: TrendingUp },
  altro: { label: "Altro", bg: "#F0EDF7", text: "#6E6E6E", Icon: Star },
};

const CHANNEL_META = {
  booking_com: { label: "Booking.com", bg: "#DCEAFB", text: "#1A5FB4" },
  airbnb: { label: "Airbnb", bg: "#FDE3E9", text: "#C4265E" },
  website: { label: "Sito web", bg: "#E4EEE9", text: TEAL },
  direct: { label: "Diretta", bg: "#F0EDF7", text: BRASS },
  other_ota: { label: "Altro portale", bg: "#F0EDF7", text: "#6E6E6E" },
  phone_email: { label: "Telefono/Email", bg: "#F0EDF7", text: "#6E6E6E" },
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
          <h2 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: "20px", color: INK }}>Nuovo ospite</h2>
          <button onClick={onClose} className="p-1.5 rounded-full" style={{ backgroundColor: "#F0EDF7" }}>
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
            <input value={form.booking_number} onChange={(e) => setForm({ ...form, booking_number: e.target.value })} className="w-full px-3 py-2.5 rounded-xl outline-none" style={{ ...inputStyle(), fontFamily: "'Montserrat', sans-serif" }} />
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
            <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "12.5px", fontWeight: 600, color: INK }}>Annulla</span>
          </button>
          <button onClick={() => onSave(form)} disabled={saving || !form.guest_name.trim()} className="px-4 py-2.5 rounded-full active:scale-[0.98] transition-transform" style={{ backgroundColor: CLAY, opacity: saving ? 0.7 : 1 }}>
            <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "12.5px", fontWeight: 600, color: PARCHMENT }}>{saving ? "Salvataggio..." : "Crea ospite"}</span>
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
      {error && <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "12px", color: CLAY, marginBottom: "10px" }}>{error}</p>}
      <div className="flex justify-end mb-5">
        <button onClick={() => setCreating(true)} className="flex items-center gap-1.5 px-4 py-2.5 rounded-full active:scale-[0.98] transition-transform" style={{ backgroundColor: CLAY }}>
          <Plus size={14} color={PARCHMENT} />
          <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "12.5px", fontWeight: 600, color: PARCHMENT }}>Invita ospite</span>
        </button>
      </div>
      {loading ? (
        <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "13px", color: "#6E6E6E" }}>Caricamento ospiti...</p>
      ) : (
        <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${LINE}` }}>
          {guests.map((g, i) => (
            <div key={g.id} className="flex items-center gap-4 px-5 py-4" style={{ backgroundColor: PAPER, borderTop: i === 0 ? "none" : `1px solid ${LINE}` }}>
              <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: BRASS }}>
                <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "11px", fontWeight: 600, color: INK }}>
                  {(g.guest_name || "?").split(" ").map((n) => n[0]).join("").slice(0, 2)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "13.5px", fontWeight: 600, color: INK }}>{g.guest_name}</p>
                  <span className="px-2 py-0.5 rounded-full" style={{ backgroundColor: CHANNEL_META[g.channel]?.bg || "#F0EDF7" }}>
                    <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "9px", color: CHANNEL_META[g.channel]?.text || "#6E6E6E" }}>
                      {(CHANNEL_META[g.channel]?.label || g.channel || "").toUpperCase()}
                    </span>
                  </span>
                  {g.stay_purpose && PURPOSE_META[g.stay_purpose] && (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ backgroundColor: PURPOSE_META[g.stay_purpose].bg }}>
                      {React.createElement(PURPOSE_META[g.stay_purpose].Icon, { size: 9, color: PURPOSE_META[g.stay_purpose].text })}
                      <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "9px", color: PURPOSE_META[g.stay_purpose].text }}>
                        {PURPOSE_META[g.stay_purpose].label.toUpperCase()}
                      </span>
                    </span>
                  )}
                  {g.returning && (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ backgroundColor: "#FBEFD9" }}>
                      <Repeat size={9} color={CLAY} />
                      <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "9px", color: CLAY }}>CLIENTE FEDELE</span>
                    </span>
                  )}
                </div>
                <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "10.5px", color: "#6E6E6E", marginTop: "2px" }}>
                  {g.booking_number || "—"} · {fmtGuestDate(g.check_in_date)} → {fmtGuestDate(g.check_out_date)}
                </p>
              </div>
              <button onClick={() => copyLink(g)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full shrink-0" style={{ border: `1px solid ${LINE}` }}>
                <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "11.5px", fontWeight: 600, color: INK }}>
                  {copiedId === g.id ? "Copiato ✓" : "Copia link"}
                </span>
              </button>
            </div>
          ))}
          {guests.length === 0 && (
            <div className="py-10 text-center" style={{ backgroundColor: PAPER }}>
              <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "12.5px", color: "#6E6E6E" }}>Nessun ospite ancora registrato.</span>
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
    return <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "13px", color: "#6E6E6E" }}>Caricamento messaggi...</p>;
  }

  if (threads.length === 0) {
    return (
      <div className="max-w-4xl rounded-2xl p-10 text-center" style={{ border: `1px solid ${LINE}`, backgroundColor: PAPER }}>
        <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "12.5px", color: "#6E6E6E" }}>Nessun messaggio ricevuto finora.</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl flex rounded-2xl overflow-hidden" style={{ border: `1px solid ${LINE}`, height: "520px" }}>
      {error && <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "12px", color: CLAY, position: "absolute" }}>{error}</p>}
      <div className="w-64 shrink-0 overflow-y-auto" style={{ backgroundColor: PAPER, borderRight: `1px solid ${LINE}` }}>
        {threads.map((t) => (
          <button
            key={t.id}
            onClick={() => openThread(t.id)}
            className="w-full text-left px-4 py-3.5"
            style={{ backgroundColor: t.id === activeId ? "#F0EDF7" : "transparent", borderBottom: `1px solid ${LINE}` }}
          >
            <div className="flex items-center justify-between">
              <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "13px", fontWeight: 600, color: INK }}>{t.guest}</span>
              {t.unread && <span className="w-2 h-2 rounded-full" style={{ backgroundColor: CLAY }} />}
            </div>
            <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "11px", color: "#6E6E6E", marginTop: "2px" }}>{t.context}</p>
          </button>
        ))}
      </div>
      {thread && (
        <div className="flex-1 flex flex-col" style={{ backgroundColor: PARCHMENT }}>
          <div className="px-5 py-3.5" style={{ borderBottom: `1px solid ${LINE}`, backgroundColor: PAPER }}>
            <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "13.5px", fontWeight: 600, color: INK }}>{thread.guest}</p>
            <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "11px", color: "#6E6E6E" }}>{thread.context}</p>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
            {thread.messages.map((m) => (
              <div key={m.id} className="flex" style={{ justifyContent: m.sender === "host" ? "flex-end" : "flex-start" }}>
                <div
                  className="max-w-[70%] px-3.5 py-2 rounded-2xl"
                  style={{ backgroundColor: m.sender === "host" ? INK : PAPER, border: m.sender === "host" ? "none" : `1px solid ${LINE}` }}
                >
                  <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "12.5px", color: m.sender === "host" ? PARCHMENT : INK }}>{m.body}</p>
                  <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "9px", color: m.sender === "host" ? "#9C9483" : "#B4AC97", marginTop: "3px" }}>{fmtMsgTime(m.created_at)}</p>
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
    <div className="rounded flex items-center gap-3 px-4 py-3" style={{ backgroundColor: PAPER, border: `1px solid ${LINE}` }}>
      <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: "#F0EDF7" }}>
        <Icon size={16} color={CLAY} />
      </div>
      <div className="min-w-0">
        <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: "20px", color: INK, lineHeight: 1.15 }}>{value}</p>
        <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "11px", color: "#6E6E6E" }}>{label}</p>
      </div>
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
          <h2 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: "19px", color: INK }}>
            Collega {info.label}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-full" style={{ backgroundColor: "#F0EDF7" }}>
            <X size={15} color={INK} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "12px", color: "#6E6E6E", lineHeight: 1.5 }}>{info.note}</p>
          {info.fields.map((f) => (
            <Field key={f.key} label={f.label}>
              <input
                readOnly={f.readOnly}
                value={f.readOnly ? f.value : (values[f.key] || "")}
                onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
                placeholder={f.placeholder}
                onFocus={(e) => f.readOnly && e.target.select()}
                className="w-full px-3 py-2.5 rounded-xl outline-none"
                style={{ ...inputStyle(), fontFamily: f.readOnly ? "'Montserrat', sans-serif" : "'Montserrat', sans-serif", fontSize: f.readOnly ? "11.5px" : "13px" }}
              />
            </Field>
          ))}
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4" style={{ borderTop: `1px solid ${LINE}` }}>
          <button onClick={onClose} className="px-4 py-2.5 rounded-full" style={{ border: `1px solid ${LINE}` }}>
            <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "12.5px", fontWeight: 600, color: INK }}>Annulla</span>
          </button>
          <button onClick={() => { onConnect(channelId); onClose(); }} className="px-4 py-2.5 rounded-full active:scale-[0.98] transition-transform" style={{ backgroundColor: CLAY }}>
            <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "12.5px", fontWeight: 600, color: PARCHMENT }}>
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
              style={{ backgroundColor: "#F0EDF7", border: `1px solid ${LINE}` }}
            >
              <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "12.5px", fontWeight: 600, color: INK }}>{info.label}</p>
              <div className="flex items-center gap-1.5 mt-1">
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: connected ? TEAL : "#B4AC97" }} />
                <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "9.5px", color: connected ? TEAL : "#6E6E6E" }}>
                  {connected ? "CONNESSO" : "NON COLLEGATO"}
                </span>
              </div>
              <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "10.5px", color: CLAY, marginTop: "4px", display: "block" }}>
                {connected ? "Gestisci →" : "Collega →"}
              </span>
            </button>
          );
        })}
      </div>
      <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "11px", color: "#6E6E6E", marginTop: "10px" }}>
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
    return <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "13px", color: CLAY }}>Non riesco a caricare le impostazioni: {propertyError}</p>;
  }
  if (propertyLoading) {
    return <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "13px", color: "#6E6E6E" }}>Caricamento impostazioni...</p>;
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6 sticky top-0 z-10 -mx-1 px-1 py-2" style={{ backgroundColor: "#F5F3FA" }}>
        <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "10px", color: saveState === "error" ? CLAY : "#6E6E6E" }}>
          {saveState === "error" ? saveError : "Nome struttura e logo si gestiscono in \"Dati struttura\"."}
        </p>
        <button
          onClick={handleSave}
          disabled={saveState === "saving"}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full active:scale-[0.98] transition-transform shrink-0"
          style={{ backgroundColor: saveState === "saved" ? TEAL : saveState === "error" ? "#B33A2E" : CLAY, opacity: saveState === "saving" ? 0.7 : 1 }}
        >
          {saveState === "saved" ? <Check size={14} color={PARCHMENT} /> : <Save size={14} color={PARCHMENT} />}
          <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "12.5px", fontWeight: 600, color: PARCHMENT }}>
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
            <div key={key} className="flex items-center justify-between px-4 py-3 rounded-xl" style={{ backgroundColor: "#F0EDF7" }}>
              <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "12.5px", fontWeight: 600, color: INK }}>{label}</span>
              <button onClick={() => toggleSection(key)} className="flex items-center gap-2">
                <div className="w-9 h-5 rounded-full flex items-center px-0.5" style={{ backgroundColor: sections[key] ? TEAL : "#D8CDB2", justifyContent: sections[key] ? "flex-end" : "flex-start" }}>
                  <div className="w-4 h-4 rounded-full bg-white" />
                </div>
              </button>
            </div>
          ))}
        </div>
        <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "11px", color: "#6E6E6E", marginTop: "10px" }}>
          Disattivando una sezione, la relativa voce sparisce dalla Home e dalla barra di navigazione dell'app ospite — i contenuti restano salvati, potete riattivarla quando volete. Ricordate di premere "Salva modifiche" qui sopra.
        </p>
      </Section>

      <button onClick={resetDefaults} className="flex items-center gap-2 px-4 py-2.5 rounded-full" style={{ border: `1px solid ${LINE}` }}>
        <RotateCcw size={13} color={INK} />
        <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "12px", fontWeight: 600, color: INK }}>Ripristina impostazioni predefinite</span>
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
                <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "12.5px", fontWeight: 600, color: INK }}>{p.period}</p>
                <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "11px", color: "#6E6E6E", marginTop: "1px" }}>{p.date}</p>
              </div>
              <div className="flex items-center gap-2.5">
                <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "11.5px", color: INK }}>{p.amount} €</span>
                <span className="px-2.5 py-1 rounded-full" style={{ backgroundColor: meta.bg }}>
                  <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "9px", color: meta.text }}>{meta.label.toUpperCase()}</span>
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
      <div className="flex items-start gap-2.5 p-3.5 rounded-xl mb-3" style={{ backgroundColor: "#F0EDF7" }}>
        <AlertTriangle size={14} color="#6E6E6E" className="shrink-0 mt-0.5" />
        <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "11px", color: "#6E6E6E", lineHeight: 1.5 }}>
          Il blocco automatico dopo mancato pagamento è gestito da un processo lato server (non da un interruttore qui) e richiede l'integrazione reale dei pagamenti (Stripe), non ancora collegata. Qui sotto potete comunque bloccare/sbloccare manualmente la struttura in qualsiasi momento — questo interruttore scrive davvero sul database.
        </p>
      </div>

      {error && <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "12px", color: CLAY, marginBottom: "10px" }}>{error}</p>}

      {isMultiProperty ? (
        <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${LINE}` }}>
          <div className="px-4 py-2.5" style={{ backgroundColor: "#F0EDF7", borderBottom: `1px solid ${LINE}` }}>
            <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "11px", color: "#6E6E6E" }}>
              Il piano Multistruttura permetterebbe di bloccare/sbloccare ogni struttura singolarmente — questa dashboard però gestisce al momento una sola struttura per account, quindi qui sotto trovate solo quella collegata.
            </p>
          </div>
          <div className="flex items-center justify-between px-4 py-3" style={{ backgroundColor: locked ? "#F7E3DB" : PAPER }}>
            <div>
              <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "12.5px", fontWeight: 600, color: INK }}>{property?.name}</p>
              <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "9.5px", color: locked ? CLAY : TEAL, marginTop: "1px" }}>
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
              <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "11px", fontWeight: 600, color: PARCHMENT }}>
                {locked ? "Sblocca" : "Blocca"}
              </span>
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between p-4 rounded-xl" style={{ backgroundColor: locked ? "#F7E3DB" : "#F0EDF7" }}>
          <div>
            <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "12.5px", fontWeight: 600, color: INK }}>
              Stato struttura: {locked ? "bloccata" : "attiva"}
            </p>
            <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "11px", color: "#6E6E6E", marginTop: "1px" }}>
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
            <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "11.5px", fontWeight: 600, color: PARCHMENT }}>
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
        <div className="flex items-center justify-between p-4 rounded-xl mb-3" style={{ backgroundColor: "#F0EDF7" }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: trialEnabled ? BRASS : "#D8CDB2" }}>
              <Hourglass size={16} color={INK} />
            </div>
            <div>
              <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "12.5px", fontWeight: 600, color: INK }}>Prova gratuita attiva</p>
              <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "11px", color: "#6E6E6E", marginTop: "1px" }}>
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

        <div className="flex items-center justify-between p-4 rounded-xl mb-3" style={{ backgroundColor: "#F0EDF7" }}>
          <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "12.5px", fontWeight: 600, color: INK }}>Durata prova</span>
          <div className="flex items-center gap-3">
            <button onClick={() => setTrialTotal(Math.max(1, trialTotal - 1))} className="w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: PAPER, border: `1px solid ${LINE}` }}>
              <span style={{ color: INK }}>−</span>
            </button>
            <input
              value={trialTotal}
              onChange={(e) => setTrialTotal(Math.max(1, Number(e.target.value.replace(/\D/g, "")) || 1))}
              className="w-14 text-center py-1 rounded-lg outline-none"
              style={{ backgroundColor: PAPER, border: `1px solid ${LINE}`, fontFamily: "'Montserrat', sans-serif", fontSize: "13px", color: INK }}
            />
            <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "12px", color: "#6E6E6E" }}>giorni</span>
            <button onClick={() => setTrialTotal(trialTotal + 1)} className="w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: PAPER, border: `1px solid ${LINE}` }}>
              <span style={{ color: INK }}>+</span>
            </button>
          </div>
        </div>

        <div className="p-4 rounded-xl" style={{ backgroundColor: "#F0EDF7" }}>
          <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "12.5px", fontWeight: 600, color: INK, marginBottom: "8px" }}>
            Link da inviare per iniziare la prova
          </p>
          <div className="flex items-center gap-2">
            <span
              className="flex-1 px-3 py-2 rounded-lg"
              style={{ backgroundColor: PAPER, border: `1px solid ${LINE}`, fontFamily: "'Montserrat', sans-serif", fontSize: "11px", color: "#6B6455", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
            >
              {trialLink}
            </span>
            <button
              onClick={() => { setLinkCopied(true); setTimeout(() => setLinkCopied(false), 2000); }}
              className="px-3 py-2 rounded-lg shrink-0"
              style={{ backgroundColor: linkCopied ? TEAL : PAPER, border: `1px solid ${linkCopied ? TEAL : LINE}` }}
            >
              <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "11px", fontWeight: 600, color: linkCopied ? PARCHMENT : INK }}>
                {linkCopied ? "Copiato ✓" : "Copia link"}
              </span>
            </button>
          </div>
        </div>
      </Section>

      {inTrial && (
        <div className="rounded-2xl p-5 mb-5 flex items-center gap-4" style={{ backgroundColor: "#F0EDF7", border: `1px solid ${LINE}` }}>
          <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: BRASS }}>
            <Hourglass size={20} color={INK} />
          </div>
          <div className="flex-1">
            <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "14px", fontWeight: 600, color: INK }}>
              Siete in prova gratuita — {trialDaysLeft} giorni rimasti su {trialTotal}
            </p>
            <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "12px", color: "#6E6E6E", marginTop: "2px" }}>
              Alla scadenza l'app resterà attiva in sola lettura finché non scegliete un piano.
            </p>
            <div className="w-full h-1.5 rounded-full mt-3" style={{ backgroundColor: "#E4DAC4" }}>
              <div className="h-full rounded-full" style={{ width: `${(trialDaysLeft / trialTotal) * 100}%`, backgroundColor: CLAY }} />
            </div>
          </div>
        </div>
      )}

      <Section eyebrow="PIANI" title="Scegliete il vostro abbonamento">
        <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "11px", color: "#6E6E6E", marginBottom: "10px" }}>
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
                  backgroundColor: selected ? INK : "#F0EDF7",
                  border: `1px solid ${selected ? INK : LINE}`,
                  opacity: p.active ? 1 : 0.6,
                }}
              >
                {p.highlight && (
                  <span className="absolute -top-2 right-3 px-2 py-0.5 rounded-full" style={{ backgroundColor: CLAY }}>
                    <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "8.5px", color: PARCHMENT }}>PIÙ SCELTO</span>
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
                        fontFamily: "'Montserrat', sans-serif",
                        fontWeight: 700,
                        fontSize: "16px",
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
                    <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "8.5px", color: CLAY }}>NON IN VENDITA</span>
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
                      fontFamily: "'Montserrat', sans-serif",
                      fontSize: "16px",
                      color: selected ? BRASS : CLAY,
                      textAlign: "center",
                    }}
                  />
                  <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "16px", color: selected ? BRASS : CLAY }}>€</span>
                  <span style={{ fontSize: "10px", color: selected ? "#9C9483" : "#6E6E6E" }}>/mese</span>
                </div>
                <div className="mt-3 space-y-1.5">
                  {p.features.map((f) => (
                    <div key={f} className="flex items-start gap-1.5">
                      <Check size={11} color={selected ? BRASS : TEAL} className="mt-0.5 shrink-0" />
                      <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "10.5px", color: selected ? "#C9C2AF" : "#6B6455" }}>{f}</span>
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
          <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "13px", fontWeight: 600, color: PARCHMENT }}>
            {inTrial ? "Attiva l'abbonamento ora" : "Aggiorna metodo di pagamento"}
          </span>
        </button>
        {paymentClicked && (
          <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "11px", color: TEAL, marginTop: "8px" }}>
            ✓ In produzione questo pulsante aprirebbe il checkout di pagamento su checkout.evolutiontrip.it
          </p>
        )}
        <div className="flex items-center justify-between mt-3 px-4 py-2.5 rounded-xl" style={{ backgroundColor: "#F0EDF7" }}>
          <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "10.5px", color: "#6E6E6E", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            checkout.evolutiontrip.it/pay/{selectedPlan}
          </span>
          <button className="px-2.5 py-1 rounded-full shrink-0 ml-2" style={{ backgroundColor: PAPER, border: `1px solid ${LINE}` }}>
            <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "10.5px", fontWeight: 600, color: INK }}>Copia link</span>
          </button>
        </div>
      </Section>

      <PaymentHistorySection />
      <LockSection isMultiProperty={selectedPlan === "multi_struttura"} />

      <Section eyebrow="FATTURAZIONE" title="Metodo di pagamento">
        <div className="flex items-center justify-between p-4 rounded-xl" style={{ backgroundColor: "#F0EDF7" }}>
          <div className="flex items-center gap-2.5">
            <CreditCard size={16} color="#6E6E6E" />
            <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "12.5px", color: "#6E6E6E" }}>Nessun metodo di pagamento salvato</span>
          </div>
          <button
            onClick={() => setPaymentClicked(true)}
            className="px-3 py-1.5 rounded-full"
            style={{ border: `1px solid ${LINE}` }}
          >
            <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "11.5px", fontWeight: 600, color: INK }}>Aggiungi carta</span>
          </button>
        </div>
      </Section>
    </div>
  );
}

const FLYER_TRAVELER_IMG = "data:image/png;base64,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";

/**
 * Riquadro reale (non demo): mostra il link vero della struttura, con
 * copia, apertura come ospite, condivisione WhatsApp e un volantino
 * scaricabile con il QR vero generato per questa struttura.
 * Il colore personalizzato dell'app si gestisce gia' altrove, in
 * "Impostazioni app" (property.accent_color / home_color): non lo
 * ripetiamo qui per non avere due posti diversi che modificano la
 * stessa cosa.
 */
function InviteGuestsSection({ property }) {
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);
  const canvasRef = useRef(null);

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const guestLink = property?.slug && origin ? `${origin}/g/${property.slug}` : "";
  const qrSrc = guestLink
    ? `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(guestLink)}`
    : "";

  const copyLink = () => {
    if (!guestLink) return;
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    if (navigator.clipboard) navigator.clipboard.writeText(guestLink);
  };

  const loadImage = (src, crossOrigin) =>
    new Promise((resolve, reject) => {
      const img = new Image();
      if (crossOrigin) img.crossOrigin = crossOrigin;
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });

  const downloadFlyer = async () => {
    if (!guestLink || generating) return;
    setGenerating(true);
    try {
      const W = 1000, H = 700;
      const canvas = canvasRef.current || document.createElement("canvas");
      canvas.width = W; canvas.height = H;
      const ctx = canvas.getContext("2d");

      ctx.fillStyle = "#F4F2ED";
      ctx.fillRect(0, 0, W, H);

      const [traveler, qr] = await Promise.all([
        loadImage(FLYER_TRAVELER_IMG),
        loadImage(qrSrc, "anonymous"),
      ]);

      // viaggiatore, ancorato in basso a destra
      const travH = H * 0.86;
      const travW = travH * (traveler.width / traveler.height);
      ctx.drawImage(traveler, W - travW - 40, H - travH - 20, travW, travH);

      // riquadro bianco per il QR, in alto a sinistra
      const qrBox = 260, qrX = 60, qrY = 90;
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(qrX, qrY, qrBox, qrBox);
      ctx.strokeStyle = "#CFCFCF";
      ctx.lineWidth = 2;
      ctx.strokeRect(qrX, qrY, qrBox, qrBox);
      ctx.drawImage(qr, qrX + 15, qrY + 15, qrBox - 30, qrBox - 30);

      // nome struttura
      ctx.fillStyle = "#B98C4A";
      ctx.font = "700 30px Montserrat, sans-serif";
      ctx.textAlign = "left";
      ctx.fillText((property?.name || "La tua struttura").toUpperCase(), qrX, qrY - 30);

      // titolo + sottotitolo
      ctx.font = "700 30px Montserrat, sans-serif";
      ctx.fillText("RENDI UNICA LA", qrX, qrY + qrBox + 55);
      ctx.fillText("TUA VACANZA", qrX, qrY + qrBox + 92);
      ctx.fillStyle = "#555555";
      ctx.font = "400 15px Montserrat, sans-serif";
      ctx.fillText("Inquadra il QR Code e scopri i nostri", qrX, qrY + qrBox + 122);
      ctx.fillText("consigli su luoghi e locali", qrX, qrY + qrBox + 142);

      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `volantino-${property?.slug || "struttura"}.png`;
        a.click();
        URL.revokeObjectURL(url);
        setGenerating(false);
      }, "image/png");
    } catch (e) {
      // Il caso piu' comune e' un blocco di rete sul QR: apriamo il link
      // diretto come ripiego, cosi' l'host puo' comunque salvare l'immagine.
      window.open(qrSrc, "_blank");
      setGenerating(false);
    }
  };

  return (
    <Section eyebrow="ACCOGLIENZA OSPITI" title="Invita i tuoi ospiti">
      <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "11.5px", color: "#6E6E6E", marginBottom: "12px", lineHeight: 1.5 }}>
        Condividi il link della tua struttura o scarica il volantino con il QR Code da stampare ed esporre in struttura.
      </p>
      <div className="flex items-center gap-2 mb-3">
        <span
          className="flex-1 px-3 py-2.5 rounded-xl"
          style={{ backgroundColor: "#F0EDF7", border: `1px solid ${LINE}`, fontFamily: "'Montserrat', sans-serif", fontSize: "11.5px", color: "#6B6455", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
        >
          {guestLink || "Completa prima i dati struttura per generare il link"}
        </span>
        <button
          onClick={copyLink}
          disabled={!guestLink}
          className="px-3.5 py-2.5 rounded-xl shrink-0"
          style={{ backgroundColor: copied ? TEAL : CLAY, opacity: guestLink ? 1 : 0.5 }}
        >
          <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "12px", fontWeight: 600, color: PARCHMENT }}>
            {copied ? "Copiato ✓" : "Copia link"}
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
          <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "11.5px", fontWeight: 600, color: INK }}>Anteprima</span>
        </a>
        <a
          href={guestLink ? `https://wa.me/?text=${encodeURIComponent(guestLink)}` : undefined}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-2 rounded-full"
          style={{ border: `1px solid ${LINE}`, opacity: guestLink ? 1 : 0.5, pointerEvents: guestLink ? "auto" : "none" }}
        >
          <svg width="12" height="12" viewBox="0 0 16 16" fill={TEAL}><path d="M8 1.2A6.8 6.8 0 0 0 2.2 11.5L1.2 14.8l3.4-1A6.8 6.8 0 1 0 8 1.2z"/></svg>
          <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "11.5px", fontWeight: 600, color: INK }}>Invia con WhatsApp</span>
        </a>
        <button
          onClick={downloadFlyer}
          disabled={!guestLink || generating}
          className="flex items-center gap-1.5 px-3 py-2 rounded-full"
          style={{ border: `1px solid ${LINE}`, opacity: guestLink ? 1 : 0.5 }}
        >
          <svg width="12" height="12" viewBox="0 0 16 16" fill={INK}><path d="M7 1.5h2v6h2.5L8 11.5 4.5 7.5H7zM2 12.5h12v2H2z"/></svg>
          <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "11.5px", fontWeight: 600, color: INK }}>
            {generating ? "Preparazione..." : "Scarica volantino"}
          </span>
        </button>
      </div>
      <canvas ref={canvasRef} style={{ display: "none" }} />
    </Section>
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
    return <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "13px", color: "#6E6E6E" }}>Caricamento statistiche...</p>;
  }

  return (
    <div className="max-w-4xl">
      {error && <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "12px", color: CLAY, marginBottom: "10px" }}>{error}</p>}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard label="Luoghi pubblicati" value={String(stats?.places_published ?? 0)} Icon={Compass} />
        <StatCard label="Prenotazioni totali" value={String(stats?.bookings_total ?? 0)} Icon={CalendarCheck} />
        <StatCard label="Email inviate" value={String(stats?.emails_sent ?? 0)} Icon={Mail} />
        <StatCard label="Valutazione media" value={stats?.avg_rating != null ? String(stats.avg_rating) : "—"} Icon={Star} />
      </div>

      <InviteGuestsSection property={property} />

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
                <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "12.5px", fontWeight: 600, color: INK }}>{f.guest_name || "Ospite"}</p>
                {f.comment && <p style={{ fontFamily: "'Montserrat', sans-serif", fontStyle: "italic", fontSize: "12px", color: "#6B6455", marginTop: "2px" }}>"{f.comment}"</p>}
              </div>
            </div>
          ))}
          {feedback.length === 0 && (
            <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "12.5px", color: "#6E6E6E" }}>Nessun feedback ricevuto finora.</p>
          )}
        </div>
      </Section>

      <Section eyebrow="CONTENUTI" title="Lingue disponibili">
        <div className="flex items-center gap-2 flex-wrap">
          {[{ code: "IT", full: true }, { code: "EN", full: true }, { code: "RU", full: true }, { code: "FR", full: false }, { code: "DE", full: false }].map((l) => (
            <div key={l.code} className="flex items-center gap-2 px-3.5 py-2 rounded-full" style={{ backgroundColor: l.full ? "#E4EEE9" : "#F0EDF7" }}>
              <Globe size={13} color={l.full ? TEAL : "#6E6E6E"} />
              <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "11px", color: l.full ? TEAL : "#6E6E6E" }}>{l.code}</span>
              <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "10.5px", color: l.full ? TEAL : "#6E6E6E" }}>
                {l.full ? "completo" : "da tradurre"}
              </span>
            </div>
          ))}
        </div>
        <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "10.5px", color: "#6E6E6E", marginTop: "10px" }}>
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
          <div key={i} className="relative w-16 h-16 rounded-xl overflow-hidden" style={{ backgroundColor: "#F0EDF7", border: `1px solid ${LINE}` }}>
            {url && url.startsWith("http") ? (
              <img src={url} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <FileText size={14} color="#6E6E6E" />
              </div>
            )}
            <button onClick={() => onRemove(i)} className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(27,42,65,0.7)" }}>
              <X size={9} color="#fff" />
            </button>
          </div>
        ))}
        <button onClick={() => fileInputRef.current.click()} disabled={uploading} className="w-16 h-16 rounded-xl flex flex-col items-center justify-center gap-1" style={{ border: `1px dashed ${LINE}`, backgroundColor: "#F0EDF7" }}>
          <Upload size={14} color="#6E6E6E" />
          <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "8px", color: "#6E6E6E" }}>{uploading ? "..." : "ADD"}</span>
        </button>
      </div>
      {uploadError && <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "10.5px", color: CLAY, marginTop: "6px" }}>{uploadError}</p>}
    </Field>
  );
}

function EventEditor({ event, onClose, onSave, saving }) {
  const [form, setForm] = useState(event || { category: "evento_locale", name: "", venue: "", start: "", end: "", published: true, officialUrl: "", photos: [] });
  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center px-6" style={{ backgroundColor: "rgba(27,42,65,0.5)" }}>
      <div className="w-full max-w-lg rounded-2xl overflow-hidden" style={{ backgroundColor: PAPER, maxHeight: "88vh", overflowY: "auto" }}>
        <div className="flex items-center justify-between px-6 pt-5 pb-4" style={{ borderBottom: `1px solid ${LINE}` }}>
          <h2 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: "20px", color: INK }}>
            {event ? "Modifica evento" : "Nuovo evento o fiera"}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-full" style={{ backgroundColor: "#F0EDF7" }}>
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
                  style={{ backgroundColor: form.category === id ? INK : "#F0EDF7", border: `1px solid ${form.category === id ? INK : LINE}` }}
                >
                  <Icon size={13} color={form.category === id ? BRASS : TEAL} />
                  <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "12px", fontWeight: 600, color: form.category === id ? PARCHMENT : INK }}>{label}</span>
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
              <LinkIcon size={14} color="#6E6E6E" className="absolute left-3 top-1/2 -translate-y-1/2" />
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
            <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "12.5px", color: INK }}>Pubblicato agli ospiti</span>
          </button>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4" style={{ borderTop: `1px solid ${LINE}` }}>
          <button onClick={onClose} className="px-4 py-2.5 rounded-full" style={{ border: `1px solid ${LINE}` }}>
            <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "12.5px", fontWeight: 600, color: INK }}>Annulla</span>
          </button>
          <button onClick={() => onSave(form)} disabled={saving} className="px-4 py-2.5 rounded-full active:scale-[0.98] transition-transform" style={{ backgroundColor: CLAY, opacity: saving ? 0.7 : 1 }}>
            <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "12.5px", fontWeight: 600, color: PARCHMENT }}>{saving ? "Salvataggio..." : "Salva evento"}</span>
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
      {error && <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "12px", color: CLAY, marginBottom: "10px" }}>{error}</p>}
      <div className="flex justify-end mb-5">
        <button onClick={() => setCreating(true)} className="flex items-center gap-1.5 px-4 py-2.5 rounded-full active:scale-[0.98] transition-transform" style={{ backgroundColor: CLAY }}>
          <Plus size={14} color={PARCHMENT} />
          <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "12.5px", fontWeight: 600, color: PARCHMENT }}>Nuovo evento</span>
        </button>
      </div>
      {loading ? (
        <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "13px", color: "#6E6E6E" }}>Caricamento eventi...</p>
      ) : (
        <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${LINE}` }}>
          {events.map((e, i) => {
            const cat = EVENT_CATEGORIES.find((c) => c.id === e.category);
            return (
              <div key={e.id} className="flex items-center gap-4 px-5 py-4" style={{ backgroundColor: PAPER, borderTop: i === 0 ? "none" : `1px solid ${LINE}` }}>
                <div className="w-11 h-11 rounded-xl flex flex-col items-center justify-center shrink-0" style={{ backgroundColor: "#F0EDF7" }}>
                  <CalendarDays size={16} color={TEAL} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "13.5px", fontWeight: 600, color: INK }}>{e.name}</p>
                    {cat && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ backgroundColor: "#F0EDF7" }}>
                        <cat.Icon size={9} color={TEAL} />
                        <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "9px", color: TEAL }}>{cat.label.toUpperCase()}</span>
                      </span>
                    )}
                  </div>
                  <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "11.5px", color: "#6E6E6E", marginTop: "2px" }}>
                    {e.venue} · {fmt(e.start)}{e.end && e.end !== e.start ? ` → ${fmt(e.end)}` : ""}
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full shrink-0" style={{ backgroundColor: e.published ? "#E4EEE9" : "#F0EDF7" }}>
                  <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "9px", color: e.published ? TEAL : "#6E6E6E" }}>
                    {e.published ? "PUBBLICATO" : "BOZZA"}
                  </span>
                </span>
                <button onClick={() => setEditing(e)} className="p-2 rounded-lg shrink-0" style={{ backgroundColor: "#F0EDF7" }}>
                  <Pencil size={13} color={INK} />
                </button>
              </div>
            );
          })}
          {events.length === 0 && (
            <div className="py-10 text-center" style={{ backgroundColor: PAPER }}>
              <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "12.5px", color: "#6E6E6E" }}>Nessun evento in programma.</span>
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
    return <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "13px", color: "#6E6E6E" }}>Caricamento menù...</p>;
  }

  const pdfFileName = current.pdf_url ? current.pdf_url.split("/").pop() : null;

  return (
    <div className="max-w-3xl">
      {error && <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "12px", color: CLAY, marginBottom: "10px" }}>{error}</p>}
      <div className="flex gap-2 mb-5 flex-wrap">
        {MEAL_TYPES.map((m) => (
          <button
            key={m.id}
            onClick={() => setMeal(m.id)}
            className="px-3.5 py-2 rounded-full"
            style={{ backgroundColor: meal === m.id ? INK : PAPER, border: `1px solid ${meal === m.id ? INK : LINE}` }}
          >
            <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "12px", fontWeight: 600, color: meal === m.id ? PARCHMENT : INK }}>
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
              style={{ backgroundColor: current.mode === "pdf" ? BRASS : "#F0EDF7" }}
            >
              <FileText size={13} color={current.mode === "pdf" ? INK : "#6E6E6E"} />
              <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "12px", fontWeight: 600, color: current.mode === "pdf" ? INK : "#6E6E6E" }}>
                Carica PDF
              </span>
            </button>
            <button
              onClick={() => setMode("builder")}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-full"
              style={{ backgroundColor: current.mode === "builder" ? BRASS : "#F0EDF7" }}
            >
              <UtensilsCrossed size={13} color={current.mode === "builder" ? INK : "#6E6E6E"} />
              <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "12px", fontWeight: 600, color: current.mode === "builder" ? INK : "#6E6E6E" }}>
                Crea piatto per piatto
              </span>
            </button>
          </div>
          <button onClick={toggleActive} className="flex items-center gap-2">
            <div className="w-9 h-5 rounded-full flex items-center px-0.5" style={{ backgroundColor: current.active ? TEAL : "#D8CDB2", justifyContent: current.active ? "flex-end" : "flex-start" }}>
              <div className="w-4 h-4 rounded-full bg-white" />
            </div>
            <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "12px", color: INK }}>Attivo</span>
          </button>
        </div>

        <div className="flex items-center gap-3 mb-5">
          <button onClick={toggleIncluded} className="flex items-center gap-2">
            <div className="w-9 h-5 rounded-full flex items-center px-0.5" style={{ backgroundColor: !current.included ? BRASS : "#D8CDB2", justifyContent: !current.included ? "flex-end" : "flex-start" }}>
              <div className="w-4 h-4 rounded-full bg-white" />
            </div>
            <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "12px", color: INK }}>A pagamento (non incluso nel soggiorno)</span>
          </button>
          {!current.included && (
            <div className="flex items-center gap-1.5">
              <input
                value={current.price}
                onChange={(e) => setMenus((prev) => ({ ...prev, [meal]: { ...prev[meal], price: e.target.value } }))}
                onBlur={(e) => savePrice(e.target.value)}
                placeholder="0"
                className="w-20 px-2.5 py-1.5 rounded-lg outline-none"
                style={{ ...inputStyle(), fontFamily: "'Montserrat', sans-serif" }}
              />
              <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "12px", color: "#6E6E6E" }}>€ a persona</span>
            </div>
          )}
        </div>

        {current.mode === "pdf" ? (
          <div>
            <input ref={pdfInputRef} type="file" accept="application/pdf" onChange={handlePdfChange} className="hidden" />
            {uploading ? (
              <div className="h-28 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#F0EDF7" }}>
                <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "11px", color: "#6E6E6E" }}>Caricamento...</span>
              </div>
            ) : pdfFileName ? (
              <div className="flex items-center justify-between p-4 rounded-xl" style={{ backgroundColor: "#F0EDF7" }}>
                <a href={current.pdf_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 min-w-0">
                  <FileText size={18} color={CLAY} className="shrink-0" />
                  <span className="truncate" style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "13px", fontWeight: 600, color: INK }}>{pdfFileName}</span>
                </a>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => pdfInputRef.current.click()} className="px-3 py-1.5 rounded-full" style={{ border: `1px solid ${LINE}` }}>
                    <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "11.5px", fontWeight: 600, color: INK }}>Sostituisci</span>
                  </button>
                  <button onClick={() => ensureMenuRow({ pdf_url: null })} className="p-2 rounded-full" style={{ backgroundColor: "#F7E3DB" }} title="Elimina PDF">
                    <Trash2 size={14} color={CLAY} />
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={() => pdfInputRef.current.click()} className="w-full h-28 rounded-xl flex flex-col items-center justify-center gap-1.5" style={{ border: `1px dashed ${LINE}`, backgroundColor: "#F0EDF7" }}>
                <Upload size={16} color="#6E6E6E" />
                <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "11px", color: "#6E6E6E" }}>Carica il PDF del menù</span>
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
                  style={{ backgroundColor: it.is_vegetarian ? "#E4EEE9" : "#F0EDF7" }}
                  title="Vegetariano"
                >
                  <Leaf size={14} color={it.is_vegetarian ? TEAL : "#B4AC97"} />
                </button>
                <button onClick={() => removeItem(it.id)} className="p-2 rounded-lg shrink-0" style={{ backgroundColor: "#F0EDF7" }}>
                  <Trash2 size={14} color="#6E6E6E" />
                </button>
              </div>
            ))}
            <button onClick={addItem} className="flex items-center gap-1.5 mt-1 px-3 py-2 rounded-xl" style={{ border: `1px dashed ${LINE}` }}>
              <Plus size={13} color={TEAL} />
              <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "12px", color: TEAL, fontWeight: 600 }}>Aggiungi piatto</span>
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
          <h2 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: "20px", color: INK }}>
            {excursion ? "Modifica escursione" : "Nuova escursione"}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-full" style={{ backgroundColor: "#F0EDF7" }}>
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
              <LinkIcon size={14} color="#6E6E6E" className="absolute left-3 top-1/2 -translate-y-1/2" />
              <input value={form.officialUrl || ""} onChange={(e) => setForm({ ...form, officialUrl: e.target.value })} placeholder="https://..." className="w-full pl-9 pr-3 py-2.5 rounded-xl outline-none" style={inputStyle()} />
            </div>
          </Field>
          <div className="grid grid-cols-3 gap-4">
            <Field label="Durata (h)">
              <input value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} placeholder="3.5" className="w-full px-3 py-2.5 rounded-xl outline-none" style={{ ...inputStyle(), fontFamily: "'Montserrat', sans-serif" }} />
            </Field>
            <Field label="Difficoltà">
              <select value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })} className="w-full px-3 py-2.5 rounded-xl outline-none" style={inputStyle()}>
                {Object.entries(DIFFICULTY_META).map(([id, m]) => <option key={id} value={id}>{m.label}</option>)}
              </select>
            </Field>
            <Field label="Prezzo (€)">
              <input value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="0" className="w-full px-3 py-2.5 rounded-xl outline-none" style={{ ...inputStyle(), fontFamily: "'Montserrat', sans-serif" }} />
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
              <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "12.5px", color: INK }}>Prenotabile</span>
            </button>
            <button onClick={() => setForm({ ...form, published: !form.published })} className="flex items-center gap-2">
              <div className="w-9 h-5 rounded-full flex items-center px-0.5" style={{ backgroundColor: form.published ? TEAL : "#D8CDB2", justifyContent: form.published ? "flex-end" : "flex-start" }}>
                <div className="w-4 h-4 rounded-full bg-white" />
              </div>
              <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "12.5px", color: INK }}>Pubblicata</span>
            </button>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4" style={{ borderTop: `1px solid ${LINE}` }}>
          <button onClick={onClose} className="px-4 py-2.5 rounded-full" style={{ border: `1px solid ${LINE}` }}>
            <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "12.5px", fontWeight: 600, color: INK }}>Annulla</span>
          </button>
          <button onClick={() => onSave(form)} disabled={saving} className="px-4 py-2.5 rounded-full active:scale-[0.98] transition-transform" style={{ backgroundColor: CLAY, opacity: saving ? 0.7 : 1 }}>
            <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "12.5px", fontWeight: 600, color: PARCHMENT }}>{saving ? "Salvataggio..." : "Salva escursione"}</span>
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
      {error && <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "12px", color: CLAY, marginBottom: "10px" }}>{error}</p>}
      <div className="flex justify-end mb-5">
        <button onClick={() => setCreating(true)} className="flex items-center gap-1.5 px-4 py-2.5 rounded-full active:scale-[0.98] transition-transform" style={{ backgroundColor: CLAY }}>
          <Plus size={14} color={PARCHMENT} />
          <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "12.5px", fontWeight: 600, color: PARCHMENT }}>Nuova escursione</span>
        </button>
      </div>
      {loading ? (
        <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "13px", color: "#6E6E6E" }}>Caricamento escursioni...</p>
      ) : (
        <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${LINE}` }}>
          {excursions.map((e, i) => {
            const diff = DIFFICULTY_META[e.difficulty];
            return (
              <div key={e.id} className="flex items-center gap-4 px-5 py-4" style={{ backgroundColor: PAPER, borderTop: i === 0 ? "none" : `1px solid ${LINE}` }}>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: "#F0EDF7" }}>
                  <Mountain size={17} color={TEAL} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "13.5px", fontWeight: 600, color: INK }}>{e.name}</p>
                    <span className="px-2 py-0.5 rounded-full" style={{ backgroundColor: diff.bg }}>
                      <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "9px", color: diff.text }}>{diff.label.toUpperCase()}</span>
                    </span>
                    {Number(e.price) > 0 && (
                      <span className="px-2 py-0.5 rounded-full" style={{ backgroundColor: "#F0EDF7" }}>
                        <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "9px", color: CLAY }}>{e.price} €</span>
                      </span>
                    )}
                    {!e.published && (
                      <span className="px-2 py-0.5 rounded-full" style={{ backgroundColor: "#F0EDF7" }}>
                        <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "9px", color: "#6E6E6E" }}>BOZZA</span>
                      </span>
                    )}
                  </div>
                  <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "11.5px", color: "#6E6E6E", marginTop: "2px" }}>
                    {e.meetingPoint} · {e.duration}h
                  </p>
                </div>
                <button onClick={() => setEditing(e)} className="p-2 rounded-lg shrink-0" style={{ backgroundColor: "#F0EDF7" }}>
                  <Pencil size={13} color={INK} />
                </button>
              </div>
            );
          })}
          {excursions.length === 0 && (
            <div className="py-10 text-center" style={{ backgroundColor: PAPER }}>
              <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "12.5px", color: "#6E6E6E" }}>Nessuna escursione configurata.</span>
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
  // Colori dedicati a questa schermata (viola scuro + rosa corallo),
  // usati SOLO qui: il resto della dashboard resta con la sua palette
  // abituale (blu notte/rame/ottone).
  const AUTH_PURPLE = "#380D82";
  const AUTH_PURPLE_DARK = "#44109B";
  const AUTH_CORAL = "#DC6E8B";
  const AUTH_CORAL_DARK = "#D96481";
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
    <div className="w-full min-h-screen flex" style={{ backgroundColor: AUTH_PURPLE_DARK }}>
      <style>{`
        @import url(https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap);
      `}</style>

      <div className="flex-1 flex items-center justify-center py-10 px-4">
      <div className="w-full max-w-md rounded-3xl overflow-hidden" style={{ backgroundColor: PAPER, boxShadow: "0 20px 60px rgba(0,0,0,0.35)" }}>
        <div className="px-8 pt-8 pb-6 text-center" style={{ backgroundColor: AUTH_PURPLE }}>
          <div className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center mx-auto mb-3 border-2 bg-white" style={{ borderColor: AUTH_CORAL }}>
            <img src="/logo-icon.png" alt="EvolutionTrip" className="w-full h-full object-cover" />
          </div>
          <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "9px", letterSpacing: "0.12em", color: AUTH_CORAL }}>
            I CONSIGLI PER I TUOI OSPITI
          </p>
          <p className="mt-1" style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "22px", fontWeight: 800, color: mode === "login" ? AUTH_CORAL : PARCHMENT }}>
            {mode === "register" ? "Create il vostro account gratuito" : mode === "forgot" ? "Reimpostate la password" : "Login"}
          </p>
        </div>

        {mode === "forgot" ? (
          <form onSubmit={submitReset} noValidate className="px-6 pt-6 pb-6 space-y-3">
            {resetSent ? (
              <div className="text-center py-2">
                <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 border-2" style={{ borderColor: TEAL, borderStyle: "dashed" }}>
                  <Check size={20} color={TEAL} />
                </div>
                <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "13px", color: INK, fontWeight: 600 }}>Email inviata</p>
                <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "11.5px", color: "#6E6E6E", marginTop: "4px" }}>
                  Controllate {resetEmail} per il link di reimpostazione password.
                </p>
                <button
                  type="button"
                  onClick={() => { setMode("login"); setResetSent(false); }}
                  className="w-full py-3 rounded-full mt-4"
                  style={{ backgroundColor: INK }}
                >
                  <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "13px", fontWeight: 600, color: PARCHMENT }}>Torna al login</span>
                </button>
              </div>
            ) : (
              <>
                <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "11.5px", color: "#6E6E6E", marginBottom: "2px" }}>
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
                {error && <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "11.5px", color: AUTH_CORAL_DARK }}>{error}</p>}
                <button type="submit" className="w-full py-3 rounded-full mt-2 active:scale-[0.98] transition-transform" style={{ backgroundColor: AUTH_CORAL }}>
                  <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "13px", fontWeight: 600, color: PARCHMENT }}>Invia link di reset</span>
                </button>
                <button type="button" onClick={() => { setMode("login"); setError(""); }} className="w-full py-2">
                  <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "11.5px", color: "#6E6E6E" }}>← Torna indietro</span>
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
              <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "12px", color: INK }}>Ricordami</span>
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

          {error && <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "11.5px", color: CLAY }}>{error}</p>}

          <button type="submit" className="w-full py-3 rounded-full mt-2 active:scale-[0.98] transition-transform" style={{ backgroundColor: AUTH_CORAL }}>
            <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "13px", fontWeight: 600, color: PARCHMENT }}>
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
                <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "12px", fontWeight: 600, color: INK }}>Registrati</span>
              </button>
              <button
                type="button"
                onClick={() => { setMode("forgot"); setError(""); }}
                className="flex-1 py-2.5 rounded-full"
                style={{ border: `1px solid ${LINE}` }}
              >
                <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "12px", fontWeight: 600, color: INK }}>Password dimenticata</span>
              </button>
            </div>
          )}

          {mode === "register" && (
            <>
              <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "10.5px", color: "#6E6E6E", textAlign: "center" }}>
                Nessuna carta richiesta ora. Creando l'account accettate termini e informativa privacy.
              </p>
              <button type="button" onClick={() => { setMode("login"); setError(""); }} className="w-full py-1">
                <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "11.5px", color: TEAL }}>Avete già un account? Accedi</span>
              </button>
            </>
          )}
        </form>
        )}
      </div>
      </div>

      <div className="hidden lg:flex flex-1 items-center justify-center relative overflow-hidden" style={{ backgroundColor: "#FFFFFF" }}>
        <svg width="70%" height="70%" viewBox="0 0 400 500" fill="none" style={{ maxWidth: "420px" }}>
          <path d="M60 380 C 110 380, 100 300, 150 300" stroke={AUTH_CORAL} strokeWidth="2" strokeDasharray="5 5" fill="none" opacity="0.5" />
          <path d="M60 380 C 90 340, 160 260, 210 220" stroke={AUTH_CORAL} strokeWidth="2" strokeDasharray="5 5" fill="none" opacity="0.5" />
          <path d="M60 380 C 140 360, 220 300, 280 190" stroke={AUTH_CORAL} strokeWidth="2" strokeDasharray="5 5" fill="none" opacity="0.5" />
          <path d="M60 380 C 150 400, 230 420, 300 400" stroke={AUTH_CORAL} strokeWidth="2" strokeDasharray="5 5" fill="none" opacity="0.5" />

          <rect x="140" y="70" width="180" height="360" rx="28" fill={PAPER} stroke={LINE} strokeWidth="2" />
          <rect x="156" y="94" width="148" height="290" rx="6" fill="#F0EDF7" />
          <line x1="156" y1="140" x2="304" y2="140" stroke="#E4DAC4" strokeWidth="1.5" />
          <line x1="156" y1="190" x2="304" y2="190" stroke="#E4DAC4" strokeWidth="1.5" />
          <line x1="156" y1="240" x2="304" y2="240" stroke="#E4DAC4" strokeWidth="1.5" />
          <line x1="156" y1="290" x2="304" y2="290" stroke="#E4DAC4" strokeWidth="1.5" />
          <line x1="156" y1="340" x2="304" y2="340" stroke="#E4DAC4" strokeWidth="1.5" />
          <line x1="200" y1="94" x2="200" y2="384" stroke="#E4DAC4" strokeWidth="1.5" />
          <line x1="245" y1="94" x2="245" y2="384" stroke="#E4DAC4" strokeWidth="1.5" />

          <g>
            <circle cx="60" cy="380" r="20" fill={AUTH_CORAL} opacity="0.15" />
            <path d="M60 366 C 71 366, 79 374, 79 384 C 79 397, 60 412, 60 412 C 60 412, 41 397, 41 384 C 41 374, 49 366, 60 366 Z" fill={AUTH_CORAL} />
            <circle cx="60" cy="384" r="6" fill="#FFFFFF" />
          </g>
          <g>
            <circle cx="210" cy="220" r="20" fill={AUTH_CORAL} opacity="0.15" />
            <path d="M210 206 C 221 206, 229 214, 229 224 C 229 237, 210 252, 210 252 C 210 252, 191 237, 191 224 C 191 214, 199 206, 210 206 Z" fill={AUTH_CORAL} />
            <circle cx="210" cy="224" r="6" fill="#FFFFFF" />
          </g>
          <g>
            <circle cx="280" cy="190" r="24" fill={AUTH_CORAL_DARK} opacity="0.18" />
            <path d="M280 172 C 293 172, 302 181, 302 193 C 302 208, 280 227, 280 227 C 280 227, 258 208, 258 193 C 258 181, 267 172, 280 172 Z" fill={AUTH_CORAL_DARK} />
            <text x="280" y="199" textAnchor="middle" fontSize="17" fontWeight="700" fill="#FFFFFF">!</text>
          </g>
          <g>
            <circle cx="300" cy="400" r="18" fill={AUTH_CORAL} opacity="0.15" />
            <path d="M300 388 C 309 388, 316 395, 316 403 C 316 414, 300 427, 300 427 C 300 427, 284 414, 284 403 C 284 395, 291 388, 300 388 Z" fill={AUTH_CORAL} />
            <circle cx="300" cy="403" r="5" fill="#FFFFFF" />
          </g>
        </svg>
        <div className="absolute bottom-8 right-8 w-14 h-14 rounded-full flex items-center justify-center" style={{ backgroundColor: AUTH_CORAL, boxShadow: "0 10px 25px rgba(0,0,0,0.2)" }}>
          <MessageCircle size={22} color="#FFFFFF" />
        </div>
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
      <div className="w-full min-h-screen flex items-center justify-center" style={{ backgroundColor: "#F5F3FA" }}>
        <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "13px", color: "#6E6E6E" }}>Verifica sessione in corso...</p>
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
    <div className="w-full min-h-screen flex" style={{ backgroundColor: "#F5F3FA" }}>
      <style>{`
        @import url(https://fonts.googleapis.com/css2?family=Baloo+2:wght@700;800&family=Montserrat:wght@400;500;600;700;800&display=swap);
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
