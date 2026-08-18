"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Tab = "home" | "agenda" | "scan" | "shop" | "community" | "profile";
type LocationKey = "Olbia" | "Porto Cervo" | "Porto Rotondo" | "Cagliari" | "Alghero";
type AccountType = "private" | "operator" | "company" | "owner";
type Task = { id: number; title: string; boat: string; due: string; priority: "Alta" | "Media" | "Bassa"; done: boolean };
type Purchase = { id: number; title: string; detail: string; price: string; done: boolean };
type SupplyOrder = { id: number; title: string; detail: string; done: boolean };
type YardJob = { id: number; title: string; detail: string; done: boolean };
type Message = { id: number; role: "user" | "assistant"; text: string; image?: string; sources?: { title: string; url: string }[] };
type WebResult = { reply: string; sources?: { title: string; url: string }[] };
type CommunityRequest = { id: number; ownerId: string; title: string; details: string; category: string; location: LocationKey; created: string; status: "Aperta" | "Presa in carico" | "Chiusa"; acceptedBy?: string };
type Operator = { id: number; name: string; category: string; locations: LocationKey[]; distance?: string; rating?: string; response?: string; premium?: boolean; tags: string[]; note: string; phone?: string; email?: string; website?: string; telegram?: string; verified?: boolean; ownerUserId?: string };
type ServiceCategory = { name: string; icon: string };
type Language = "it" | "en" | "fr" | "es" | "de";
type DirectoryProvider = { id: string; name: string; category: string; locations: LocationKey[]; services: string[]; note: string; website: string; email?: string; whatsapp?: string; phone?: string };
type InboxStatus = "Nuova" | "Assegnata" | "In lavorazione" | "Chiusa";
type InboxActivity = { id: string; time: string; text: string };
type WhatsappInboxItem = {
  id: string;
  client: string;
  channel: string;
  preview: string;
  time: string;
  priority: "Alta" | "Media" | "Bassa";
  status: InboxStatus;
  category: string;
  boat: string;
  location: string;
  issue: string;
  missing: string[];
  suggestedOperator: string;
};
type RequestLauncher = {
  title: string;
  category: string;
  details: string;
  targetName: string;
  chatPrompt: string;
  email?: string;
  whatsapp?: string;
};

const BRAND_NAME = "Olbia Yachting Community";
const ASSISTANT_NAME = "Yachting Community Assistant";
const REQUEST_ASSISTANT_NAME = "Yachting Community Assistant";
const requestSteps = [
  { id: "01", title: "Raccogli la richiesta", note: "Nome, mezzo, zona, urgenza e foto in un solo passaggio." },
  { id: "02", title: "Ordina il problema", note: "Categoria lavoro, priorita e domande utili prima del preventivo." },
  { id: "03", title: "Inviala bene", note: "Messaggio pronto da mandare a tecnico, cantiere o cliente." },
];

const requestDemoCases = [
  { title: "Ringhiera inox da saldare", note: "Barca a motore, intervento su misura in banchina.", category: "Inox e carpenteria" },
  { title: "Ricambio nautico urgente", note: "Codice da identificare e alternativa disponibile da trovare.", category: "Ricambi" },
  { title: "Pulizia barca per domani", note: "Richiesta rapida con foto, orario e porto.", category: "Pulizia e detailing" },
  { title: "Guasto elettrico al salpa ancora", note: "Urgenza, diagnosi iniziale e tecnico da coinvolgere.", category: "Elettrica nautica" },
  { title: "Controllo prima dell'uscita", note: "Manutenzione veloce con check prioritari.", category: "Manutenzione" },
];

const whatsappDemoMessages = [
  { id: "m1", sender: "Cliente", time: "09:14", tone: "customer" as const, text: "Ciao, ho il salpa ancora bloccato sul Bavaria 46. Sono a Olbia, zona Molo Brin. Mi servirebbe qualcuno oggi se possibile." },
  { id: "m2", sender: ASSISTANT_NAME, time: "09:15", tone: "assistant" as const, text: "Ricevuto. La richiesta viene ordinata con priorita, categoria tecnica e dati mancanti prima dell'invio." },
];

const whatsappStructuredFields = [
  { label: "Categoria", value: "Elettrica / coperta" },
  { label: "Priorita", value: "Alta" },
  { label: "Zona", value: "Olbia - Molo Brin" },
  { label: "Imbarcazione", value: "Bavaria 46" },
  { label: "Problema", value: "Salpa ancora bloccato" },
  { label: "Dati da chiedere", value: "Foto, banchina, segni di alimentazione" },
];

const whatsappActionSteps = [
  "Assegna a tecnico elettrico nautico",
  "Invia risposta pronta al cliente",
  "Crea intervento e salva in archivio",
];

const whatsappInboxItems: WhatsappInboxItem[] = [
  {
    id: "thread-salpa-ancora",
    client: "Marco R.",
    channel: "WhatsApp Business",
    preview: "Salpa ancora bloccato, Bavaria 46, Olbia, mi serve oggi.",
    time: "09:14",
    priority: "Alta",
    status: "Nuova",
    category: "Elettrica / coperta",
    boat: "Bavaria 46",
    location: "Olbia - Molo Brin",
    issue: "Salpa ancora bloccato in banchina",
    missing: ["Foto del verricello", "Numero banchina", "Segni di alimentazione"],
    suggestedOperator: "Costa Smeralda Electric",
  },
  {
    id: "thread-pulizia-teak",
    client: "Captain Elena",
    channel: "WhatsApp Business",
    preview: "Serve pulizia teak e lavaggio ponte entro domani a Porto Cervo.",
    time: "10:02",
    priority: "Media",
    status: "Assegnata",
    category: "Pulizia e detailing",
    boat: "Yacht 21 m",
    location: "Porto Cervo",
    issue: "Preparazione barca prima arrivo ospiti",
    missing: ["Orario preferito", "Foto teak", "Accesso acqua in banchina"],
    suggestedOperator: "Blue Detail Porto Cervo",
  },
  {
    id: "thread-ricambio-pompa",
    client: "Gianni P.",
    channel: "WhatsApp Business",
    preview: "Mi serve un ricambio per pompa di sentina, ho foto e codice parziale.",
    time: "11:27",
    priority: "Media",
    status: "In lavorazione",
    category: "Ricambi nautici",
    boat: "Saver 690",
    location: "Olbia",
    issue: "Ricerca ricambio compatibile con urgenza moderata",
    missing: ["Tensione 12/24 V", "Diametro raccordi", "Foto etichetta"],
    suggestedOperator: "Sardinia Nautic Parts",
  },
];

const inboxStatusOrder: InboxStatus[] = ["Nuova", "Assegnata", "In lavorazione", "Chiusa"];
const initialWhatsappActivityLog: Record<string, InboxActivity[]> = {
  "thread-salpa-ancora": [
    { id: "a-1", time: "09:14", text: "Messaggio ricevuto da WhatsApp Business." },
    { id: "a-2", time: "09:15", text: "Richiesta classificata come elettrica / coperta con priorità alta." },
  ],
  "thread-pulizia-teak": [
    { id: "a-3", time: "10:02", text: "Richiesta ricevuta e ordinata." },
    { id: "a-4", time: "10:10", text: "Assegnata a Blue Detail Porto Cervo." },
  ],
  "thread-ricambio-pompa": [
    { id: "a-5", time: "11:27", text: "Cliente inviato codice parziale e foto iniziale." },
    { id: "a-6", time: "11:34", text: "Aperta ricerca ricambio compatibile con fornitore locale." },
  ],
};

const shopCategories = [
  { id: "safety", symbol: "✦", tone: "safety", name: "Sicurezza e dotazioni", note: "Giubbotti, salvagenti, estintori, segnali e dotazioni per l'equipaggio", source: "SVB", providers: ["SVB", "TREM", "FNI", "Motomarine"], badge: "Sicurezza" },
  { id: "pumps", symbol: "≈", tone: "water", name: "Pompe e impianti acqua", note: "Pompe di sentina, autoclavi, giranti, raccordi e accessori idraulici", source: "Osculati", providers: ["Osculati", "TREM", "SVB"], badge: "Impianti" },
  { id: "mooring", symbol: "⚓", tone: "mooring", name: "Ormeggio e ancoraggio", note: "Ancore, catene, cime, parabordi, boe, bitte e accessori da banchina", source: "Osculati", providers: ["Osculati", "TREM", "Motomarine", "Marine Hardware"], badge: "Essenziale" },
  { id: "electrical", symbol: "ϟ", tone: "electrical", name: "Elettrica, luci ed energia", note: "Batterie, caricabatterie, quadri, fanali, cavi, fusibili e inverter", source: "Motomarine", providers: ["Motomarine", "FNI", "Osculati", "SVB"], badge: "12 / 24 V" },
  { id: "deck", symbol: "◇", tone: "deck", name: "Ferramenta e coperta", note: "Chiusure, maniglie, cerniere, oblò, passacavi e accessori di design", source: "Foresti & Suardi", providers: ["Foresti & Suardi", "Marine Hardware", "Motomarine", "TREM"], badge: "Coperta" },
  { id: "engines", symbol: "⚙", tone: "engine", name: "Ricambi motore", note: "Anodi, filtri, giranti, eliche, serbatoi e componenti per la manutenzione", source: "SVB", providers: ["SVB", "Marine Hardware", "Motomarine", "FNI"], badge: "Officina" },
  { id: "instruments", symbol: "⌖", tone: "electronics", name: "Strumentazione ed elettronica", note: "GPS, radar, VHF, sensori, bussole, antenne e sistemi strumenti", source: "SVB", providers: ["SVB", "Marine Hardware", "Motomarine", "FNI"], badge: "Navigazione" },
  { id: "antifouling", symbol: "◒", tone: "care", name: "Cura barca e carena", note: "Antivegetative, detergenti, lucidanti, sigillanti, vernici e utensili", source: "SVB", providers: ["SVB", "Marine Hardware", "TREM", "Motomarine"], badge: "Manutenzione" },
  { id: "comfort", symbol: "⌂", tone: "comfort", name: "Comfort e servizi di bordo", note: "WC nautici, cucina, frigoriferi, rubinetteria, stoviglie e arredo", source: "TREM", providers: ["TREM", "SVB", "Motomarine"], badge: "A bordo" },
  { id: "tender", symbol: "➤", tone: "tender", name: "Tender e tempo libero", note: "Tender, gonfiatori, accessori per battelli, alaggio e sport acquatici", source: "TREM", providers: ["TREM", "Motomarine", "Osculati"], badge: "Tempo libero" },
];

