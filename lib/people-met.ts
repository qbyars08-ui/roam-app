// =============================================================================
// ROAM — People You've Met (contact cards from Travel Squad)
// =============================================================================
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'roam_people_met';

export interface PersonMet {
  id: string;
  name: string;
  whereMet: string;
  destination?: string;  // city/country where you met
  tripDates: string;
  photoUrl?: string;
  instagram?: string;
  linkedin?: string;
  twitter?: string;
  city?: string;  // their current city for proximity alerts
}

export async function getPeopleMet(): Promise<PersonMet[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export async function savePersonMet(person: Omit<PersonMet, 'id'>): Promise<PersonMet> {
  const list = await getPeopleMet();
  const newOne: PersonMet = { ...person, id: genId() };
  list.push(newOne);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  return newOne;
}

export async function updatePersonMet(id: string, updates: Partial<Omit<PersonMet, 'id'>>): Promise<PersonMet | null> {
  const list = await getPeopleMet();
  const idx = list.findIndex((p) => p.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...updates };
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  return list[idx];
}

export async function deletePersonMet(id: string): Promise<boolean> {
  const list = (await getPeopleMet()).filter((p) => p.id !== id);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  return true;
}

/** People in the same city as user (proximity). Pass user's current city. */
export function getPeopleInCity(people: PersonMet[], userCity: string): PersonMet[] {
  const q = userCity.toLowerCase().trim();
  if (!q) return [];
  return people.filter((p) => {
    const city = (p.city ?? p.destination ?? p.whereMet ?? '').toLowerCase();
    return city && city.includes(q);
  });
}
