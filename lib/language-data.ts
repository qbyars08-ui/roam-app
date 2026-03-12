// =============================================================================
// ROAM — Language Survival AI
// 50 essential phrases per top 10 destination
// Categories: Food | Transport | Emergency | Shopping | Greetings | Nightlife
// Mapped to itinerary stops for context ("At Tsukiji Market you'll need...")
// =============================================================================

export type PhraseCategory = 'food' | 'transport' | 'emergency' | 'shopping' | 'greetings' | 'nightlife';

export interface Phrase {
  local: string;
  english: string;
  phonetic: string;
  category: PhraseCategory;
  /** Optional: itinerary stop where this phrase is especially useful */
  atStop?: string;
}

export interface DestinationPack {
  city: string;
  language: string;
  langCode: string; // for expo-speech
  flag: string;
  phrases: Phrase[];
}

/** Extended pack with location hints and native phrase format (for prep/location-aware flows) */
export interface LocationHint {
  stop: string;
  hint: string;
  categories: PhraseCategory[];
}

export interface NativePhrase {
  native: string;
  english: string;
  phonetic: string;
  category: PhraseCategory;
}

export interface LanguagePack {
  destination: string;
  language: string;
  flag: string;
  speechCode: string;
  locationHints: LocationHint[];
  phrases: NativePhrase[];
}

export const PHRASE_CATEGORIES: Record<PhraseCategory, { label: string; emoji: string }> = {
  greetings: { label: 'Greetings', emoji: '' },
  food: { label: 'Food & Drink', emoji: '' },
  transport: { label: 'Transport', emoji: '' },
  emergency: { label: 'Emergency', emoji: '' },
  shopping: { label: 'Shopping', emoji: '' },
  nightlife: { label: 'Nightlife', emoji: '' },
};

// -----------------------------------------------------------------------------
// TOKYO — Japanese
// -----------------------------------------------------------------------------
const TOKYO: DestinationPack = {
  city: 'Tokyo',
  language: 'Japanese',
  langCode: 'ja-JP',
  flag: 'JP',
  phrases: [
    { local: 'こんにちは', english: 'Hello', phonetic: 'kon-NI-chi-wa', category: 'greetings' },
    { local: 'ありがとうございます', english: 'Thank you', phonetic: 'a-ri-GA-to go-zai-MAS', category: 'greetings' },
    { local: 'すみません', english: 'Excuse me', phonetic: 'su-mi-ma-SEN', category: 'greetings' },
    { local: 'ごめんなさい', english: 'Sorry', phonetic: 'go-men-na-SAI', category: 'greetings' },
    { local: 'はい / いいえ', english: 'Yes / No', phonetic: 'HAI / ee-EH', category: 'greetings' },
    { local: 'おはようございます', english: 'Good morning', phonetic: 'o-ha-YO go-zai-MAS', category: 'greetings' },
    { local: 'こんばんは', english: 'Good evening', phonetic: 'kon-BAN-wa', category: 'greetings' },
    { local: 'さようなら', english: 'Goodbye', phonetic: 'sa-yo-na-RA', category: 'greetings' },
    { local: 'お会計お願いします', english: 'The bill please', phonetic: 'o-KAI-kei o-ne-gai shi-MAS', category: 'food', atStop: 'Tsukiji Market' },
    { local: '水をください', english: 'Water please', phonetic: 'mi-ZU o ku-da-SAI', category: 'food' },
    { local: 'おいしい！', english: 'This is delicious', phonetic: 'oi-SHI-i', category: 'food' },
    { local: 'ベジタリアンです', english: 'I\'m vegetarian', phonetic: 'be-ji-TA-ri-an des', category: 'food' },
    { local: '肉なしでお願いします', english: 'No meat please', phonetic: 'NI-ku na-shi de o-ne-gai shi-MAS', category: 'food' },
    { local: 'おすすめは？', english: 'Recommendation?', phonetic: 'o-SU-su-me wa?', category: 'food' },
    { local: 'ビールをください', english: 'Beer please', phonetic: 'BI-ru o ku-da-SAI', category: 'food' },
    { local: 'いただきます', english: 'Let\'s eat (before meal)', phonetic: 'i-ta-da-ki-MAS', category: 'food', atStop: 'Tsukiji Market' },
    { local: 'お腹いっぱいです', english: 'I\'m full', phonetic: 'o-na-ka ip-pai des', category: 'food' },
    { local: 'これをください', english: 'I\'ll have this', phonetic: 'ko-RE o ku-da-SAI', category: 'food' },
    { local: 'アレルギーがあります', english: 'I\'m allergic to...', phonetic: 'a-RE-ru-gi ga a-ri-MAS', category: 'food' },
    { local: '...はどこですか？', english: 'Where is...?', phonetic: '... wa DO-ko des-ka?', category: 'transport' },
    { local: '駅はどこですか？', english: 'Where is the station?', phonetic: 'E-ki wa DO-ko des-ka?', category: 'transport' },
    { local: 'トイレはどこですか？', english: 'Bathroom?', phonetic: 'TOI-re wa DO-ko des-ka?', category: 'transport' },
    { local: '左 / 右 / まっすぐ', english: 'Left / Right / Straight', phonetic: 'hi-DA-ri / MI-gi / mas-SU-gu', category: 'transport' },
    { local: '...まで一枚', english: 'One ticket to...', phonetic: '... MA-de i-chi-MAI', category: 'transport' },
    { local: '次の駅は？', english: 'Next stop?', phonetic: 'TSU-gi no E-ki wa?', category: 'transport' },
    { local: 'タクシー乗り場は？', english: 'Where is the taxi stand?', phonetic: 'ta-ku-SHI-i no-ri-BA wa?', category: 'transport' },
    { local: '助けて！', english: 'Help!', phonetic: 'ta-SU-ke-te!', category: 'emergency' },
    { local: '医者が必要です', english: 'I need a doctor', phonetic: 'I-sha ga hi-tsu-YO des', category: 'emergency' },
    { local: '警察を呼んでください', english: 'Call the police', phonetic: 'kei-SA-tsu o YON-de ku-da-SAI', category: 'emergency' },
    { local: '病院はどこですか', english: 'Where is the hospital?', phonetic: 'byo-in wa DO-ko des-ka?', category: 'emergency' },
    { local: 'いくらですか？', english: 'How much?', phonetic: 'I-ku-ra des-ka?', category: 'shopping' },
    { local: '高すぎます', english: 'Too expensive', phonetic: 'ta-ka-SU-gi-mas', category: 'shopping' },
    { local: 'これをください', english: 'I want this one', phonetic: 'ko-RE o ku-da-SAI', category: 'shopping', atStop: 'Shibuya' },
    { local: 'もう少し安くできますか？', english: 'Can you go lower?', phonetic: 'mo su-ko-shi ya-su-ku de-ki-mas-ka?', category: 'shopping' },
    { local: '試着してもいいですか？', english: 'Can I try this on?', phonetic: 'shi-chaku shi-te mo ii des-ka?', category: 'shopping' },
    { local: '乾杯！', english: 'Cheers!', phonetic: 'KAN-pai!', category: 'nightlife', atStop: 'Golden Gai' },
    { local: 'もう一杯お願いします', english: 'Another round please', phonetic: 'mo ip-pai o-ne-gai shi-MAS', category: 'nightlife' },
    { local: 'ウイスキーをください', english: 'Whiskey please', phonetic: 'wi-SU-ki o ku-da-SAI', category: 'nightlife' },
    { local: '払い割りで', english: 'Separate checks please', phonetic: 'ha-rai-WA-ri de', category: 'nightlife' },
    { local: '禁煙席ありますか？', english: 'Do you have non-smoking?', phonetic: 'kin-EN seki a-ri-mas-ka?', category: 'nightlife' },
  ],
};

