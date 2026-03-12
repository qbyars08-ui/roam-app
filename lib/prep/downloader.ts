// =============================================================================
// ROAM — PREP download orchestrator
// Simulates download; real impl would fetch tiles, generate AI Q&A, etc.
// =============================================================================

import type { Trip } from '../store';
import type { PrepSectionId } from './types';
import { setPrepSection, setPrepProgress } from './storage';
import { PREP_SECTIONS } from './constants';
import { parseItinerary } from '../types/itinerary';

export type DownloadProgressCallback = (sectionId: PrepSectionId, progress: number, done: boolean) => void;

async function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function downloadOfflineMap(tripId: string, onProgress: DownloadProgressCallback): Promise<void> {
  for (let i = 0; i <= 100; i += 10) {
    await delay(120);
    onProgress('offline_map', i, i === 100);
  }
  await setPrepSection(tripId, 'offline_map', JSON.stringify({ tiles: 'cached', version: 1 }));
}

async function downloadAICompanion(tripId: string, _destination: string, onProgress: DownloadProgressCallback): Promise<void> {
  const qa: Array<{ q: string; a: string }> = [
    { q: 'Where is the nearest hospital?', a: 'Search "hospital" on the offline map. Major hospitals are pinned.' },
    { q: 'How do I get to the airport?', a: 'Use the transport tab. Airport shuttle/taxi options shown.' },
    { q: 'Is this food safe to eat?', a: 'Stick to busy places. Avoid raw produce. Bottled water only.' },
    { q: 'What does this sign say?', a: 'Use the Language tab to show "Please translate this" to a local.' },
    { q: 'Where can I find an ATM?', a: 'ATMs near your hotel are pinned in Emergency toolkit.' },
    { q: 'My restaurant is closed, what\'s nearby?', a: 'Check backup suggestions in your itinerary for each day.' },
    { q: 'I\'m lost, where am I going?', a: 'Open the offline map. Your itinerary stops are pinned with directions.' },
    { q: 'Is this price fair?', a: 'Typical prices are in the Cultural guide. Haggle at markets.' },
    { q: 'HELP', a: 'EMERGENCY: Police, ambulance, embassy numbers are in Emergency toolkit. Stay calm.' },
  ];
  for (let i = 0; i <= 100; i += 8) {
    await delay(100);
    onProgress('ai_companion', Math.min(i, 100), i >= 100);
  }
  await setPrepSection(tripId, 'ai_companion', JSON.stringify({ qa, count: qa.length }));
}

async function downloadLanguageKit(tripId: string, destination: string, onProgress: DownloadProgressCallback): Promise<void> {
  const isJapan = /Japan|Tokyo|Kyoto|Osaka/i.test(destination);
  const isThai = /Thai|Bangkok|Chiang Mai/i.test(destination);
  const phrases = isJapan
    ? [
        { id: '1', category: 'Emergency', english: 'Help!', local: '助けて！', phonetic: 'ta-SU-ke-te' },
        { id: '2', category: 'Emergency', english: 'Where is the hospital?', local: '病院はどこですか？', phonetic: 'byo-IN wa do-ko des-ka' },
        { id: '3', category: 'Food', english: 'The bill please', local: 'お会計お願いします', phonetic: 'o-kai-ke o-ne-gai shi-mas' },
        { id: '4', category: 'Food', english: 'Water please', local: '水をお願いします', phonetic: 'mi-ZU o o-ne-gai shi-mas' },
        { id: '5', category: 'Directions', english: 'Where is...?', local: '...はどこですか？', phonetic: '... wa do-ko des-ka' },
        { id: '6', category: 'Greetings', english: 'Thank you', local: 'ありがとう', phonetic: 'a-ri-ga-TO' },
        { id: '7', category: 'Greetings', english: 'Excuse me', local: 'すみません', phonetic: 'su-mi-ma-sen' },
      ]
    : isThai
    ? [
        { id: '1', category: 'Emergency', english: 'Help!', local: 'ช่วยด้วย!', phonetic: 'chuay duay' },
        { id: '2', category: 'Emergency', english: 'Where is the hospital?', local: 'โรงพยาบาลอยู่ที่ไหน', phonetic: 'rong pa-ya-baan yoo tee nai' },
        { id: '3', category: 'Food', english: 'The bill please', local: 'เช็คบิลครับ', phonetic: 'chek bin krap' },
        { id: '4', category: 'Food', english: 'Not spicy please', local: 'ไม่เผ็ดครับ', phonetic: 'mai phet krap' },
        { id: '5', category: 'Directions', english: 'Where is...?', local: '...อยู่ที่ไหน', phonetic: '... yoo tee nai' },
        { id: '6', category: 'Greetings', english: 'Thank you', local: 'ขอบคุณครับ', phonetic: 'kop khun krap' },
        { id: '7', category: 'Transport', english: 'How much to...?', local: 'ไป...เท่าไหร่', phonetic: 'bpai ... tao-rai' },
      ]
    : [
        { id: '1', category: 'Emergency', english: 'Help!', local: '¡Ayuda!', phonetic: 'ah-YOO-dah' },
        { id: '2', category: 'Emergency', english: 'Where is the hospital?', local: '¿Dónde está el hospital?', phonetic: 'DON-deh es-TAH el oh-spee-TAL' },
        { id: '3', category: 'Food', english: 'The bill please', local: 'La cuenta por favor', phonetic: 'lah KWEN-tah por fa-VOR' },
        { id: '4', category: 'Food', english: 'Water please', local: 'Agua por favor', phonetic: 'AH-gwah por fa-VOR' },
        { id: '5', category: 'Food', english: 'I\'m allergic to...', local: 'Soy alérgico a...', phonetic: 'soy ah-LER-hee-ko ah' },
        { id: '6', category: 'Directions', english: 'Where is...?', local: '¿Dónde está...?', phonetic: 'DON-deh es-TAH' },
        { id: '7', category: 'Greetings', english: 'Thank you', local: 'Gracias', phonetic: 'GRAH-syahs' },
        { id: '8', category: 'Transport', english: 'How much to the airport?', local: '¿Cuánto al aeropuerto?', phonetic: 'KWAN-to al ah-eh-ro-PWER-to' },
        { id: '9', category: 'Medical', english: 'I need a doctor', local: 'Necesito un médico', phonetic: 'neh-seh-SEE-to oon MEH-dee-ko' },
      ];
  for (let i = 0; i <= 100; i += 12) {
    await delay(80);
    onProgress('language_kit', Math.min(i, 100), i >= 100);
  }
  const lang = isJapan ? 'ja' : isThai ? 'th' : 'es';
  await setPrepSection(tripId, 'language_kit', JSON.stringify({ language: lang, phrases }));
}

