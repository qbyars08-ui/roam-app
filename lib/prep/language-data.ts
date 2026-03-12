// =============================================================================
// ROAM — Language Survival Kit Data
// 50 essential phrases for top 10 destinations
// =============================================================================

export interface Phrase {
  english: string;
  local: string;
  phonetic: string;
  category: 'greetings' | 'food' | 'directions' | 'emergency' | 'transport' | 'shopping' | 'social';
}

export interface LanguagePack {
  language: string;
  destinations: string[];
  flag: string;
  phrases: Phrase[];
}

// ---------------------------------------------------------------------------
// Japanese — Tokyo, Kyoto, Osaka
// ---------------------------------------------------------------------------
const JAPANESE: LanguagePack = {
  language: 'Japanese',
  destinations: ['Tokyo', 'Kyoto', 'Osaka'],
  flag: 'JP',
  phrases: [
    { english: 'Hello', local: 'こんにちは', phonetic: 'kon-NI-chi-wa', category: 'greetings' },
    { english: 'Thank you', local: 'ありがとうございます', phonetic: 'a-ri-GA-to go-zai-MAS', category: 'greetings' },
    { english: 'Excuse me', local: 'すみません', phonetic: 'su-mi-ma-SEN', category: 'greetings' },
    { english: 'Sorry', local: 'ごめんなさい', phonetic: 'go-men-na-SAI', category: 'greetings' },
    { english: 'Yes / No', local: 'はい / いいえ', phonetic: 'HAI / ee-EH', category: 'greetings' },
    { english: 'The bill please', local: 'お会計お願いします', phonetic: 'o-KAI-kei o-ne-gai shi-MAS', category: 'food' },
    { english: 'Water please', local: '水をください', phonetic: 'mi-ZU o ku-da-SAI', category: 'food' },
    { english: 'This is delicious', local: 'おいしい！', phonetic: 'oi-SHI-i', category: 'food' },
    { english: 'I\'m vegetarian', local: 'ベジタリアンです', phonetic: 'be-ji-TA-ri-an des', category: 'food' },
    { english: 'No meat please', local: '肉なしでお願いします', phonetic: 'NI-ku na-shi de o-ne-gai shi-MAS', category: 'food' },
    { english: 'Recommendation?', local: 'おすすめは？', phonetic: 'o-SU-su-me wa?', category: 'food' },
    { english: 'Beer please', local: 'ビールをください', phonetic: 'BI-ru o ku-da-SAI', category: 'food' },
    { english: 'Where is...?', local: '...はどこですか？', phonetic: '... wa DO-ko des-ka?', category: 'directions' },
    { english: 'Train station', local: '駅はどこですか？', phonetic: 'E-ki wa DO-ko des-ka?', category: 'directions' },
    { english: 'Bathroom?', local: 'トイレはどこですか？', phonetic: 'TOI-re wa DO-ko des-ka?', category: 'directions' },
    { english: 'Left / Right / Straight', local: '左 / 右 / まっすぐ', phonetic: 'hi-DA-ri / MI-gi / mas-SU-gu', category: 'directions' },
    { english: 'Help!', local: '助けて！', phonetic: 'ta-SU-ke-te!', category: 'emergency' },
    { english: 'I need a doctor', local: '医者が必要です', phonetic: 'I-sha ga hi-tsu-YO des', category: 'emergency' },
    { english: 'Call the police', local: '警察を呼んでください', phonetic: 'kei-SA-tsu o YON-de ku-da-SAI', category: 'emergency' },
    { english: 'I\'m allergic to...', local: '...アレルギーがあります', phonetic: '... a-RE-ru-gi ga a-ri-MAS', category: 'emergency' },
    { english: 'How much?', local: 'いくらですか？', phonetic: 'I-ku-ra des-ka?', category: 'shopping' },
    { english: 'Too expensive', local: '高すぎます', phonetic: 'ta-ka-SU-gi-mas', category: 'shopping' },
    { english: 'One ticket to...', local: '...まで一枚', phonetic: '... MA-de i-chi-MAI', category: 'transport' },
    { english: 'Next stop?', local: '次の駅は？', phonetic: 'TSU-gi no E-ki wa?', category: 'transport' },
    { english: 'Cheers!', local: '乾杯！', phonetic: 'KAN-pai!', category: 'social' },
  ],
};