// -----------------------------------------------------------------------------
// BALI — Indonesian
// -----------------------------------------------------------------------------
const BALI: DestinationPack = {
  city: 'Bali',
  language: 'Indonesian',
  langCode: 'id-ID',
  flag: 'ID',
  phrases: [
    { local: 'Halo', english: 'Hello', phonetic: 'HAH-lo', category: 'greetings' },
    { local: 'Terima kasih', english: 'Thank you', phonetic: 'teh-REE-mah KAH-see', category: 'greetings' },
    { local: 'Tolong', english: 'Please', phonetic: 'TOH-long', category: 'greetings' },
    { local: 'Permisi', english: 'Excuse me', phonetic: 'per-MEE-see', category: 'greetings' },
    { local: 'Ya / Tidak', english: 'Yes / No', phonetic: 'ya / TEE-dak', category: 'greetings' },
    { local: 'Selamat pagi', english: 'Good morning', phonetic: 'se-LAH-mat PAH-gee', category: 'greetings' },
    { local: 'Selamat malam', english: 'Good night', phonetic: 'se-LAH-mat ma-LAM', category: 'greetings' },
    { local: 'Sampai jumpa', english: 'Goodbye', phonetic: 'sam-PAI JOOM-pah', category: 'greetings' },
    { local: 'Minta bill', english: 'The bill please', phonetic: 'MIN-tah bill', category: 'food' },
    { local: 'Enak sekali!', english: 'Delicious!', phonetic: 'eh-NAK suh-KAH-lee!', category: 'food', atStop: 'Warung' },
    { local: 'Tidak pedas', english: 'Not spicy', phonetic: 'TEE-dak PEH-das', category: 'food' },
    { local: 'Air putih', english: 'Water', phonetic: 'a-ir poo-EE-tee', category: 'food' },
    { local: 'Biru', english: 'Beer', phonetic: 'BEE-roo', category: 'food' },
    { local: 'Saya vegetarian', english: 'I\'m vegetarian', phonetic: 'SAH-yah ve-ji-TA-ri-an', category: 'food' },
    { local: 'Tidak pakai daging', english: 'No meat', phonetic: 'TEE-dak PAH-kai DAH-ging', category: 'food' },
    { local: 'Bisa kurangi pedas?', english: 'Can you make it less spicy?', phonetic: 'BEE-sa ku-RAN-gee PEH-das?', category: 'food' },
    { local: 'Satu lagi', english: 'One more', phonetic: 'SAH-too LAH-gee', category: 'food' },
    { local: 'Di mana...?', english: 'Where is...?', phonetic: 'dee MAH-nah...?', category: 'transport' },
    { local: 'Berapa ke...?', english: 'How much to...?', phonetic: 'be-RAH-pah ke...?', category: 'transport' },
    { local: 'Mau ke bandara', english: 'I want to go to the airport', phonetic: 'mow ke ban-DAH-rah', category: 'transport' },
    { local: 'Berhenti di sini', english: 'Stop here', phonetic: 'ber-HEN-tee dee SEE-nee', category: 'transport' },
    { local: 'Nyalakan meter', english: 'Turn on the meter', phonetic: 'nya-LAH-kan ME-ter', category: 'transport' },
    { local: 'Tolong!', english: 'Help!', phonetic: 'TOH-long!', category: 'emergency' },
    { local: 'Saya butuh dokter', english: 'I need a doctor', phonetic: 'SAH-yah BOO-too DOK-ter', category: 'emergency' },
    { local: 'Rumah sakit', english: 'Hospital', phonetic: 'ROO-mah SAH-keet', category: 'emergency' },
    { local: 'Polisi', english: 'Police', phonetic: 'po-LEE-see', category: 'emergency' },
    { local: 'Berapa?', english: 'How much?', phonetic: 'be-RAH-pah?', category: 'shopping', atStop: 'Ubud Market' },
    { local: 'Terlalu mahal', english: 'Too expensive', phonetic: 'ter-LAH-loo MAH-hal', category: 'shopping' },
    { local: 'Kurang bisa?', english: 'Can you go lower?', phonetic: 'KOO-rang BEE-sa?', category: 'shopping' },
    { local: 'Saya lihat saja', english: 'Just looking', phonetic: 'SAH-yah LEE-hat SAH-jah', category: 'shopping' },
    { local: 'Bersulang!', english: 'Cheers!', phonetic: 'ber-SOO-lang!', category: 'nightlife', atStop: 'Seminyak' },
    { local: 'Satu bir', english: 'One beer', phonetic: 'SAH-too beer', category: 'nightlife' },
    { local: 'Koktail', english: 'Cocktail', phonetic: 'KOK-tail', category: 'nightlife' },
    { local: 'Bayar terpisah', english: 'Separate checks', phonetic: 'BAH-yar ter-PEE-sah', category: 'nightlife' },
  ],
};

// -----------------------------------------------------------------------------
// BANGKOK — Thai
// -----------------------------------------------------------------------------
const BANGKOK: DestinationPack = {
  city: 'Bangkok',
  language: 'Thai',
  langCode: 'th-TH',
  flag: 'TH',
  phrases: [
    { local: 'สวัสดีครับ/ค่ะ', english: 'Hello', phonetic: 'sa-wat-DEE krap/ka', category: 'greetings' },
    { local: 'ขอบคุณครับ/ค่ะ', english: 'Thank you', phonetic: 'kop-KHUN krap/ka', category: 'greetings' },
    { local: 'ขอโทษครับ/ค่ะ', english: 'Sorry / Excuse me', phonetic: 'kor-TOHT krap/ka', category: 'greetings' },
    { local: 'ใช่ / ไม่ใช่', english: 'Yes / No', phonetic: 'chai / mai chai', category: 'greetings' },
    { local: 'ไม่เป็นไร', english: 'No problem', phonetic: 'mai pen rai', category: 'greetings' },
    { local: 'เช็คบิลครับ/ค่ะ', english: 'The bill please', phonetic: 'chek bin krap/ka', category: 'food', atStop: 'Yaowarat' },
    { local: 'ไม่เผ็ดครับ/ค่ะ', english: 'Not spicy please', phonetic: 'mai PET krap/ka', category: 'food' },
    { local: 'อร่อย!', english: 'Delicious!', phonetic: 'a-ROI!', category: 'food' },
    { local: 'น้ำเปล่าครับ/ค่ะ', english: 'Water please', phonetic: 'nam plao krap/ka', category: 'food' },
    { local: 'ไม่ใส่น้ำตาล', english: 'No sugar', phonetic: 'mai sai nam tan', category: 'food' },
    { local: 'อีกหนึ่งครับ/ค่ะ', english: 'One more please', phonetic: 'eek neung krap/ka', category: 'food' },
    { local: '...อยู่ที่ไหน', english: 'Where is...?', phonetic: '... yoo tee nai', category: 'transport' },
    { local: 'ห้องน้ำอยู่ที่ไหน', english: 'Bathroom?', phonetic: 'hong nam yoo tee nai', category: 'transport' },
    { local: 'ไป...เท่าไหร่', english: 'How much to...?', phonetic: 'bpai ... TAO-rai', category: 'transport' },
    { local: 'เปิดมิเตอร์ครับ/ค่ะ', english: 'Turn on the meter', phonetic: 'bpert mi-ter krap/ka', category: 'transport' },
    { local: 'จอดตรงนี้ครับ/ค่ะ', english: 'Stop here', phonetic: 'jot trong nee krap/ka', category: 'transport' },
    { local: 'ช่วยด้วย!', english: 'Help!', phonetic: 'CHUAY duay!', category: 'emergency' },
    { local: 'โรงพยาบาล', english: 'Hospital', phonetic: 'rong pa-ya-BAAN', category: 'emergency' },
    { local: 'ตำรวจ', english: 'Police', phonetic: 'tam-RUAT', category: 'emergency' },
    { local: 'เท่าไหร่', english: 'How much?', phonetic: 'tao-RAI', category: 'shopping', atStop: 'Chatuchak' },
    { local: 'แพงไป', english: 'Too expensive', phonetic: 'paeng bpai', category: 'shopping' },
    { local: 'ลดหน่อยได้ไหม', english: 'Can you lower the price?', phonetic: 'lot noi dai mai', category: 'shopping' },
    { local: 'ชนแก้ว!', english: 'Cheers!', phonetic: 'chon gaew!', category: 'nightlife', atStop: 'Khao San' },
  ],
};

