"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Tab = "home" | "agenda" | "scan" | "community" | "profile";
type LocationKey = "Olbia" | "Porto Cervo" | "Porto Rotondo" | "Cagliari" | "Alghero";
type AccountType = "private" | "operator" | "company" | "owner";
type Task = { id: number; title: string; boat: string; due: string; priority: "Alta" | "Media" | "Bassa"; done: boolean };
type Purchase = { id: number; title: string; detail: string; price: string; done: boolean };
type Message = { id: number; role: "user" | "assistant"; text: string; image?: string; sources?: { title: string; url: string }[] };
type WebResult = { reply: string; sources?: { title: string; url: string }[] };
type CommunityRequest = { id: number; ownerId: string; title: string; details: string; category: string; location: LocationKey; created: string; status: "Aperta" | "Presa in carico"; acceptedBy?: string };
type Operator = { id: number; name: string; category: string; locations: LocationKey[]; distance: string; rating: string; response: string; premium: boolean; tags: string[]; note: string };
type ServiceCategory = { name: string; icon: string };
type InstallPromptEvent = Event & { prompt(): Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

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
  const [tab, setTab] = useState<Tab>("home");
  const [chat, setChat] = useState(false);
  const [plan, setPlan] = useState<"Standard" | "Premium">("Standard");
  const [accountType, setAccountType] = useState<AccountType>("owner");
  const [location, setLocation] = useState<LocationKey>("Olbia");
  const [yardOpen, setYardOpen] = useState(false);
  const [chatText, setChatText] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatStatus, setChatStatus] = useState("");
  const [messages, setMessages] = useState<Message[]>([{ id: 1, role: "assistant", text: "Ciao Simon. Posso aiutarti con un ricambio, un guasto, una mansione o un professionista nautico nella tua zona." }]);
  const [communityRequests, setCommunityRequests] = useState<CommunityRequest[]>([]);
  const [formMode, setFormMode] = useState<"task" | "purchase" | "request" | null>(null);
  const [operatorCategory, setOperatorCategory] = useState<string | null>(null);
  const [selectedOperator, setSelectedOperator] = useState<Operator | null>(null);
  const [webLoading, setWebLoading] = useState(false);
  const [webResult, setWebResult] = useState<WebResult | null>(null);
  const [form, setForm] = useState({ title: "", category: "Meccanica", details: "" });
  const [toast, setToast] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const installPromptRef = useRef<InstallPromptEvent | null>(null);

  useEffect(() => {
    const savedTasks = localStorage.getItem("marinaio-tasks");
    const savedPurchases = localStorage.getItem("marinaio-purchases");
    const savedRequests = localStorage.getItem("marinaio-community-requests");
    const savedLocation = localStorage.getItem("marinaio-location") as LocationKey | null;
    const savedPlan = localStorage.getItem("marinaio-plan") as "Standard" | "Premium" | null;
    const savedAccountType = localStorage.getItem("marinaio-account-type") as AccountType | null;
    if (savedTasks) setTasks(JSON.parse(savedTasks));
    if (savedPurchases) setPurchases(JSON.parse(savedPurchases));
    if (savedRequests) setCommunityRequests(JSON.parse(savedRequests));
    if (savedLocation && savedLocation in locationData) setLocation(savedLocation);
    if (savedPlan === "Standard" || savedPlan === "Premium") setPlan(savedPlan);
    if (savedAccountType === "private" || savedAccountType === "operator" || savedAccountType === "company" || savedAccountType === "owner") setAccountType(savedAccountType);
  }, []);

  useEffect(() => { localStorage.setItem("marinaio-tasks", JSON.stringify(tasks)); }, [tasks]);
  useEffect(() => { localStorage.setItem("marinaio-purchases", JSON.stringify(purchases)); }, [purchases]);
  useEffect(() => { localStorage.setItem("marinaio-community-requests", JSON.stringify(communityRequests)); }, [communityRequests]);
  useEffect(() => { localStorage.setItem("marinaio-location", location); }, [location]);
  useEffect(() => { localStorage.setItem("marinaio-plan", plan); }, [plan]);
  useEffect(() => { localStorage.setItem("marinaio-account-type", accountType); }, [accountType]);

  useEffect(() => {
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    const captureInstallPrompt = (event: Event) => {
      event.preventDefault();
      installPromptRef.current = event as InstallPromptEvent;
    };
    window.addEventListener("beforeinstallprompt", captureInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", captureInstallPrompt);
  }, []);

  const progress = useMemo(() => tasks.length ? Math.round(tasks.filter((task) => task.done).length / tasks.length * 100) : 0, [tasks]);
  const currentLocation = locationData[location];
  const allRequests = useMemo(() => [...communityRequests, ...demoRequests], [communityRequests]);
  const operatorCategories = currentLocation.services.map((service) => service.name);
  const visibleRequests = allRequests.filter((request) => {
    if (accountType === "private") return request.ownerId === "me";
    if (accountType === "operator") return request.location === location && request.status === "Aperta" && operatorCategories.some((category) => categoryMatches(request.category, category));
    return request.location === location;
  });
  const visibleOperators = useMemo(() => operators.filter((operator) => operator.locations.includes(location) && (!operatorCategory || operator.category === operatorCategory)), [location, operatorCategory]);
  const operatorCount = (category: string) => operators.filter((operator) => operator.locations.includes(location) && operator.category === category).length;

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

  const submitForm = () => {
    if (!form.title.trim() || !formMode) return;
    if (formMode === "task") {
      setTasks((items) => [...items, { id: Date.now(), title: form.title.trim(), boat: form.details.trim() || "La mia imbarcazione", due: "Da programmare", priority: "Media", done: false }]);
    }
    if (formMode === "purchase") {
      setPurchases((items) => [...items, { id: Date.now(), title: form.title.trim(), detail: form.details.trim() || "Da cercare", price: "-", done: false }]);
    }
    if (formMode === "request") {
      setCommunityRequests((items) => [{ id: Date.now(), ownerId: "me", title: form.title.trim(), details: form.details.trim() || `${location} - Dettagli da concordare`, category: form.category, location, created: "Adesso", status: "Aperta" }, ...items]);
      notify(`Richiesta inviata agli operatori compatibili a ${location}`);
    }
    setFormMode(null);
  };

  const openForm = (mode: "task" | "purchase" | "request") => {
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
    const firstUsefulLine = text.split("\n").map((line) => line.replace(/^[-*#\s]+/, "").replace(/\*\*/g, "").trim()).find((line) => line.length > 8) ?? "Mansione suggerita da Yacht Master";
    return firstUsefulLine.length > 68 ? `${firstUsefulLine.slice(0, 65)}...` : firstUsefulLine;
  };

  const addMessageToAgenda = (message: Message) => {
    const title = taskTitleFromMessage(message.text);
    setTasks((items) => [...items, { id: Date.now(), title, boat: "Suggerita da Yacht Master", due: "Da programmare", priority: "Media", done: false }]);
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

  const acceptRequest = (id: number) => {
    setCommunityRequests((items) => items.map((item) => item.id === id ? { ...item, status: "Presa in carico", acceptedBy: `Operatore demo ${location}` } : item));
    notify("Intervento accettato: il richiedente ricevera una notifica");
  };

  const sendChat = async (preset?: string) => {
    const text = (preset ?? chatText).trim();
    if (!text) return;
    setMessages((items) => [...items, { id: Date.now(), role: "user", text }]);
    setChatText("");
    setChatLoading(true);
    setChatStatus("Sto ragionando...");
    try {
      const data = await postChat({ message: `Localita attuale: ${location}. ${text}` });
      setMessages((items) => [...items, { id: Date.now() + 1, role: "assistant", text: data.reply ?? "Non ho trovato una risposta utile.", sources: data.sources }]);
    } catch (error) {
      const text = error instanceof Error && error.name === "AbortError" ? "La risposta sta impiegando troppo tempo. Riprova con una domanda piu breve." : error instanceof Error ? error.message : "Non riesco a collegarmi al servizio.";
      setMessages((items) => [...items, { id: Date.now() + 1, role: "assistant", text }]);
    } finally {
      setChatLoading(false);
      setChatStatus("");
    }
  };

  const installApp = async () => {
    if (window.confirm("Vuoi scaricare Yacht Master per Android?")) window.location.href = "/downloads/Yacht-Master-Android.apk";
  };

  return (
    <main className={`app-shell tab-${tab}`}>
      <header className="topbar">
        <button className="brand" onClick={() => goTo("home")} aria-label="Torna alla home">
          <span className="brand-mark">M</span><span>MetaYachting <b>AI</b></span>
        </button>
        <div className="top-actions">
          <div className="location-wrap">
            <span className="location-dot" />
            <select className="location-select" value={location} onChange={(event) => chooseLocation(event.target.value as LocationKey)} aria-label="Localita">
              {(Object.keys(locationData) as LocationKey[]).map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </div>
          <button className="download-app" onClick={installApp}>Scarica app</button>
          <button className={`plan-badge ${plan.toLowerCase()}`} onClick={() => goTo("profile")}>{plan}</button>
          <button className="avatar" aria-label="Profilo" onClick={() => goTo("profile")}>SC</button>
        </div>
      </header>

      <nav className="section-tabs" aria-label="Sezioni dell'app">
        <button className={tab === "home" ? "active" : ""} onClick={() => goTo("home")}>Home</button>
        <button className={tab === "agenda" ? "active" : ""} onClick={() => goTo("agenda")}>Agenda</button>
        <button className={tab === "scan" ? "active" : ""} onClick={() => goTo("scan")}>Scansiona</button>
        <button className={tab === "community" ? "active" : ""} onClick={() => goTo("community")}>Interventi</button>
        <button className={tab === "profile" ? "active" : ""} onClick={() => goTo("profile")}>Profilo e piani</button>
      </nav>

      <section className="hero" data-section="home">
        <div>
          <span className="eyebrow">BUONGIORNO, SIMON</span>
          <h1>Cosa serve oggi<br />alla tua barca?</h1>
          <p>Identifica, trova e organizza. Yacht Master ti accompagna dalla diagnosi al lavoro completato nella zona di {location}.</p>
          <button className="hero-download" onClick={installApp}>Scarica APK Android</button>
        </div>
        <div className="weather"><span>*</span><strong>{currentLocation.weather}</strong><small>{location} - {currentLocation.sea}</small></div>
      </section>

      <section className="quick-grid" data-section="home" aria-label="Azioni rapide">
        <button className="quick primary" onClick={() => fileRef.current?.click()}><span className="quick-icon">O</span><b>Scatta una foto</b><small>Identifica un componente</small><i>-&gt;</i></button>
        <input ref={fileRef} hidden type="file" accept="image/*" capture="environment" onChange={(event) => identifyPhoto(event.target.files?.[0])} />
        <button className="quick" onClick={() => setChat(true)}><span className="quick-icon">Q</span><b>Cerca un prodotto</b><small>Ricambi e accessori</small><i>-&gt;</i></button>
        <button className="quick" onClick={() => goTo("community")}><span className="quick-icon">P</span><b>Trova un professionista</b><small>Servizi a {location}</small><i>-&gt;</i></button>
      </section>

      <section className="scan-page" data-section="scan">
        <span className="eyebrow">RICONOSCIMENTO VISIVO</span>
        <h1>Fotografa il componente.</h1>
        <p>Inquadra bene marca, codice e collegamenti. Yacht Master analizzerà la foto e potrà cercare ricambi compatibili.</p>
        <button onClick={() => fileRef.current?.click()}><span>O</span> Apri la fotocamera</button>
        <small>Puoi anche scegliere una foto gia presente sul telefono.</small>
      </section>

      <section className="dashboard-grid" data-section="agenda">
        <article className="panel tasks-panel">
          <div className="panel-head"><div><span className="eyebrow">AGENDA DI BORDO</span><h2>Mansioni</h2></div><button className="text-button" onClick={() => openForm("task")}>+ Aggiungi</button></div>
          <div className="progress-row"><span>Avanzamento di oggi</span><b>{progress}%</b><div className="progress"><i style={{ width: `${progress}%` }} /></div></div>
          <div className="task-list">
            {!tasks.length && <div className="empty-state"><b>Nessuna mansione</b><span>Parti da zero e aggiungi il primo lavoro da svolgere.</span><button onClick={() => openForm("task")}>Aggiungi mansione</button></div>}
            {tasks.map((task) => <label className={`task ${task.done ? "done" : ""}`} key={task.id}><input type="checkbox" checked={task.done} onChange={() => setTasks((items) => items.map((item) => item.id === task.id ? { ...item, done: !item.done } : item))} /><span className="check">OK</span><span className="task-copy"><b>{task.title}</b><small>{task.boat}</small></span><span className={`priority ${task.priority.toLowerCase()}`}>{task.done ? "Completata" : task.due}</span></label>)}
          </div>
          <button className="full-link" onClick={() => notify("Agenda completa in arrivo")}>Vedi tutte le mansioni <span>-&gt;</span></button>
        </article>

        {(accountType === "private" || accountType === "company" || accountType === "owner") && <article className="panel shopping-panel">
          <div className="panel-head"><div><span className="eyebrow">LISTA ACQUISTI</span><h2>Prodotti da ordinare</h2></div><span className="count">{purchases.filter((item) => !item.done).length}</span></div>
          {!purchases.length && <div className="empty-state"><b>Lista acquisti vuota</b><span>Aggiungi il primo prodotto o chiedi alla chat di cercarlo.</span><button onClick={() => openForm("purchase")}>Aggiungi prodotto</button></div>}
          {purchases.map((item) => <label className={`purchase ${item.done ? "done" : ""}`} key={item.id}><input type="checkbox" checked={item.done} onChange={() => setPurchases((items) => items.map((product) => product.id === item.id ? { ...product, done: !product.done } : product))} /><span className="product-img">R</span><span><b>{item.title}</b><small>{item.detail}</small></span><strong>{item.price}</strong></label>)}
          <button className="buy-button" onClick={() => notify("Confronto prezzi avviato sui portali nautici")}>Confronta prezzi e disponibilita</button>
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
          <h2>{location} Yachting Community</h2>
          <p>{accountType === "private" ? "Accesso privato: puoi pubblicare richieste e vedere solo le tue." : accountType === "operator" ? "Accesso operatore: vedi richieste aperte compatibili con zona e mansione." : accountType === "company" ? "Accesso ditta associata: lavorazioni, ordini e commesse della zona." : "Accesso titolare: tutte le sezioni sono disponibili separatamente."}</p>
          <div className="community-access">
            <button className={accountType === "private" ? "active" : ""} onClick={() => setAccountType("private")}><b>Privato</b><span>solo le mie richieste</span></button>
            <button className={accountType === "operator" ? "active" : ""} onClick={() => setAccountType("operator")}><b>Operatore</b><span>lavori compatibili</span></button>
            <button className={accountType === "company" ? "active" : ""} onClick={() => setAccountType("company")}><b>Ditta associata</b><span>richieste di zona</span></button>
            <button className={accountType === "owner" ? "active" : ""} onClick={() => setAccountType("owner")}><b>Titolare</b><span>accesso completo</span></button>
          </div>
          <button className="publish-job" onClick={() => openForm("request")}>+ Pubblica una richiesta</button>
          <div className={`community-feed ${accountType === "private" ? "" : "pro-feed"}`}>
            {!visibleRequests.length && <div className="community-empty">{accountType === "private" ? `Non hai ancora pubblicato richieste a ${location}.` : `Nessuna richiesta visibile per questo accesso a ${location}.`}</div>}
            {visibleRequests.slice(0, accountType === "private" ? 6 : 10).map((request) => <article key={request.id}><span>{request.status} - {request.created} - {request.category}</span><b>{request.title}</b><p>{request.details}</p>{request.acceptedBy && <em>OK {request.acceptedBy} e disponibile</em>}{accountType !== "private" && request.status === "Aperta" && <button onClick={() => acceptRequest(request.id)}>Prendi in carico</button>}</article>)}
          </div>
        </div>
        <div className="operator-area">
          <div className="service-grid">{currentLocation.services.map((service) => { const count = operatorCount(service.name); return <button className={operatorCategory === service.name ? "active" : ""} key={service.name} onClick={() => openOperators(service.name)}><i>{service.icon}</i><span><b>{service.name}</b><small>{count === 1 ? "1 operatore" : `${count} operatori`}</small></span><em>&gt;</em></button>; })}</div>
          <div className="operator-panel">
            <div className="operator-head"><div><span className="eyebrow light">OPERATORI DISPONIBILI</span><h3>{operatorCategory ?? `Tutti a ${location}`}</h3></div><div className="operator-head-actions">{operatorCategory && <button onClick={() => { setOperatorCategory(null); setWebResult(null); }}>Tutti</button>}<button onClick={verifyOperatorsOnWeb} disabled={webLoading}>{webLoading ? "Verifico..." : "Verifica sul web"}</button></div></div>
            {webResult && <div className="web-result"><RichText text={webResult.reply} />{webResult.sources?.length ? <div className="source-list"><span>Fonti web</span>{webResult.sources.map((source, index) => <a key={source.url} href={source.url} target="_blank" rel="noreferrer">{index + 1}. {source.title}</a>)}</div> : null}</div>}
            <div className="operator-list">
              {!visibleOperators.length && <div className="community-empty">Nessun operatore demo in questa categoria. Pubblica una richiesta e verra mostrata agli iscritti compatibili.</div>}
              {visibleOperators.map((operator) => <article className={`operator-card ${selectedOperator?.id === operator.id ? "selected" : ""}`} key={operator.id} onClick={() => setSelectedOperator(operator)}>
                <div className="operator-title"><b>{operator.name}</b>{operator.premium && <span>Premium</span>}</div>
                <p>{operator.note}</p>
                <div className="operator-meta"><span>{operator.category}</span><span>{operator.distance}</span><span>{operator.rating}/5</span></div>
                <div className="operator-tags">{operator.tags.map((tag) => <small key={tag}>{tag}</small>)}</div>
                <div className="operator-actions"><em>{operator.response}</em><button onClick={(event) => { event.stopPropagation(); requestOperator(operator); }}>Richiedi intervento</button></div>
              </article>)}
            </div>
          </div>
        </div>
      </section>

      {(accountType === "company" || accountType === "owner") && <section className="yard-strip">
        <div><span className="eyebrow">MODALITA CANTIERE</span><h2>Ogni commessa sotto controllo.</h2><p>Imbarcazioni, squadre, attivita, materiali e avanzamento in un unico spazio condiviso.</p></div>
        <button onClick={() => setYardOpen(true)}>Apri area cantieri</button>
      </section>}

      <section className="plans" data-section="profile" id="plans">
        <div className="plans-intro"><span className="eyebrow">PIANI METAYACHTING AI</span><h2>Scegli quanto supporto vuoi a bordo.</h2><p>Le funzioni quotidiane restano accessibili a tutti. Premium aggiunge intelligenza, collaborazione e priorita.</p></div>
        <div className={`plan-card ${plan === "Standard" ? "selected" : ""}`}><span>STANDARD</span><h3>Per iniziare</h3><strong>Gratis</strong><ul><li>Agenda e lista acquisti</li><li>3 identificazioni AI al mese</li><li>Ricerca servizi nella zona scelta</li><li>1 imbarcazione</li></ul><button onClick={() => { setPlan("Standard"); notify("Piano Standard selezionato"); }}>{plan === "Standard" ? "Piano attuale" : "Scegli Standard"}</button></div>
        <div className={`plan-card premium-card ${plan === "Premium" ? "selected" : ""}`}><span>PREMIUM</span><h3>Per chi vive il mare</h3><strong>EUR 14,90 <small>/ mese</small></strong><ul><li>Identificazioni AI illimitate</li><li>Confronto prezzi avanzato</li><li>Piu imbarcazioni e collaboratori</li><li>Assistenza e richieste prioritarie</li><li>Storico manutenzioni completo</li></ul><button onClick={() => { setPlan("Premium"); notify("Premium attivato in modalita demo"); }}>{plan === "Premium" ? "Premium attivo" : "Prova Premium"}</button></div>
      </section>

      <nav className="bottom-nav" aria-label="Navigazione principale">
        {([["home", "H", "Home"], ["agenda", "OK", "Agenda"], ["scan", "O", "Scansiona"], ["community", "P", "Zona"], ["profile", "SC", "Profilo"]] as [Tab, string, string][]).map(([id, icon, label]) => <button key={id} className={tab === id ? "active" : ""} onClick={() => goTo(id)}><i>{icon}</i><span>{label}</span></button>)}
      </nav>

      <button className="chat-fab" onClick={() => setChat(!chat)} aria-label="Apri assistente">AI</button>
      {chat && <aside className="chat chat-live"><button onClick={() => setChat(false)}>x</button><span>YACHT MASTER - ONLINE</span><h3>Assistente nautico</h3><div ref={messageListRef} className="message-list">{messages.map((message) => <div key={message.id} className={`message ${message.role}`}>{message.image && <img className="message-image" src={message.image} alt="Foto caricata" />}<RichText text={message.text} />{message.role === "assistant" && message.id !== 1 && <button className="message-action" onClick={() => addMessageToAgenda(message)}>+ Aggiungi in agenda</button>}{message.sources?.length ? <div className="source-list"><span>Fonti consultate</span>{message.sources.map((source, i) => <a key={source.url} href={source.url} target="_blank" rel="noreferrer">{i + 1}. {source.title}</a>)}</div> : null}</div>)}{chatLoading && <div className="message assistant"><span className="thinking-dot" /> {chatStatus || "Sto lavorando..."}</div>}</div><div className="suggestions"><button disabled={chatLoading} onClick={() => sendChat("Devo trovare una girante")}>Trova una girante</button><button disabled={chatLoading} onClick={() => sendChat(`Cerco un elettricista nautico a ${location}`)}>Elettricista in zona</button><button disabled={chatLoading} onClick={() => fileRef.current?.click()}>+ Allega foto</button></div><form className="chat-input" onSubmit={(event) => { event.preventDefault(); sendChat(); }}><input disabled={chatLoading} value={chatText} onChange={(event) => setChatText(event.target.value)} placeholder="Scrivi un messaggio..." aria-label="Messaggio" /><button disabled={chatLoading} type="submit">^</button></form><small className="ai-note">Verifica sempre le indicazioni tecniche critiche con un professionista qualificato.</small></aside>}
      {toast && <div className="toast">OK {toast}</div>}

      {yardOpen && <div className="modal-backdrop" onClick={() => setYardOpen(false)}><section className="yard-modal" onClick={(event) => event.stopPropagation()}><button className="modal-close" onClick={() => setYardOpen(false)}>x</button><span className="eyebrow">METAYACHTING AI CANTIERI</span><h2>Commesse attive</h2><div className="job"><div><b>M/Y Aurora</b><small>Refit sala macchine - Consegna 18 agosto</small></div><strong>68%</strong><i><em style={{ width: "68%" }} /></i></div><div className="job"><div><b>S/Y Levante</b><small>Carena e antivegetativa - Consegna 22 agosto</small></div><strong>35%</strong><i><em style={{ width: "35%" }} /></i></div><div className="job-stats"><span><b>7</b><small>Mansioni aperte</small></span><span><b>3</b><small>Tecnici assegnati</small></span><span><b>2</b><small>Ordini in attesa</small></span></div><button className="new-job" onClick={() => notify("Nuova commessa pronta per essere creata")}>+ Nuova commessa</button></section></div>}

      {formMode && <div className="modal-backdrop" onClick={() => setFormMode(null)}><form className="entry-modal" onClick={(event) => event.stopPropagation()} onSubmit={(event) => { event.preventDefault(); submitForm(); }}><button type="button" className="modal-close" onClick={() => setFormMode(null)}>x</button><span className="eyebrow">{formMode === "request" ? "NUOVA RICHIESTA" : formMode === "task" ? "AGENDA DI BORDO" : "LISTA ACQUISTI"}</span><h2>{formMode === "request" ? `Richiedi un intervento a ${location}` : formMode === "task" ? "Aggiungi una mansione" : "Aggiungi un prodotto"}</h2><label><span>{formMode === "request" ? "Intervento richiesto" : formMode === "task" ? "Mansione" : "Prodotto"}</span><input autoFocus value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder={formMode === "request" ? "Es. Controllo caricabatterie" : "Inserisci un titolo"} required /></label>{formMode === "request" && <label><span>Categoria</span><select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}><option>Meccanica</option><option>Elettrica</option><option>Elettronica</option><option>Refit</option><option>Pulizia</option><option>Altro</option></select></label>}<label><span>{formMode === "request" ? "Barca, marina e urgenza" : "Dettagli facoltativi"}</span><textarea value={form.details} onChange={(event) => setForm({ ...form, details: event.target.value })} placeholder={formMode === "request" ? `Es. Marina di ${location}, M/Y 15 m, entro domani` : "Aggiungi informazioni"} /></label><button className="entry-submit" type="submit">{formMode === "request" ? "Pubblica richiesta" : "Salva"}</button></form></div>}
    </main>
  );
}
