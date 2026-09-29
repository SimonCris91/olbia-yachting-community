"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Tab = "home" | "agenda" | "scan" | "community" | "profile";
type LocationKey = "Olbia" | "Porto Cervo" | "Porto Rotondo" | "Cagliari" | "Alghero";
type AccountType = "private" | "operator" | "company" | "owner";
type ProfileRole = Exclude<AccountType, "owner">;
type Task = { id: number; title: string; boat: string; due: string; priority: "Alta" | "Media" | "Bassa"; done: boolean };
type Purchase = { id: number; title: string; detail: string; price: string; done: boolean };
type Job = { id: number; title: string; details: string; done: boolean };
type Message = { id: number; role: "user" | "assistant"; text: string; image?: string; sources?: { title: string; url: string }[] };
type WebResult = { reply: string; sources?: { title: string; url: string }[] };
type CommunityRequest = { id: number; ownerId: string; title: string; details: string; category: string; location: LocationKey; created: string; status: "Aperta" | "Presa in carico" | "Chiusa"; acceptedBy?: string; acceptedByUserId?: string };
type Operator = { id: number; name: string; category: string; locations: LocationKey[]; distance?: string; rating?: string; response?: string; premium?: boolean; tags: string[]; note: string; phone?: string; email?: string; website?: string; telegram?: string; verified?: boolean; ownerUserId?: string };
type ServiceCategory = { name: string; icon: string };
type Language = "it" | "en" | "fr" | "es" | "de";
type WhatsAppDraft = { isRelevant: boolean; title: string; category: string; details: string; urgency: string; missing: string[]; replyMessage: string };
type Supplier = { name: string; category: string; description: string; url: string };

const BRAND_NAME = "Olbia Yachting Community";
const ASSISTANT_NAME = "Yachting Assistant";
const accessLabels: Record<AccountType, string> = { private: "Privato", operator: "Operatore", company: "Ditta associata", owner: "Titolare" };
const accessOptions: Array<{ id: AccountType; title: string; description: string; features: string }> = [
  { id: "private", title: "Privato", description: "Per armatori e proprietari", features: "Richieste, agenda, acquisti e assistente AI" },
  { id: "operator", title: "Operatore", description: "Per tecnici e professionisti", features: "Lavorazioni compatibili, agenda e profilo servizi" },
  { id: "company", title: "Ditta associata", description: "Per aziende e cantieri", features: "Lavorazioni, ordini, commesse e squadra" },
  { id: "owner", title: "Titolare", description: "Amministrazione della piattaforma", features: "Tutte le aree e viste separate" },
];

const normalizeTelegramLink = (value: string) => {
  const cleaned = value.trim().replace(/^@/, "").replace(/^https?:\/\/(?:t\.me|telegram\.me)\//i, "").replace(/^t\.me\//i, "").replace(/^telegram\.me\//i, "").replace(/^\/+/, "");
  return cleaned ? `https://t.me/${cleaned}` : "";
};

const normalizeWhatsAppPhone = (value: string) => {
  let digits = value.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.length === 10 && digits.startsWith("3")) digits = `39${digits}`;
  return digits.length >= 8 ? digits : "";
};

const suppliers: Supplier[] = [
  { name: "Osculati", category: "Catalogo generale", description: "Accessori, ricambi, sicurezza e impianti di bordo.", url: "https://www.osculati.com/en/page/catalog" },
  { name: "SVB", category: "Shop nautico", description: "Attrezzatura, elettronica, manutenzione e ricambi.", url: "https://www.svb-marine.it/" },
  { name: "TREM", category: "Catalogo 2025/2026", description: "Coperta, impianti, ferramenta, ormeggio e sicurezza.", url: "https://www.trem.net/catalogo" },
  { name: "Foresti & Suardi", category: "Catalogo ufficiale", description: "Ferramenta, illuminazione e accessori nautici Made in Italy.", url: "https://catalogue.forestiesuardi.it/" },
  { name: "Motomarine", category: "Cataloghi 2025/2026", description: "Ricambi, eliche e oltre 20.000 articoli nautici.", url: "https://cataloghi.motomarine.it/" },
  { name: "Marine Hardware", category: "Catalogo Italia", description: "Dotazioni, utensileria, ferramenta e prodotti tecnici.", url: "https://www.marinehardware.it/eCommerceStd/azienda.jsp" },
];

const locationData: Record<LocationKey, { weather: string; sea: string; services: ServiceCategory[] }> = {
  Olbia: {
    weather: "27 deg",
    sea: "mare calmo",
    services: [
      { name: "Cantieri & refit", icon: "C" },
      { name: "Meccanica marina", icon: "M" },
      { name: "Elettrica nautica", icon: "E" },
      { name: "Ricambi nautici", icon: "R" },
    ],
  },
  "Porto Cervo": {
    weather: "26 deg",
    sea: "vento leggero",
    services: [
      { name: "Concierge yacht", icon: "Y" },
      { name: "Pulizia e detailing", icon: "D" },
      { name: "Meccanica marina", icon: "M" },
      { name: "Cambusa e forniture", icon: "F" },
    ],
  },
  "Porto Rotondo": {
    weather: "27 deg",
    sea: "poco mosso",
    services: [
      { name: "Elettronica", icon: "E" },
      { name: "Tender e gommoni", icon: "T" },
      { name: "Tappezzeria nautica", icon: "P" },
      { name: "Ricambi nautici", icon: "R" },
    ],
  },
  Cagliari: {
    weather: "29 deg",
    sea: "brezza da SE",
    services: [
      { name: "Cantieri & refit", icon: "C" },
      { name: "Vele e rigging", icon: "V" },
      { name: "Elettronica", icon: "E" },
      { name: "Ricambi nautici", icon: "R" },
    ],
  },
  Alghero: {
    weather: "25 deg",
    sea: "maestrale debole",
    services: [
      { name: "Meccanica marina", icon: "M" },
      { name: "Carena e antivegetativa", icon: "C" },
      { name: "Elettrica nautica", icon: "E" },
      { name: "Ormeggi e marina", icon: "O" },
    ],
  },
};

const operators: Operator[] = [
  { id: 1, name: "Nautica Gallura Service", category: "Meccanica marina", locations: ["Olbia", "Porto Cervo", "Porto Rotondo"], distance: "3.2 km", rating: "4.8", response: "Risponde entro 20 min", premium: true, tags: ["Motori entrobordo", "Generatori", "Urgenze"], note: "Tecnici mobili per diagnosi in banchina e interventi rapidi." },
  { id: 2, name: "Costa Smeralda Electric", category: "Elettrica nautica", locations: ["Olbia", "Porto Cervo", "Porto Rotondo"], distance: "6.8 km", rating: "4.7", response: "Disponibile oggi", premium: true, tags: ["Batterie", "Caricabatterie", "Quadri 12/24V"], note: "Specializzati in impianti bordo, inverter e ricerca dispersioni." },
  { id: 3, name: "Olbia Marine Refit", category: "Cantieri & refit", locations: ["Olbia"], distance: "4.5 km", rating: "4.6", response: "Risponde entro 1 ora", premium: false, tags: ["Carena", "Verniciatura", "Refit"], note: "Cantiere operativo per lavorazioni programmate e alaggi." },
  { id: 4, name: "Smeralda Yacht Concierge", category: "Concierge yacht", locations: ["Porto Cervo"], distance: "1.1 km", rating: "4.9", response: "Risposta rapida", premium: true, tags: ["Cambusa", "Transfer", "Servizi ospiti"], note: "Gestione richieste owner, comandante e ospiti in Costa Smeralda." },
  { id: 5, name: "Rotondo Tender Lab", category: "Tender e gommoni", locations: ["Porto Rotondo"], distance: "2.4 km", rating: "4.5", response: "Disponibile domani", premium: false, tags: ["Tubolari", "Fuoribordo", "Tender"], note: "Riparazioni tender, controlli fuoribordo e accessori." },
  { id: 6, name: "Cagliari Rigging & Sails", category: "Vele e rigging", locations: ["Cagliari"], distance: "5.0 km", rating: "4.8", response: "Risponde oggi", premium: true, tags: ["Sartiame", "Vele", "Albero"], note: "Controlli rigging, sostituzioni e lavorazioni su barche a vela." },
  { id: 7, name: "Alghero Sea Power", category: "Meccanica marina", locations: ["Alghero"], distance: "3.9 km", rating: "4.4", response: "Risponde entro 2 ore", premium: false, tags: ["Tagliandi", "Pompe", "Raffreddamento"], note: "Manutenzione motori e impianti acqua mare." },
  { id: 8, name: "Sardinia Nautic Parts", category: "Ricambi nautici", locations: ["Olbia", "Porto Rotondo", "Cagliari"], distance: "Spedizione locale", rating: "4.6", response: "Preventivo in giornata", premium: false, tags: ["Jabsco", "Osculati", "Filtri"], note: "Ricambi nautici con ricerca codici e alternative compatibili." },
  { id: 9, name: "Blue Detail Porto Cervo", category: "Pulizia e detailing", locations: ["Porto Cervo"], distance: "0.8 km", rating: "4.9", response: "Disponibile oggi", premium: true, tags: ["Lavaggio", "Teak", "Lucidatura"], note: "Detailing yacht, teak care e preparazione ospiti." },
  { id: 10, name: "Alghero Marina Support", category: "Ormeggi e marina", locations: ["Alghero"], distance: "1.7 km", rating: "4.3", response: "Risponde entro 1 ora", premium: false, tags: ["Ormeggi", "Assistenza", "Banchina"], note: "Supporto operativo in porto e piccoli interventi di bordo." },
  { id: 11, name: "Gallura Diesel Lab", category: "Meccanica marina", locations: ["Olbia"], distance: "5.6 km", rating: "4.5", response: "Disponibile domani", premium: false, tags: ["Diesel", "Scambiatori", "Tagliandi"], note: "Officina per manutenzione ordinaria e problemi di raffreddamento." },
  { id: 12, name: "Molo Brin Marine Tech", category: "Meccanica marina", locations: ["Olbia"], distance: "1.9 km", rating: "4.7", response: "Risponde entro 45 min", premium: true, tags: ["Pompe", "Autoclavi", "WC nautici"], note: "Interventi rapidi su impianti tecnici, pompe e servizi di bordo." },
  { id: 13, name: "Nord Est Yacht Works", category: "Cantieri & refit", locations: ["Olbia", "Porto Rotondo"], distance: "7.4 km", rating: "4.6", response: "Sopralluogo in 24h", premium: true, tags: ["Vetroresina", "Coperta", "Refit"], note: "Squadra mobile per ripristini, resinature e lavori estetici." },
  { id: 14, name: "Olbia Shipwrights", category: "Cantieri & refit", locations: ["Olbia"], distance: "8.1 km", rating: "4.4", response: "Preventivo in giornata", premium: false, tags: ["Falegnameria", "Interni", "Teak"], note: "Lavorazioni artigianali su interni, coperta e finiture." },
  { id: 15, name: "Banchina 12 Volt", category: "Elettrica nautica", locations: ["Olbia"], distance: "2.8 km", rating: "4.5", response: "Disponibile oggi", premium: false, tags: ["Pannelli", "Batterie", "Cablaggi"], note: "Assistenza elettrica per piccoli guasti e installazioni bordo." },
  { id: 16, name: "Marine Power Olbia", category: "Elettrica nautica", locations: ["Olbia", "Porto Cervo"], distance: "4.2 km", rating: "4.8", response: "Risposta rapida", premium: true, tags: ["Lithium", "Inverter", "Carica"], note: "Upgrade energetici, batterie litio e sistemi di ricarica." },
  { id: 17, name: "Nautic Store Olbia", category: "Ricambi nautici", locations: ["Olbia"], distance: "2.1 km", rating: "4.4", response: "Disponibilita in giornata", premium: false, tags: ["Giranti", "Filtri", "Anodi"], note: "Banco ricambi per manutenzione stagionale e parti consumabili." },
  { id: 18, name: "Ricambi Porto Rotondo", category: "Ricambi nautici", locations: ["Porto Rotondo"], distance: "1.3 km", rating: "4.3", response: "Preventivo veloce", premium: false, tags: ["Jabsco", "Pompe", "Accessori"], note: "Ricerca codici e consegna in marina su ricambi piccoli." },
  { id: 19, name: "Cagliari Marine Electronics", category: "Elettronica", locations: ["Cagliari"], distance: "3.2 km", rating: "4.7", response: "Risponde oggi", premium: true, tags: ["GPS", "Radar", "Autopilota"], note: "Installazione e diagnosi strumenti di navigazione." },
  { id: 20, name: "Rotondo Electronics", category: "Elettronica", locations: ["Porto Rotondo"], distance: "2.0 km", rating: "4.4", response: "Risponde entro 2 ore", premium: false, tags: ["VHF", "AIS", "Display"], note: "Assistenza elettronica per strumenti e comunicazioni." },
  { id: 21, name: "Sardinia Upholstery", category: "Tappezzeria nautica", locations: ["Porto Rotondo"], distance: "3.6 km", rating: "4.5", response: "Sopralluogo in 48h", premium: false, tags: ["Cuscineria", "Tendalini", "Coperture"], note: "Tappezzeria nautica, coperture e riparazioni tessuti tecnici." },
  { id: 22, name: "Cervo Galley Supply", category: "Cambusa e forniture", locations: ["Porto Cervo"], distance: "0.9 km", rating: "4.8", response: "Consegna oggi", premium: true, tags: ["Cambusa", "Vini", "Forniture"], note: "Forniture bordo e consegna diretta in porto." },
];