// -----------------------------------------------------------------------------
// LISBON — Portuguese
// -----------------------------------------------------------------------------
const LISBON: DestinationPack = {
  city: 'Lisbon',
  language: 'Portuguese',
  langCode: 'pt-PT',
  flag: 'PT',
  phrases: [
    { local: 'Olá', english: 'Hello', phonetic: 'oh-LAH', category: 'greetings' },
    { local: 'Obrigado/a', english: 'Thank you', phonetic: 'oh-bree-GAH-do/dah', category: 'greetings' },
    { local: 'Por favor', english: 'Please', phonetic: 'por fah-VOR', category: 'greetings' },
    { local: 'Com licença', english: 'Excuse me', phonetic: 'kom lee-SEN-sah', category: 'greetings' },
    { local: 'Sim / Não', english: 'Yes / No', phonetic: 'seeng / now', category: 'greetings' },
    { local: 'Bom dia', english: 'Good morning', phonetic: 'bong DEE-ah', category: 'greetings' },
    { local: 'A conta por favor', english: 'The bill please', phonetic: 'ah KON-tah por fah-VOR', category: 'food', atStop: 'Time Out Market' },
    { local: 'Um café por favor', english: 'A coffee please', phonetic: 'oom kah-FEH por fah-VOR', category: 'food' },
    { local: 'Delicioso!', english: 'Delicious!', phonetic: 'deh-li-SYOH-zoo!', category: 'food' },
    { local: 'Água por favor', english: 'Water please', phonetic: 'AH-gwah por fah-VOR', category: 'food' },
    { local: 'Sou vegetariano/a', english: 'I\'m vegetarian', phonetic: 'so veh-jeh-ta-ree-AH-no/dah', category: 'food' },
    { local: 'Onde fica...?', english: 'Where is...?', phonetic: 'ON-deh FEE-kah...?', category: 'transport' },
    { local: 'Onde está a casa de banho?', english: 'Bathroom?', phonetic: 'ON-deh es-TAH ah KAH-zah deh BAN-yoo?', category: 'transport' },
    { local: 'Quanto custa o bilhete?', english: 'How much is the ticket?', phonetic: 'KWAN-to KOOSH-tah o bee-LYEH-te?', category: 'transport' },
    { local: 'Socorro!', english: 'Help!', phonetic: 'so-KO-ho!', category: 'emergency' },
    { local: 'Preciso de um médico', english: 'I need a doctor', phonetic: 'preh-SEE-zoo deh oom MEH-dee-koo', category: 'emergency' },
    { local: 'Quanto custa?', english: 'How much?', phonetic: 'KWAN-to KOOSH-tah?', category: 'shopping' },
    { local: 'Muito caro', english: 'Too expensive', phonetic: 'MWEE-too KAH-roo', category: 'shopping' },
    { local: 'Saúde!', english: 'Cheers!', phonetic: 'sah-OO-deh!', category: 'nightlife', atStop: 'Bairro Alto' },
  ],
};

// -----------------------------------------------------------------------------
// PARIS — French
// -----------------------------------------------------------------------------
const PARIS: DestinationPack = {
  city: 'Paris',
  language: 'French',
  langCode: 'fr-FR',
  flag: '🇫🇷',
  phrases: [
    { local: 'Bonjour', english: 'Hello', phonetic: 'bon-ZHOOR', category: 'greetings' },
    { local: 'Merci', english: 'Thank you', phonetic: 'mer-SEE', category: 'greetings' },
    { local: 'S\'il vous plaît', english: 'Please', phonetic: 'seel voo PLEH', category: 'greetings' },
    { local: 'Excusez-moi', english: 'Excuse me', phonetic: 'ex-koo-ZAY mwah', category: 'greetings' },
    { local: 'Oui / Non', english: 'Yes / No', phonetic: 'wee / non', category: 'greetings' },
    { local: 'L\'addition s\'il vous plaît', english: 'The bill please', phonetic: 'lah-dee-SYON seel voo PLEH', category: 'food', atStop: 'Café' },
    { local: 'Un café s\'il vous plaît', english: 'A coffee please', phonetic: 'uhn ka-FEH seel voo PLEH', category: 'food' },
    { local: 'De l\'eau s\'il vous plaît', english: 'Water please', phonetic: 'duh LOH seel voo PLEH', category: 'food' },
    { local: 'Délicieux!', english: 'Delicious!', phonetic: 'deh-lee-SYUH!', category: 'food' },
    { local: 'Je suis végétarien/ne', english: 'I\'m vegetarian', phonetic: 'zhuh swee veh-zhay-ta-ree-AN/ne', category: 'food' },
    { local: 'Où est...?', english: 'Where is...?', phonetic: 'oo EH...?', category: 'transport' },
    { local: 'Où sont les toilettes?', english: 'Bathroom?', phonetic: 'oo son leh twa-LET?', category: 'transport' },
    { local: 'Où est la station de métro?', english: 'Where is the metro?', phonetic: 'oo eh lah sta-SYON duh meh-TRO?', category: 'transport' },
    { local: 'Au secours!', english: 'Help!', phonetic: 'oh suh-KOOR!', category: 'emergency' },
    { local: 'J\'ai besoin d\'un médecin', english: 'I need a doctor', phonetic: 'zhay buh-ZWAN dun meh-de-SAN', category: 'emergency' },
    { local: 'Combien?', english: 'How much?', phonetic: 'kom-BYAN?', category: 'shopping' },
    { local: 'C\'est trop cher', english: 'Too expensive', phonetic: 'seh troh SHER', category: 'shopping' },
    { local: 'Santé!', english: 'Cheers!', phonetic: 'son-TAY!', category: 'nightlife', atStop: 'Montmartre' },
  ],
};

// -----------------------------------------------------------------------------
// BARCELONA — Spanish
// -----------------------------------------------------------------------------
const BARCELONA: DestinationPack = {
  city: 'Barcelona',
  language: 'Spanish',
  langCode: 'es-ES',
  flag: 'ES',
  phrases: [
    { local: 'Hola', english: 'Hello', phonetic: 'OH-lah', category: 'greetings' },
    { local: 'Gracias', english: 'Thank you', phonetic: 'GRAH-syahs', category: 'greetings' },
    { local: 'Por favor', english: 'Please', phonetic: 'por fah-VOR', category: 'greetings' },
    { local: 'Disculpe', english: 'Excuse me', phonetic: 'dis-KOOL-peh', category: 'greetings' },
    { local: 'Sí / No', english: 'Yes / No', phonetic: 'see / no', category: 'greetings' },
    { local: 'La cuenta por favor', english: 'The bill please', phonetic: 'lah KWEN-tah por fah-VOR', category: 'food', atStop: 'La Boqueria' },
    { local: 'Agua por favor', english: 'Water please', phonetic: 'AH-gwah por fah-VOR', category: 'food' },
    { local: '¡Muy delicioso!', english: 'Very delicious!', phonetic: 'mooy de-li-SYO-so', category: 'food' },
    { local: 'Soy vegetariano/a', english: 'I\'m vegetarian', phonetic: 'soy veh-heh-ta-ree-AH-no/dah', category: 'food' },
    { local: 'Una cerveza por favor', english: 'A beer please', phonetic: 'OO-nah ser-VEH-sah por fah-VOR', category: 'food' },
    { local: '¿Dónde está...?', english: 'Where is...?', phonetic: 'DON-deh es-TAH...?', category: 'transport' },
    { local: '¿Dónde está el baño?', english: 'Bathroom?', phonetic: 'DON-deh es-TAH el BAN-yo?', category: 'transport' },
    { local: '¿Cuánto a...?', english: 'How much to...?', phonetic: 'KWAN-to ah...?', category: 'transport' },
    { local: '¡Ayuda!', english: 'Help!', phonetic: 'ah-YOO-dah!', category: 'emergency' },
    { local: 'Necesito un médico', english: 'I need a doctor', phonetic: 'neh-seh-SEE-to oon MEH-dee-ko', category: 'emergency' },
    { local: '¿Cuánto cuesta?', english: 'How much?', phonetic: 'KWAN-to KWES-tah?', category: 'shopping' },
    { local: 'Muy caro', english: 'Too expensive', phonetic: 'mooy KAH-ro', category: 'shopping' },
    { local: '¡Salud!', english: 'Cheers!', phonetic: 'sah-LOOD!', category: 'nightlife', atStop: 'El Born' },
  ],
};