// ---------------------------------------------------------------------------
// Thai — Bangkok, Chiang Mai
// ---------------------------------------------------------------------------
const THAI: LanguagePack = {
  language: 'Thai',
  destinations: ['Bangkok', 'Chiang Mai'],
  flag: 'TH',
  phrases: [
    { english: 'Hello', local: 'สวัสดีครับ/ค่ะ', phonetic: 'sa-wat-DEE krap/ka', category: 'greetings' },
    { english: 'Thank you', local: 'ขอบคุณครับ/ค่ะ', phonetic: 'kop-KHUN krap/ka', category: 'greetings' },
    { english: 'Sorry / Excuse me', local: 'ขอโทษครับ/ค่ะ', phonetic: 'kor-TOHT krap/ka', category: 'greetings' },
    { english: 'Yes / No', local: 'ใช่ / ไม่ใช่', phonetic: 'chai / mai chai', category: 'greetings' },
    { english: 'No problem', local: 'ไม่เป็นไร', phonetic: 'mai pen rai', category: 'greetings' },
    { english: 'The bill please', local: 'เช็คบิลครับ/ค่ะ', phonetic: 'chek bin krap/ka', category: 'food' },
    { english: 'Not spicy please', local: 'ไม่เผ็ดครับ/ค่ะ', phonetic: 'mai PET krap/ka', category: 'food' },
    { english: 'Delicious!', local: 'อร่อย!', phonetic: 'a-ROI!', category: 'food' },
    { english: 'Water please', local: 'น้ำเปล่าครับ/ค่ะ', phonetic: 'nam plao krap/ka', category: 'food' },
    { english: 'No sugar', local: 'ไม่ใส่น้ำตาล', phonetic: 'mai sai nam tan', category: 'food' },
    { english: 'One more please', local: 'อีกหนึ่งครับ/ค่ะ', phonetic: 'eek neung krap/ka', category: 'food' },
    { english: 'Where is...?', local: '...อยู่ที่ไหน', phonetic: '... yoo tee nai', category: 'directions' },
    { english: 'Bathroom?', local: 'ห้องน้ำอยู่ที่ไหน', phonetic: 'hong nam yoo tee nai', category: 'directions' },
    { english: 'How much to...?', local: 'ไป...เท่าไหร่', phonetic: 'bpai ... TAO-rai', category: 'transport' },
    { english: 'Turn on the meter', local: 'เปิดมิเตอร์ครับ/ค่ะ', phonetic: 'bpert mi-ter krap/ka', category: 'transport' },
    { english: 'Stop here', local: 'จอดตรงนี้ครับ/ค่ะ', phonetic: 'jot trong nee krap/ka', category: 'transport' },
    { english: 'Help!', local: 'ช่วยด้วย!', phonetic: 'CHUAY duay!', category: 'emergency' },
    { english: 'Hospital', local: 'โรงพยาบาล', phonetic: 'rong pa-ya-BAAN', category: 'emergency' },
    { english: 'Police', local: 'ตำรวจ', phonetic: 'tam-RUAT', category: 'emergency' },
    { english: 'How much?', local: 'เท่าไหร่', phonetic: 'tao-RAI', category: 'shopping' },
    { english: 'Too expensive', local: 'แพงไป', phonetic: 'paeng bpai', category: 'shopping' },
    { english: 'Can you lower?', local: 'ลดหน่อยได้ไหม', phonetic: 'lot noi dai mai', category: 'shopping' },
    { english: 'Cheers!', local: 'ชนแก้ว!', phonetic: 'chon gaew!', category: 'social' },
  ],
};