const demoRequests: CommunityRequest[] = [
  { id: 9001, ownerId: "demo-owner-1", title: "Controllo caricabatterie in banchina", details: "M/Y 13 m - tensione instabile batterie servizi. Richiesta entro oggi.", category: "Elettrica", location: "Olbia", created: "12 min fa", status: "Aperta" },
  { id: 9002, ownerId: "demo-owner-2", title: "Girante e controllo raffreddamento", details: "Motore entrobordo, temperatura alta al minimo. Barca a Olbia.", category: "Meccanica", location: "Olbia", created: "35 min fa", status: "Aperta" },
  { id: 9003, ownerId: "demo-owner-3", title: "Pulizia teak prima dell'arrivo ospiti", details: "Yacht 21 m, intervento richiesto a Porto Cervo entro domani mattina.", category: "Pulizia", location: "Porto Cervo", created: "1 ora fa", status: "Aperta" },
  { id: 9004, ownerId: "demo-owner-4", title: "Riparazione tubolare tender", details: "Microperdita su tubolare tender, zona Porto Rotondo.", category: "Tender e gommoni", location: "Porto Rotondo", created: "2 ore fa", status: "Aperta" },
  { id: 9005, ownerId: "demo-owner-5", title: "Verifica autopilota", details: "Autopilota non tiene rotta, richiesta tecnico elettronica a Cagliari.", category: "Elettronica", location: "Cagliari", created: "Oggi", status: "Aperta" },
];

const categoryMatches = (requestCategory: string, serviceCategory: string) => {
  const request = requestCategory.toLowerCase();
  const service = serviceCategory.toLowerCase();
  return service.includes(request) || request.includes(service) || (request === "meccanica" && service.includes("meccanica")) || (request === "elettrica" && service.includes("elettrica")) || (request === "pulizia" && service.includes("pulizia")) || (request === "refit" && service.includes("refit"));
};