// -----------------------------------------------------------------------------
// ROME — Italian
// -----------------------------------------------------------------------------
const ROME: DestinationPack = {
  city: 'Rome',
  language: 'Italian',
  langCode: 'it-IT',
  flag: 'IT',
  phrases: [
    { local: 'Ciao', english: 'Hello', phonetic: 'CHOW', category: 'greetings' },
    { local: 'Grazie', english: 'Thank you', phonetic: 'GRAH-tsyeh', category: 'greetings' },
    { local: 'Per favore', english: 'Please', phonetic: 'per fah-VO-reh', category: 'greetings' },
    { local: 'Scusi', english: 'Excuse me', phonetic: 'SKOO-zee', category: 'greetings' },
    { local: 'Sì / No', english: 'Yes / No', phonetic: 'see / no', category: 'greetings' },
    { local: 'Il conto per favore', english: 'The bill please', phonetic: 'il KON-to per fah-VO-reh', category: 'food', atStop: 'Trastevere' },
    { local: 'Un caffè per favore', english: 'A coffee please', phonetic: 'oon kaf-FEH per fah-VO-reh', category: 'food' },
    { local: 'Buonissimo!', english: 'Delicious!', phonetic: 'bwo-NIS-si-mo!', category: 'food' },
    { local: 'Acqua naturale per favore', english: 'Still water please', phonetic: 'AK-wah na-too-RAH-leh per fah-VO-reh', category: 'food' },
    { local: 'Sono vegetariano/a', english: 'I\'m vegetarian', phonetic: 'SO-no veh-jeh-ta-ree-AH-no/dah', category: 'food' },
    { local: 'Dove è...?', english: 'Where is...?', phonetic: 'DO-veh eh...?', category: 'transport' },
    { local: 'Dov\'è il bagno?', english: 'Bathroom?', phonetic: 'do-VEH il BAN-yo?', category: 'transport' },
    { local: 'Aiuto!', english: 'Help!', phonetic: 'ah-YOO-to!', category: 'emergency' },
    { local: 'Ho bisogno di un medico', english: 'I need a doctor', phonetic: 'oh bee-ZON-yo dee oon MEH-dee-ko', category: 'emergency' },
    { local: 'Quanto costa?', english: 'How much?', phonetic: 'KWAN-to KOS-tah?', category: 'shopping' },
    { local: 'Troppo caro', english: 'Too expensive', phonetic: 'TROP-po KAH-ro', category: 'shopping' },
    { local: 'Cin cin!', english: 'Cheers!', phonetic: 'chin chin!', category: 'nightlife', atStop: 'Trastevere' },
  ],
};

// -----------------------------------------------------------------------------
// AMSTERDAM — Dutch
// -----------------------------------------------------------------------------
const AMSTERDAM: DestinationPack = {
  city: 'Amsterdam',
  language: 'Dutch',
  langCode: 'nl-NL',
  flag: 'NL',
  phrases: [
    { local: 'Hallo', english: 'Hello', phonetic: 'HAH-lo', category: 'greetings' },
    { local: 'Dank je wel', english: 'Thank you', phonetic: 'dank yeh VEL', category: 'greetings' },
    { local: 'Alstublieft', english: 'Please', phonetic: 'al-stoo-BLEEFT', category: 'greetings' },
    { local: 'Sorry', english: 'Sorry', phonetic: 'SOR-ree', category: 'greetings' },
    { local: 'Ja / Nee', english: 'Yes / No', phonetic: 'yah / nay', category: 'greetings' },
    { local: 'De rekening graag', english: 'The bill please', phonetic: 'deh re-KEN-ing khrakh', category: 'food' },
    { local: 'Een koffie graag', english: 'A coffee please', phonetic: 'eyn KOF-fee khrakh', category: 'food' },
    { local: 'Lekker!', english: 'Delicious!', phonetic: 'LEK-ker!', category: 'food', atStop: 'De Pijp' },
    { local: 'Water graag', english: 'Water please', phonetic: 'VAH-ter khrakh', category: 'food' },
    { local: 'Ik ben vegetariër', english: 'I\'m vegetarian', phonetic: 'ik ben veh-heh-TAR-ee-er', category: 'food' },
    { local: 'Een biertje graag', english: 'A beer please', phonetic: 'eyn BEER-tyeh khrakh', category: 'food' },
    { local: 'Waar is...?', english: 'Where is...?', phonetic: 'var is...?', category: 'transport' },
    { local: 'Waar is het toilet?', english: 'Bathroom?', phonetic: 'var is het twa-LET?', category: 'transport' },
    { local: 'Help!', english: 'Help!', phonetic: 'help!', category: 'emergency' },
    { local: 'Hoeveel kost het?', english: 'How much?', phonetic: 'HOO-vel kost het?', category: 'shopping' },
    { local: 'Proost!', english: 'Cheers!', phonetic: 'proast!', category: 'nightlife', atStop: 'Jordaan' },
  ],
};

// -----------------------------------------------------------------------------
// PRAGUE — Czech
// -----------------------------------------------------------------------------
const PRAGUE: DestinationPack = {
  city: 'Prague',
  language: 'Czech',
  langCode: 'cs-CZ',
  flag: 'CZ',
  phrases: [
    { local: 'Dobrý den', english: 'Hello', phonetic: 'DOB-ree den', category: 'greetings' },
    { local: 'Děkuji', english: 'Thank you', phonetic: 'DYEH-koo-yee', category: 'greetings' },
    { local: 'Prosím', english: 'Please', phonetic: 'PRO-seem', category: 'greetings' },
    { local: 'Ano / Ne', english: 'Yes / No', phonetic: 'AH-no / neh', category: 'greetings' },
    { local: 'Účet prosím', english: 'The bill please', phonetic: 'OO-chet PRO-seem', category: 'food', atStop: 'Old Town' },
    { local: 'Pivo prosím', english: 'Beer please', phonetic: 'PEE-vo PRO-seem', category: 'food' },
    { local: 'Vodu prosím', english: 'Water please', phonetic: 'VO-doo PRO-seem', category: 'food' },
    { local: 'Kde je...?', english: 'Where is...?', phonetic: 'gdeh yeh...?', category: 'transport' },
    { local: 'Kde jsou toalety?', english: 'Bathroom?', phonetic: 'gdeh ysoh to-ah-LEH-tee?', category: 'transport' },
    { local: 'Pomoc!', english: 'Help!', phonetic: 'PO-mots!', category: 'emergency' },
    { local: 'Kolik to stojí?', english: 'How much?', phonetic: 'KO-lik to STOY-ee?', category: 'shopping' },
    { local: 'Na zdraví!', english: 'Cheers!', phonetic: 'nah ZDRAH-vee!', category: 'nightlife', atStop: 'Old Town Square' },
  ],
};

// -----------------------------------------------------------------------------
// BUDAPEST — Hungarian
// -----------------------------------------------------------------------------
const BUDAPEST: DestinationPack = {
  city: 'Budapest',
  language: 'Hungarian',
  langCode: 'hu-HU',
  flag: 'HU',
  phrases: [
    { local: 'Szia', english: 'Hello', phonetic: 'SEE-ah', category: 'greetings' },
    { local: 'Köszönöm', english: 'Thank you', phonetic: 'KUR-sur-nurm', category: 'greetings' },
    { local: 'Kérem', english: 'Please', phonetic: 'KAY-rem', category: 'greetings' },
    { local: 'Igen / Nem', english: 'Yes / No', phonetic: 'EE-gen / nem', category: 'greetings' },
    { local: 'A számlát kérem', english: 'The bill please', phonetic: 'ah SAHM-laht KAY-rem', category: 'food', atStop: 'Central Market' },
    { local: 'Egy sört kérek', english: 'A beer please', phonetic: 'edj shurt KAY-rek', category: 'food' },
    { local: 'Hol van...?', english: 'Where is...?', phonetic: 'hol vahn...?', category: 'transport' },
    { local: 'Hol van a mosdó?', english: 'Bathroom?', phonetic: 'hol vahn ah MUSH-doh?', category: 'transport' },
    { local: 'Segítség!', english: 'Help!', phonetic: 'SHEH-geet-sheg!', category: 'emergency' },
    { local: 'Mennyibe kerül?', english: 'How much?', phonetic: 'MEN-yee-beh KEH-rul?', category: 'shopping' },
    { local: 'Egészségére!', english: 'Cheers!', phonetic: 'EH-gaysh-shay-geh-reh!', category: 'nightlife', atStop: 'Ruin Bars' },
  ],
};

// -----------------------------------------------------------------------------
// Export & helpers
// -----------------------------------------------------------------------------
export const DESTINATION_PACKS: DestinationPack[] = [
  TOKYO, BALI, BANGKOK, LISBON, PARIS, BARCELONA, ROME, AMSTERDAM, PRAGUE, BUDAPEST,
];