// ---------------------------------------------------------------------------
// Spanish — Barcelona, Mexico City, Buenos Aires
// ---------------------------------------------------------------------------
const SPANISH: LanguagePack = {
  language: 'Spanish',
  destinations: ['Barcelona', 'Mexico City', 'Buenos Aires', 'Medellín'],
  flag: 'DE',
  phrases: [
    { english: 'Hello', local: 'Hola', phonetic: 'OH-lah', category: 'greetings' },
    { english: 'Thank you', local: 'Gracias', phonetic: 'GRAH-syahs', category: 'greetings' },
    { english: 'Please', local: 'Por favor', phonetic: 'por fah-VOR', category: 'greetings' },
    { english: 'Excuse me', local: 'Disculpe', phonetic: 'dis-KOOL-peh', category: 'greetings' },
    { english: 'I don\'t speak Spanish', local: 'No hablo español', phonetic: 'no AH-blo es-pan-YOL', category: 'greetings' },
    { english: 'The bill please', local: 'La cuenta por favor', phonetic: 'lah KWEN-tah por fah-VOR', category: 'food' },
    { english: 'Water please', local: 'Agua por favor', phonetic: 'AH-gwah por fah-VOR', category: 'food' },
    { english: 'Very delicious!', local: '¡Muy delicioso!', phonetic: 'mooy de-li-SYO-so', category: 'food' },
    { english: 'I\'m allergic to...', local: 'Soy alérgico a...', phonetic: 'soy ah-LER-hee-ko ah...', category: 'food' },
    { english: 'No meat', local: 'Sin carne', phonetic: 'sin KAR-neh', category: 'food' },
    { english: 'Where is...?', local: '¿Dónde está...?', phonetic: 'DON-deh es-TAH...?', category: 'directions' },
    { english: 'Bathroom?', local: '¿Dónde está el baño?', phonetic: 'DON-deh es-TAH el BAN-yo?', category: 'directions' },
    { english: 'How far is it?', local: '¿Qué tan lejos?', phonetic: 'keh tan LEH-hos?', category: 'directions' },
    { english: 'To the airport', local: 'Al aeropuerto', phonetic: 'al ah-eh-ro-PWER-to', category: 'transport' },
    { english: 'How much to...?', local: '¿Cuánto a...?', phonetic: 'KWAN-to ah...?', category: 'transport' },
    { english: 'Help!', local: '¡Ayuda!', phonetic: 'ah-YOO-dah!', category: 'emergency' },
    { english: 'I need a doctor', local: 'Necesito un médico', phonetic: 'neh-seh-SEE-to oon MEH-dee-ko', category: 'emergency' },
    { english: 'Call the police', local: 'Llame a la policía', phonetic: 'YAH-meh ah lah po-lee-SEE-ah', category: 'emergency' },
    { english: 'How much?', local: '¿Cuánto cuesta?', phonetic: 'KWAN-to KWES-tah?', category: 'shopping' },
    { english: 'Too expensive', local: 'Muy caro', phonetic: 'mooy KAH-ro', category: 'shopping' },
    { english: 'Cheers!', local: '¡Salud!', phonetic: 'sah-LOOD!', category: 'social' },
  ],
};

// ---------------------------------------------------------------------------
// Italian — Rome
// ---------------------------------------------------------------------------
const ITALIAN: LanguagePack = {
  language: 'Italian',
  destinations: ['Rome', 'Florence', 'Amalfi Coast'],
  flag: 'IN',
  phrases: [
    { english: 'Hello', local: 'Ciao', phonetic: 'CHOW', category: 'greetings' },
    { english: 'Thank you', local: 'Grazie', phonetic: 'GRAH-tsyeh', category: 'greetings' },
    { english: 'Please', local: 'Per favore', phonetic: 'per fah-VO-reh', category: 'greetings' },
    { english: 'Excuse me', local: 'Scusi', phonetic: 'SKOO-zee', category: 'greetings' },
    { english: 'Good morning', local: 'Buongiorno', phonetic: 'bwon-JOR-no', category: 'greetings' },
    { english: 'The bill please', local: 'Il conto per favore', phonetic: 'il KON-to per fah-VO-reh', category: 'food' },
    { english: 'A coffee please', local: 'Un caffè per favore', phonetic: 'oon kaf-FEH per fah-VO-reh', category: 'food' },
    { english: 'Delicious!', local: 'Buonissimo!', phonetic: 'bwo-NIS-si-mo!', category: 'food' },
    { english: 'Water (still/sparkling)', local: 'Acqua (naturale/frizzante)', phonetic: 'AK-wah (na-too-RAH-leh/frit-SAHN-teh)', category: 'food' },
    { english: 'Where is...?', local: 'Dove è...?', phonetic: 'DO-veh eh...?', category: 'directions' },
    { english: 'Bathroom?', local: 'Dov\'è il bagno?', phonetic: 'do-VEH il BAN-yo?', category: 'directions' },
    { english: 'Help!', local: 'Aiuto!', phonetic: 'ah-YOO-to!', category: 'emergency' },
    { english: 'I need a doctor', local: 'Ho bisogno di un medico', phonetic: 'oh bee-ZON-yo dee oon MEH-dee-ko', category: 'emergency' },
    { english: 'How much?', local: 'Quanto costa?', phonetic: 'KWAN-to KOS-tah?', category: 'shopping' },
    { english: 'Cheers!', local: 'Cin cin!', phonetic: 'chin chin!', category: 'social' },
  ],
};

