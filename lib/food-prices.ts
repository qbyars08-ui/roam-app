// =============================================================================
// ROAM — Local Food Price Index
// What things ACTUALLY cost — street food to fine dining
// =============================================================================

export interface FoodPrice {
  readonly item: string;
  readonly local: string;
  readonly tourist: string;
  readonly where: string;
}

export interface FoodPriceIndex {
  readonly currency: string;
  readonly beerPrice: string;
  readonly coffeePrice: string;
  readonly mealBudget: string;
  readonly mealMidRange: string;
  readonly mealFine: string;
  readonly waterBottle: string;
  readonly localMustTry: readonly FoodPrice[];
}

// ---------------------------------------------------------------------------
// Real prices, not Numbeo averages
// ---------------------------------------------------------------------------

const PRICES: Record<string, FoodPriceIndex> = {
  tokyo: {
    currency: 'JPY',
    beerPrice: '¥500-700 (draft at izakaya)',
    coffeePrice: '¥250 (Doutor) — ¥600 (specialty)',
    mealBudget: '¥500-1,200',
    mealMidRange: '¥1,500-3,500',
    mealFine: '¥8,000-20,000',
    waterBottle: '¥100-120',
    localMustTry: [
      { item: 'Ramen', local: '¥700-1,000', tourist: '¥1,200-1,800', where: 'Any standalone ramen shop (not in a department store)' },
      { item: 'Sushi (conveyor belt)', local: '¥1,000-2,000', tourist: '¥2,500-4,000', where: 'Genki Sushi or Sushiro — same fish, fraction of the price' },
      { item: 'Onigiri', local: '¥120-200', tourist: 'Same', where: '7-Eleven or Lawson. The salmon one is perfect.' },
      { item: 'Wagyu beef bowl', local: '¥500-800', tourist: '¥2,000+', where: 'Sukiya or Matsuya chains. ¥500 for a legit gyudon.' },
      { item: 'Tempura set', local: '¥800-1,200', tourist: '¥2,000-3,500', where: 'Tenya chain is excellent and cheap' },
    ],
  },
  paris: {
    currency: 'EUR',
    beerPrice: '€6-9 (bar) / €3-4 (supermarket)',
    coffeePrice: '€1.20 (espresso at bar) — €4.50 (café table)',
    mealBudget: '€8-15',
    mealMidRange: '€20-40',
    mealFine: '€60-150',
    waterBottle: '€0.50-1',
    localMustTry: [
      { item: 'Croissant', local: '€1.20-1.50', tourist: '€2.50-3.50', where: 'Any boulangerie with a queue. Avoid ones near monuments.' },
      { item: 'Croque Monsieur', local: '€6-9', tourist: '€12-16', where: 'Walk 2 streets from Champs-Élysées — price drops 40%' },
      { item: 'Wine (glass)', local: '€4-6', tourist: '€8-14', where: 'Happy hour (5-8pm) at any neighborhood bar' },
      { item: 'Steak frites', local: '€14-18', tourist: '€22-30', where: 'Le Relais de l\'Entrecôte — one menu, perfected' },
      { item: 'Falafel (Le Marais)', local: '€6-7', tourist: '€8-9', where: 'L\'As du Fallafel — the line is worth it. Get the special.' },
    ],
  },
  bali: {
    currency: 'IDR',
    beerPrice: 'Rp 25,000-40,000 (Bintang at warung)',
    coffeePrice: 'Rp 10,000-15,000 (local) / Rp 40,000-60,000 (specialty)',
    mealBudget: 'Rp 20,000-50,000',
    mealMidRange: 'Rp 80,000-200,000',
    mealFine: 'Rp 500,000-1,500,000',
    waterBottle: 'Rp 5,000-8,000',
    localMustTry: [
      { item: 'Nasi Goreng', local: 'Rp 15,000-25,000', tourist: 'Rp 45,000-75,000', where: 'Any warung. The simpler the place, the better the nasi goreng.' },
      { item: 'Babi Guling (roast pig)', local: 'Rp 30,000-50,000', tourist: 'Rp 80,000-120,000', where: 'Ibu Oka in Ubud is famous but overpriced. Babi Guling Pak Malen is better.' },
      { item: 'Fresh coconut', local: 'Rp 10,000-15,000', tourist: 'Rp 25,000-35,000', where: 'Beach vendors. Negotiate or find a warung.' },
      { item: 'Smoothie bowl', local: 'Rp 35,000-50,000', tourist: 'Rp 65,000-90,000', where: 'Everywhere in Canggu. They\'re all good. Don\'t overthink it.' },
      { item: 'Mie Goreng', local: 'Rp 12,000-20,000', tourist: 'Rp 40,000-60,000', where: 'Night market or any roadside warung' },
    ],
  },
  bangkok: {
    currency: 'THB',
    beerPrice: '฿60-100 (7-Eleven) / ฿120-200 (bar)',
    coffeePrice: '฿40-60 (local) / ฿100-160 (café)',
    mealBudget: '฿40-120',
    mealMidRange: '฿200-500',
    mealFine: '฿1,500-5,000',
    waterBottle: '฿7-15',
    localMustTry: [
      { item: 'Pad Thai', local: '฿40-60', tourist: '฿100-180', where: 'Thipsamai is famous. Street version at ฿50 is just as good.' },
      { item: 'Som Tum (papaya salad)', local: '฿40-60', tourist: '฿80-120', where: 'Any som tum cart. Say "mai pet" for mild or prepare to cry.' },
      { item: 'Mango sticky rice', local: '฿60-80', tourist: '฿100-150', where: 'Soi 38 or any dessert cart. Peak season March-May.' },
      { item: 'Tom Yum Goong', local: '฿80-120', tourist: '฿180-300', where: 'P\'Aor or any shophouse restaurant. Not a tourist restaurant.' },
      { item: 'Boat noodles', local: '฿15-25 per bowl', tourist: '฿40-60', where: 'Victory Monument area. Tiny bowls — order 3-5.' },
    ],
  },
  rome: {
    currency: 'EUR',
    beerPrice: '€4-6 (bar) / €1-2 (supermarket)',
    coffeePrice: '€1 (espresso at bar) — €3 (seated)',
    mealBudget: '€5-12',
    mealMidRange: '€15-30',
    mealFine: '€50-120',
    waterBottle: '€0.30-0.50 (or free from nasoni fountains)',
    localMustTry: [
      { item: 'Pizza al taglio (by the slice)', local: '€2-4', tourist: '€4-7', where: 'Bonci Pizzarium near Vatican. Or any place that sells by weight.' },
      { item: 'Supplì (fried rice ball)', local: '€1.50-2.50', tourist: '€3-5', where: 'Supplizio or any pizza al taglio shop. Cacio e pepe version is elite.' },
      { item: 'Cacio e Pepe', local: '€8-12', tourist: '€14-20', where: 'Da Felice in Testaccio. Not the ones near the Colosseum.' },
      { item: 'Gelato', local: '€2.50-3.50', tourist: '€4-6', where: 'Fatamorgana or Giolitti. If they have mountains of colorful gelato = tourist trap.' },
      { item: 'Espresso at the bar', local: '€1-1.20', tourist: '€3-4 (seated)', where: 'Stand at the bar like a local. Same coffee, 1/3 the price.' },
    ],
  },
  seoul: {
    currency: 'KRW',
    beerPrice: '₩4,000-6,000 (convenience store: ₩2,000)',
    coffeePrice: '₩4,500-6,000',
    mealBudget: '₩5,000-10,000',
    mealMidRange: '₩12,000-25,000',
    mealFine: '₩50,000-150,000',
    waterBottle: '₩800-1,000',
    localMustTry: [
      { item: 'Korean BBQ (samgyeopsal)', local: '₩12,000-16,000/person', tourist: '₩20,000-30,000', where: 'Mapo area near Hongdae. The meat + sides are unlimited at many spots.' },
      { item: 'Tteokbokki (spicy rice cakes)', local: '₩3,000-4,000', tourist: '₩5,000-7,000', where: 'Sindang Tteokbokki Town — an entire alley dedicated to it' },
      { item: 'Bibimbap', local: '₩6,000-9,000', tourist: '₩12,000-18,000', where: 'Gogung in Jeonju is legendary. In Seoul, any local spot.' },
      { item: 'Fried chicken + beer', local: '₩16,000-20,000', tourist: '₩22,000-28,000', where: 'BHC or Kyochon. Order online via Baemin app for delivery.' },
      { item: 'Convenience store meal', local: '₩3,000-5,000', tourist: 'Same', where: 'GS25 or CU. Triangle kimbap + ramyeon = ₩3,500 total.' },
    ],
  },
  london: {
    currency: 'GBP',
    beerPrice: '£5-7 (pub) / £1.50-2 (supermarket)',
    coffeePrice: '£2.50-4',
    mealBudget: '£5-12',
    mealMidRange: '£15-30',
    mealFine: '£50-150',
    waterBottle: '£0.50-1 (or free tap water at any restaurant)',
    localMustTry: [
      { item: 'Fish & chips', local: '£8-12', tourist: '£14-18', where: 'Poppies in Spitalfields or any chippy away from tourist zones' },
      { item: 'Full English breakfast', local: '£7-10', tourist: '£12-16', where: 'Any greasy spoon café. The more tired the decor, the better the fry-up.' },
      { item: 'Sunday roast', local: '£14-18', tourist: '£18-25', where: 'Any gastropub. Book ahead — Sunday lunch is serious business.' },
      { item: 'Curry (Brick Lane)', local: '£8-12', tourist: '£12-16', where: 'Skip the ones with hawkers outside. Tayyabs in Whitechapel is better.' },
      { item: 'Borough Market snack', local: '£5-8', tourist: '£8-12', where: 'Go at lunch on weekdays. Weekends are tourist chaos. Kappacasein for raclette.' },
    ],
  },
  barcelona: {
    currency: 'EUR',
    beerPrice: '€2.50-4 (bar) / €0.80-1.20 (supermarket)',
    coffeePrice: '€1.30-2.50',
    mealBudget: '€5-12',
    mealMidRange: '€15-30',
    mealFine: '€50-120',
    waterBottle: '€0.50-1',
    localMustTry: [
      { item: 'Patatas bravas', local: '€4-6', tourist: '€7-10', where: 'Bar Tomás in Sarrià — the gold standard. Not the ones on La Rambla.' },
      { item: 'Pan con tomate', local: '€2-3', tourist: '€4-6', where: 'Literally any bar. Bread, tomato, olive oil. Simple perfection.' },
      { item: 'Vermouth on tap', local: '€2-3', tourist: '€5-7', where: 'Any vermutería in Gràcia or Poble Sec. Sunday noon tradition.' },
      { item: 'Fideuà (seafood noodle paella)', local: '€10-14', tourist: '€16-22', where: 'Barceloneta neighborhood. NOT the beachfront restaurants with photos on menus.' },
      { item: 'Churros con chocolate', local: '€3-4', tourist: '€5-8', where: 'Granja Viader or Xurreria Trebol. Not the street carts.' },
    ],
  },
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function getFoodPriceIndex(destination: string): FoodPriceIndex | null {
  const key = destination.toLowerCase().trim();
  return PRICES[key] ?? null;
}

export function getLocalMustTry(destination: string): readonly FoodPrice[] {
  return getFoodPriceIndex(destination)?.localMustTry ?? [];
}

export function hasFoodPrices(destination: string): boolean {
  return getFoodPriceIndex(destination) !== null;
}