export const TOP_10_CITIES = DESTINATION_PACKS.map((p) => p.city);

/** Get pack for a city name (case-insensitive) */
export function getPackForCity(city: string): DestinationPack | null {
  const k = city.toLowerCase();
  return DESTINATION_PACKS.find((p) => p.city.toLowerCase() === k) ?? null;
}

/** Get phrases for a specific category */
export function getPhrasesByCategory(pack: DestinationPack, category: PhraseCategory): Phrase[] {
  return pack.phrases.filter((p) => p.category === category);
}

// ---------------------------------------------------------------------------
// SPANISH (Catalan region) — Barcelona (LanguagePack with location hints)
// ---------------------------------------------------------------------------
const BARCELONA_LP: LanguagePack = {
  destination: 'Barcelona',
  language: 'Spanish',
  flag: 'ES',
  speechCode: 'es-ES',
  locationHints: [
    { stop: 'La Boqueria', hint: "At La Boqueria you'll need food & shopping phrases", categories: ['food', 'shopping'] },
    { stop: 'Sagrada Família', hint: "Visiting sights you'll need greetings & transport", categories: ['greetings', 'transport'] },
    { stop: 'El Raval', hint: "In El Raval you'll need nightlife phrases", categories: ['nightlife'] },
  ],
  phrases: [
    { native: 'Hola', english: 'Hello', phonetic: 'OH-lah', category: 'greetings' },
    { native: 'Gracias', english: 'Thank you', phonetic: 'GRAH-syahs', category: 'greetings' },
    { native: 'Por favor', english: 'Please', phonetic: 'por fah-VOR', category: 'greetings' },
    { native: 'Disculpe', english: 'Excuse me', phonetic: 'dis-KOOL-peh', category: 'greetings' },
    { native: 'Adiós', english: 'Goodbye', phonetic: 'ah-DYOHS', category: 'greetings' },
    { native: 'Sí / No', english: 'Yes / No', phonetic: 'see / noh', category: 'greetings' },
    { native: 'No hablo español', english: "I don't speak Spanish", phonetic: 'no AH-blo es-pan-YOL', category: 'greetings' },
    { native: 'La cuenta por favor', english: 'The bill please', phonetic: 'lah KWEN-tah por fah-VOR', category: 'food' },
    { native: 'Un café por favor', english: 'A coffee please', phonetic: 'oon kah-FEH por fah-VOR', category: 'food' },
    { native: '¡Muy delicioso!', english: 'Very delicious', phonetic: 'mooy de-li-SYO-so', category: 'food' },
    { native: 'Agua por favor', english: 'Water please', phonetic: 'AH-gwah por fah-VOR', category: 'food' },
    { native: 'Soy vegetariano', english: "I'm vegetarian", phonetic: 'soy veh-heh-tah-ree-AH-no', category: 'food' },
    { native: '¡Salud!', english: 'Cheers', phonetic: 'sah-LOOD', category: 'nightlife' },
    { native: '¿Dónde está...?', english: 'Where is...?', phonetic: 'DON-deh es-TAH', category: 'transport' },
    { native: '¿Dónde está el baño?', english: 'Where is the bathroom?', phonetic: 'DON-deh es-TAH el BAN-yo', category: 'transport' },
    { native: '¿Cuánto cuesta?', english: 'How much?', phonetic: 'KWAN-to KWES-tah', category: 'shopping' },
    { native: '¡Ayuda!', english: 'Help', phonetic: 'ah-YOO-dah', category: 'emergency' },
    { native: 'Un billete para...', english: 'A ticket to...', phonetic: 'oon bee-YEH-teh pah-rah', category: 'transport' },
    { native: 'Pare aquí', english: 'Stop here', phonetic: 'PAH-reh ah-KEE', category: 'transport' },
    { native: 'Estoy perdido', english: "I'm lost", phonetic: 'es-TOY per-DEE-doh', category: 'emergency' },
    { native: 'Necesito un médico', english: 'I need a doctor', phonetic: 'neh-seh-SEE-to oon MEH-dee-ko', category: 'emergency' },
    { native: 'Muy caro', english: 'Too expensive', phonetic: 'mooy KAH-ro', category: 'shopping' },
    { native: 'Quiero esto', english: 'I want this', phonetic: 'KYEH-ro ES-toh', category: 'shopping' },
    { native: 'Una más', english: 'One more', phonetic: 'OO-nah mahs', category: 'nightlife' },
    { native: 'Sin hielo', english: 'No ice', phonetic: 'seen YEH-loh', category: 'nightlife' },
    { native: '¿Recomendación?', english: 'Recommendation?', phonetic: 'reh-ko-men-dah-SYON', category: 'food' },
    { native: '¿Habla inglés?', english: 'Do you speak English?', phonetic: 'AH-blah een-GLEHS', category: 'greetings' },
    { native: 'Llame a la policía', english: 'Call the police', phonetic: 'YAH-meh ah lah po-lee-SEE-ah', category: 'emergency' },
    { native: 'Hospital', english: 'Hospital', phonetic: 'os-pee-TAHL', category: 'emergency' },
    { native: 'Farmacia', english: 'Pharmacy', phonetic: 'far-MAH-syah', category: 'emergency' },
    { native: 'Próxima parada', english: 'Next stop', phonetic: 'PROK-see-mah pah-RAH-dah', category: 'transport' },
    { native: 'Para llevar', english: 'To go', phonetic: 'PAH-rah yeh-VAR', category: 'food' },
    { native: 'Una mesa para dos', english: 'Table for two', phonetic: 'OO-nah MEH-sah PAH-rah dos', category: 'food' },
    { native: '¿Puedo tomar una foto?', english: 'Can I take a photo?', phonetic: 'PWEH-doh toh-MAR OO-nah FOH-toh', category: 'greetings' },
    { native: 'No entiendo', english: "I don't understand", phonetic: 'no en-TYEN-doh', category: 'greetings' },
    { native: 'Barato', english: 'Cheap', phonetic: 'bah-RAH-toh', category: 'shopping' },
    { native: 'Descuento', english: 'Discount', phonetic: 'des-KWEN-toh', category: 'shopping' },
    { native: 'Sin azúcar', english: 'No sugar', phonetic: 'seen ah-SOO-kar', category: 'food' },
    { native: 'Sin carne', english: 'No meat', phonetic: 'seen KAR-neh', category: 'food' },
    { native: 'Una cerveza', english: 'A beer', phonetic: 'OO-nah ser-VEH-sah', category: 'nightlife' },
    { native: 'Una copa de vino', english: 'A glass of wine', phonetic: 'OO-nah KOH-pah deh VEE-noh', category: 'nightlife' },
    { native: 'Cerrado', english: 'Closed', phonetic: 'ser-RAH-doh', category: 'shopping' },
    { native: 'Abierto', english: 'Open', phonetic: 'ah-BYER-toh', category: 'shopping' },
    { native: 'Al aeropuerto', english: 'To the airport', phonetic: 'al ah-eh-ro-PWER-toh', category: 'transport' },
  ],
};