// ---------------------------------------------------------------------------
// French — Paris
// ---------------------------------------------------------------------------
const FRENCH: LanguagePack = {
  language: 'French',
  destinations: ['Paris'],
  flag: 'FR',
  phrases: [
    { english: 'Hello', local: 'Bonjour', phonetic: 'bon-ZHOOR', category: 'greetings' },
    { english: 'Thank you', local: 'Merci', phonetic: 'mer-SEE', category: 'greetings' },
    { english: 'Please', local: 'S\'il vous plaît', phonetic: 'seel voo PLEH', category: 'greetings' },
    { english: 'Excuse me', local: 'Excusez-moi', phonetic: 'ex-koo-ZAY mwah', category: 'greetings' },
    { english: 'I don\'t speak French', local: 'Je ne parle pas français', phonetic: 'zhuh nuh parl pah fron-SEH', category: 'greetings' },
    { english: 'The bill please', local: 'L\'addition s\'il vous plaît', phonetic: 'lah-dee-SYON seel voo PLEH', category: 'food' },
    { english: 'A coffee please', local: 'Un café s\'il vous plaît', phonetic: 'uhn ka-FEH seel voo PLEH', category: 'food' },
    { english: 'Delicious!', local: 'Délicieux!', phonetic: 'deh-lee-SYUH!', category: 'food' },
    { english: 'Water please', local: 'De l\'eau s\'il vous plaît', phonetic: 'duh LOH seel voo PLEH', category: 'food' },
    { english: 'Where is...?', local: 'Où est...?', phonetic: 'oo EH...?', category: 'directions' },
    { english: 'Bathroom?', local: 'Où sont les toilettes?', phonetic: 'oo son leh twa-LET?', category: 'directions' },
    { english: 'Help!', local: 'Au secours!', phonetic: 'oh suh-KOOR!', category: 'emergency' },
    { english: 'How much?', local: 'Combien?', phonetic: 'kom-BYAN?', category: 'shopping' },
    { english: 'Cheers!', local: 'Santé!', phonetic: 'son-TAY!', category: 'social' },
  ],
};

// ---------------------------------------------------------------------------
// Portuguese — Lisbon
// ---------------------------------------------------------------------------
const PORTUGUESE: LanguagePack = {
  language: 'Portuguese',
  destinations: ['Lisbon'],
  flag: 'PT',
  phrases: [
    { english: 'Hello', local: 'Olá', phonetic: 'oh-LAH', category: 'greetings' },
    { english: 'Thank you', local: 'Obrigado/a', phonetic: 'oh-bree-GAH-do/dah', category: 'greetings' },
    { english: 'Please', local: 'Por favor', phonetic: 'por fah-VOR', category: 'greetings' },
    { english: 'Excuse me', local: 'Com licença', phonetic: 'kom lee-SEN-sah', category: 'greetings' },
    { english: 'The bill please', local: 'A conta por favor', phonetic: 'ah KON-tah por fah-VOR', category: 'food' },
    { english: 'A coffee please', local: 'Um café por favor', phonetic: 'oom kah-FEH por fah-VOR', category: 'food' },
    { english: 'Delicious!', local: 'Delicioso!', phonetic: 'deh-li-SYOH-zoo!', category: 'food' },
    { english: 'Where is...?', local: 'Onde fica...?', phonetic: 'ON-deh FEE-kah...?', category: 'directions' },
    { english: 'Help!', local: 'Socorro!', phonetic: 'so-KO-ho!', category: 'emergency' },
    { english: 'How much?', local: 'Quanto custa?', phonetic: 'KWAN-to KOOSH-tah?', category: 'shopping' },
    { english: 'Cheers!', local: 'Saúde!', phonetic: 'sah-OO-deh!', category: 'social' },
  ],
};

