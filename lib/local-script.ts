// =============================================================================
// ROAM — Hotel / address in local script for "Show driver my hotel"
// Phrase + optional script so the driver sees where to go.
// =============================================================================

/** "Take me here" or equivalent in local language, plus hotel name for display. */
export interface HotelForDriver {
  /** Instruction in local script (e.g. "ここへお願いします") */
  phrase: string;
  /** Hotel/place name — same as input or transliterated where we have it */
  placeName: string;
  /** Optional: secondary line (e.g. romanized for Japanese) */
  secondary?: string;
}

const PHRASES: Record<string, string> = {
  Tokyo: 'ここへお願いします',
  Kyoto: 'ここへお願いします',
  Osaka: 'ここへお願いします',
  Paris: 'Merci de m\'emmener ici',
  London: 'Please take me here',
  Barcelona: 'Por favor, llévame aquí',
  Madrid: 'Por favor, llévame aquí',
  Rome: 'Per favore, portami qui',
  Bangkok: 'กรุณาพาฉันไปที่นี่',
  'Chiang Mai': 'กรุณาพาฉันไปที่นี่',
  Bali: 'Tolong antar saya ke sini',
  Seoul: '여기로 가 주세요',
  'New York': 'Please take me here',
  'Mexico City': 'Por favor, llévame aquí',
  Oaxaca: 'Por favor, llévame aquí',
  Lisbon: 'Por favor, leve-me aqui',
  Porto: 'Por favor, leve-me aqui',
  Amsterdam: 'Breng me hier naartoe',
  Istanbul: 'Lütfen beni buraya götürün',
  Budapest: 'Kérlek, vigyél ide',
  Dubrovnik: 'Molim, odvezite me ovdje',
  Marrakech: 'من فضلك خذني إلى هنا',
  Dubai: 'من فضلك خذني إلى هنا',
  'Cape Town': 'Please take me here',
  Reykjavik: 'Vinsamlegast keyrðu mig hingað',
  Tbilisi: 'გთხოვთ მიმიყვანოთ აქ',
  Medellín: 'Por favor, llévame aquí',
  Cartagena: 'Por favor, llévame aquí',
  'Buenos Aires': 'Por favor, llevame acá',
  Sydney: 'Please take me here',
  Hanoi: 'Làm ơn đưa tôi đến đây',
  'Hoi An': 'Làm ơn đưa tôi đến đây',
  Jaipur: 'कृपया मुझे यहाँ ले चलें',
};

/** Get "Take me here" + hotel name in local script for showing to a driver. */
export function getHotelForDriver(destination: string, hotelName: string): HotelForDriver {
  const phrase = PHRASES[destination] ?? 'Please take me here';
  return {
    phrase,
    placeName: hotelName,
    secondary: undefined,
  };
}