// ---------------------------------------------------------------------------
// ITALIAN — Rome (LanguagePack with location hints)
// ---------------------------------------------------------------------------
const ROME_LP: LanguagePack = {
  destination: 'Rome',
  language: 'Italian',
  flag: 'IT',
  speechCode: 'it-IT',
  locationHints: [
    { stop: 'Testaccio Market', hint: "At the market you'll need food phrases", categories: ['food'] },
    { stop: 'Colosseum', hint: "At tourist sights you'll need transport & greetings", categories: ['transport', 'greetings'] },
    { stop: 'Trastevere', hint: "In Trastevere you'll need nightlife & food phrases", categories: ['nightlife', 'food'] },
  ],
  phrases: [
    { native: 'Ciao', english: 'Hello', phonetic: 'CHOW', category: 'greetings' },
    { native: 'Grazie', english: 'Thank you', phonetic: 'GRAH-tsyeh', category: 'greetings' },
    { native: 'Per favore', english: 'Please', phonetic: 'per fah-VO-reh', category: 'greetings' },
    { native: 'Scusi', english: 'Excuse me', phonetic: 'SKOO-zee', category: 'greetings' },
    { native: 'Buongiorno', english: 'Good morning', phonetic: 'bwon-JOR-no', category: 'greetings' },
    { native: 'Sì / No', english: 'Yes / No', phonetic: 'see / noh', category: 'greetings' },
    { native: 'Il conto per favore', english: 'The bill please', phonetic: 'il KON-to per fah-VO-reh', category: 'food' },
    { native: 'Un caffè per favore', english: 'A coffee please', phonetic: 'oon kaf-FEH per fah-VO-reh', category: 'food' },
    { native: 'Buonissimo', english: 'Delicious', phonetic: 'bwo-NIS-si-mo', category: 'food' },
    { native: 'Acqua per favore', english: 'Water please', phonetic: 'AK-wah per fah-VO-reh', category: 'food' },
    { native: 'Sono vegetariano', english: "I'm vegetarian", phonetic: 'SO-no veh-zheh-tah-ree-AH-no', category: 'food' },
    { native: 'Cin cin', english: 'Cheers', phonetic: 'chin chin', category: 'nightlife' },
    { native: "Dove è...?", english: 'Where is...?', phonetic: 'DO-veh eh', category: 'transport' },
    { native: "Dov'è il bagno?", english: 'Where is the bathroom?', phonetic: 'do-VEH il BAN-yo', category: 'transport' },
    { native: 'Quanto costa?', english: 'How much?', phonetic: 'KWAN-to KOS-tah', category: 'shopping' },
    { native: 'Aiuto', english: 'Help', phonetic: 'ah-YOO-to', category: 'emergency' },
    { native: 'Un biglietto per...', english: 'A ticket to...', phonetic: 'oon bee-LYET-to per', category: 'transport' },
    { native: 'Si fermi qui', english: 'Stop here', phonetic: 'see FER-mee kwee', category: 'transport' },
    { native: 'Mi sono perso', english: "I'm lost", phonetic: 'mee SO-no PER-so', category: 'emergency' },
    { native: 'Ho bisogno di un medico', english: 'I need a doctor', phonetic: 'oh bee-ZON-yo dee oon MEH-dee-ko', category: 'emergency' },
    { native: 'Troppo caro', english: 'Too expensive', phonetic: 'TROP-po KAH-ro', category: 'shopping' },
    { native: 'Vorrei questo', english: 'I would like this', phonetic: 'vor-REH KWEH-sto', category: 'shopping' },
    { native: 'Un altro', english: 'Another one', phonetic: 'oon AHL-tro', category: 'nightlife' },
    { native: 'Senza ghiaccio', english: 'No ice', phonetic: 'SEN-tsah GYAH-cho', category: 'nightlife' },
    { native: 'Consiglia?', english: 'Recommendation?', phonetic: 'kon-SEEL-yah', category: 'food' },
    { native: 'Parla inglese?', english: 'Do you speak English?', phonetic: 'PAR-lah een-GLEH-zeh', category: 'greetings' },
    { native: 'Chiami la polizia', english: 'Call the police', phonetic: 'KYAH-mee lah po-lee-TSEE-ah', category: 'emergency' },
    { native: "L'ospedale", english: 'Hospital', phonetic: 'los-peh-DAH-leh', category: 'emergency' },
    { native: 'Farmacia', english: 'Pharmacy', phonetic: 'far-MAH-chah', category: 'emergency' },
    { native: 'Prossima fermata', english: 'Next stop', phonetic: 'PROS-see-mah fer-MAH-tah', category: 'transport' },
    { native: 'Da portare via', english: 'To go', phonetic: 'dah por-TAH-reh VEE-ah', category: 'food' },
    { native: 'Un tavolo per due', english: 'Table for two', phonetic: 'oon TAH-vo-lo per DWEH', category: 'food' },
    { native: 'Posso fare una foto?', english: 'Can I take a photo?', phonetic: 'POS-so FAH-reh OO-nah FOH-toh', category: 'greetings' },
    { native: 'Non capisco', english: "I don't understand", phonetic: 'non kah-PEE-sko', category: 'greetings' },
    { native: 'Economico', english: 'Cheap', phonetic: 'eh-ko-NOH-mee-ko', category: 'shopping' },
    { native: 'Sconto', english: 'Discount', phonetic: 'SKON-to', category: 'shopping' },
    { native: 'Senza zucchero', english: 'No sugar', phonetic: 'SEN-tsah TSOOK-ke-ro', category: 'food' },
    { native: 'Senza carne', english: 'No meat', phonetic: 'SEN-tsah KAR-neh', category: 'food' },
    { native: 'Una birra', english: 'A beer', phonetic: 'OO-nah BEER-rah', category: 'nightlife' },
    { native: 'Un bicchiere di vino', english: 'A glass of wine', phonetic: 'oon bee-KYEH-reh dee VEE-no', category: 'nightlife' },
    { native: 'Chiuso', english: 'Closed', phonetic: 'KYOO-zo', category: 'shopping' },
    { native: 'Aperto', english: 'Open', phonetic: 'ah-PER-to', category: 'shopping' },
    { native: "All'aeroporto", english: 'To the airport', phonetic: 'ahl-lah-eh-ro-POR-to', category: 'transport' },
  ],
};

// ---------------------------------------------------------------------------
// DUTCH — Amsterdam (LanguagePack with location hints)
// ---------------------------------------------------------------------------
const AMSTERDAM_LP: LanguagePack = {
  destination: 'Amsterdam',
  language: 'Dutch',
  flag: 'NL',
  speechCode: 'nl-NL',
  locationHints: [
    { stop: 'Albert Cuyp Market', hint: "At the market you'll need food & shopping", categories: ['food', 'shopping'] },
    { stop: 'Jordaan', hint: "In Jordaan you'll need greetings & food", categories: ['greetings', 'food'] },
    { stop: 'Leidseplein', hint: "At Leidseplein you'll need nightlife phrases", categories: ['nightlife'] },
  ],
  phrases: [
    { native: 'Hallo', english: 'Hello', phonetic: 'HAH-lo', category: 'greetings' },
    { native: 'Dank je wel', english: 'Thank you', phonetic: 'dahnk yeh vel', category: 'greetings' },
    { native: 'Alsjeblieft', english: 'Please', phonetic: 'ahl-syeh-BLEEFT', category: 'greetings' },
    { native: 'Sorry', english: 'Excuse me', phonetic: 'SOR-ree', category: 'greetings' },
    { native: 'Dag', english: 'Goodbye', phonetic: 'dahkh', category: 'greetings' },
    { native: 'Ja / Nee', english: 'Yes / No', phonetic: 'yah / nay', category: 'greetings' },
    { native: 'De rekening graag', english: 'The bill please', phonetic: 'deh RAY-ke-ning khrahkh', category: 'food' },
    { native: 'Een koffie graag', english: 'A coffee please', phonetic: 'ayn KOF-fee khrahkh', category: 'food' },
    { native: 'Lekker', english: 'Delicious', phonetic: 'LEK-ker', category: 'food' },
    { native: 'Water graag', english: 'Water please', phonetic: 'WAH-ter khrahkh', category: 'food' },
    { native: 'Ik ben vegetariër', english: "I'm vegetarian", phonetic: 'ik ben veh-heh-tah-ree-er', category: 'food' },
    { native: 'Proost', english: 'Cheers', phonetic: 'prohst', category: 'nightlife' },
    { native: 'Waar is...?', english: 'Where is...?', phonetic: 'vahr is', category: 'transport' },
    { native: 'Waar is het toilet?', english: 'Where is the bathroom?', phonetic: 'vahr is het twah-LET', category: 'transport' },
    { native: 'Hoeveel kost het?', english: 'How much?', phonetic: 'HOO-vel kost het', category: 'shopping' },
    { native: 'Help', english: 'Help', phonetic: 'help', category: 'emergency' },
    { native: 'Een kaartje naar...', english: 'A ticket to...', phonetic: 'ayn KAHR-tyeh nahr', category: 'transport' },
    { native: 'Stop hier', english: 'Stop here', phonetic: 'stop heer', category: 'transport' },
    { native: 'Ik ben verdwaald', english: "I'm lost", phonetic: 'ik ben ver-DWAHLT', category: 'emergency' },
    { native: 'Ik heb een dokter nodig', english: 'I need a doctor', phonetic: 'ik hep ayn DOK-ter noh-dikh', category: 'emergency' },
    { native: 'Te duur', english: 'Too expensive', phonetic: 'teh duur', category: 'shopping' },
    { native: 'Dit wil ik', english: 'I want this', phonetic: 'dit vil ik', category: 'shopping' },
    { native: 'Nog een', english: 'One more', phonetic: 'nokh ayn', category: 'nightlife' },
    { native: 'Zonder ijs', english: 'No ice', phonetic: 'ZON-der eys', category: 'nightlife' },
    { native: 'Wat raadt u aan?', english: 'Recommendation?', phonetic: 'vat raht oo ahn', category: 'food' },
    { native: 'Spreekt u Engels?', english: 'Do you speak English?', phonetic: 'spraykt oo ENG-els', category: 'greetings' },
    { native: 'Bel de politie', english: 'Call the police', phonetic: 'bel deh po-LEE-tsee', category: 'emergency' },
    { native: 'Ziekenhuis', english: 'Hospital', phonetic: 'ZEE-ken-hows', category: 'emergency' },
    { native: 'Apotheek', english: 'Pharmacy', phonetic: 'ah-po-TAYK', category: 'emergency' },
    { native: 'Volgende halte', english: 'Next stop', phonetic: 'VOL-khen-deh HAHL-teh', category: 'transport' },
    { native: 'Om mee te nemen', english: 'To go', phonetic: 'om may teh NAY-men', category: 'food' },
    { native: 'Een tafel voor twee', english: 'Table for two', phonetic: 'ayn TAH-fel voor vway', category: 'food' },
    { native: 'Mag ik een foto maken?', english: 'Can I take a photo?', phonetic: 'mahkh ik ayn FOH-toh MAH-ken', category: 'greetings' },
    { native: 'Ik begrijp het niet', english: "I don't understand", phonetic: 'ik beh-KREYP het neet', category: 'greetings' },
    { native: 'Goedkoop', english: 'Cheap', phonetic: 'KHGOOT-kohp', category: 'shopping' },
    { native: 'Korting', english: 'Discount', phonetic: 'KOR-ting', category: 'shopping' },
    { native: 'Zonder suiker', english: 'No sugar', phonetic: 'ZON-der SOW-ker', category: 'food' },
    { native: 'Zonder vlees', english: 'No meat', phonetic: 'ZON-der vlays', category: 'food' },
    { native: 'Een biertje', english: 'A beer', phonetic: 'ayn BEER-tyeh', category: 'nightlife' },
    { native: 'Een glas wijn', english: 'A glass of wine', phonetic: 'ayn glahs veyn', category: 'nightlife' },
    { native: 'Gesloten', english: 'Closed', phonetic: 'kheh-SLOH-ten', category: 'shopping' },
    { native: 'Open', english: 'Open', phonetic: 'OH-pen', category: 'shopping' },
    { native: 'Naar de luchthaven', english: 'To the airport', phonetic: 'nahr deh LUKHT-hah-ven', category: 'transport' },
  ],
};