// ---------------------------------------------------------------------------
// Arabic — Marrakech, Dubai
// ---------------------------------------------------------------------------
const ARABIC: LanguagePack = {
  language: 'Arabic (Moroccan)',
  destinations: ['Marrakech', 'Dubai'],
  flag: 'MX',
  phrases: [
    { english: 'Hello', local: 'السلام عليكم', phonetic: 'as-sa-LAA-mu a-LAY-kum', category: 'greetings' },
    { english: 'Thank you', local: 'شكرا', phonetic: 'SHUK-ran', category: 'greetings' },
    { english: 'Please', local: 'من فضلك', phonetic: 'min FAD-lak', category: 'greetings' },
    { english: 'Yes / No', local: 'نعم / لا', phonetic: 'NA-am / LA', category: 'greetings' },
    { english: 'The bill please', local: 'الحساب من فضلك', phonetic: 'al-hi-SAAB min FAD-lak', category: 'food' },
    { english: 'Water please', local: 'ماء من فضلك', phonetic: 'MA min FAD-lak', category: 'food' },
    { english: 'Delicious!', local: 'لذيذ!', phonetic: 'la-ZEEZ!', category: 'food' },
    { english: 'Where is...?', local: 'أين...؟', phonetic: 'AY-na...?', category: 'directions' },
    { english: 'Help!', local: '!النجدة', phonetic: 'an-NAJ-da!', category: 'emergency' },
    { english: 'How much?', local: 'بكم؟', phonetic: 'bi-KAM?', category: 'shopping' },
    { english: 'Too expensive', local: 'غالي بزاف', phonetic: 'GHA-lee biz-ZAF', category: 'shopping' },
    { english: 'Cheers!', local: 'بالصحة!', phonetic: 'bis-SAH-ha!', category: 'social' },
  ],
};

// ---------------------------------------------------------------------------
// Indonesian — Bali
// ---------------------------------------------------------------------------
const INDONESIAN: LanguagePack = {
  language: 'Indonesian',
  destinations: ['Bali'],
  flag: 'IE',
  phrases: [
    { english: 'Hello', local: 'Halo', phonetic: 'HAH-lo', category: 'greetings' },
    { english: 'Thank you', local: 'Terima kasih', phonetic: 'teh-REE-mah KAH-see', category: 'greetings' },
    { english: 'Please', local: 'Tolong', phonetic: 'TOH-long', category: 'greetings' },
    { english: 'Excuse me', local: 'Permisi', phonetic: 'per-MEE-see', category: 'greetings' },
    { english: 'The bill please', local: 'Minta bill', phonetic: 'MIN-tah bill', category: 'food' },
    { english: 'Delicious!', local: 'Enak sekali!', phonetic: 'eh-NAK suh-KAH-lee!', category: 'food' },
    { english: 'Not spicy', local: 'Tidak pedas', phonetic: 'TEE-dak PEH-das', category: 'food' },
    { english: 'Where is...?', local: 'Di mana...?', phonetic: 'dee MAH-nah...?', category: 'directions' },
    { english: 'Help!', local: 'Tolong!', phonetic: 'TOH-long!', category: 'emergency' },
    { english: 'How much?', local: 'Berapa?', phonetic: 'beh-RAH-pah?', category: 'shopping' },
    { english: 'Too expensive', local: 'Terlalu mahal', phonetic: 'ter-LAH-loo MAH-hal', category: 'shopping' },
    { english: 'Cheers!', local: 'Bersulang!', phonetic: 'ber-SOO-lang!', category: 'social' },
  ],
};

// ---------------------------------------------------------------------------
// Greek — Santorini, Athens
// ---------------------------------------------------------------------------
const GREEK: LanguagePack = {
  language: 'Greek',
  destinations: ['Santorini', 'Athens'],
  flag: 'GR',
  phrases: [
    { english: 'Hello', local: 'Γεια σας', phonetic: 'YAH-sas', category: 'greetings' },
    { english: 'Thank you', local: 'Ευχαριστώ', phonetic: 'ef-ha-ree-STOH', category: 'greetings' },
    { english: 'Please', local: 'Παρακαλώ', phonetic: 'pa-ra-ka-LOH', category: 'greetings' },
    { english: 'The bill please', local: 'Τον λογαριασμό', phonetic: 'ton lo-ga-ree-az-MOH', category: 'food' },
    { english: 'Delicious!', local: 'Νόστιμο!', phonetic: 'NO-stee-mo!', category: 'food' },
    { english: 'Water please', local: 'Νερό παρακαλώ', phonetic: 'ne-ROH pa-ra-ka-LOH', category: 'food' },
    { english: 'Where is...?', local: 'Πού είναι...;', phonetic: 'POO EE-neh...?', category: 'directions' },
    { english: 'Help!', local: 'Βοήθεια!', phonetic: 'vo-EE-thee-ah!', category: 'emergency' },
    { english: 'How much?', local: 'Πόσο κάνει;', phonetic: 'PO-so KAH-nee?', category: 'shopping' },
    { english: 'Cheers!', local: 'Στην υγειά μας!', phonetic: 'steen ee-YAH mas!', category: 'social' },
  ],
};