async function downloadEmergency(tripId: string, _destination: string, onProgress: DownloadProgressCallback): Promise<void> {
  const data = {
    emergency: [
      { type: 'police', number: '911', label: 'Police (US) / Local: check Cultural guide' },
      { type: 'ambulance', number: '911', label: 'Ambulance' },
      { type: 'fire', number: '911', label: 'Fire' },
    ],
    embassy: 'U.S. Embassy — see itinerary emergency section',
    atms: 'Nearest ATMs pinned on map',
  };
  await delay(200);
  onProgress('emergency', 50, false);
  await delay(200);
  onProgress('emergency', 100, true);
  await setPrepSection(tripId, 'emergency', JSON.stringify(data));
}

async function downloadCultural(tripId: string, _destination: string, onProgress: DownloadProgressCallback): Promise<void> {
  const data = {
    etiquette: 'Dress modestly at religious sites. Tipping 10-15% at restaurants.',
    scams: 'Taxi meter scams — insist on meter. Pickpockets in crowds — keep valuables hidden.',
    simCards: 'Airport kiosks: ~$20 for 7 days. Local stores cheaper.',
    currency: 'Exchange rate cached. Use ATMs for best rate. Small bills for tips.',
  };
  await delay(150);
  onProgress('cultural', 100, true);
  await setPrepSection(tripId, 'cultural', JSON.stringify(data));
}

async function downloadPacking(tripId: string, trip: Trip, onProgress: DownloadProgressCallback): Promise<void> {
  let itinerary;
  try {
    itinerary = parseItinerary(trip.itinerary);
  } catch {
    itinerary = { packingEssentials: ['Passport', 'Adapter', 'Sunscreen'], destination: trip.destination, days: trip.days };
  }
  const items = (itinerary as { packingEssentials?: string[] }).packingEssentials ?? ['Passport', 'Adapter', 'Sunscreen', 'Medication', 'Phone charger'];
  const packing = { items: items.map((i) => ({ name: i, packed: false })), alerts: ['Adapter for local outlets', 'Reef-safe sunscreen for beach'] };
  await delay(120);
  onProgress('packing', 100, true);
  await setPrepSection(tripId, 'packing', JSON.stringify(packing));
}

async function downloadItinerary(tripId: string, trip: Trip, onProgress: DownloadProgressCallback): Promise<void> {
  for (let i = 0; i <= 100; i += 15) {
    await delay(80);
    onProgress('itinerary', Math.min(i, 100), i >= 100);
  }
  await setPrepSection(tripId, 'itinerary', JSON.stringify({ trip, offline: true }));
}

export async function downloadAllPrep(
  trip: Trip,
  onProgress: DownloadProgressCallback
): Promise<void> {
  const progress: Record<PrepSectionId, boolean> = {
    offline_map: false,
    ai_companion: false,
    language_kit: false,
    emergency: false,
    cultural: false,
    packing: false,
    itinerary: false,
  };

  const dest = trip.destination;

  await downloadOfflineMap(trip.id, (id, p, done) => {
    if (done) progress[id] = true;
    onProgress(id, p, done);
  });
  await downloadAICompanion(trip.id, dest, (id, p, done) => {
    if (done) progress[id] = true;
    onProgress(id, p, done);
  });
  await downloadLanguageKit(trip.id, dest, (id, p, done) => {
    if (done) progress[id] = true;
    onProgress(id, p, done);
  });
  await downloadEmergency(trip.id, dest, (id, p, done) => {
    if (done) progress[id] = true;
    onProgress(id, p, done);
  });
  await downloadCultural(trip.id, dest, (id, p, done) => {
    if (done) progress[id] = true;
    onProgress(id, p, done);
  });
  await downloadPacking(trip.id, trip, (id, p, done) => {
    if (done) progress[id] = true;
    onProgress(id, p, done);
  });
  await downloadItinerary(trip.id, trip, (id, p, done) => {
    if (done) progress[id] = true;
    onProgress(id, p, done);
  });

  await setPrepProgress(trip.id, progress);
}

export function getTotalSizeMB(): number {
  return PREP_SECTIONS.reduce((sum, s) => sum + s.sizeMB, 0);
}