// ---------------------------------------------------------------------------
// CZECH — Prague (LanguagePack with location hints)
// ---------------------------------------------------------------------------
const PRAGUE_LP: LanguagePack = {
  destination: 'Prague',
  language: 'Czech',
  flag: 'CZ',
  speechCode: 'cs-CZ',
  locationHints: [
    { stop: 'Old Town Square', hint: "In Old Town you'll need greetings & shopping", categories: ['greetings', 'shopping'] },
    { stop: 'Havelská Market', hint: "At the market you'll need food & shopping phrases", categories: ['food', 'shopping'] },
    { stop: 'Wenceslas Square', hint: "At Wenceslas Square you'll need nightlife phrases", categories: ['nightlife'] },
  ],
  phrases: [
    { native: 'Dobrý den', english: 'Hello', phonetic: 'DOB-ree den', category: 'greetings' },
    { native: 'Děkuji', english: 'Thank you', phonetic: 'DYEH-koo-yee', category: 'greetings' },
    { native: 'Prosím', english: 'Please', phonetic: 'PRO-seem', category: 'greetings' },
    { native: 'Promiňte', english: 'Excuse me', phonetic: 'pro-MEEN-tyeh', category: 'greetings' },
    { native: 'Ano / Ne', english: 'Yes / No', phonetic: 'AH-no / neh', category: 'greetings' },
    { native: 'Účet prosím', english: 'The bill please', phonetic: 'OO-chet PRO-seem', category: 'food' },
    { native: 'Kávu prosím', english: 'A coffee please', phonetic: 'KAH-voo PRO-seem', category: 'food' },
    { native: 'Výborně', english: 'Delicious', phonetic: 'VEE-bor-nyeh', category: 'food' },
    { native: 'Vodu prosím', english: 'Water please', phonetic: 'VO-doo PRO-seem', category: 'food' },
    { native: 'Jsem vegetarián', english: "I'm vegetarian", phonetic: 'yem veh-geh-tah-RYAHN', category: 'food' },
    { native: 'Na zdraví', english: 'Cheers', phonetic: 'nah ZDRAH-vee', category: 'nightlife' },
    { native: 'Kde je...?', english: 'Where is...?', phonetic: 'gdeh yeh', category: 'transport' },
    { native: 'Kde je záchod?', english: 'Where is the bathroom?', phonetic: 'gdeh yeh ZAH-khod', category: 'transport' },
    { native: 'Kolik to stojí?', english: 'How much?', phonetic: 'KOH-leek toh STOY-ee', category: 'shopping' },
    { native: 'Pomoc', english: 'Help', phonetic: 'POH-mots', category: 'emergency' },
    { native: 'Jízdenku do...', english: 'A ticket to...', phonetic: 'YEEZ-den-koo doh', category: 'transport' },
    { native: 'Zastavte tady', english: 'Stop here', phonetic: 'ZAH-staf-teh TAH-dee', category: 'transport' },
    { native: 'Ztratil jsem se', english: "I'm lost", phonetic: 'ZTRAH-til yem seh', category: 'emergency' },
    { native: 'Potřebuji lékaře', english: 'I need a doctor', phonetic: 'poh-TREH-boo-yee LEH-kah-zheh', category: 'emergency' },
    { native: 'Příliš drahé', english: 'Too expensive', phonetic: 'PRZHIL-ish DRAH-heh', category: 'shopping' },
    { native: 'Chci tohle', english: 'I want this', phonetic: 'khtsee TOH-hleh', category: 'shopping' },
    { native: 'Ještě jedno', english: 'One more', phonetic: 'YESH-tyeh YED-noh', category: 'nightlife' },
    { native: 'Bez ledu', english: 'No ice', phonetic: 'bez LEH-doo', category: 'nightlife' },
    { native: 'Co doporučujete?', english: 'Recommendation?', phonetic: 'tsoh doh-poh-ROO-choo-yeh-teh', category: 'food' },
    { native: 'Mluvíte anglicky?', english: 'Do you speak English?', phonetic: 'mloo-VEE-teh ahn-GLITS-kee', category: 'greetings' },
    { native: 'Zavolejte policii', english: 'Call the police', phonetic: 'zah-vo-LEH-tyeh po-LEE-tsee-ee', category: 'emergency' },
    { native: 'Nemocnice', english: 'Hospital', phonetic: 'NEH-mots-nee-tseh', category: 'emergency' },
    { native: 'Lékárna', english: 'Pharmacy', phonetic: 'LEH-kahr-nah', category: 'emergency' },
    { native: 'Příští zastávka', english: 'Next stop', phonetic: 'PRZHIL-shtee zah-STAHV-kah', category: 'transport' },
    { native: 'S sebou', english: 'To go', phonetic: 's SEH-boh', category: 'food' },
    { native: 'Stůl pro dva', english: 'Table for two', phonetic: 'stool proh dvah', category: 'food' },
    { native: 'Můžu vyfotit?', english: 'Can I take a photo?', phonetic: 'MOO-zhoo vee-FOH-tit', category: 'greetings' },
    { native: 'Nerozumím', english: "I don't understand", phonetic: 'neh-roh-zoo-MEEM', category: 'greetings' },
    { native: 'Levné', english: 'Cheap', phonetic: 'LEV-neh', category: 'shopping' },
    { native: 'Sleva', english: 'Discount', phonetic: 'SLEH-vah', category: 'shopping' },
    { native: 'Bez cukru', english: 'No sugar', phonetic: 'bez TSOO-kroo', category: 'food' },
    { native: 'Bez masa', english: 'No meat', phonetic: 'bez MAH-sah', category: 'food' },
    { native: 'Pivo', english: 'Beer', phonetic: 'PEE-vo', category: 'nightlife' },
    { native: 'Skleničku vína', english: 'A glass of wine', phonetic: 'SKLEN-eech-koo VEE-nah', category: 'nightlife' },
    { native: 'Zavřeno', english: 'Closed', phonetic: 'zahv-RZHEH-noh', category: 'shopping' },
    { native: 'Otevřeno', english: 'Open', phonetic: 'oh-tev-RZHEH-noh', category: 'shopping' },
    { native: 'Na letiště', english: 'To the airport', phonetic: 'nah LEH-tyeesh-tyeh', category: 'transport' },
  ],
};