// ---------------------------------------------------------------------------
// English — New York, London, Sydney (local phrases + slang)
// ---------------------------------------------------------------------------
const ENGLISH: LanguagePack = {
  language: 'English',
  destinations: ['New York', 'London', 'Sydney', 'Cape Town'],
  flag: '',
  phrases: [
    { english: 'Cheers', local: 'Cheers', phonetic: 'cheerz', category: 'social' },
    { english: 'Thanks mate', local: 'Ta', phonetic: 'tah', category: 'greetings' },
    { english: 'No worries', local: 'No worries', phonetic: 'no WUR-eez', category: 'greetings' },
    { english: 'The check please', local: 'Check please', phonetic: 'check PLEEZ', category: 'food' },
    { english: 'Where is...?', local: 'Where is...?', phonetic: 'ware iz...?', category: 'directions' },
    { english: 'Help!', local: 'Help!', phonetic: 'help', category: 'emergency' },
    { english: 'How much?', local: 'How much?', phonetic: 'how much', category: 'shopping' },
  ],
};

// ---------------------------------------------------------------------------
// Icelandic — Reykjavik
// ---------------------------------------------------------------------------
const ICELANDIC: LanguagePack = {
  language: 'Icelandic',
  destinations: ['Reykjavik'],
  flag: 'ES',
  phrases: [
    { english: 'Hello', local: 'Halló', phonetic: 'HAH-lo', category: 'greetings' },
    { english: 'Thank you', local: 'Takk', phonetic: 'TAHK', category: 'greetings' },
    { english: 'Please', local: 'Vinsamlegast', phonetic: 'VIN-sam-le-gast', category: 'greetings' },
    { english: 'The bill please', local: 'Reikninginn takk', phonetic: 'RAYK-ning-inn TAHK', category: 'food' },
    { english: 'Delicious!', local: 'Ljúffengt!', phonetic: 'LYOOF-fengt!', category: 'food' },
    { english: 'Where is...?', local: 'Hvar er...?', phonetic: 'KVAR er...?', category: 'directions' },
    { english: 'Help!', local: 'Hjálp!', phonetic: 'HYOWLP!', category: 'emergency' },
    { english: 'How much?', local: 'Hvað kostar?', phonetic: 'KVATH KOS-tar?', category: 'shopping' },
    { english: 'Cheers!', local: 'Skál!', phonetic: 'SKOWL!', category: 'social' },
  ],
};

// ---------------------------------------------------------------------------
// Export all language packs
// ---------------------------------------------------------------------------
export const LANGUAGE_PACKS: LanguagePack[] = [
  JAPANESE,
  THAI,
  SPANISH,
  ITALIAN,
  FRENCH,
  PORTUGUESE,
  ARABIC,
  INDONESIAN,
  GREEK,
  ICELANDIC,
  ENGLISH,
];

/** Find the best language pack for a destination */
export function getLanguagePackForDestination(destination: string): LanguagePack | null {
  return LANGUAGE_PACKS.find((pack) =>
    pack.destinations.some((d) => destination.toLowerCase().includes(d.toLowerCase()))
  ) ?? null;
}

/** Category labels for display */
export const PHRASE_CATEGORIES: Record<string, { label: string; emoji: string }> = {
  greetings: { label: 'Greetings', emoji: '' },
  food: { label: 'Food & Drink', emoji: '' },
  directions: { label: 'Getting Around', emoji: '' },
  emergency: { label: 'Emergency', emoji: '' },
  transport: { label: 'Transport', emoji: '' },
  shopping: { label: 'Shopping', emoji: '' },
  social: { label: 'Social', emoji: '' },
};