const shopSuppliers = [
  { id: "vendor-motomarine", name: "Motomarine", note: "Catalogo generalista" },
  { id: "vendor-fni", name: "FNI", note: "Forniture Nautiche Italiane" },
  { id: "vendor-trem", name: "TREM", note: "Catalogo nautica" },
  { id: "vendor-osculati", name: "Osculati", note: "Accessori nautici" },
  { id: "vendor-foresti", name: "Foresti & Suardi", note: "Ferramenta e design" },
  { id: "vendor-svb", name: "SVB", note: "Catalogo europeo" },
  { id: "vendor-marine-hardware", name: "Marine Hardware", note: "Oltre 20.000 articoli nautici" },
];

const normalizeTelegramLink = (value: string) => {
  const cleaned = value.trim().replace(/^@/, "").replace(/^https?:\/\/(?:t\.me|telegram\.me)\//i, "").replace(/^t\.me\//i, "").replace(/^telegram\.me\//i, "").replace(/^\/+/, "");
  return cleaned ? `https://t.me/${cleaned}` : "";
};

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

const publicDirectoryProviders: DirectoryProvider[] = [
  { id: "cantieri-olbia", name: "Cantieri di Olbia", category: "Cantieri & refit", locations: ["Olbia"], services: ["Refit", "Assistenza tecnica", "Motori", "Alaggio"], note: "Cantiere aperto tutto l'anno con riparazione, manutenzione, allestimento e trasformazione yacht.", website: "https://www.cantieridiolbia.com/", email: "info@cantieridiolbia.com", phone: "+39 0789 58645" },
  { id: "isola-bianca", name: "Cantiere Navale Isola Bianca", category: "Cantieri & refit", locations: ["Olbia"], services: ["Rimessaggio", "Refitting", "Restyling", "Service H24"], note: "Cantiere di Olbia per barche a motore e a vela, con rimessaggio, riparazione e refit.", website: "https://www.isolabianca.it/", email: "info@isolabianca.it", whatsapp: "393499850537", phone: "+39 0789 21018" },
  { id: "nautica-acqua", name: "Nautica Acqua", category: "Cantieri & refit", locations: ["Olbia"], services: ["Refitting", "Motoristica", "Falegnameria", "Vetroresina"], note: "Cantiere a Cala Saccaia con officina, verniciatura, falegnameria e lavorazioni in vetroresina.", website: "https://www.nauticaacqua.it/", email: "info@nauticaacqua.it" },
  { id: "cs-nautica", name: "C.S. Nautica", category: "Cantieri & refit", locations: ["Olbia"], services: ["Rimessaggio", "Assistenza", "Refitting", "Carenaggio"], note: "Cantiere nautico di Olbia con manutenzione, assistenza, rimessaggio e allestimenti.", website: "https://csnautica.it/", email: "info@csnautica.it", phone: "+39 349 5755394" },
  { id: "olbia-yacht-service", name: "Olbia Yacht Service", category: "Cantieri & refit", locations: ["Olbia"], services: ["Rimessaggio", "Assistenza yacht", "Cala Saccaia"], note: "Servizi e assistenza per imbarcazioni con sede operativa a Cala Saccaia, Olbia.", website: "https://www.olbiayachtservice.it/", email: "info@olbiayachtservice.it", phone: "+39 0789 599266" },
  { id: "porto-rotondo-yachting", name: "Porto Rotondo Yachting", category: "Cantieri & refit", locations: ["Olbia", "Porto Rotondo"], services: ["Rimessaggio", "Assistenza", "Cantiere", "Barche fino a 50 piedi"], note: "Cantiere a Cala Saccaia con area coperta, piazzale e assistenza nei porti della zona.", website: "https://www.portorotondoyachting.com/sito/it/cantiere-nautico", email: "info@portorotondoyachting.com", phone: "+39 0789 34258" },
  { id: "marina-porto-rotondo", name: "Marina di Porto Rotondo", category: "Ormeggi e marina", locations: ["Porto Rotondo"], services: ["Posti barca", "Mega yacht", "Servizi marina", "Ormeggio"], note: "Marina turistica di Porto Rotondo con posti barca e servizi per vela, motore e mega yacht.", website: "https://www.marinadiportorotondo.it/" },
  { id: "ds-service", name: "DS Service", category: "Elettrica nautica", locations: ["Olbia"], services: ["Impianti elettrici", "Elettronica", "220/380 V", "Diagnostica"], note: "Impianti elettrici ed elettronici di bordo, illuminazione, ricarica, inverter e assistenza tecnica.", website: "https://www.ds-service.net/", phone: "+39 352 0860729" },
  { id: "elmec-nautica", name: "Elmec Nautica", category: "Elettronica", locations: ["Olbia"], services: ["GPS e radar", "Autopiloti", "VHF", "Reti di bordo"], note: "Fornitura, installazione, configurazione e assistenza per apparecchiature elettroniche navali.", website: "https://www.elmecnautica.com/", email: "elmecnautica@gmail.com", phone: "+39 329 6358037" },
  { id: "nautical-connect", name: "Nautical Connect", category: "Assistenza yacht", locations: ["Olbia", "Porto Cervo"], services: ["Supporto tecnico", "Ricambi", "Yacht management", "Charter"], note: "Servizi tecnici e operativi per yacht con sede a Olbia e attività in Costa Smeralda.", website: "https://www.nauticalconnect.com/", email: "info@nauticalconnect.com", phone: "+39 392 3332525" },
  { id: "ysa-yacht-service", name: "YSA Yacht Service", category: "Concierge yacht", locations: ["Porto Cervo"], services: ["Formalità", "Ormeggi", "Provisioning", "Riparazioni"], note: "Assistenza yacht a Porto Cervo per formalità, prenotazioni, forniture e coordinamento lavori.", website: "https://www.ysayachtservice.com/", email: "info@ysayachtservice.com", whatsapp: "393280230712", phone: "+39 328 0230712" },
  { id: "sea-world-services", name: "Sea World Services", category: "Concierge yacht", locations: ["Porto Cervo"], services: ["Yacht service", "Logistica", "Provisioning", "Assistenza"], note: "Servizi nautici e assistenza su misura per yacht, equipaggi e regate in Costa Smeralda.", website: "https://seaworldservices.com/it/sws-servizi-ita/", email: "sws@swsportocervo.com", phone: "+39 0789 91693" },
  { id: "sea-sardinia-services", name: "Sea Sardinia Services", category: "Concierge yacht", locations: ["Olbia", "Porto Cervo"], services: ["Provisioning", "Berth reservation", "Winter storage", "Emergenze"], note: "Provisioning, prenotazioni ormeggio, concierge e coordinamento dell'assistenza tecnica.", website: "https://www.seasardiniaservices.com/", email: "info@seasardiniaservice.com", phone: "+39 320 0588581" },
  { id: "yachting-group", name: "Yachting Group", category: "Cambusa e forniture", locations: ["Olbia"], services: ["Provisioning", "Cambusa", "Laundry", "Boat accessories"], note: "Servizi yacht e forniture con consegna a bordo dalla base di Portisco Marina.", website: "https://www.yachtinggroup.it/", email: "info@yachtingroup.com", whatsapp: "393510937765", phone: "+39 351 0937765" },
  { id: "chiara-service", name: "Chiara Service", category: "Pulizia e detailing", locations: ["Olbia", "Porto Cervo", "Porto Rotondo"], services: ["Lavanderia", "Teak", "Lucidatura", "Sanificazione"], note: "Pulizia e cura yacht, lavanderia con ritiro a bordo, teak, acciai e sanificazione interni.", website: "https://www.chiaraservice.it/servizi", email: "info@chiaraservice.it", phone: "+39 393 9149340" },
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

const directoryMatchesCategory = (provider: DirectoryProvider, category: string) => {
  const text = `${provider.category} ${provider.services.join(" ")} ${provider.note}`.toLowerCase();
  const selected = category.toLowerCase();
  if (selected.includes("cantieri") || selected.includes("refit")) return /cantier|refit|rimessaggio|restyling/.test(text);
  if (selected.includes("meccanica")) return /meccanic|motor|officina|riparazion/.test(text);
  if (selected.includes("elettrica")) return /elettric|elettronic|220\/380|batter/.test(text);
  if (selected.includes("elettronica")) return /elettronic|gps|radar|vhf|strument/.test(text);
  if (selected.includes("ricambi")) return /ricamb|fornitur|accessori/.test(text);
  if (selected.includes("concierge")) return /concierge|provisioning|yacht service|formalità/.test(text);
  if (selected.includes("pulizia")) return /pulizia|lavanderia|teak|sanific|lucidatura/.test(text);
  if (selected.includes("tender")) return /tender|charter|battell/.test(text);
  if (selected.includes("ormeggi") || selected.includes("marina")) return /ormeggi|marina|posti barca|berth/.test(text);
  if (selected.includes("cambusa") || selected.includes("forniture")) return /cambusa|provisioning|fornitur|food/.test(text);
  return categoryMatches(provider.category, category);
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
  const [orders, setOrders] = useState<SupplyOrder[]>([]);
  const [yardJobs, setYardJobs] = useState<YardJob[]>([]);
  const [tab, setTab] = useState<Tab>("home");
  const [chat, setChat] = useState(false);
  const [plan, setPlan] = useState<"Standard" | "Premium">("Standard");
  const [accountType, setAccountType] = useState<AccountType>("owner");
  const [location, setLocation] = useState<LocationKey>("Olbia");
  const [yardOpen, setYardOpen] = useState(false);
  const [chatText, setChatText] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatStatus, setChatStatus] = useState("");
  const [messages, setMessages] = useState<Message[]>([{ id: 1, role: "assistant", text: "Ciao, sono Yachting Community Assistant. Ordino richieste nautiche, preparo le domande giuste e trasformo WhatsApp confusi in schede chiare per tecnici, cantieri e clienti." }]);
  const [communityRequests, setCommunityRequests] = useState<CommunityRequest[]>([]);
  const [signedIn, setSignedIn] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [currentUserId, setCurrentUserId] = useState("");
  const [profileName, setProfileName] = useState("");
  const [telegramHandle, setTelegramHandle] = useState("");
  const [language, setLanguage] = useState<Language>("it");
  const [showDemoData, setShowDemoData] = useState(false);
  const [whatsappThreads, setWhatsappThreads] = useState<WhatsappInboxItem[]>(whatsappInboxItems);
  const [whatsappActivityLog, setWhatsappActivityLog] = useState<Record<string, InboxActivity[]>>(initialWhatsappActivityLog);
  const [inboxStatusFilter, setInboxStatusFilter] = useState<InboxStatus | "Tutte">("Tutte");
  const [selectedWhatsappThreadId, setSelectedWhatsappThreadId] = useState(whatsappInboxItems[0].id);
  const [formMode, setFormMode] = useState<"task" | "purchase" | "order" | "job" | "request" | null>(null);
  const [operatorEditorOpen, setOperatorEditorOpen] = useState(false);
  const [operatorCategory, setOperatorCategory] = useState<string | null>(null);
  const [selectedOperator, setSelectedOperator] = useState<Operator | null>(null);
  const [realOperators, setRealOperators] = useState<Operator[]>([]);
  const [myOperatorProfile, setMyOperatorProfile] = useState<Operator | null>(null);
  const [webLoading, setWebLoading] = useState(false);
  const [webResult, setWebResult] = useState<WebResult | null>(null);
  const [form, setForm] = useState({ title: "", category: "Meccanica", details: "" });
  const [operatorForm, setOperatorForm] = useState<{ name: string; category: string; locations: LocationKey[]; phone: string; email: string; website: string; telegram: string; note: string; tags: string }>({ name: "", category: "Meccanica marina", locations: [location], phone: "", email: "", website: "", telegram: "", note: "", tags: "" });
  const [requestLauncher, setRequestLauncher] = useState<RequestLauncher | null>(null);
  const [toast, setToast] = useState("");
  const [shopQuery, setShopQuery] = useState("");
  const [directoryQuery, setDirectoryQuery] = useState("");
  const [directoryRequest, setDirectoryRequest] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const savedLocation = localStorage.getItem("yachting-assistant-location") as LocationKey | null;
    const savedLanguage = localStorage.getItem("yachting-assistant-language") as Language | null;
    const savedPlan = localStorage.getItem("marinaio-plan") as "Standard" | "Premium" | null;
    const savedAccountType = localStorage.getItem("marinaio-account-type") as AccountType | null;
    const savedDemoMode = localStorage.getItem("barcaora-demo-mode");
    if (savedLocation && savedLocation in locationData) setLocation(savedLocation);
    if (savedLanguage && ["it", "en", "fr", "es", "de"].includes(savedLanguage)) setLanguage(savedLanguage);
    if (savedPlan === "Standard" || savedPlan === "Premium") setPlan(savedPlan);
    if (savedAccountType === "private" || savedAccountType === "operator" || savedAccountType === "company" || savedAccountType === "owner") setAccountType(savedAccountType);
    if (savedDemoMode === "true") setShowDemoData(true);
  }, []);

  useEffect(() => { localStorage.setItem("yachting-assistant-location", location); }, [location]);
  useEffect(() => { localStorage.setItem("marinaio-plan", plan); }, [plan]);
  useEffect(() => { localStorage.setItem("marinaio-account-type", accountType); }, [accountType]);
  useEffect(() => { localStorage.setItem("yachting-assistant-language", language); document.documentElement.lang = language; }, [language]);
  useEffect(() => { localStorage.setItem("barcaora-demo-mode", showDemoData ? "true" : "false"); }, [showDemoData]);

  useEffect(() => {
    const loadSavedRequests = async () => {
      try {
        const profileResponse = await fetch("/api/profile");
        if (!profileResponse.ok) return;
        const profileData = await profileResponse.json() as { profile?: { userId?: string; displayName?: string; telegram?: string; role?: AccountType } };
        setSignedIn(true);
        setCurrentUserId(profileData.profile?.userId ?? "");
        setProfileName(profileData.profile?.displayName ?? "Utente");
        setTelegramHandle(profileData.profile?.telegram ?? "");
        if (profileData.profile?.role) setAccountType(profileData.profile.role);
        const workspaceResponse = await fetch("/api/workspace");
        if (workspaceResponse.ok) {
          const workspaceData = await workspaceResponse.json() as { items?: Array<{ id: number; kind: "task" | "purchase" | "order" | "job"; title: string; details: string; done: boolean }> };
          const savedItems = workspaceData.items ?? [];
          setTasks(savedItems.filter((item) => item.kind === "task").map((item) => ({ id: item.id, title: item.title, boat: item.details || "La mia imbarcazione", due: "Da programmare", priority: "Media", done: item.done })));
          setPurchases(savedItems.filter((item) => item.kind === "purchase").map((item) => ({ id: item.id, title: item.title, detail: item.details || "Da cercare", price: "-", done: item.done })));
          setOrders(savedItems.filter((item) => item.kind === "order").map((item) => ({ id: item.id, title: item.title, detail: item.details || "Ordine da completare", done: item.done })));
          setYardJobs(savedItems.filter((item) => item.kind === "job").map((item) => ({ id: item.id, title: item.title, detail: item.details || "Commessa in lavorazione", done: item.done })));
        }
        const response = await fetch(`/api/requests?location=${encodeURIComponent(location)}`);
        if (!response.ok) return;
        const data = await response.json() as { requests?: Array<{ id: number; ownerId?: string; title: string; details: string; category: string; location: LocationKey; status: "open" | "accepted" | "closed"; acceptedBy?: string; created?: string }> };
        setCommunityRequests((data.requests ?? []).map((item) => ({
          id: item.id,
          ownerId: item.ownerId ?? currentUserId ?? "me",
          title: item.title,
          details: item.details,
          category: item.category,
          location: item.location,
          created: item.created ? new Date(item.created).toLocaleDateString("it-IT") : "Adesso",
          status: item.status === "accepted" ? "Presa in carico" : item.status === "closed" ? "Chiusa" : "Aperta",
          acceptedBy: item.acceptedBy,
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
  }, [currentUserId, location]);

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
  const archivedRequests = useMemo(() => allRequests.filter((request) => request.status === "Chiusa"), [allRequests]);
  const activeRequests = useMemo(() => allRequests.filter((request) => request.status !== "Chiusa"), [allRequests]);
  const visibleShopCategories = useMemo(() => {
    const query = shopQuery.trim().toLowerCase();
    return query ? shopCategories.filter((item) => `${item.name} ${item.note} ${item.badge} ${item.providers.join(" ")}`.toLowerCase().includes(query)) : shopCategories;
  }, [shopQuery]);
  const operatorCategories = currentLocation.services.map((service) => service.name);
  const visibleRequests = activeRequests.filter((request) => {
    if (accountType === "private") return !currentUserId || request.ownerId === currentUserId;
    if (accountType === "operator") return request.location === location && request.status === "Aperta" && operatorCategories.some((category) => categoryMatches(request.category, category));
    return request.location === location;
  });
  const visibleOperators = useMemo(() => showDemoData ? operators.filter((operator) => operator.locations.includes(location) && (!operatorCategory || operator.category === operatorCategory)) : realOperators.filter((operator) => operator.locations.includes(location) && (!operatorCategory || operator.category === operatorCategory)), [location, operatorCategory, showDemoData, realOperators]);
  const visibleDirectoryProviders = useMemo(() => {
    const query = directoryQuery.trim().toLowerCase();
    return publicDirectoryProviders.filter((provider) => provider.locations.includes(location) && (!operatorCategory || directoryMatchesCategory(provider, operatorCategory)) && (!query || `${provider.name} ${provider.category} ${provider.services.join(" ")} ${provider.note}`.toLowerCase().includes(query)));
  }, [directoryQuery, location, operatorCategory]);
  const filteredWhatsappThreads = useMemo(() => inboxStatusFilter === "Tutte" ? whatsappThreads : whatsappThreads.filter((item) => item.status === inboxStatusFilter), [inboxStatusFilter, whatsappThreads]);
  const selectedWhatsappThread = useMemo(() => filteredWhatsappThreads.find((item) => item.id === selectedWhatsappThreadId) ?? filteredWhatsappThreads[0] ?? whatsappThreads[0], [filteredWhatsappThreads, selectedWhatsappThreadId, whatsappThreads]);
  const whatsappStatusCounts = useMemo(() => ({
    Tutte: whatsappThreads.length,
    Nuova: whatsappThreads.filter((item) => item.status === "Nuova").length,
    Assegnata: whatsappThreads.filter((item) => item.status === "Assegnata").length,
    "In lavorazione": whatsappThreads.filter((item) => item.status === "In lavorazione").length,
    Chiusa: whatsappThreads.filter((item) => item.status === "Chiusa").length,
  }), [whatsappThreads]);
  const selectedWhatsappActivity = selectedWhatsappThread ? (whatsappActivityLog[selectedWhatsappThread.id] ?? []) : [];
  const archivedWhatsappThreads = useMemo(() => whatsappThreads.filter((item) => item.status === "Chiusa").slice().reverse(), [whatsappThreads]);
  const openTasksCount = useMemo(() => tasks.filter((task) => !task.done).length, [tasks]);
  const pendingOrdersCount = useMemo(() => orders.filter((order) => !order.done).length, [orders]);
  const activeJobsCount = useMemo(() => yardJobs.filter((job) => !job.done).length, [yardJobs]);
  const completedJobsCount = useMemo(() => yardJobs.filter((job) => job.done).length, [yardJobs]);
  const operatorCount = (category: string) => {
    const registered = showDemoData ? operators.filter((operator) => operator.locations.includes(location) && operator.category === category).length : realOperators.filter((operator) => operator.locations.includes(location) && operator.category === category).length;
    const directory = publicDirectoryProviders.filter((provider) => provider.locations.includes(location) && directoryMatchesCategory(provider, category)).length;
    return registered + directory;
  };

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

  const timeNowLabel = () => new Date().toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });

  const appendWhatsappActivity = (threadId: string, text: string) => {
    const entry: InboxActivity = { id: `${threadId}-${Date.now()}`, time: timeNowLabel(), text };
    setWhatsappActivityLog((current) => ({ ...current, [threadId]: [...(current[threadId] ?? []), entry] }));
  };

  const updateWhatsappThreadStatus = (threadId: string, nextStatus: InboxStatus) => {
    setWhatsappThreads((current) => current.map((item) => item.id === threadId ? { ...item, status: nextStatus } : item));
    appendWhatsappActivity(threadId, `Stato aggiornato a ${nextStatus}.`);
    notify(`Richiesta aggiornata: ${nextStatus}`);
  };

  const advanceWhatsappThread = (threadId: string) => {
    const current = whatsappThreads.find((item) => item.id === threadId);
    if (!current) return;
    const currentIndex = inboxStatusOrder.indexOf(current.status);
    const nextStatus = inboxStatusOrder[Math.min(currentIndex + 1, inboxStatusOrder.length - 1)];
    updateWhatsappThreadStatus(threadId, nextStatus);
  };

  const archiveWhatsappThread = (threadId: string) => {
    updateWhatsappThreadStatus(threadId, "Chiusa");
    appendWhatsappActivity(threadId, "Richiesta archiviata nello storico interventi.");
  };

  const createWhatsappIntervention = (threadId: string) => {
    const thread = whatsappThreads.find((item) => item.id === threadId);
    if (!thread) return;
    appendWhatsappActivity(threadId, `Intervento creato e pronto per agenda tecnica: ${thread.issue}.`);
    goTo("agenda");
    notify("Intervento creato in demo");
  };

  const saveWorkspaceItem = async (kind: "task" | "purchase" | "order" | "job", title: string, details: string) => {
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
    if (formMode === "order") {
      const item = await saveWorkspaceItem("order", form.title.trim(), form.details.trim() || "Ordine fornitore da completare");
      setOrders((items) => [...items, { id: item.id, title: item.title, detail: item.details, done: false }]);
    }
    if (formMode === "job") {
      const item = await saveWorkspaceItem("job", form.title.trim(), form.details.trim() || "Commessa aperta");
      setYardJobs((items) => [...items, { id: item.id, title: item.title, detail: item.details, done: false }]);
      setYardOpen(true);
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

  const openForm = (mode: "task" | "purchase" | "order" | "job" | "request") => {
    setForm({ title: "", category: "Meccanica", details: "" });
    setFormMode(mode);
  };

  const openRequestLauncher = (launcher: RequestLauncher) => {
    setRequestLauncher(launcher);
  };

  const buildDirectoryChatPrompt = (providerName: string) => `Aiutami a capire se ${providerName} è adatta per questa richiesta: ${directoryRequest.trim() || `servizio nella zona di ${location}`}.`;

  const buildRequestSubjectBody = (launcher: RequestLauncher) => {
    const reference = `OYC-${launcher.targetName.toUpperCase().replace(/[^A-Z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 16) || "REQUEST"}-${Date.now().toString(36).toUpperCase()}`;
    const subject = `Olbia Yachting Community Request · ${reference}`;
    const body = [
      "Buongiorno,",
      "",
      "invio questa richiesta tramite Olbia Yachting Community.",
      `Destinatario: ${launcher.targetName}`,
      `Zona: ${location}`,
      `Categoria: ${launcher.category}`,
      `Richiesta: ${launcher.details}`,
      `Riferimento: ${reference}`,
      "",
      "Attendo un vostro riscontro. Grazie.",
    ].join("\n");
    return { reference, subject, body };
  };

  const launchRequestEmail = (launcher: RequestLauncher) => {
    if (!launcher.email) return;
    const { reference, subject, body } = buildRequestSubjectBody(launcher);
    navigator.sendBeacon("/api/outreach", new Blob([JSON.stringify({ providerId: launcher.targetName, channel: "email", location, reference })], { type: "application/json" }));
    window.location.href = `mailto:${launcher.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setRequestLauncher(null);
  };

  const launchRequestWhatsapp = (launcher: RequestLauncher) => {
    if (!launcher.whatsapp) return;
    const { reference, subject, body } = buildRequestSubjectBody(launcher);
    navigator.sendBeacon("/api/outreach", new Blob([JSON.stringify({ providerId: launcher.targetName, channel: "whatsapp", location, reference })], { type: "application/json" }));
    window.location.href = `https://wa.me/${launcher.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(`${subject}\n\n${body}`)}`;
    setRequestLauncher(null);
  };

  const launchRequestChat = (launcher: RequestLauncher) => {
    setChatText(launcher.chatPrompt);
    setChat(true);
    setRequestLauncher(null);
  };

  const launchRequestForm = (launcher: RequestLauncher) => {
    setForm({ title: launcher.title, category: launcher.category, details: launcher.details });
    setFormMode("request");
    setRequestLauncher(null);
  };

  const openOperators = (category: string) => {
    setOperatorCategory(category);
    setSelectedOperator(null);
    setWebResult(null);
  };

  const requestOperator = (operator: Operator) => {
    setSelectedOperator(operator);
    const category = operator.category.includes("Elettrica") ? "Elettrica" : operator.category.includes("Elettronica") ? "Elettronica" : operator.category.includes("Refit") || operator.category.includes("Cantieri") ? "Refit" : "Meccanica";
    const details = `${operator.name} - ${location}. Descrivi qui il problema, barca e urgenza.`;
    openRequestLauncher({
      title: `Intervento ${operator.category}`,
      category,
      details,
      targetName: operator.name,
      chatPrompt: `Aiutami a preparare una richiesta per ${operator.name} a ${location}. Categoria: ${operator.category}. Problema:`,
      email: operator.email,
    });
  };

  const openProviderContact = (provider: DirectoryProvider, channel: "email" | "whatsapp") => {
    const reference = `OYC-${provider.id.toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
    const requestText = directoryRequest.trim() || "Descrivi qui il problema, l'imbarcazione e l'urgenza.";
    const subject = `Olbia Yachting Community Request · ${reference}`;
    const body = [
      "Buongiorno,",
      "",
      "invio questa richiesta tramite Olbia Yachting Community.",
      `Azienda: ${provider.name}`,
      `Zona: ${location}`,
      `Richiesta: ${requestText}`,
      `Riferimento: ${reference}`,
      "",
      "Attendo un vostro riscontro. Grazie.",
    ].join("\n");
    const event = JSON.stringify({ providerId: provider.id, channel, location, reference });
    navigator.sendBeacon("/api/outreach", new Blob([event], { type: "application/json" }));
    if (channel === "email" && provider.email) {
      window.location.href = `mailto:${provider.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      return;
    }
    if (channel === "whatsapp" && provider.whatsapp) {
      window.location.href = `https://wa.me/${provider.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(`${subject}\n\n${body}`)}`;
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
      const data = await response.json() as { acceptedBy?: string; error?: string; signIn?: string };
      if (!response.ok) {
        if (data.signIn) window.location.href = data.signIn;
        throw new Error(data.error ?? "Impossibile prendere in carico la richiesta");
      }
      setCommunityRequests((items) => items.map((item) => item.id === id ? { ...item, status: "Presa in carico", acceptedBy: data.acceptedBy ?? "Operatore" } : item));
      notify("Intervento preso in carico");
    } catch (error) {
      notify(error instanceof Error ? error.message : "Impossibile prendere in carico la richiesta");
    }
  };

  const closeRequest = async (id: number) => {
    try {
      const response = await fetch("/api/requests", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, action: "close" }) });
      const data = await response.json() as { acceptedBy?: string; error?: string; signIn?: string };
      if (!response.ok) {
        if (data.signIn) window.location.href = data.signIn;
        throw new Error(data.error ?? "Impossibile chiudere la richiesta");
      }
      setCommunityRequests((items) => items.map((item) => item.id === id ? { ...item, status: "Chiusa", acceptedBy: data.acceptedBy ?? item.acceptedBy } : item));
      notify("Richiesta chiusa e archiviata");
      goTo("agenda");
    } catch (error) {
      notify(error instanceof Error ? error.message : "Impossibile chiudere la richiesta");
    }
  };

  const changeAccountType = async (nextRole: AccountType) => {
    if (nextRole === "owner") {
      setAccountType("owner");
      notify("Vista titolare attivata su questo dispositivo");
      return;
    }
    try {
      const response = await fetch("/api/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ role: nextRole }) });
      const data = await response.json() as { error?: string; signIn?: string };
      if (!response.ok) {
        if (data.signIn) window.location.href = data.signIn;
        throw new Error(data.error ?? "Impossibile aggiornare il ruolo");
      }
      setAccountType(nextRole);
      setSignedIn(true);
      notify("Ruolo aggiornato");
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
  if (!signedIn) return <main className="auth-screen"><div className="auth-card"><img src="/olbia-yachting-brand.png" alt={BRAND_NAME} /><span>{BRAND_NAME.toUpperCase()}</span><h1>Il tuo spazio nautico personale</h1><p>Accedi per avere agenda, prodotti e richieste separati da quelli degli altri utenti.</p><button onClick={() => { window.location.href = "/signin-with-chatgpt?return_to=/"; }}>Continua con ChatGPT</button><small>Se apri il link da un altro telefono o con un altro account, ciascuno vedra il proprio spazio personale.</small><div className="auth-legal-links"><a href="/privacy">Privacy</a><a href="/terms">Termini e trasparenza</a></div></div></main>;

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
          <select className="language-select" value={language} onChange={(event) => setLanguage(event.target.value as Language)} aria-label="Lingua"><option value="it">IT</option><option value="en">EN</option><option value="fr">FR</option><option value="es">ES</option><option value="de">DE</option></select>
          <button className="telegram-switch" type="button" onClick={openTelegramLink}>Telegram</button>
          <a className="account-switch" href="/signout-with-chatgpt?return_to=%2F">Cambia account</a>
          <button className="avatar" aria-label="Profilo" onClick={() => goTo("profile")}>{profileName.slice(0, 2).toUpperCase()}</button>
        </div>
      </header>

      <nav className="section-tabs" aria-label="Sezioni dell'app">
        <button className={tab === "home" ? "active" : ""} onClick={() => goTo("home")}>Home</button>
        <button className={tab === "scan" ? "active" : ""} onClick={() => goTo("scan")}>Foto</button>
        <button className={tab === "community" ? "active" : ""} onClick={() => goTo("community")}>Richieste</button>
        <button className={tab === "shop" ? "active" : ""} onClick={() => goTo("shop")}>Materiali</button>
        <button className={tab === "agenda" ? "active" : ""} onClick={() => goTo("agenda")}>Archivio</button>
        <button className={tab === "profile" ? "active" : ""} onClick={() => goTo("profile")}>Profilo</button>
      </nav>

      <picture className="brand-showcase" data-section="home">
        <source media="(max-width: 700px)" srcSet="/olbia-yachting-brand.png" />
        <img src="/olbia-yachting-hero.png" alt="Olbia Yachting Community - Connect, Share, Sail" />
      </picture>

      <section className="hero" data-section="home">
        <div>
          <span className="eyebrow">{REQUEST_ASSISTANT_NAME}</span>
          <h1>Richieste nautiche<br />piu chiare, subito.</h1>
          <p>Trasforma messaggi confusi in schede ordinate con priorita, materiali possibili e testo pronto da inviare.</p>
        </div>
        <div className="weather"><span>3</span><strong>passi</strong><small>raccogli, ordina, invia</small></div>
      </section>

      <section className="quick-grid" data-section="home" aria-label="Azioni rapide">
        <button className="quick primary" onClick={() => openRequestLauncher({ title: "Richiesta assistenza", category: "Altro", details: `Zona ${location}. Descrivi qui il problema, la barca, l'urgenza e allega una foto se serve.`, targetName: ASSISTANT_NAME, chatPrompt: `Aiutami a trasformare questa richiesta nautica in una scheda ordinata per ${location}.` })}><span className="quick-icon">1</span><b>Apri la demo</b><small>Compila una richiesta guidata</small><i>-&gt;</i></button>
        <input ref={fileRef} hidden type="file" accept="image/*" capture="environment" onChange={(event) => identifyPhoto(event.target.files?.[0])} />
        <button className="quick" onClick={() => fileRef.current?.click()}><span className="quick-icon">2</span><b>Carica una foto</b><small>Aiuta a capire guasto o componente</small><i>-&gt;</i></button>
        <button className="quick" onClick={() => goTo("community")}><span className="quick-icon">3</span><b>Trova chi la gestisce</b><small>Tecnici e aziende reali a {location}</small><i>-&gt;</i></button>
      </section>

      <section className="request-focus" data-section="home">
        <div className="request-focus-copy">
          <span className="eyebrow">COME FUNZIONA</span>
          <h2>Una demo semplice da capire.</h2>
          <p>Serve a una cosa sola: ricevere richieste nautiche in modo piu ordinato, cosi chi lavora perde meno tempo su WhatsApp e al telefono.</p>
          <div className="request-step-list">
            {requestSteps.map((step) => <article key={step.id}><span>{step.id}</span><div><b>{step.title}</b><small>{step.note}</small></div></article>)}
          </div>
        </div>
        <div className="request-demo-board">
          <div className="request-demo-head">
            <b>Da WhatsApp a scheda lavoro</b>
            <small>Questa e la trasformazione che l'azienda deve vedere subito.</small>
          </div>
          <div className="request-visual-grid">
            <article className="whatsapp-thread-card" aria-label="Messaggio WhatsApp in ingresso">
              <div className="demo-card-head">
                <b>Messaggio in ingresso</b>
                <small>Il cliente continua a scrivere su WhatsApp come ha sempre fatto.</small>
              </div>
              <div className="whatsapp-thread">
                {whatsappDemoMessages.map((message) => <div key={message.id} className={`whatsapp-row ${message.tone}`}>
                  <div className="whatsapp-meta">
                    <strong>{message.sender}</strong>
                    <small>{message.time}</small>
                  </div>
                  <p>{message.text}</p>
                </div>)}
              </div>
            </article>
            <article className="structured-request-card" aria-label="Richiesta ordinata nell'app">
              <div className="demo-card-head">
                <b>Richiesta ordinata</b>
                <small>Nell'app compare subito una scheda chiara e lavorabile.</small>
              </div>
              <div className="structured-request-fields">
                {whatsappStructuredFields.map((field) => <div key={field.label} className="structured-field">
                  <span>{field.label}</span>
                  <b>{field.value}</b>
                </div>)}
              </div>
            </article>
          </div>
          <div className="request-demo-list compact">
            {requestDemoCases.slice(0, 3).map((item, index) => <article key={item.title}><span>{`0${index + 1}`}</span><div><b>{item.title}</b><small>{item.note}</small></div><em>{item.category}</em></article>)}
          </div>
          <div className="request-demo-actions" aria-label="Azioni rapide disponibili">
            {whatsappActionSteps.map((step) => <span key={step}>{step}</span>)}
          </div>
          <button className="request-demo-cta" onClick={() => setChat(true)}>Prova un caso nella chat</button>
        </div>
      </section>

      <section className="whatsapp-inbox-section" data-section="home">
        <div className="whatsapp-inbox-copy">
          <span className="eyebrow">INBOX AZIENDALE</span>
          <h2>Così lavora l’azienda dopo il messaggio.</h2>
          <p>Le richieste entrano da WhatsApp Business, vengono lette subito e diventano ticket ordinati con priorità, zona, barca e prossimo passo.</p>
        </div>
        <div className="whatsapp-inbox-filters" aria-label="Filtri stato richieste">
          {(["Tutte", ...inboxStatusOrder] as const).map((status) => <button key={status} className={inboxStatusFilter === status ? "active" : ""} onClick={() => {
            setInboxStatusFilter(status);
            const firstThread = (status === "Tutte" ? whatsappThreads : whatsappThreads.filter((item) => item.status === status))[0];
            if (firstThread) setSelectedWhatsappThreadId(firstThread.id);
          }}>
            <span>{status}</span>
            <b>{whatsappStatusCounts[status]}</b>
          </button>)}
        </div>
        <div className="whatsapp-inbox-board">
          <aside className="whatsapp-inbox-list" aria-label="Conversazioni ricevute">
            {filteredWhatsappThreads.map((item) => <button key={item.id} className={`whatsapp-inbox-item ${selectedWhatsappThread?.id === item.id ? "active" : ""}`} onClick={() => setSelectedWhatsappThreadId(item.id)}>
              <div className="whatsapp-inbox-item-head">
                <b>{item.client}</b>
                <small>{item.time}</small>
              </div>
              <p>{item.preview}</p>
              <div className="whatsapp-inbox-item-meta">
                <span>{item.priority}</span>
                <span>{item.status}</span>
              </div>
            </button>)}
            {!filteredWhatsappThreads.length && <div className="whatsapp-inbox-empty"><b>Nessuna richiesta in questo stato</b><span>Qui compariranno le conversazioni WhatsApp appena entrano o cambiano fase.</span></div>}
            <div className="whatsapp-archive-card">
              <span>Archivio recente</span>
              {archivedWhatsappThreads.length ? archivedWhatsappThreads.map((item) => <div key={item.id}>
                <b>{item.client}</b>
                <small>{item.issue}</small>
              </div>) : <small>Nessuna richiesta chiusa ancora nella demo.</small>}
            </div>
          </aside>
          {selectedWhatsappThread && <article className="whatsapp-ticket-card" aria-label="Dettaglio richiesta selezionata">
            <div className="whatsapp-ticket-head">
              <div>
                <span>{selectedWhatsappThread.channel}</span>
                <h3>{selectedWhatsappThread.client}</h3>
              </div>
              <div className="whatsapp-ticket-badges">
                <small>{selectedWhatsappThread.priority}</small>
                <small>{selectedWhatsappThread.status}</small>
              </div>
            </div>
            <div className="whatsapp-ticket-progress" aria-label="Avanzamento richiesta">
              {inboxStatusOrder.map((status) => <div key={status} className={`whatsapp-progress-step ${inboxStatusOrder.indexOf(status) <= inboxStatusOrder.indexOf(selectedWhatsappThread.status) ? "done" : ""}`}>
                <i>{inboxStatusOrder.indexOf(status) + 1}</i>
                <span>{status}</span>
              </div>)}
            </div>
            <div className="whatsapp-ticket-grid">
              <div><span>Categoria</span><b>{selectedWhatsappThread.category}</b></div>
              <div><span>Barca</span><b>{selectedWhatsappThread.boat}</b></div>
              <div><span>Zona</span><b>{selectedWhatsappThread.location}</b></div>
              <div><span>Operatore suggerito</span><b>{selectedWhatsappThread.suggestedOperator}</b></div>
            </div>
            <div className="whatsapp-ticket-problem">
              <span>Problema sintetizzato</span>
              <p>{selectedWhatsappThread.issue}</p>
            </div>
            <div className="whatsapp-ticket-missing">
              <span>Dati mancanti da chiedere</span>
              <div>
                {selectedWhatsappThread.missing.map((item) => <small key={item}>{item}</small>)}
              </div>
            </div>
            <div className="whatsapp-ticket-history">
              <span>Storico attivita</span>
              <div>
                {selectedWhatsappActivity.map((item) => <article key={item.id}>
                  <small>{item.time}</small>
                  <p>{item.text}</p>
                </article>)}
              </div>
            </div>
            <div className="whatsapp-ticket-actions">
              <button onClick={() => updateWhatsappThreadStatus(selectedWhatsappThread.id, "Assegnata")}>Assegna</button>
              <button onClick={() => advanceWhatsappThread(selectedWhatsappThread.id)}>Avanza stato</button>
              <button onClick={() => setChat(true)}>Risposta pronta</button>
              <button onClick={() => createWhatsappIntervention(selectedWhatsappThread.id)}>Crea intervento</button>
              <button onClick={() => archiveWhatsappThread(selectedWhatsappThread.id)}>Archivia</button>
            </div>
          </article>}
        </div>
      </section>

      <section className="shop-page" data-section="shop">
        <div className="shop-hero">
          <span className="eyebrow light">MATERIALI E RICAMBI</span>
          <h1>Dal problema ai materiali possibili.</h1>
          <p>Qui controlli che cosa potrebbe servire prima di chiedere un preventivo o cercare un ricambio.</p>
          <label className="shop-search"><span>Cerca nella vetrina</span><input value={shopQuery} onChange={(event) => setShopQuery(event.target.value)} placeholder="Es. pompa, parabordo, ricambio motore" /></label>
        </div>
        <div className="shop-disclosure"><b>Assistente tecnico e operativo, non checkout interno</b><span>{BRAND_NAME} non vende questi articoli e non gestisce il pagamento. Questa sezione serve a dare una base utile a preventivi, richieste materiali e urgenze tecniche.</span></div>
        <section className="supplier-strip" aria-labelledby="supplier-title">
          <div className="supplier-heading"><span>CATALOGHI CONSULTATI</span><h2 id="supplier-title">Più fornitori, una sola ricerca.</h2><p>I nomi appartengono ai rispettivi titolari. La presenza qui indica soltanto un collegamento al catalogo ufficiale, non una partnership.</p></div>
          <div className="supplier-list">{shopSuppliers.map((supplier) => <a key={supplier.id} href={`/api/out?id=${encodeURIComponent(supplier.id)}`} target="_blank" rel="noreferrer nofollow sponsored"><b>{supplier.name}</b><small>{supplier.note}</small><i aria-hidden="true">↗</i></a>)}</div>
        </section>
        <div className="shop-grid">
          {visibleShopCategories.map((item) => <article className="shop-card" key={item.id}>
            <div className={`shop-card-visual ${item.tone}`} aria-hidden="true"><span>{item.symbol}</span><i /><i /></div>
            <div className="shop-card-head"><span className="shop-badge">{item.badge}</span><small>Catalogo principale: {item.source}</small></div>
            <h2>{item.name}</h2>
            <p>{item.note}</p>
            <div className="shop-providers" aria-label={`Fornitori per ${item.name}`}>{item.providers.map((provider) => <span key={provider}>{provider}</span>)}</div>
            <div className="shop-actions"><a href={`/api/out?id=${encodeURIComponent(item.id)}`} target="_blank" rel="noreferrer nofollow sponsored">Apri il catalogo</a><button onClick={() => { setChatText(`Aiutami a scegliere: ${item.name}. Quali dati della barca devo verificare prima dell'acquisto?`); setChat(true); }}>Chiedi all'AI</button></div>
          </article>)}
          {!visibleShopCategories.length && <div className="shop-empty"><b>Nessuna categoria trovata</b><span>Prova un termine più generale oppure chiedi direttamente a {ASSISTANT_NAME}.</span><button onClick={() => setChat(true)}>Apri assistente</button></div>}
        </div>
        <p className="shop-safety">Prima dell'acquisto verifica sempre dimensioni, tensione 12/24 V, portata, attacchi, codici originali e certificazioni richieste. Per dispositivi di sicurezza e componenti tecnici rivolgiti a un professionista qualificato.</p>
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
          <button className="buy-button" onClick={() => notify("Confronto prezzi avviato sui portali nautici")}>Confronta prezzi e disponibilita</button>
        </article>}

        {(accountType === "company" || accountType === "owner") && <article className="panel shopping-panel">
          <div className="panel-head"><div><span className="eyebrow">ORDINI FORNITORI</span><h2>Ordini da seguire</h2></div><div className="panel-actions"><span className="count">{pendingOrdersCount}</span><button className="text-button" onClick={() => openForm("order")}>+ Aggiungi</button></div></div>
          {!orders.length && <div className="empty-state"><b>Nessun ordine attivo</b><span>Qui puoi salvare ordini materiali, ricambi e acquisti da seguire con la ditta.</span><button onClick={() => openForm("order")}>Aggiungi ordine</button></div>}
          {orders.map((item) => <label className={`purchase ${item.done ? "done" : ""}`} key={item.id}><input type="checkbox" checked={item.done} onChange={() => { const done = !item.done; setOrders((items) => items.map((order) => order.id === item.id ? { ...order, done } : order)); void toggleWorkspaceItem(item.id, done).catch(() => notify("Impossibile aggiornare l'ordine")); }} /><span className="product-img">O</span><span><b>{item.title}</b><small>{item.detail}</small></span><strong>{item.done ? "Chiuso" : "In corso"}</strong></label>)}
          <button className="buy-button" onClick={() => setYardOpen(true)}>Apri commesse e avanzamento</button>
        </article>}
      </section>

      <section className="request-archive-section" data-section="agenda">
        <div className="request-archive-head">
          <div>
            <span className="eyebrow">ARCHIVIO RICHIESTE</span>
            <h2>Richieste chiuse e tracciate.</h2>
            <p>Qui ritrovi le richieste chiuse dal network con categoria, zona e riferimento operativo.</p>
          </div>
          <div className="request-archive-summary">
            <b>{archivedRequests.length}</b>
            <small>richieste archiviate</small>
          </div>
        </div>
        <div className="request-archive-grid">
          {!archivedRequests.length && <div className="archive-empty"><b>Nessuna richiesta archiviata</b><span>Quando chiudi una richiesta dalla rete interventi, comparirà qui separata da quelle attive.</span></div>}
          {archivedRequests.map((item) => {
            return <article className="archive-card" key={item.id}>
              <div className="archive-card-top">
                <span>{item.status}</span>
                <small>{item.created}</small>
              </div>
              <h3>{item.title}</h3>
              <p>{item.details}</p>
              <div className="archive-card-meta">
                <strong>{item.category}</strong>
                <strong>{item.location}</strong>
              </div>
              <div className="archive-card-details">
                <span>Stato finale: {item.status}</span>
                <span>Operatore: {item.acceptedBy ?? "Non indicato"}</span>
              </div>
              <div className="archive-card-history"><b>Ultimo aggiornamento</b><small>{item.acceptedBy ? `Presa in carico da ${item.acceptedBy}` : "Richiesta chiusa e archiviata."}</small></div>
              <button onClick={() => {
                goTo("community");
              }}>Apri in richieste</button>
            </article>;
          })}
        </div>
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
          <h2>{location} Request Network</h2>
          <p>{accountType === "private" ? "Vedi e salvi solo le tue richieste." : accountType === "operator" ? "Ricevi richieste piu ordinate e compatibili con il tuo lavoro." : accountType === "company" ? "Gestisci richieste, materiali e contatti della zona." : "Hai accesso completo, ma il focus qui resta sulle richieste."}</p>
          <div className="community-access">
            <button className={accountType === "private" ? "active" : ""} onClick={() => void changeAccountType("private")}><b>Privato</b><span>solo le mie richieste</span></button>
            <button className={accountType === "operator" ? "active" : ""} onClick={() => void changeAccountType("operator")}><b>Operatore</b><span>lavori compatibili</span></button>
            <button className={accountType === "company" ? "active" : ""} onClick={() => void changeAccountType("company")}><b>Ditta associata</b><span>richieste di zona</span></button>
            <button className={accountType === "owner" ? "active" : ""} onClick={() => void changeAccountType("owner")}><b>Titolare</b><span>accesso completo</span></button>
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
          <button className="publish-job" onClick={() => openRequestLauncher({ title: "Richiesta assistenza", category: "Altro", details: `Zona ${location}. Descrivi qui il problema, la barca, l'urgenza e allega una foto se serve.`, targetName: ASSISTANT_NAME, chatPrompt: `Aiutami a impostare una richiesta di assistenza nautica nella zona di ${location}. Ti dirò barca, problema, urgenza e categoria.` })}>+ Avvia una richiesta ordinata</button>
          <div className={`community-feed ${accountType === "private" ? "" : "pro-feed"}`}>
            {!visibleRequests.length && <div className="community-empty">{accountType === "private" ? `Non hai ancora pubblicato richieste attive a ${location}.` : `Nessuna richiesta attiva visibile per questo accesso a ${location}.`}</div>}
            {visibleRequests.slice(0, accountType === "private" ? 6 : 10).map((request) => {
              const isDemo = request.ownerId.startsWith("demo-");
              return <article key={request.id}><span>{request.status} - {request.created} - {request.category}</span><b>{request.title}</b><p>{request.details}</p><small className={`data-badge ${isDemo ? "demo" : "live"}`}>{isDemo ? "Demo" : "Dato reale"}</small>{request.acceptedBy && <em>OK {request.acceptedBy} e disponibile</em>}{accountType !== "private" && request.status === "Aperta" && !isDemo && <button onClick={() => acceptRequest(request.id)}>Prendi in carico</button>}{request.status !== "Chiusa" && !isDemo && (accountType !== "private" || request.ownerId === currentUserId) && <button onClick={() => closeRequest(request.id)}>Chiudi e archivia</button>}</article>;
            })}
          </div>
        </div>
        <div className="operator-area">
          <div className="service-grid">{currentLocation.services.map((service) => { const count = operatorCount(service.name); return <button className={operatorCategory === service.name ? "active" : ""} key={service.name} onClick={() => openOperators(service.name)}><i>{service.icon}</i><span><b>{service.name}</b><small>{count === 1 ? "1 riferimento" : `${count} riferimenti`}</small></span><em>&gt;</em></button>; })}</div>
          <div className="operator-panel">
            <div className="operator-head"><div><span className="eyebrow light">OPERATORI DISPONIBILI</span><h3>{operatorCategory ?? `Tutti a ${location}`}</h3></div><div className="operator-head-actions">{operatorCategory && <button onClick={() => { setOperatorCategory(null); setWebResult(null); }}>Tutti</button>}<button onClick={verifyOperatorsOnWeb} disabled={webLoading}>{webLoading ? "Verifico..." : "Verifica sul web"}</button></div></div>
            <p className="operator-note">{showDemoData ? "Elenco locale in modalita demo: usa Verifica sul web per controllare aziende reali e fonti." : visibleOperators.length ? "Archivio operatori reale collegato al database. I dati mostrati qui arrivano dai profili pubblicati dagli operatori." : "Nessun operatore reale pubblicato in questa zona. Un operatore o una ditta puo creare adesso il proprio profilo."}</p>
            {(accountType === "operator" || accountType === "company") && <button className="publish-job secondary-job" onClick={openOperatorEditor}>{myOperatorProfile ? "Aggiorna profilo operatore" : "Pubblica profilo operatore"}</button>}
            {webResult && <div className="web-result"><RichText text={webResult.reply} />{webResult.sources?.length ? <div className="source-list"><span>Fonti web</span>{webResult.sources.map((source, index) => <a key={source.url} href={source.url} target="_blank" rel="noreferrer">{index + 1}. {source.title}</a>)}</div> : null}</div>}
            <div className="operator-list">
              {!visibleOperators.length && <div className="community-empty">{showDemoData ? "Nessun operatore demo in questa categoria. Pubblica una richiesta e verra mostrata agli iscritti compatibili." : "Qui compariranno gli operatori reali che pubblicano un profilo per questa zona."}</div>}
              {visibleOperators.map((operator) => <article className={`operator-card ${selectedOperator?.id === operator.id ? "selected" : ""}`} key={operator.id} onClick={() => setSelectedOperator(operator)}>
                <div className="operator-title"><b>{operator.name}</b>{showDemoData && <span>Demo</span>}{!showDemoData && operator.verified && <span>Verificato</span>}{operator.premium && <span>Premium</span>}</div>
                <p>{operator.note}</p>
                <div className="operator-meta"><span>{operator.category}</span>{operator.distance && <span>{operator.distance}</span>}{operator.rating && <span>{operator.rating}/5</span>}</div>
                <div className="operator-tags">{operator.tags.map((tag) => <small key={tag}>{tag}</small>)}</div>
                {!showDemoData && <div className="operator-contact">{operator.phone && <a href={`tel:${operator.phone}`}>{operator.phone}</a>}{operator.email && <a href={`mailto:${operator.email}`}>{operator.email}</a>}{operator.telegram && normalizeTelegramLink(operator.telegram) && <a href={normalizeTelegramLink(operator.telegram)} target="_blank" rel="noreferrer">Telegram</a>}{operator.website && <a href={operator.website.startsWith("http") ? operator.website : `https://${operator.website}`} target="_blank" rel="noreferrer">Sito</a>}</div>}
                <div className="operator-actions"><em>{operator.response ?? (showDemoData ? "Disponibilita demo" : "Profilo reale pubblicato")}</em><button onClick={(event) => { event.stopPropagation(); requestOperator(operator); }}>Richiedi intervento</button></div>
              </article>)}
            </div>
          </div>
          <section className="public-directory" aria-labelledby="directory-title">
            <div className="directory-head"><div><span>DIRECTORY PUBBLICA</span><h3 id="directory-title">Aziende e servizi reali</h3><p>Informazioni sintetizzate dai siti ufficiali. Non indicano iscrizione, disponibilità immediata o collaborazione con la piattaforma.</p></div><label><span>Cerca servizio o azienda</span><input value={directoryQuery} onChange={(event) => setDirectoryQuery(event.target.value)} placeholder="Es. elettricista, refit, lavanderia" /></label></div>
            <label className="directory-request"><span>La tua richiesta</span><textarea value={directoryRequest} onChange={(event) => setDirectoryRequest(event.target.value)} rows={3} maxLength={800} placeholder="Es. problema all'impianto elettrico, yacht 15 m, intervento richiesto domani..." /><small>Scrivila una volta: verrà inserita nel messaggio. L'app non salva il testo e non invia senza la tua conferma.</small></label>
            <div className="directory-list">
              {visibleDirectoryProviders.map((provider) => <article className="directory-card" key={provider.id}>
                <div className="directory-title"><span aria-hidden="true">{provider.name.slice(0, 1)}</span><div><b>{provider.name}</b><small>Fonte pubblica · {provider.locations.join(" / ")}</small></div></div>
                <p>{provider.note}</p>
                <div className="directory-tags"><strong>{provider.category}</strong>{provider.services.map((service) => <span key={service}>{service}</span>)}</div>
                {(provider.email || provider.whatsapp || provider.phone) && <div className="directory-contact-line">{provider.email && <span>{provider.email}</span>}{provider.phone && <span>{provider.phone}</span>}</div>}
                <div className="directory-actions"><a href={provider.website} target="_blank" rel="noreferrer nofollow external">Sito ufficiale</a>{provider.email && <button className="contact-email" onClick={() => openProviderContact(provider, "email")}>Apri Email</button>}{provider.whatsapp && <button className="contact-whatsapp" onClick={() => openProviderContact(provider, "whatsapp")}>Apri WhatsApp</button>}<button type="button" onClick={() => openRequestLauncher({ title: `Richiesta verso ${provider.name}`, category: provider.category, details: directoryRequest.trim() || `Richiesta per ${provider.name} nella zona di ${location}.`, targetName: provider.name, chatPrompt: buildDirectoryChatPrompt(provider.name), email: provider.email, whatsapp: provider.whatsapp })}>Chiedi a {ASSISTANT_NAME}</button></div>
                {(provider.email || provider.whatsapp) && <small className="directory-consent">Si apre l'app scelta con un messaggio precompilato. Sarai tu a controllarlo e inviarlo.</small>}
              </article>)}
              {!visibleDirectoryProviders.length && <div className="directory-empty"><b>Nessun risultato in questa zona</b><span>Prova un'altra categoria o un termine più generale.</span></div>}
            </div>
          </section>
        </div>
      </section>

      {(accountType === "company" || accountType === "owner") && <section className="yard-strip">
        <div><span className="eyebrow">MODALITA CANTIERE</span><h2>Ogni commessa sotto controllo.</h2><p>Imbarcazioni, squadre, attivita, materiali e avanzamento in un unico spazio condiviso.</p><small>{yardJobs.length ? `Hai ${activeJobsCount} commesse aperte, ${pendingOrdersCount} ordini da seguire e ${openTasksCount} mansioni ancora aperte.` : "Da qui puoi iniziare a salvare commesse reali del cantiere, una per una."}</small></div>
        <button onClick={() => setYardOpen(true)}>{yardJobs.length ? "Apri area cantieri" : "Crea prima commessa"}</button>
      </section>}

      <section className="plans" data-section="profile" id="plans">
        <div className="plans-intro"><span className="eyebrow">PIANI {BRAND_NAME.toUpperCase()}</span><h2>Scegli quanto supporto vuoi a bordo.</h2><p>Le funzioni quotidiane restano accessibili a tutti. Premium aggiunge intelligenza, collaborazione e priorita.</p></div>
        <div className={`plan-card ${plan === "Standard" ? "selected" : ""}`}><span>STANDARD</span><h3>Per iniziare</h3><strong>Gratis</strong><ul><li>Agenda e lista acquisti</li><li>3 identificazioni AI al mese</li><li>Ricerca servizi nella zona scelta</li><li>1 imbarcazione</li></ul><button onClick={() => { setPlan("Standard"); notify("Piano Standard selezionato"); }}>{plan === "Standard" ? "Piano attuale" : "Scegli Standard"}</button></div>
        <div className={`plan-card premium-card ${plan === "Premium" ? "selected" : ""}`}><span>PREMIUM</span><h3>Per chi vive il mare</h3><strong>EUR 14,90 <small>/ mese</small></strong><ul><li>Identificazioni AI illimitate</li><li>Confronto prezzi avanzato</li><li>Piu imbarcazioni e collaboratori</li><li>Assistenza e richieste prioritarie</li><li>Storico manutenzioni completo</li></ul><button onClick={() => { setPlan("Premium"); notify("Premium selezionato in anteprima: pagamento reale non ancora attivo"); }}>{plan === "Premium" ? "Premium attivo" : "Prova Premium"}</button><small className="plan-note">Attualmente e una anteprima funzionale: il pagamento reale non e ancora collegato.</small><a className="profile-download" href="/downloads/Yachting-Assistant-Android.apk" download>Scarica l'app Android</a><a className="profile-signout" href="/signout-with-chatgpt?return_to=%2F">Esci o cambia account</a><small className="plan-note">Se condividi il link, ogni persona deve accedere col proprio account per vedere il proprio spazio e non quello di chi ha gia aperto l'app su quel dispositivo.</small></div>
        <div className={`plan-card telegram-card ${telegramHandle ? "selected" : ""}`}><div className="telegram-copy"><span>TELEGRAM</span><h3>Contatto diretto</h3><p>Salva il tuo username, canale o link Telegram. Lo ritrovi nel profilo e nei contatti rapidi degli operatori.</p></div><div className="telegram-form"><label><span>Username o link Telegram</span><input value={telegramHandle} onChange={(event) => setTelegramHandle(event.target.value)} placeholder="@nomeutente o https://t.me/..." /></label><button type="button" onClick={() => void saveTelegramProfile()}>Salva Telegram</button>{normalizeTelegramLink(telegramHandle) && <a className="telegram-link" href={normalizeTelegramLink(telegramHandle)} target="_blank" rel="noreferrer">Apri Telegram</a>}</div><small className="plan-note">Svuota il campo e salva di nuovo per rimuoverlo. Per automazioni vere serve un bot token; qui hai il collegamento operativo persistente, gratuito e pronto all'uso.</small></div>
      </section>

      <footer className="legal-footer">
        <div><img src="/yachting-community-logo.png" alt="" /><span><b>{BRAND_NAME}</b><small>Segno distintivo in uso. Nessuna dichiarazione di marchio registrato.</small></span></div>
        <nav aria-label="Informazioni legali"><a href="/privacy">Privacy</a><a href="/terms">Termini e trasparenza</a></nav>
        <p>© 2026 {BRAND_NAME}. Le risposte AI non sostituiscono tecnici qualificati né strumenti ufficiali di navigazione e sicurezza.</p>
      </footer>

      <nav className="bottom-nav" aria-label="Navigazione principale">
        {([["home", "H", "Home"], ["scan", "O", "Foto"], ["community", "P", "Richieste"], ["shop", "V", "Materiali"], ["agenda", "OK", "Archivio"], ["profile", "SC", "Profilo"]] as [Tab, string, string][]).map(([id, icon, label]) => <button key={id} className={tab === id ? "active" : ""} onClick={() => goTo(id)}><i>{icon}</i><span>{label}</span></button>)}
      </nav>

      <button className="chat-fab" onClick={() => setChat(!chat)} aria-label={`Apri l'assistente ${BRAND_NAME}`}><span className="assistant-symbol" aria-hidden="true"><i /><i /><i /></span></button>
      {chat && <aside className="chat chat-live"><button onClick={() => setChat(false)}>x</button><span>{BRAND_NAME.toUpperCase()} - ONLINE</span><h3>{ASSISTANT_NAME}</h3><div ref={messageListRef} className="message-list">{messages.map((message) => <div key={message.id} className={`message ${message.role}`}>{message.image && <img className="message-image" src={message.image} alt="Foto caricata" />}<RichText text={message.text} />{message.role === "assistant" && message.id !== 1 && <div className="message-actions"><button className="message-action" onClick={() => addMessageToAgenda(message)}>+ Aggiungi in agenda</button><button className="message-action shop-action" onClick={() => { setChat(false); goTo("shop"); }}>Apri materiali</button></div>}{message.sources?.length ? <div className="source-list"><span>Fonti consultate</span>{message.sources.map((source, i) => <a key={source.url} href={source.url} target="_blank" rel="noreferrer">{i + 1}. {source.title}</a>)}</div> : null}</div>)}{chatLoading && <div className="message assistant"><span className="thinking-dot" /> {chatStatus || "Sto lavorando..."}</div>}</div><div className="suggestions"><button disabled={chatLoading} onClick={() => openRequestLauncher({ title: "Richiesta assistenza", category: "Altro", details: `Zona ${location}. Descrivi qui il problema, la barca, l'urgenza e allega una foto se serve.`, targetName: ASSISTANT_NAME, chatPrompt: `Aiutami a impostare una richiesta di assistenza nautica nella zona di ${location}. Ti dirò barca, problema, urgenza e categoria.` })}>Inizia richiesta</button><button disabled={chatLoading} onClick={() => sendChat("Ho un problema elettrico al salpa ancora a Olbia. Quali dati devo raccogliere prima di chiamare un tecnico?")}>Caso elettrico</button><button disabled={chatLoading} onClick={() => fileRef.current?.click()}>Allega foto</button></div><form className="chat-input" onSubmit={(event) => { event.preventDefault(); sendChat(); }}><input disabled={chatLoading} value={chatText} onChange={(event) => setChatText(event.target.value)} placeholder="Scrivi un messaggio..." aria-label="Messaggio" /><button disabled={chatLoading} type="submit">^</button></form><small className="ai-note">Verifica sempre le indicazioni tecniche critiche con un professionista qualificato.</small></aside>}
      {toast && <div className="toast">OK {toast}</div>}

      {requestLauncher && <div className="modal-backdrop" onClick={() => setRequestLauncher(null)}><section className="request-launcher-modal" onClick={(event) => event.stopPropagation()}><button className="modal-close" onClick={() => setRequestLauncher(null)}>x</button><span className="eyebrow">COME VUOI AVVIARE LA RICHIESTA</span><h2>{requestLauncher.targetName}</h2><p>{requestLauncher.details}</p><div className="request-launcher-actions"><button onClick={() => launchRequestChat(requestLauncher)}>Chat con {ASSISTANT_NAME}</button><button onClick={() => launchRequestForm(requestLauncher)}>Compila la richiesta</button>{requestLauncher.email && <button className="contact-email" onClick={() => launchRequestEmail(requestLauncher)}>Apri Email</button>}{requestLauncher.whatsapp && <button className="contact-whatsapp" onClick={() => launchRequestWhatsapp(requestLauncher)}>Apri WhatsApp</button>}</div><small className="plan-note">Il testo viene preparato in automatico, ma sei tu a confermare l'invio o il salvataggio.</small></section></div>}

      {yardOpen && <div className="modal-backdrop" onClick={() => setYardOpen(false)}><section className="yard-modal" onClick={(event) => event.stopPropagation()}><button className="modal-close" onClick={() => setYardOpen(false)}>x</button><span className="eyebrow">{BRAND_NAME.toUpperCase()} CANTIERI</span><h2>Commesse attive</h2><small className="plan-note">Questa area ora salva commesse e ordini del tuo account. Pagamenti, clienti e squadre multiutente restano nella prossima fase.</small>{!yardJobs.length && <div className="empty-state"><b>Nessuna commessa salvata</b><span>Crea la prima commessa reale del cantiere e la ritroverai qui.</span><button onClick={() => openForm("job")}>Crea commessa</button></div>}{yardJobs.map((job) => <div className="job" key={job.id}><div><b>{job.title}</b><small>{job.detail}</small></div><strong>{job.done ? "100%" : "45%"}</strong><i><em style={{ width: job.done ? "100%" : "45%" }} /></i></div>)}<div className="job-stats"><span><b>{activeJobsCount}</b><small>Commesse aperte</small></span><span><b>{openTasksCount}</b><small>Mansioni aperte</small></span><span><b>{pendingOrdersCount}</b><small>Ordini in attesa</small></span><span><b>{completedJobsCount}</b><small>Commesse chiuse</small></span></div><button className="new-job" onClick={() => openForm("job")}>+ Nuova commessa</button></section></div>}

      {operatorEditorOpen && <div className="modal-backdrop" onClick={() => setOperatorEditorOpen(false)}><form className="entry-modal" onClick={(event) => event.stopPropagation()} onSubmit={(event) => { event.preventDefault(); void saveOperatorProfile().catch((error: Error) => notify(error.message)); }}><button type="button" className="modal-close" onClick={() => setOperatorEditorOpen(false)}>x</button><span className="eyebrow">PROFILO OPERATORE</span><h2>{myOperatorProfile ? "Aggiorna il tuo profilo" : "Pubblica il tuo profilo"}</h2><label><span>Nome attivita</span><input autoFocus value={operatorForm.name} onChange={(event) => setOperatorForm({ ...operatorForm, name: event.target.value })} placeholder="Es. Nautica Gallura Service" required /></label><label><span>Categoria</span><select value={operatorForm.category} onChange={(event) => setOperatorForm({ ...operatorForm, category: event.target.value })}><option>Meccanica marina</option><option>Elettrica nautica</option><option>Elettronica</option><option>Cantieri & refit</option><option>Ricambi nautici</option><option>Tender e gommoni</option><option>Pulizia e detailing</option><option>Concierge yacht</option><option>Cambusa e forniture</option><option>Vele e rigging</option><option>Tappezzeria nautica</option><option>Ormeggi e marina</option></select></label><label><span>Localita coperte</span><div className="location-checks">{(Object.keys(locationData) as LocationKey[]).map((item) => <label key={item} className="check-option"><input type="checkbox" checked={operatorForm.locations.includes(item)} onChange={(event) => setOperatorForm((current) => ({ ...current, locations: event.target.checked ? [...current.locations, item] : current.locations.filter((locationItem) => locationItem !== item) }))} /><span>{item}</span></label>)}</div></label><label><span>Telefono</span><input value={operatorForm.phone} onChange={(event) => setOperatorForm({ ...operatorForm, phone: event.target.value })} placeholder="+39 ..." /></label><label><span>Email</span><input value={operatorForm.email} onChange={(event) => setOperatorForm({ ...operatorForm, email: event.target.value })} placeholder="info@azienda.it" /></label><label><span>Sito web</span><input value={operatorForm.website} onChange={(event) => setOperatorForm({ ...operatorForm, website: event.target.value })} placeholder="www.azienda.it" /></label><label><span>Telegram</span><input value={operatorForm.telegram} onChange={(event) => setOperatorForm({ ...operatorForm, telegram: event.target.value })} placeholder="@nomeutente o https://t.me/..." /></label><label><span>Tag servizi</span><input value={operatorForm.tags} onChange={(event) => setOperatorForm({ ...operatorForm, tags: event.target.value })} placeholder="Generatori, Batterie, Urgenze" /></label><label><span>Descrizione</span><textarea value={operatorForm.note} onChange={(event) => setOperatorForm({ ...operatorForm, note: event.target.value })} placeholder="Spiega servizi, tempi e area operativa" /></label><button className="entry-submit" type="submit">Salva profilo operatore</button></form></div>}

      {formMode && <div className="modal-backdrop" onClick={() => setFormMode(null)}><form className="entry-modal" onClick={(event) => event.stopPropagation()} onSubmit={(event) => { event.preventDefault(); submitForm(); }}><button type="button" className="modal-close" onClick={() => setFormMode(null)}>x</button><span className="eyebrow">{formMode === "request" ? "NUOVA RICHIESTA" : formMode === "task" ? "AGENDA DI BORDO" : formMode === "purchase" ? "LISTA ACQUISTI" : formMode === "order" ? "ORDINE FORNITORE" : "COMMESSA CANTIERE"}</span><h2>{formMode === "request" ? `Richiedi un intervento a ${location}` : formMode === "task" ? "Aggiungi una mansione" : formMode === "purchase" ? "Aggiungi un prodotto" : formMode === "order" ? "Aggiungi un ordine" : "Aggiungi una commessa"}</h2><label><span>{formMode === "request" ? "Intervento richiesto" : formMode === "task" ? "Mansione" : formMode === "purchase" ? "Prodotto" : formMode === "order" ? "Ordine" : "Commessa"}</span><input autoFocus value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder={formMode === "request" ? "Es. Controllo caricabatterie" : formMode === "order" ? "Es. Ordine giranti e filtri Volvo" : formMode === "job" ? "Es. Refit M/Y Aurora" : "Inserisci un titolo"} required /></label>{formMode === "request" && <label><span>Categoria</span><select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}><option>Meccanica</option><option>Elettrica</option><option>Elettronica</option><option>Refit</option><option>Pulizia</option><option>Altro</option></select></label>}<label><span>{formMode === "request" ? "Barca, marina e urgenza" : formMode === "order" ? "Fornitore, materiale o nota ordine" : formMode === "job" ? "Barca, lavoro e consegna prevista" : "Dettagli facoltativi"}</span><textarea value={form.details} onChange={(event) => setForm({ ...form, details: event.target.value })} placeholder={formMode === "request" ? `Es. Marina di ${location}, M/Y 15 m, entro domani` : formMode === "order" ? "Es. Fornitore locale, consegna prevista venerdì, materiale urgente" : formMode === "job" ? "Es. Yacht 18 m, refit impianto elettrico, consegna entro fine mese" : "Aggiungi informazioni"} /></label><button className="entry-submit" type="submit">{formMode === "request" ? "Pubblica richiesta" : "Salva"}</button></form></div>}
    </main>
  );
}