function RichText({ text }: { text: string }) {
  return (
    <div className="rich-text">
      {text
        .split("\n")
        .filter((line) => line.trim() && !/^\|?[-:| ]+\|?$/.test(line))
        .map((line, index) => {
          const parts = line.replace(/^#+\s*/, "").replace(/^\|\s*/, "").replace(/\s*\|\s*$/, "").split(/(\*\*[^*]+\*\*)/g);
          const content = parts.map((part, i) => part.startsWith("**") && part.endsWith("**") ? <strong key={i}>{part.slice(2, -2)}</strong> : part.replace(/\s*\|\s*/g, " - "));
          return /^[-*]\s/.test(line) ? <div className="rich-bullet" key={index}>{content}</div> : <p key={index}>{content}</p>;
        })}
    </div>
  );
}

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [tab, setTab] = useState<Tab>("home");
  const [chat, setChat] = useState(false);
  const [plan, setPlan] = useState<"Standard" | "Premium">("Standard");
  const [accountType, setAccountType] = useState<AccountType>("private");
  const [isOwner, setIsOwner] = useState(false);
  const [accessPickerOpen, setAccessPickerOpen] = useState(false);
  const [location, setLocation] = useState<LocationKey>("Olbia");
  const [yardOpen, setYardOpen] = useState(false);
  const [chatText, setChatText] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatStatus, setChatStatus] = useState("");
  const [messages, setMessages] = useState<Message[]>([{ id: 1, role: "assistant", text: "Ciao. Posso aiutarti con un ricambio, un guasto, una mansione o un professionista nautico nella tua zona." }]);
  const [communityRequests, setCommunityRequests] = useState<CommunityRequest[]>([]);
  const [signedIn, setSignedIn] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [currentUserId, setCurrentUserId] = useState("");
  const [profileName, setProfileName] = useState("");
  const [telegramHandle, setTelegramHandle] = useState("");
  const [language, setLanguage] = useState<Language>("it");
  const [showDemoData, setShowDemoData] = useState(false);
  const [formMode, setFormMode] = useState<"task" | "purchase" | "job" | "request" | null>(null);
  const [operatorEditorOpen, setOperatorEditorOpen] = useState(false);
  const [whatsAppOpen, setWhatsAppOpen] = useState(false);
  const [whatsAppText, setWhatsAppText] = useState("");
  const [whatsAppDraft, setWhatsAppDraft] = useState<WhatsAppDraft | null>(null);
  const [whatsAppLoading, setWhatsAppLoading] = useState(false);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [operatorCategory, setOperatorCategory] = useState<string | null>(null);
  const [selectedOperator, setSelectedOperator] = useState<Operator | null>(null);
  const [realOperators, setRealOperators] = useState<Operator[]>([]);
  const [myOperatorProfile, setMyOperatorProfile] = useState<Operator | null>(null);
  const [webLoading, setWebLoading] = useState(false);
  const [webResult, setWebResult] = useState<WebResult | null>(null);
  const [form, setForm] = useState({ title: "", category: "Meccanica", details: "" });
  const [operatorForm, setOperatorForm] = useState<{ name: string; category: string; locations: LocationKey[]; phone: string; email: string; website: string; telegram: string; note: string; tags: string }>({ name: "", category: "Meccanica marina", locations: [location], phone: "", email: "", website: "", telegram: "", note: "", tags: "" });
  const [toast, setToast] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const savedLocation = localStorage.getItem("yachting-assistant-location") as LocationKey | null;
    const savedLanguage = localStorage.getItem("yachting-assistant-language") as Language | null;
    const savedPlan = localStorage.getItem("marinaio-plan") as "Standard" | "Premium" | null;
    const savedDemoMode = localStorage.getItem("barcaora-demo-mode");
    if (savedLocation && savedLocation in locationData) setLocation(savedLocation);
    if (savedLanguage && ["it", "en", "fr", "es", "de"].includes(savedLanguage)) setLanguage(savedLanguage);
    if (savedPlan === "Standard" || savedPlan === "Premium") setPlan(savedPlan);
    if (savedDemoMode === "true") setShowDemoData(true);
  }, []);

  useEffect(() => { localStorage.setItem("yachting-assistant-location", location); }, [location]);
  useEffect(() => { localStorage.setItem("marinaio-plan", plan); }, [plan]);
  useEffect(() => { localStorage.setItem("yachting-assistant-language", language); document.documentElement.lang = language; }, [language]);
  useEffect(() => { localStorage.setItem("barcaora-demo-mode", showDemoData ? "true" : "false"); }, [showDemoData]);

  useEffect(() => {
    const loadSavedRequests = async () => {
      try {
        const profileResponse = await fetch("/api/profile");
        if (!profileResponse.ok) return;
        const profileData = await profileResponse.json() as { profile?: { userId?: string; displayName?: string; telegram?: string; role?: ProfileRole; isOwner?: boolean } };
        const profileUserId = profileData.profile?.userId ?? "";
        const profileRole = profileData.profile?.role ?? "private";
        const ownerAccess = !!profileData.profile?.isOwner;
        const sessionKey = `oyc-access-${profileUserId}`;
        const savedAccess = sessionStorage.getItem(sessionKey) as AccountType | null;
        const validSavedAccess = savedAccess && accessOptions.some((option) => option.id === savedAccess) && (savedAccess !== "owner" || ownerAccess) ? savedAccess : null;
        setSignedIn(true);
        setCurrentUserId(profileUserId);
        setProfileName(profileData.profile?.displayName ?? "Utente");
        setTelegramHandle(profileData.profile?.telegram ?? "");
        setIsOwner(ownerAccess);
        setAccountType(ownerAccess ? validSavedAccess ?? "owner" : profileRole);
        setAccessPickerOpen(!validSavedAccess);
        const workspaceResponse = await fetch("/api/workspace");
        if (workspaceResponse.ok) {
          const workspaceData = await workspaceResponse.json() as { items?: Array<{ id: number; kind: "task" | "purchase" | "job"; title: string; details: string; done: boolean }> };
          const savedItems = workspaceData.items ?? [];
          setTasks(savedItems.filter((item) => item.kind === "task").map((item) => ({ id: item.id, title: item.title, boat: item.details || "La mia imbarcazione", due: "Da programmare", priority: "Media", done: item.done })));
          setPurchases(savedItems.filter((item) => item.kind === "purchase").map((item) => ({ id: item.id, title: item.title, detail: item.details || "Da cercare", price: "-", done: item.done })));
          setJobs(savedItems.filter((item) => item.kind === "job").map((item) => ({ id: item.id, title: item.title, details: item.details || "Dettagli da aggiungere", done: item.done })));
        }
        const response = await fetch(`/api/requests?location=${encodeURIComponent(location)}`);
        if (!response.ok) return;
        const data = await response.json() as { requests?: Array<{ id: number; ownerId: string; title: string; details: string; category: string; location: LocationKey; status: "open" | "accepted" | "closed"; acceptedBy?: string; acceptedByUserId?: string; created?: string }> };
        setCommunityRequests((data.requests ?? []).map((item) => ({
          id: item.id,
          ownerId: item.ownerId === profileUserId ? "me" : item.ownerId,
          title: item.title,
          details: item.details,
          category: item.category,
          location: item.location,
          created: item.created ? new Date(item.created).toLocaleDateString("it-IT") : "Adesso",
          status: item.status === "closed" ? "Chiusa" : item.status === "accepted" ? "Presa in carico" : "Aperta",
          acceptedBy: item.acceptedBy,
          acceptedByUserId: item.acceptedByUserId,
        })));
        const operatorsResponse = await fetch(`/api/operators?location=${encodeURIComponent(location)}`);
        if (operatorsResponse.ok) {
          const operatorsData = await operatorsResponse.json() as { operators?: Operator[]; mine?: Operator | null };
          setRealOperators(operatorsData.operators ?? []);
          setMyOperatorProfile(operatorsData.mine ?? null);
        }
      } catch { /* L'accesso viene riproposto quando la rete torna disponibile. */ }
      finally { setAuthChecked(true); }
    };
    void loadSavedRequests();
  }, [location]);

  const progress = useMemo(() => tasks.length ? Math.round(tasks.filter((task) => task.done).length / tasks.length * 100) : 0, [tasks]);
  const currentLocation = locationData[location];
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    const name = (profileName.trim().split(" ")[0] || "Benvenuto").toUpperCase();
    if (hour < 12) return `BUONGIORNO, ${name}`;
    if (hour < 18) return `BUON POMERIGGIO, ${name}`;
    return `BUONA SERA, ${name}`;
  }, [profileName]);
  const allRequests = useMemo(() => showDemoData ? [...communityRequests, ...demoRequests] : communityRequests, [communityRequests, showDemoData]);
  const operatorCategories = currentLocation.services.map((service) => service.name);
  const visibleRequests = allRequests.filter((request) => {
    if (accountType === "private") return request.ownerId === "me";
    if (accountType === "operator") return request.location === location && ((request.status === "Aperta" && operatorCategories.some((category) => categoryMatches(request.category, category))) || request.acceptedByUserId === currentUserId);
    return request.location === location;
  });
  const openTaskCount = tasks.filter((task) => !task.done).length;
  const pendingPurchaseCount = purchases.filter((item) => !item.done).length;
  const activeJobCount = jobs.filter((job) => !job.done).length;
  const openRequestCount = visibleRequests.filter((request) => request.status !== "Chiusa").length;
  const taskProgress = tasks.length ? Math.round((tasks.length - openTaskCount) / tasks.length * 100) : 0;
  const visibleOperators = useMemo(() => showDemoData ? operators.filter((operator) => operator.locations.includes(location) && (!operatorCategory || operator.category === operatorCategory)) : realOperators.filter((operator) => operator.locations.includes(location) && (!operatorCategory || operator.category === operatorCategory)), [location, operatorCategory, showDemoData, realOperators]);
  const operatorCount = (category: string) => showDemoData ? operators.filter((operator) => operator.locations.includes(location) && operator.category === category).length : realOperators.filter((operator) => operator.locations.includes(location) && operator.category === category).length;

  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2600);
  };

  const goTo = (nextTab: Tab) => {
    setTab(nextTab);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const chooseLocation = (nextLocation: LocationKey) => {
    setLocation(nextLocation);
    setOperatorCategory(null);
    setSelectedOperator(null);
    setWebResult(null);
    notify(`Localita impostata su ${nextLocation}`);
  };

  const saveWorkspaceItem = async (kind: "task" | "purchase" | "job", title: string, details: string) => {
    const response = await fetch("/api/workspace", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind, title, details }) });
    const data = await response.json() as { item?: { id: number; title: string; details: string }; signIn?: string; error?: string };
    if (!response.ok) { if (data.signIn) window.location.href = data.signIn; throw new Error(data.error ?? "Impossibile salvare"); }
    return data.item!;
  };

  const toggleWorkspaceItem = async (id: number, done: boolean) => {
    const response = await fetch("/api/workspace", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, done }) });
    if (!response.ok) throw new Error("Impossibile aggiornare l'elemento");
  };

  const submitForm = async () => {
    if (!form.title.trim() || !formMode) return;
    if (formMode === "task") {
      const item = await saveWorkspaceItem("task", form.title.trim(), form.details.trim() || "La mia imbarcazione");
      setTasks((items) => [...items, { id: item.id, title: item.title, boat: item.details, due: "Da programmare", priority: "Media", done: false }]);
    }
    if (formMode === "purchase") {
      const item = await saveWorkspaceItem("purchase", form.title.trim(), form.details.trim() || "Da cercare");
      setPurchases((items) => [...items, { id: item.id, title: item.title, detail: item.details, price: "-", done: false }]);
    }
    if (formMode === "job") {
      const item = await saveWorkspaceItem("job", form.title.trim(), form.details.trim() || "Dettagli da aggiungere");
      setJobs((items) => [{ id: item.id, title: item.title, details: item.details, done: false }, ...items]);
      notify("Commessa creata e salvata");
    }
    if (formMode === "request") {
      try {
        const response = await fetch("/api/requests", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: form.title.trim(), details: form.details.trim(), category: form.category, location }) });
        const data = await response.json() as { request?: CommunityRequest; error?: string; signIn?: string };
        if (!response.ok) {
          if (data.signIn) window.location.href = data.signIn;
          throw new Error(data.error ?? "Impossibile pubblicare la richiesta");
        }
        if (data.request) setCommunityRequests((items) => [{ ...data.request!, ownerId: "me", status: "Aperta", created: "Adesso" }, ...items]);
        notify(`Richiesta inviata agli operatori compatibili a ${location}`);
      } catch (error) {
        notify(error instanceof Error ? error.message : "Impossibile pubblicare la richiesta");
        return;
      }
    }
    setFormMode(null);
  };

  const openForm = (mode: "task" | "purchase" | "job" | "request") => {
    setForm({ title: "", category: "Meccanica", details: "" });
    setFormMode(mode);
  };

  const openOperators = (category: string) => {
    setOperatorCategory(category);
    setSelectedOperator(null);
    setWebResult(null);
  };

  const requestOperator = (operator: Operator) => {
    setSelectedOperator(operator);
    setForm({ title: `Intervento ${operator.category}`, category: operator.category.includes("Elettrica") ? "Elettrica" : operator.category.includes("Elettronica") ? "Elettronica" : operator.category.includes("Refit") || operator.category.includes("Cantieri") ? "Refit" : "Meccanica", details: `${operator.name} - ${location}. Descrivi qui il problema, barca e urgenza.` });
    setFormMode("request");
  };

  const openWhatsAppImport = () => {
    setWhatsAppText("");
    setWhatsAppDraft(null);
    setWhatsAppOpen(true);
  };

  const analyzeWhatsApp = async () => {
    if (whatsAppText.trim().length < 5) return notify("Incolla prima il messaggio ricevuto");
    setWhatsAppLoading(true);
    try {
      const response = await fetch("/api/whatsapp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: whatsAppText.trim(), location }) });
      const data = await response.json() as { draft?: WhatsAppDraft; error?: string; signIn?: string };
      if (!response.ok) {
        if (data.signIn) window.location.href = data.signIn;
        throw new Error(data.error ?? "Impossibile analizzare il messaggio");
      }
      if (!data.draft) throw new Error("Scheda non disponibile");
      setWhatsAppDraft(data.draft);
      notify(data.draft.isRelevant ? "Richiesta WhatsApp ordinata" : "Il messaggio non sembra una richiesta nautica");
    } catch (error) {
      notify(error instanceof Error ? error.message : "Impossibile analizzare il messaggio");
    } finally {
      setWhatsAppLoading(false);
    }
  };

  const useWhatsAppDraft = () => {
    if (!whatsAppDraft) return;
    const detailParts = [whatsAppDraft.details, `Urgenza: ${whatsAppDraft.urgency}`, whatsAppDraft.missing.length ? `Dati da confermare: ${whatsAppDraft.missing.join(", ")}` : ""];
    setForm({ title: whatsAppDraft.title || "Richiesta da WhatsApp", category: whatsAppDraft.category, details: detailParts.filter(Boolean).join("\n") });
    setWhatsAppOpen(false);
    setFormMode("request");
  };

  const copyWhatsAppReply = async () => {
    if (!whatsAppDraft?.replyMessage) return;
    try {
      await navigator.clipboard.writeText(whatsAppDraft.replyMessage);
      notify("Risposta copiata: ora puoi incollarla su WhatsApp");
    } catch {
      notify("Copia non disponibile su questo dispositivo");
    }
  };

  const openOperatorEditor = () => {
    setOperatorForm({
      name: myOperatorProfile?.name ?? profileName ?? "",
      category: myOperatorProfile?.category ?? operatorCategory ?? operatorCategories[0] ?? "Meccanica marina",
      locations: myOperatorProfile?.locations?.length ? myOperatorProfile.locations : [location],
      phone: myOperatorProfile?.phone ?? "",
      email: myOperatorProfile?.email ?? "",
      website: myOperatorProfile?.website ?? "",
      telegram: myOperatorProfile?.telegram ?? "",
      note: myOperatorProfile?.note ?? "",
      tags: myOperatorProfile?.tags?.join(", ") ?? "",
    });
    setOperatorEditorOpen(true);
  };

  const saveOperatorProfile = async () => {
    const payload = {
      ...operatorForm,
      locations: operatorForm.locations,
      tags: operatorForm.tags.split(",").map((item) => item.trim()).filter(Boolean),
      telegram: operatorForm.telegram.trim(),
    };
    const response = await fetch("/api/operators", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const data = await response.json() as { operator?: Operator; error?: string; signIn?: string };
    if (!response.ok) {
      if (data.signIn) window.location.href = data.signIn;
      throw new Error(data.error ?? "Impossibile salvare il profilo operatore");
    }
    if (data.operator) {
      setMyOperatorProfile(data.operator);
      setRealOperators((items) => {
        const next = items.filter((item) => item.id !== data.operator!.id);
        return [data.operator!, ...next];
      });
    }
    setOperatorEditorOpen(false);
    notify("Profilo operatore salvato");
  };

  const messageListRef = useRef<HTMLDivElement>(null);
  useEffect(() => { messageListRef.current?.scrollTo({ top: messageListRef.current.scrollHeight, behavior: "smooth" }); }, [messages, chatLoading]);

  const compressImageFile = (file: File) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Impossibile leggere la foto"));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error("Formato immagine non leggibile"));
      image.onload = () => {
        const maxSide = 1400;
        const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        const context = canvas.getContext("2d");
        if (!context) return reject(new Error("Impossibile preparare la foto"));
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      image.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });

  const postChat = async (payload: { message: string; image?: string }) => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 45000);
    try {
      const response = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload), signal: controller.signal });
      const data = await response.json() as { reply?: string; error?: string; sources?: { title: string; url: string }[] };
      if (!response.ok) throw new Error(data.error ?? "Risposta non disponibile");
      return data;
    } finally {
      window.clearTimeout(timeout);
    }
  };

  const taskTitleFromMessage = (text: string) => {
    const firstUsefulLine = text.split("\n").map((line) => line.replace(/^[-*#\s]+/, "").replace(/\*\*/g, "").trim()).find((line) => line.length > 8) ?? `Mansione suggerita da ${ASSISTANT_NAME}`;
    return firstUsefulLine.length > 68 ? `${firstUsefulLine.slice(0, 65)}...` : firstUsefulLine;
  };

  const addMessageToAgenda = async (message: Message) => {
    const title = taskTitleFromMessage(message.text);
    try {
      const item = await saveWorkspaceItem("task", title, `Suggerita da ${ASSISTANT_NAME}`);
      setTasks((items) => [...items, { id: item.id, title: item.title, boat: item.details, due: "Da programmare", priority: "Media", done: false }]);
    } catch (error) { notify(error instanceof Error ? error.message : "Impossibile salvare la mansione"); return; }
    notify("Mansione aggiunta in agenda");
    setChat(false);
    goTo("agenda");
  };

  const identifyPhoto = async (file?: File) => {
    if (!file) return;
    setChat(true);
    setChatLoading(true);
    setChatStatus("Preparo la foto...");
    try {
      const image = await compressImageFile(file);
      const prompt = `Localita attuale: ${location}. Analizza questa foto scattata a bordo o in cantiere. Identifica il componente nautico se possibile, leggi marca/codice visibile, spiega a cosa serve e suggerisci cosa cercare online o quale operatore chiamare.`;
      setMessages((items) => [...items, { id: Date.now(), role: "user", text: "Foto caricata per identificazione nautica", image }]);
      setChatStatus("Analizzo il componente...");
      const data = await postChat({ message: prompt, image });
      setMessages((items) => [...items, { id: Date.now() + 1, role: "assistant", text: data.reply ?? `Errore: ${data.error ?? "identificazione non disponibile"}`, sources: data.sources }]);
    } catch (error) {
      const text = error instanceof Error && error.name === "AbortError" ? "La richiesta sta impiegando troppo tempo. Riprova con una foto piu nitida e ravvicinata." : error instanceof Error ? error.message : "Non riesco a leggere o inviare la foto.";
      setMessages((items) => [...items, { id: Date.now() + 1, role: "assistant", text: `${text}\n\nConsiglio: fotografa bene marca, codice e collegamenti, evitando riflessi e distanza eccessiva.` }]);
    } finally {
      setChatLoading(false);
      setChatStatus("");
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const verifyOperatorsOnWeb = async () => {
    const category = operatorCategory ?? "operatori nautici";
    setWebLoading(true);
    setWebResult(null);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: `Verifica sul web aziende reali per ${category} a ${location}. Cerca siti ufficiali, portali nautici o pagine aziendali. Restituisci solo risultati con fonte: nome azienda, cosa fa, zona, telefono o sito se disponibile. Non inventare dati.` }),
      });
      const data = await response.json() as { reply?: string; error?: string; sources?: { title: string; url: string }[] };
      setWebResult({ reply: data.reply ?? `Errore: ${data.error ?? "ricerca non disponibile"}`, sources: data.sources });
    } catch {
      setWebResult({ reply: "Non riesco a verificare il web in questo momento. Riprova tra poco." });
    } finally {
      setWebLoading(false);
    }
  };

  const acceptRequest = async (id: number) => {
    try {
      const response = await fetch("/api/requests", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, action: "accept" }) });
      const data = await response.json() as { acceptedBy?: string; acceptedByUserId?: string; error?: string; signIn?: string };
      if (!response.ok) {
        if (data.signIn) window.location.href = data.signIn;
        throw new Error(data.error ?? "Impossibile prendere in carico la richiesta");
      }
      setCommunityRequests((items) => items.map((item) => item.id === id ? { ...item, status: "Presa in carico", acceptedBy: data.acceptedBy ?? "Operatore", acceptedByUserId: data.acceptedByUserId ?? currentUserId } : item));
      notify("Intervento preso in carico");
    } catch (error) {
      notify(error instanceof Error ? error.message : "Impossibile prendere in carico la richiesta");
    }
  };

  const closeRequest = async (id: number) => {
    try {
      const response = await fetch("/api/requests", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, action: "close" }) });
      const data = await response.json() as { error?: string; signIn?: string };
      if (!response.ok) {
        if (data.signIn) window.location.href = data.signIn;
        throw new Error(data.error ?? "Impossibile chiudere la lavorazione");
      }
      setCommunityRequests((items) => items.map((item) => item.id === id ? { ...item, status: "Chiusa" } : item));
      notify("Lavorazione chiusa e archiviata");
    } catch (error) {
      notify(error instanceof Error ? error.message : "Impossibile chiudere la lavorazione");
    }
  };

  const changeAccountType = async (nextRole: AccountType) => {
    const sessionKey = `oyc-access-${currentUserId}`;
    if (nextRole === "owner" && !isOwner) {
      notify("La vista titolare e riservata al proprietario della piattaforma");
      return;
    }
    if (isOwner || nextRole === accountType) {
      setAccountType(nextRole);
      sessionStorage.setItem(sessionKey, nextRole);
      setAccessPickerOpen(false);
      notify(`Vista ${accessLabels[nextRole]} attivata`);
      return;
    }
    try {
      const response = await fetch("/api/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ role: nextRole as ProfileRole }) });
      const data = await response.json() as { error?: string; signIn?: string };
      if (!response.ok) {
        if (data.signIn) window.location.href = data.signIn;
        throw new Error(data.error ?? "Impossibile aggiornare il ruolo");
      }
      setAccountType(nextRole);
      setSignedIn(true);
      sessionStorage.setItem(sessionKey, nextRole);
      setAccessPickerOpen(false);
      window.location.reload();
    } catch (error) {
      notify(error instanceof Error ? error.message : "Impossibile aggiornare il ruolo");
    }
  };

  const saveTelegramProfile = async () => {
    const telegram = telegramHandle.trim();
    try {
      const response = await fetch("/api/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ telegram }) });
      const data = await response.json() as { telegram?: string | null; error?: string; signIn?: string };
      if (!response.ok) {
        if (data.signIn) window.location.href = data.signIn;
        throw new Error(data.error ?? "Impossibile salvare Telegram");
      }
      setTelegramHandle(data.telegram ?? telegram);
      notify(telegram ? "Telegram salvato" : "Telegram rimosso");
    } catch (error) {
      notify(error instanceof Error ? error.message : "Impossibile salvare Telegram");
    }
  };

  const openTelegramLink = () => {
    const telegram = normalizeTelegramLink(telegramHandle);
    if (telegram) {
      window.open(telegram, "_blank", "noopener,noreferrer");
      return;
    }
    goTo("profile");
    notify("Aggiungi prima il tuo Telegram nel profilo");
  };

  const sendChat = async (preset?: string) => {
    const text = (preset ?? chatText).trim();
    if (!text) return;
    setMessages((items) => [...items, { id: Date.now(), role: "user", text }]);
    setChatText("");
    setChatLoading(true);
    setChatStatus("Sto ragionando...");
    try {
      const languageName = ({ it: "italiano", en: "inglese", fr: "francese", es: "spagnolo", de: "tedesco" } as const)[language];
      const data = await postChat({ message: `Rispondi in ${languageName}. Localita attuale: ${location}. ${text}` });
      setMessages((items) => [...items, { id: Date.now() + 1, role: "assistant", text: data.reply ?? "Non ho trovato una risposta utile.", sources: data.sources }]);
    } catch (error) {
      const text = error instanceof Error && error.name === "AbortError" ? "La risposta sta impiegando troppo tempo. Riprova con una domanda piu breve." : error instanceof Error ? error.message : "Non riesco a collegarmi al servizio.";
      setMessages((items) => [...items, { id: Date.now() + 1, role: "assistant", text }]);
    } finally {
      setChatLoading(false);
      setChatStatus("");
    }
  };

  if (!authChecked) return <main className="auth-screen"><div className="auth-card"><img src="/olbia-yachting-brand.png" alt={BRAND_NAME} /><span>{BRAND_NAME.toUpperCase()}</span><h1>Prepariamo il tuo spazio personale</h1><p>Verifico il tuo accesso in sicurezza.</p></div></main>;
  if (!signedIn) return <main className="auth-screen"><div className="auth-card"><img src="/olbia-yachting-brand.png" alt={BRAND_NAME} /><span>{BRAND_NAME.toUpperCase()}</span><h1>Il tuo spazio nautico personale</h1><p>Accedi per avere agenda, prodotti e richieste separati da quelli degli altri utenti.</p><button onClick={() => { window.location.href = "/signin-with-chatgpt?return_to=/"; }}>Continua con ChatGPT</button><small>Se apri il link da un altro telefono o con un altro account, ciascuno vedra il proprio spazio personale.</small></div></main>;
  if (accessPickerOpen) return <main className="auth-screen access-screen"><section className="auth-card access-choice-card"><img src="/yachting-community-logo.png" alt={BRAND_NAME} /><span>{BRAND_NAME.toUpperCase()}</span><h1>Come vuoi accedere?</h1><p>Scegli lo spazio adatto alla tua attivita. Potrai cambiarlo in seguito dal pulsante Accesso.</p><div className="access-choice-grid">{accessOptions.filter((option) => option.id !== "owner" || isOwner).map((option) => <button key={option.id} type="button" onClick={() => void changeAccountType(option.id)}><b>{option.title}</b><span>{option.description}</span><small>{option.features}</small></button>)}</div><a href="/signout-with-chatgpt?return_to=%2F">Esci o cambia account</a></section></main>;

  return (
    <main className={`app-shell tab-${tab}`}>
      <header className="topbar">
        <button className="brand" onClick={() => goTo("home")} aria-label="Torna alla home">
          <img className="brand-logo" src="/yachting-community-logo.png" alt={`${BRAND_NAME} logo`} /><span>{BRAND_NAME}<small>{ASSISTANT_NAME}</small></span>
        </button>
        <div className="top-actions">
          <div className="location-wrap">
            <span className="location-dot" />
            <select className="location-select" value={location} onChange={(event) => chooseLocation(event.target.value as LocationKey)} aria-label="Localita">
              {(Object.keys(locationData) as LocationKey[]).map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </div>
          <button className={`plan-badge ${plan.toLowerCase()}`} onClick={() => goTo("profile")}>{plan}</button>
          <button className="access-badge" type="button" onClick={() => setAccessPickerOpen(true)}>Accesso: {accessLabels[accountType]}</button>
          <select className="language-select" value={language} onChange={(event) => setLanguage(event.target.value as Language)} aria-label="Lingua"><option value="it">IT</option><option value="en">EN</option><option value="fr">FR</option><option value="es">ES</option><option value="de">DE</option></select>
          <button className="telegram-switch" type="button" onClick={openTelegramLink}>Telegram</button>
          <a className="account-switch" href="/signout-with-chatgpt?return_to=%2F">Cambia account</a>
          <button className="avatar" aria-label="Profilo" onClick={() => goTo("profile")}>{profileName.slice(0, 2).toUpperCase()}</button>
        </div>
      </header>

      <nav className="section-tabs" aria-label="Sezioni dell'app">
        <button className={tab === "home" ? "active" : ""} onClick={() => goTo("home")}>Home</button>
        <button className={tab === "agenda" ? "active" : ""} onClick={() => goTo("agenda")}>Agenda</button>
        <button className={tab === "scan" ? "active" : ""} onClick={() => goTo("scan")}>Scansiona</button>
        <button className={tab === "community" ? "active" : ""} onClick={() => goTo("community")}>{accountType === "private" ? "Richieste" : "Lavorazioni"}</button>
        {(accountType === "company" || accountType === "owner") && <button onClick={() => setYardOpen(true)}>Commesse</button>}
        <button className={tab === "profile" ? "active" : ""} onClick={() => goTo("profile")}>Profilo e piani</button>
      </nav>

      <picture className="brand-showcase" data-section="home">
        <source media="(max-width: 700px)" srcSet="/olbia-yachting-brand.png" />
        <img src="/olbia-yachting-hero.png" alt="Olbia Yachting Community - Connect, Share, Sail" />
      </picture>

      <section className="hero" data-section="home">
        <div>
          <span className="eyebrow">{greeting}</span>
          <h1>Cosa serve oggi<br />alla tua barca?</h1>
          <p>Identifica, trova e organizza. {BRAND_NAME} ti accompagna dalla diagnosi al lavoro completato nella zona di {location}.</p>
        </div>
        <div className="weather"><span>*</span><strong>{currentLocation.weather}</strong><small>{location} - {currentLocation.sea}</small></div>
      </section>

      <section className="quick-grid" data-section="home" aria-label="Azioni rapide">
        <button className="quick primary" onClick={() => fileRef.current?.click()}><span className="quick-icon">O</span><b>Scatta una foto</b><small>Identifica un componente</small><i>-&gt;</i></button>
        <input ref={fileRef} hidden type="file" accept="image/*" capture="environment" onChange={(event) => identifyPhoto(event.target.files?.[0])} />
        <button className="quick" onClick={() => setChat(true)}><span className="quick-icon">Q</span><b>Cerca un prodotto</b><small>Ricambi e accessori</small><i>-&gt;</i></button>
        <button className="quick" onClick={() => goTo("community")}><span className="quick-icon">P</span><b>Trova un professionista</b><small>Servizi a {location}</small><i>-&gt;</i></button>
      </section>

      <section className="operations-overview" data-section="home" aria-labelledby="operations-title">
        <div className="operations-heading"><div><span className="eyebrow">QUADRO DI BORDO</span><h2 id="operations-title">Centro operativo</h2><p>{accountType === "company" || accountType === "owner" ? "Una vista rapida delle attivita e dei lavori della tua organizzazione." : accountType === "operator" ? `Le tue attivita e le richieste compatibili a ${location}.` : "Agenda e richieste della tua imbarcazione, in un unico riepilogo."}</p></div><span className="operations-location">{location}</span></div>
        <div className="operations-metrics">
          <button className="operations-metric" onClick={() => goTo("agenda")}><span>Mansioni aperte</span><strong>{openTaskCount}</strong><small>{tasks.length ? `${taskProgress}% completate` : "Nessuna mansione inserita"}</small><i>Apri agenda →</i></button>
          {(accountType === "private" || accountType === "company" || accountType === "owner") && <button className="operations-metric" onClick={() => goTo("agenda")}><span>Acquisti da seguire</span><strong>{pendingPurchaseCount}</strong><small>{purchases.length ? "Prodotti nella tua lista" : "Lista acquisti vuota"}</small><i>Apri ordini →</i></button>}
          {(accountType === "company" || accountType === "owner") && <button className="operations-metric" onClick={() => setYardOpen(true)}><span>Commesse attive</span><strong>{activeJobCount}</strong><small>{jobs.length ? "Archivio personale" : "Nessuna commessa inserita"}</small><i>Apri commesse →</i></button>}
          <button className="operations-metric" onClick={() => goTo("community")}><span>{accountType === "private" ? "Le mie richieste" : "Lavorazioni visibili"}</span><strong>{openRequestCount}</strong><small>{showDemoData ? "Include contenuti dimostrativi" : "Richieste non chiuse"}</small><i>{accountType === "private" ? "Apri richieste →" : "Apri lavorazioni →"}</i></button>
        </div>
        <div className="operations-footer"><div className="operations-progress"><div><b>Completamento mansioni</b><span>{taskProgress}%</span></div><i><em style={{ width: `${taskProgress}%` }} /></i></div><div className="operations-actions"><button onClick={() => openForm("task")}>+ Mansione</button>{(accountType === "private" || accountType === "company" || accountType === "owner") && <button onClick={() => openForm("purchase")}>+ Prodotto</button>}{(accountType === "company" || accountType === "owner") && <button onClick={() => openForm("job")}>+ Commessa</button>}<button onClick={() => openForm("request")}>+ Richiesta</button></div></div>
      </section>

      <section className="scan-page" data-section="scan">
        <span className="eyebrow">RICONOSCIMENTO VISIVO</span>
        <h1>Fotografa il componente.</h1>
        <p>Inquadra bene marca, codice e collegamenti. {ASSISTANT_NAME} analizzerà la foto e potrà cercare ricambi compatibili.</p>
        <button onClick={() => fileRef.current?.click()}><span>O</span> Apri la fotocamera</button>
        <small>Puoi anche scegliere una foto gia presente sul telefono.</small>
      </section>

      <section className="dashboard-grid" data-section="agenda">
        <article className="panel tasks-panel">
          <div className="panel-head"><div><span className="eyebrow">AGENDA DI BORDO</span><h2>Mansioni</h2></div><button className="text-button" onClick={() => openForm("task")}>+ Aggiungi</button></div>
          <div className="progress-row"><span>Avanzamento di oggi</span><b>{progress}%</b><div className="progress"><i style={{ width: `${progress}%` }} /></div></div>
          <div className="task-list">
            {!tasks.length && <div className="empty-state"><b>Nessuna mansione</b><span>Parti da zero e aggiungi il primo lavoro da svolgere.</span><button onClick={() => openForm("task")}>Aggiungi mansione</button></div>}
            {tasks.map((task) => <label className={`task ${task.done ? "done" : ""}`} key={task.id}><input type="checkbox" checked={task.done} onChange={() => { const done = !task.done; setTasks((items) => items.map((item) => item.id === task.id ? { ...item, done } : item)); void toggleWorkspaceItem(task.id, done).catch(() => notify("Impossibile aggiornare la mansione")); }} /><span className="check">OK</span><span className="task-copy"><b>{task.title}</b><small>{task.boat}</small></span><span className={`priority ${task.priority.toLowerCase()}`}>{task.done ? "Completata" : task.due}</span></label>)}
          </div>
          <button className="full-link" onClick={() => notify("Agenda completa in arrivo")}>Vedi tutte le mansioni <span>-&gt;</span></button>
        </article>

        {(accountType === "private" || accountType === "company" || accountType === "owner") && <article className="panel shopping-panel">
          <div className="panel-head"><div><span className="eyebrow">LISTA ACQUISTI</span><h2>Prodotti da riordinare</h2></div><div className="panel-actions"><span className="count">{purchases.filter((item) => !item.done).length}</span><button className="text-button" onClick={() => openForm("purchase")}>+ Aggiungi</button></div></div>
          {!purchases.length && <div className="empty-state"><b>Lista acquisti vuota</b><span>Aggiungi il primo prodotto o chiedi alla chat di cercarlo.</span><button onClick={() => openForm("purchase")}>Aggiungi prodotto</button></div>}
          {purchases.map((item) => <label className={`purchase ${item.done ? "done" : ""}`} key={item.id}><input type="checkbox" checked={item.done} onChange={() => { const done = !item.done; setPurchases((items) => items.map((product) => product.id === item.id ? { ...product, done } : product)); void toggleWorkspaceItem(item.id, done).catch(() => notify("Impossibile aggiornare il prodotto")); }} /><span className="product-img">R</span><span><b>{item.title}</b><small>{item.detail}</small></span><strong>{item.price}</strong></label>)}
          <button className="buy-button" onClick={() => setCatalogOpen(true)}>Apri cataloghi e confronta</button>
        </article>}
      </section>

      <section className="access-areas" data-section="agenda">
        <span className="eyebrow">AREE DEL TUO ACCESSO</span>
        <h2>{accountType === "owner" ? "Controllo completo" : accountType === "company" ? "Gestione ditta" : accountType === "operator" ? "Spazio operatore" : "Spazio privato"}</h2>
        <div>
          {(accountType === "operator" || accountType === "company" || accountType === "owner") && <button onClick={() => goTo("community")}><b>Lavorazioni</b><span>Interventi aperti e presi in carico</span></button>}
          {(accountType === "company" || accountType === "owner") && <button onClick={() => goTo("agenda")}><b>Ordini</b><span>Materiali, ricambi e fornitori</span></button>}
          {(accountType === "company" || accountType === "owner") && <button onClick={() => setYardOpen(true)}><b>Commesse</b><span>Barche, squadre e avanzamento</span></button>}
          {(accountType === "private" || accountType === "owner") && <button onClick={() => goTo("community")}><b>Le mie richieste</b><span>Assistenza e interventi richiesti</span></button>}
        </div>
      </section>

      <section className="community" data-section="community" id="community">
        <div className="community-copy">
          <span className="eyebrow light">RETE INTERVENTI - {location.toUpperCase()}</span>
          <h2>{location} {BRAND_NAME}</h2>
          <p>{accountType === "private" ? "Accesso privato: puoi pubblicare richieste e vedere solo le tue." : accountType === "operator" ? "Accesso operatore: vedi richieste aperte compatibili con zona e mansione." : accountType === "company" ? "Accesso ditta associata: lavorazioni, ordini e commesse della zona." : "Accesso titolare: tutte le sezioni sono disponibili separatamente."}</p>
          <div className="community-access">
            <button className={accountType === "private" ? "active" : ""} onClick={() => void changeAccountType("private")}><b>Privato</b><span>solo le mie richieste</span></button>
            <button className={accountType === "operator" ? "active" : ""} onClick={() => void changeAccountType("operator")}><b>Operatore</b><span>lavori compatibili</span></button>
            <button className={accountType === "company" ? "active" : ""} onClick={() => void changeAccountType("company")}><b>Ditta associata</b><span>richieste di zona</span></button>
            {isOwner && <button className={accountType === "owner" ? "active" : ""} onClick={() => void changeAccountType("owner")}><b>Titolare</b><span>accesso completo</span></button>}
          </div>
          <div className="reality-card">
            <div>
              <b>Stato dati</b>
              <span>{showDemoData ? "Stai visualizzando anche contenuti demo di esempio." : "Stai visualizzando solo dati reali del tuo account e richieste salvate."}</span>
            </div>
            <button type="button" className={showDemoData ? "demo-toggle active" : "demo-toggle"} onClick={() => setShowDemoData((value) => !value)}>
              {showDemoData ? "Nascondi demo" : "Mostra demo"}
            </button>
          </div>
          {!signedIn && <button className="publish-job" onClick={() => { window.location.href = "/signin-with-chatgpt?return_to=/"; }}>Accedi per salvare richieste e lavorazioni</button>}
          <div className="request-entry-actions"><button className="publish-job" onClick={() => openForm("request")}>+ Pubblica una richiesta</button><button className="publish-job whatsapp-import" onClick={openWhatsAppImport}>Importa da WhatsApp</button></div>
          <div className={`community-feed ${accountType === "private" ? "" : "pro-feed"}`}>
            {!visibleRequests.length && <div className="community-empty">{accountType === "private" ? `Non hai ancora pubblicato richieste a ${location}.` : `Nessuna richiesta visibile per questo accesso a ${location}.`}</div>}
            {visibleRequests.slice(0, accountType === "private" ? 6 : 10).map((request) => {
              const isDemo = request.ownerId.startsWith("demo-");
              const canClose = !isDemo && request.status !== "Chiusa" && (request.ownerId === "me" || request.acceptedByUserId === currentUserId);
              const shareText = `Olbia Yachting Community Request\n${request.title}\n${request.details}\nZona: ${request.location}\nCategoria: ${request.category}`;
              return <article key={request.id} className={request.status === "Chiusa" ? "request-closed" : ""}><span>{request.status} - {request.created} - {request.category}</span><b>{request.title}</b><p>{request.details}</p><small className={`data-badge ${isDemo ? "demo" : "live"}`}>{isDemo ? "Demo" : "Dato reale"}</small>{request.acceptedBy && <em>In carico a {request.acceptedBy}</em>}<div className="request-actions">{accountType !== "private" && request.status === "Aperta" && !isDemo && <button onClick={() => acceptRequest(request.id)}>Prendi in carico</button>}{canClose && <button className="close-request" onClick={() => closeRequest(request.id)}>Chiudi lavorazione</button>}{!isDemo && <a href={`https://wa.me/?text=${encodeURIComponent(shareText)}`} target="_blank" rel="noreferrer">Condividi su WhatsApp</a>}</div></article>;
            })}
          </div>
        </div>
        <div className="operator-area">
          <div className="service-grid">{currentLocation.services.map((service) => { const count = operatorCount(service.name); return <button className={operatorCategory === service.name ? "active" : ""} key={service.name} onClick={() => openOperators(service.name)}><i>{service.icon}</i><span><b>{service.name}</b><small>{count === 1 ? "1 operatore" : `${count} operatori`}</small></span><em>&gt;</em></button>; })}</div>
          <div className="operator-panel">
            <div className="operator-head"><div><span className="eyebrow light">OPERATORI DISPONIBILI</span><h3>{operatorCategory ?? `Tutti a ${location}`}</h3></div><div className="operator-head-actions">{operatorCategory && <button onClick={() => { setOperatorCategory(null); setWebResult(null); }}>Tutti</button>}<button onClick={verifyOperatorsOnWeb} disabled={webLoading}>{webLoading ? "Verifico..." : "Verifica sul web"}</button></div></div>
            <p className="operator-note">{showDemoData ? "Elenco locale in modalita demo: usa Verifica sul web per controllare aziende reali e fonti." : visibleOperators.length ? "Archivio operatori reale collegato al database. I dati mostrati qui arrivano dai profili pubblicati dagli operatori." : "Nessun operatore reale pubblicato in questa zona. Un operatore o una ditta puo creare adesso il proprio profilo."}</p>
            {(accountType === "operator" || accountType === "company" || accountType === "owner") && <button className="publish-job secondary-job" onClick={openOperatorEditor}>{myOperatorProfile ? "Aggiorna profilo operatore" : "Pubblica profilo operatore"}</button>}
            {webResult && <div className="web-result"><RichText text={webResult.reply} />{webResult.sources?.length ? <div className="source-list"><span>Fonti web</span>{webResult.sources.map((source, index) => <a key={source.url} href={source.url} target="_blank" rel="noreferrer">{index + 1}. {source.title}</a>)}</div> : null}</div>}
            <div className="operator-list">
              {!visibleOperators.length && <div className="community-empty">{showDemoData ? "Nessun operatore demo in questa categoria. Pubblica una richiesta e verra mostrata agli iscritti compatibili." : "Qui compariranno gli operatori reali che pubblicano un profilo per questa zona."}</div>}
              {visibleOperators.map((operator) => { const whatsAppPhone = operator.phone ? normalizeWhatsAppPhone(operator.phone) : ""; const contactMessage = `Buongiorno ${operator.name}, invio una richiesta tramite Olbia Yachting Community. Zona: ${location}. Vorrei informazioni per un intervento ${operator.category}.`; return <article className={`operator-card ${selectedOperator?.id === operator.id ? "selected" : ""}`} key={operator.id} onClick={() => setSelectedOperator(operator)}>
                <div className="operator-title"><b>{operator.name}</b>{showDemoData && <span>Demo</span>}{!showDemoData && operator.verified && <span>Verificato</span>}{operator.premium && <span>Premium</span>}</div>
                <p>{operator.note}</p>
                <div className="operator-meta"><span>{operator.category}</span>{operator.distance && <span>{operator.distance}</span>}{operator.rating && <span>{operator.rating}/5</span>}</div>
                <div className="operator-tags">{operator.tags.map((tag) => <small key={tag}>{tag}</small>)}</div>
                {!showDemoData && <div className="operator-contact">{operator.phone && <a href={`tel:${operator.phone}`}>{operator.phone}</a>}{whatsAppPhone && <a href={`https://wa.me/${whatsAppPhone}?text=${encodeURIComponent(contactMessage)}`} target="_blank" rel="noreferrer">WhatsApp</a>}{operator.email && <a href={`mailto:${operator.email}?subject=${encodeURIComponent("Olbia Yachting Community Request")}&body=${encodeURIComponent(contactMessage)}`}>Email richiesta</a>}{operator.telegram && normalizeTelegramLink(operator.telegram) && <a href={normalizeTelegramLink(operator.telegram)} target="_blank" rel="noreferrer">Telegram</a>}{operator.website && <a href={operator.website.startsWith("http") ? operator.website : `https://${operator.website}`} target="_blank" rel="noreferrer">Sito</a>}</div>}
                <div className="operator-actions"><em>{operator.response ?? (showDemoData ? "Disponibilita demo" : "Profilo reale pubblicato")}</em><button onClick={(event) => { event.stopPropagation(); requestOperator(operator); }}>Richiedi intervento</button></div>
              </article>; })}
            </div>
          </div>
        </div>
      </section>

      {(accountType === "company" || accountType === "owner") && <section className="yard-strip">
        <div><span className="eyebrow">MODALITA CANTIERE</span><h2>Ogni commessa sotto controllo.</h2><p>Imbarcazioni, lavorazioni e stato di avanzamento in uno spazio personale collegato al tuo account.</p><small>Le commesse inserite vengono salvate e restano disponibili ai successivi accessi.</small></div>
        <button onClick={() => setYardOpen(true)}>Apri area cantieri</button>
      </section>}

      <section className="plans" data-section="profile" id="plans">
        <div className="plans-intro"><span className="eyebrow">PIANI {BRAND_NAME.toUpperCase()}</span><h2>Scegli quanto supporto vuoi a bordo.</h2><p>Le funzioni quotidiane restano accessibili a tutti. Premium aggiunge intelligenza, collaborazione e priorita.</p></div>
        <div className="plan-card access-plan-card"><div><span>ACCESSO {accessLabels[accountType].toUpperCase()}</span><h3>Il tuo spazio operativo</h3><p>Sezioni dedicate al ruolo, dati separati per account e permessi verificati sul server.</p></div><div><strong>{accessLabels[accountType]}</strong><small>{isOwner ? "Puoi passare tra tutte le viste." : "Puoi modificare il tuo ruolo in qualsiasi momento."}</small><button onClick={() => setAccessPickerOpen(true)}>Cambia tipo di accesso</button></div></div>
        <div className={`plan-card ${plan === "Standard" ? "selected" : ""}`}><span>STANDARD</span><h3>Per iniziare</h3><strong>Gratis</strong><ul><li>Agenda e lista acquisti</li><li>3 identificazioni AI al mese</li><li>Ricerca servizi nella zona scelta</li><li>1 imbarcazione</li></ul><button onClick={() => { setPlan("Standard"); notify("Piano Standard selezionato"); }}>{plan === "Standard" ? "Piano attuale" : "Scegli Standard"}</button></div>
        <div className={`plan-card premium-card ${plan === "Premium" ? "selected" : ""}`}><span>PREMIUM</span><h3>Per chi vive il mare</h3><strong>EUR 14,90 <small>/ mese</small></strong><ul><li>Identificazioni AI illimitate</li><li>Confronto prezzi avanzato</li><li>Piu imbarcazioni e collaboratori</li><li>Assistenza e richieste prioritarie</li><li>Storico manutenzioni completo</li></ul><button onClick={() => { setPlan("Premium"); notify("Premium selezionato in anteprima: pagamento reale non ancora attivo"); }}>{plan === "Premium" ? "Premium attivo" : "Prova Premium"}</button><small className="plan-note">Attualmente e una anteprima funzionale: il pagamento reale non e ancora collegato.</small><a className="profile-download" href="/downloads/Yachting-Assistant-Android.apk" download>Scarica l'app Android</a><a className="profile-signout" href="/signout-with-chatgpt?return_to=%2F">Esci o cambia account</a><small className="plan-note">Se condividi il link, ogni persona deve accedere col proprio account per vedere il proprio spazio e non quello di chi ha gia aperto l'app su quel dispositivo.</small></div>
        <div className={`plan-card telegram-card ${telegramHandle ? "selected" : ""}`}><div className="telegram-copy"><span>TELEGRAM</span><h3>Contatto diretto</h3><p>Salva il tuo username, canale o link Telegram. Lo ritrovi nel profilo e nei contatti rapidi degli operatori.</p></div><div className="telegram-form"><label><span>Username o link Telegram</span><input value={telegramHandle} onChange={(event) => setTelegramHandle(event.target.value)} placeholder="@nomeutente o https://t.me/..." /></label><button type="button" onClick={() => void saveTelegramProfile()}>Salva Telegram</button>{normalizeTelegramLink(telegramHandle) && <a className="telegram-link" href={normalizeTelegramLink(telegramHandle)} target="_blank" rel="noreferrer">Apri Telegram</a>}</div><small className="plan-note">Svuota il campo e salva di nuovo per rimuoverlo. Per automazioni vere serve un bot token; qui hai il collegamento operativo persistente, gratuito e pronto all'uso.</small></div>
        <div className="plan-card integration-card"><span>WHATSAPP BUSINESS</span><h3>Gestione richieste</h3><p>Importa i messaggi ricevuti e trasformali in schede ordinate prima di pubblicarli.</p><ul><li>Importazione manuale con AI: attiva</li><li>Risposte e richieste precompilate: attive</li><li>Inbox automatica Meta: da collegare</li></ul><button type="button" onClick={openWhatsAppImport}>Importa una richiesta</button><small className="plan-note">La lettura automatica dei messaggi richiede un account WhatsApp Business Platform, numero abilitato, webhook e credenziali Meta. L'app non legge le chat personali.</small></div>
      </section>

      <nav className="bottom-nav" aria-label="Navigazione principale">
        {([["home", "H", "Home"], ["agenda", "OK", "Agenda"], ["scan", "O", "Scansiona"], ["community", "P", "Zona"], ["profile", "SC", "Profilo"]] as [Tab, string, string][]).map(([id, icon, label]) => <button key={id} className={tab === id ? "active" : ""} onClick={() => goTo(id)}><i>{icon}</i><span>{label}</span></button>)}
      </nav>

      <button className="chat-fab" onClick={() => setChat(!chat)} aria-label={`Apri l'assistente ${BRAND_NAME}`}><span className="assistant-symbol" aria-hidden="true"><i /><i /><i /></span></button>
      {chat && <aside className="chat chat-live"><button onClick={() => setChat(false)}>x</button><span>{BRAND_NAME.toUpperCase()} - ONLINE</span><h3>{ASSISTANT_NAME}</h3><div ref={messageListRef} className="message-list">{messages.map((message) => <div key={message.id} className={`message ${message.role}`}>{message.image && <img className="message-image" src={message.image} alt="Foto caricata" />}<RichText text={message.text} />{message.role === "assistant" && message.id !== 1 && <button className="message-action" onClick={() => addMessageToAgenda(message)}>+ Aggiungi in agenda</button>}{message.sources?.length ? <div className="source-list"><span>Fonti consultate</span>{message.sources.map((source, i) => <a key={source.url} href={source.url} target="_blank" rel="noreferrer">{i + 1}. {source.title}</a>)}</div> : null}</div>)}{chatLoading && <div className="message assistant"><span className="thinking-dot" /> {chatStatus || "Sto lavorando..."}</div>}</div><div className="suggestions"><button disabled={chatLoading} onClick={() => sendChat("Devo trovare una girante")}>Trova una girante</button><button disabled={chatLoading} onClick={() => sendChat(`Cerco un elettricista nautico a ${location}`)}>Elettricista in zona</button><button disabled={chatLoading} onClick={() => fileRef.current?.click()}>+ Allega foto</button></div><form className="chat-input" onSubmit={(event) => { event.preventDefault(); sendChat(); }}><input disabled={chatLoading} value={chatText} onChange={(event) => setChatText(event.target.value)} placeholder="Scrivi un messaggio..." aria-label="Messaggio" /><button disabled={chatLoading} type="submit">^</button></form><small className="ai-note">Verifica sempre le indicazioni tecniche critiche con un professionista qualificato.</small></aside>}
      {toast && <div className="toast">OK {toast}</div>}

      {catalogOpen && <div className="modal-backdrop" onClick={() => setCatalogOpen(false)}><section className="yard-modal catalog-modal" onClick={(event) => event.stopPropagation()}><button className="modal-close" onClick={() => setCatalogOpen(false)}>x</button><span className="eyebrow">CATALOGHI NAUTICI UFFICIALI</span><h2>Trova il ricambio alla fonte.</h2><p className="catalog-intro">Apri i siti ufficiali per verificare codici, schede tecniche, prezzi e disponibilita. Nessun link affiliato e attivo finche non esiste un accordo formale.</p><div className="catalog-grid">{suppliers.map((supplier) => <a key={supplier.name} href={supplier.url} target="_blank" rel="noreferrer"><span>{supplier.category}</span><b>{supplier.name}</b><small>{supplier.description}</small><em>Apri catalogo -&gt;</em></a>)}</div><button className="catalog-ai" onClick={() => { const products = purchases.filter((item) => !item.done).map((item) => item.title).join(", ") || "il prodotto che mi serve"; setChatText(`Confronta sui siti ufficiali dei fornitori nautici questo elenco: ${products}. Riporta fonti e non inventare prezzi o disponibilita.`); setChat(true); setCatalogOpen(false); }}>Chiedi il confronto all'assistente</button></section></div>}

      {whatsAppOpen && <div className="modal-backdrop" onClick={() => setWhatsAppOpen(false)}><section className="entry-modal whatsapp-modal" onClick={(event) => event.stopPropagation()}><button type="button" className="modal-close" onClick={() => setWhatsAppOpen(false)}>x</button><span className="eyebrow">IMPORTA DA WHATSAPP</span><h2>Da messaggio a lavorazione.</h2><p className="whatsapp-intro">Incolla il testo ricevuto. L'AI prepara una scheda, ma sarai tu a controllarla e pubblicarla. Il testo viene analizzato dall'AI e non viene salvato nel database finche non confermi la richiesta.</p><label><span>Messaggio del cliente</span><textarea autoFocus value={whatsAppText} onChange={(event) => { setWhatsAppText(event.target.value); setWhatsAppDraft(null); }} placeholder="Es. Ciao, sono al porto di Olbia con un problema al salpa ancora..." /></label><button className="entry-submit" type="button" disabled={whatsAppLoading} onClick={() => void analyzeWhatsApp()}>{whatsAppLoading ? "Analisi in corso..." : "Analizza e ordina"}</button>{whatsAppDraft && <div className={`whatsapp-draft ${whatsAppDraft.isRelevant ? "" : "not-relevant"}`}><span>{whatsAppDraft.category} - Urgenza {whatsAppDraft.urgency}</span><b>{whatsAppDraft.title}</b><p>{whatsAppDraft.details}</p>{whatsAppDraft.missing.length > 0 && <div><strong>Dati da chiedere</strong><ul>{whatsAppDraft.missing.map((item) => <li key={item}>{item}</li>)}</ul></div>}<label><span>Risposta pronta per il cliente</span><textarea readOnly value={whatsAppDraft.replyMessage} /></label><div className="whatsapp-draft-actions"><button type="button" onClick={() => void copyWhatsAppReply()}>Copia risposta</button><button type="button" disabled={!whatsAppDraft.isRelevant} onClick={useWhatsAppDraft}>Rivedi e pubblica</button></div></div>}</section></div>}

      {yardOpen && <div className="modal-backdrop" onClick={() => setYardOpen(false)}><section className="yard-modal" onClick={(event) => event.stopPropagation()}><button className="modal-close" onClick={() => setYardOpen(false)}>x</button><span className="eyebrow">{BRAND_NAME.toUpperCase()} CANTIERI</span><h2>Commesse</h2><small className="plan-note">Archivio reale e personale: ogni modifica viene salvata sul tuo account.</small>{!jobs.length && <div className="job-empty"><b>Nessuna commessa</b><small>Crea la prima commessa indicando imbarcazione, lavorazione e scadenza.</small></div>}{jobs.map((job) => <div className={`job ${job.done ? "completed" : ""}`} key={job.id}><div><b>{job.title}</b><small>{job.details}</small></div><strong>{job.done ? "Completata" : "In corso"}</strong><i><em style={{ width: job.done ? "100%" : "25%" }} /></i><button className="job-toggle" onClick={() => { const done = !job.done; setJobs((items) => items.map((item) => item.id === job.id ? { ...item, done } : item)); void toggleWorkspaceItem(job.id, done).then(() => notify(done ? "Commessa completata" : "Commessa riaperta")).catch(() => notify("Impossibile aggiornare la commessa")); }}>{job.done ? "Riapri" : "Segna completata"}</button></div>)}<div className="job-stats"><span><b>{jobs.filter((job) => !job.done).length}</b><small>Commesse aperte</small></span><span><b>{jobs.filter((job) => job.done).length}</b><small>Commesse completate</small></span><span><b>{purchases.filter((item) => !item.done).length}</b><small>Ordini in attesa</small></span></div><button className="new-job" onClick={() => { setYardOpen(false); openForm("job"); }}>+ Nuova commessa</button></section></div>}

      {operatorEditorOpen && <div className="modal-backdrop" onClick={() => setOperatorEditorOpen(false)}><form className="entry-modal" onClick={(event) => event.stopPropagation()} onSubmit={(event) => { event.preventDefault(); void saveOperatorProfile().catch((error: Error) => notify(error.message)); }}><button type="button" className="modal-close" onClick={() => setOperatorEditorOpen(false)}>x</button><span className="eyebrow">PROFILO OPERATORE</span><h2>{myOperatorProfile ? "Aggiorna il tuo profilo" : "Pubblica il tuo profilo"}</h2><label><span>Nome attivita</span><input autoFocus value={operatorForm.name} onChange={(event) => setOperatorForm({ ...operatorForm, name: event.target.value })} placeholder="Es. Nautica Gallura Service" required /></label><label><span>Categoria</span><select value={operatorForm.category} onChange={(event) => setOperatorForm({ ...operatorForm, category: event.target.value })}><option>Meccanica marina</option><option>Elettrica nautica</option><option>Elettronica</option><option>Cantieri & refit</option><option>Ricambi nautici</option><option>Tender e gommoni</option><option>Pulizia e detailing</option><option>Concierge yacht</option><option>Cambusa e forniture</option><option>Vele e rigging</option><option>Tappezzeria nautica</option><option>Ormeggi e marina</option></select></label><label><span>Localita coperte</span><div className="location-checks">{(Object.keys(locationData) as LocationKey[]).map((item) => <label key={item} className="check-option"><input type="checkbox" checked={operatorForm.locations.includes(item)} onChange={(event) => setOperatorForm((current) => ({ ...current, locations: event.target.checked ? [...current.locations, item] : current.locations.filter((locationItem) => locationItem !== item) }))} /><span>{item}</span></label>)}</div></label><label><span>Telefono</span><input value={operatorForm.phone} onChange={(event) => setOperatorForm({ ...operatorForm, phone: event.target.value })} placeholder="+39 ..." /></label><label><span>Email</span><input value={operatorForm.email} onChange={(event) => setOperatorForm({ ...operatorForm, email: event.target.value })} placeholder="info@azienda.it" /></label><label><span>Sito web</span><input value={operatorForm.website} onChange={(event) => setOperatorForm({ ...operatorForm, website: event.target.value })} placeholder="www.azienda.it" /></label><label><span>Telegram</span><input value={operatorForm.telegram} onChange={(event) => setOperatorForm({ ...operatorForm, telegram: event.target.value })} placeholder="@nomeutente o https://t.me/..." /></label><label><span>Tag servizi</span><input value={operatorForm.tags} onChange={(event) => setOperatorForm({ ...operatorForm, tags: event.target.value })} placeholder="Generatori, Batterie, Urgenze" /></label><label><span>Descrizione</span><textarea value={operatorForm.note} onChange={(event) => setOperatorForm({ ...operatorForm, note: event.target.value })} placeholder="Spiega servizi, tempi e area operativa" /></label><button className="entry-submit" type="submit">Salva profilo operatore</button></form></div>}

      {formMode && <div className="modal-backdrop" onClick={() => setFormMode(null)}><form className="entry-modal" onClick={(event) => event.stopPropagation()} onSubmit={(event) => { event.preventDefault(); void submitForm(); }}><button type="button" className="modal-close" onClick={() => setFormMode(null)}>x</button><span className="eyebrow">{formMode === "request" ? "NUOVA RICHIESTA" : formMode === "task" ? "AGENDA DI BORDO" : formMode === "job" ? "AREA CANTIERI" : "LISTA ACQUISTI"}</span><h2>{formMode === "request" ? `Richiedi un intervento a ${location}` : formMode === "task" ? "Aggiungi una mansione" : formMode === "job" ? "Crea una commessa" : "Aggiungi un prodotto"}</h2><label><span>{formMode === "request" ? "Intervento richiesto" : formMode === "task" ? "Mansione" : formMode === "job" ? "Imbarcazione o commessa" : "Prodotto"}</span><input autoFocus value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder={formMode === "request" ? "Es. Controllo caricabatterie" : formMode === "job" ? "Es. M/Y Aurora - Refit sala macchine" : "Inserisci un titolo"} required /></label>{formMode === "request" && <label><span>Categoria</span><select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}><option>Meccanica</option><option>Elettrica</option><option>Elettronica</option><option>Refit</option><option>Pulizia</option><option>Altro</option></select></label>}<label><span>{formMode === "request" ? "Barca, marina e urgenza" : formMode === "job" ? "Lavorazioni, responsabile e scadenza" : "Dettagli facoltativi"}</span><textarea value={form.details} onChange={(event) => setForm({ ...form, details: event.target.value })} placeholder={formMode === "request" ? `Es. Marina di ${location}, M/Y 15 m, entro domani` : formMode === "job" ? "Es. Revisione pompe, squadra tecnica, consegna 30 settembre" : "Aggiungi informazioni"} /></label><button className="entry-submit" type="submit">{formMode === "request" ? "Pubblica richiesta" : formMode === "job" ? "Crea commessa" : "Salva"}</button></form></div>}
    </main>
  );
}