// ---------------------------------------------------------------------------
// HUNGARIAN — Budapest (LanguagePack with location hints)
// ---------------------------------------------------------------------------
const BUDAPEST_LP: LanguagePack = {
  destination: 'Budapest',
  language: 'Hungarian',
  flag: 'HU',
  speechCode: 'hu-HU',
  locationHints: [
    { stop: 'Central Market Hall', hint: "At the market you'll need food & shopping phrases", categories: ['food', 'shopping'] },
    { stop: 'Heroes Square', hint: "At tourist spots you'll need transport & greetings", categories: ['transport', 'greetings'] },
    { stop: ' ruin bars', hint: "At ruin bars you'll need nightlife phrases", categories: ['nightlife'] },
  ],
  phrases: [
    { native: 'Szia', english: 'Hello', phonetic: 'SEE-ah', category: 'greetings' },
    { native: 'Köszönöm', english: 'Thank you', phonetic: 'KUR-sur-nurm', category: 'greetings' },
    { native: 'Kérem', english: 'Please', phonetic: 'KAY-rem', category: 'greetings' },
    { native: 'Elnézést', english: 'Excuse me', phonetic: 'EL-nay-zaysht', category: 'greetings' },
    { native: 'Igen / Nem', english: 'Yes / No', phonetic: 'EE-gen / nem', category: 'greetings' },
    { native: 'A számlát kérem', english: 'The bill please', phonetic: 'ah SAHM-laht KAY-rem', category: 'food' },
    { native: 'Egy kávét kérek', english: 'A coffee please', phonetic: 'edge KAH-vayt KAY-rek', category: 'food' },
    { native: 'Finom', english: 'Delicious', phonetic: 'FEE-nom', category: 'food' },
    { native: 'Vizet kérek', english: 'Water please', phonetic: 'VEE-zet KAY-rek', category: 'food' },
    { native: 'Vegetáriánus vagyok', english: "I'm vegetarian", phonetic: 'veh-geh-TAH-ree-ah-noosh VAH-dyok', category: 'food' },
    { native: 'Egészségére', english: 'Cheers', phonetic: 'eh-GAY-sheh-geh-reh', category: 'nightlife' },
    { native: 'Hol van...?', english: 'Where is...?', phonetic: 'hol vahn', category: 'transport' },
    { native: 'Hol a mosdó?', english: 'Where is the bathroom?', phonetic: 'hol ah MOSH-doh', category: 'transport' },
    { native: 'Mennyibe kerül?', english: 'How much?', phonetic: 'MEN-nyee-beh ke-ROOL', category: 'shopping' },
    { native: 'Segítség', english: 'Help', phonetic: 'sheh-GEET-shehg', category: 'emergency' },
    { native: 'Egy jegyet...', english: 'A ticket to...', phonetic: 'edge YEH-dyett', category: 'transport' },
    { native: 'Álljon meg itt', english: 'Stop here', phonetic: 'AH-lyon meg eet', category: 'transport' },
    { native: 'Elvesztettem', english: "I'm lost", phonetic: 'el-VES-tet-tem', category: 'emergency' },
    { native: 'Orvosra van szükségem', english: 'I need a doctor', phonetic: 'OR-vosh-rah vahn SOOK-sheh-gem', category: 'emergency' },
    { native: 'Túl drága', english: 'Too expensive', phonetic: 'tool DRAH-gah', category: 'shopping' },
    { native: 'Ezt kérem', english: 'I want this', phonetic: 'est KAY-rem', category: 'shopping' },
    { native: 'Még egyet', english: 'One more', phonetic: 'mayg EH-dyet', category: 'nightlife' },
    { native: 'Jég nélkül', english: 'No ice', phonetic: 'yayg NAYL-kool', category: 'nightlife' },
    { native: 'Mit ajánl?', english: 'Recommendation?', phonetic: 'mit AH-yahnl', category: 'food' },
    { native: 'Beszél angolul?', english: 'Do you speak English?', phonetic: 'be-SAYL ahn-go-lool', category: 'greetings' },
    { native: 'Hívja a rendőrséget', english: 'Call the police', phonetic: 'HEEV-yah ah REN-dur-shay-get', category: 'emergency' },
    { native: 'Kórház', english: 'Hospital', phonetic: 'KOR-hahz', category: 'emergency' },
    { native: 'Patika', english: 'Pharmacy', phonetic: 'PAH-tee-kah', category: 'emergency' },
    { native: 'Következő megálló', english: 'Next stop', phonetic: 'KUR-vet-ke-zur meh-GAHL-loh', category: 'transport' },
    { native: 'Elvitelre', english: 'To go', phonetic: 'el-VEE-tel-reh', category: 'food' },
    { native: 'Két főre asztalt', english: 'Table for two', phonetic: 'kayt FUR-reh AHS-tahlt', category: 'food' },
    { native: 'Fényképezhetem?', english: 'Can I take a photo?', phonetic: 'FAYN-kay-peh-zeh-heh-tem', category: 'greetings' },
    { native: 'Nem értem', english: "I don't understand", phonetic: 'nem AYR-tem', category: 'greetings' },
    { native: 'Olcsó', english: 'Cheap', phonetic: 'OL-cho', category: 'shopping' },
    { native: 'Kedvezmény', english: 'Discount', phonetic: 'KED-vez-mayn', category: 'shopping' },
    { native: 'Cukor nélkül', english: 'No sugar', phonetic: 'TSOO-kor NAYL-kool', category: 'food' },
    { native: 'Hús nélkül', english: 'No meat', phonetic: 'hoosh NAYL-kool', category: 'food' },
    { native: 'Egy sört', english: 'A beer', phonetic: 'edge shurt', category: 'nightlife' },
    { native: 'Egy pohár bort', english: 'A glass of wine', phonetic: 'edge po-HAR bort', category: 'nightlife' },
    { native: 'Zárva', english: 'Closed', phonetic: 'ZAR-vah', category: 'shopping' },
    { native: 'Nyitva', english: 'Open', phonetic: 'NYIT-vah', category: 'shopping' },
    { native: 'A repülőtérre', english: 'To the airport', phonetic: 'ah reh-PUR-lur-ter-reh', category: 'transport' },
  ],
};

/** Convert DestinationPack to LanguagePack (no location hints) */
function toLanguagePack(dp: DestinationPack): LanguagePack {
  return {
    destination: dp.city,
    language: dp.language,
    flag: dp.flag,
    speechCode: dp.langCode,
    locationHints: [],
    phrases: dp.phrases.map((p) => ({ native: p.local, english: p.english, phonetic: p.phonetic, category: p.category })),
  };
}

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------
const PACKS: Record<string, LanguagePack> = {
  Tokyo: toLanguagePack(TOKYO),
  Bali: toLanguagePack(BALI),
  Bangkok: toLanguagePack(BANGKOK),
  Lisbon: toLanguagePack(LISBON),
  Paris: toLanguagePack(PARIS),
  Barcelona: BARCELONA_LP,
  Rome: ROME_LP,
  Amsterdam: AMSTERDAM_LP,
  Prague: PRAGUE_LP,
  Budapest: BUDAPEST_LP,
};

export const LANGUAGE_PACKS = Object.values(PACKS);

export function getLanguagePackForDestination(dest: string): LanguagePack | null {
  const k = dest.toLowerCase();
  for (const [city, pack] of Object.entries(PACKS)) {
    if (k.includes(city.toLowerCase())) return pack;
  }
  return PACKS.Tokyo; // fallback
}

export function getLocationHintsForStops(
  pack: LanguagePack,
  stops: string[]
): LocationHint[] {
  const hints: LocationHint[] = [];
  for (const stop of stops) {
    const match = pack.locationHints.find((h) =>
      stop.toLowerCase().includes(h.stop.toLowerCase())
    );
    if (match) hints.push(match);
  }
  return hints;
}
