export const SUPPORTED_LANGUAGES = ['en', 'ta'];

export const LANGUAGE_LABELS = {
  en: 'English',
  ta: 'தமிழ்',
};

export function getLocaleCode(lang) {
  return lang === 'ta' ? 'ta-IN' : 'en-IN';
}

const CATEGORY_MAP = {
  rice: 'அரிசி',
  'traditional rice': 'பாரம்பரிய அரிசி',
  'native rice': 'பாரம்பரிய அரிசி',
  paddy: 'நெல்',
  millets: 'சிறுதானியங்கள்',
  millet: 'சிறுதானியங்கள்',
  pulses: 'பருப்பு வகைகள்',
  dals: 'பருப்பு வகைகள்',
  dal: 'பருப்பு',
  lentils: 'பருப்பு வகைகள்',
  oil: 'எண்ணெய்',
  oils: 'மரச்செக்கு எண்ணெய்கள்',
  'cold pressed oil': 'மரச்செக்கு எண்ணெய்',
  'cold pressed oils': 'மரச்செக்கு எண்ணெய்கள்',
  'wood pressed oil': 'மரச்செக்கு எண்ணெய்',
  'wood pressed oils': 'மரச்செக்கு எண்ணெய்கள்',
  honey: 'தூய தேன்',
  'pure honey': 'தூய தேன்',
  'wild honey': 'காட்டுத் தேன்',
  jaggery: 'கருப்பட்டி & வெல்லம்',
  'country sugar': 'நாட்டு சர்க்கரை',
  'palm jaggery': 'பனங்கருப்பட்டி',
  spices: 'மசாலா பொருட்கள்',
  masala: 'மசாலா பொருட்கள்',
  condiments: 'மசாலா பொருட்கள்',
  'spices & condiments': 'மசாலா பொருட்கள்',
  seeds: 'விதைகள்',
  'organic seeds': 'இயற்கை விதைகள்',
  'native seeds': 'நாட்டு விதைகள்',
  fertilizer: 'உரம்',
  fertilizers: 'இயற்கை உரங்கள்',
  'bio fertilizer': 'உயிர் உரம்',
  'bio fertilizers': 'உயிர் உரங்கள்',
  'bio-fertilizers': 'உயிர் உரங்கள்',
  'organic fertilizer': 'இயற்கை உரம்',
  'organic fertilizers': 'இயற்கை உரங்கள்',
  'organic complex': 'இயற்கை கலவை உரம்',
  grains: 'தானியங்கள்',
  'grains & millets': 'தானியங்கள் & சிறுதானியங்கள்',
  cereals: 'தானியங்கள்',
  'dry fruits': 'உலர் பழங்கள்',
  nuts: 'பருப்பு & கொட்டைகள்',
  'dry fruits & nuts': 'உலர் பழங்கள் & கொட்டைகள்',
  snacks: 'தின்பண்டங்கள்',
  'traditional snacks': 'பாரம்பரிய தின்பண்டங்கள்',
  ghee: 'நெய்',
  dairy: 'பால் பொருட்கள்',
  flour: 'மாவு',
  flours: 'மாவு வகைகள்',
  'millet flour': 'சிறுதானிய மாவு',
  herbs: 'மூலிகைகள்',
  vegetables: 'காய்கறிகள்',
  fruits: 'பழங்கள்',
  general: 'பொதுவானவை',
  other: 'மற்றவை',
  product: 'பொருள்',
  'farm product': 'விவசாயப் பொருள்',
};

export function translateCategory(name, lang) {
  if (!name || lang !== 'ta') return name || '';
  const key = String(name).trim().toLowerCase();
  if (CATEGORY_MAP[key]) return CATEGORY_MAP[key];

  // Check partial keyword matches for compound names like "Organic Rice" or "Pure Honey"
  for (const [engKey, tamilVal] of Object.entries(CATEGORY_MAP)) {
    if (key.includes(engKey) && engKey.length > 3) {
      return tamilVal;
    }
  }
  return name;
}

const UNIT_MAP = {
  kg: 'கிலோ',
  g: 'கிராம்',
  gram: 'கிராம்',
  grams: 'கிராம்',
  litre: 'லிட்டர்',
  liter: 'லிட்டர்',
  litres: 'லிட்டர்',
  liters: 'லிட்டர்',
  l: 'லி',
  ml: 'மி.லி',
  piece: 'எண்ணிக்கை',
  pieces: 'எண்ணிக்கை',
  pcs: 'எண்ணிக்கை',
  packet: 'பாக்கெட்',
  packets: 'பாக்கெட்',
  pack: 'பாக்கெட்',
  box: 'பெட்டி',
  boxes: 'பெட்டி',
  bag: 'மூட்டை',
  bags: 'மூட்டை',
  '5kg bag': '5 கிலோ மூட்டை',
  '10kg bag': '10 கிலோ மூட்டை',
  '25kg bag': '25 கிலோ மூட்டை',
  '50kg bag': '50 கிலோ மூட்டை',
  dozen: 'டஜன்',
  unit: 'அலகு',
  units: 'அலகு',
};

export function translateUnit(unit, lang) {
  if (!unit || lang !== 'ta') return unit || '';
  const key = String(unit).trim().toLowerCase();
  return UNIT_MAP[key] || unit;
}

const STATUS_MAP = {
  pending: 'நிலுவையில்',
  confirmed: 'உறுதி செய்யப்பட்டது',
  shipped: 'அனுப்பப்பட்டது',
  delivered: 'டெலிவரி செய்யப்பட்டது',
  completed: 'முடிவடைந்தது',
  cancelled: 'ரத்து செய்யப்பட்டது',
  paid: 'செலுத்தப்பட்டது',
  active: 'செயலில்',
  inactive: 'செயலற்றது',
  approved: 'அங்கீகரிக்கப்பட்டது',
  rejected: 'நிராகரிக்கப்பட்டது',
  unknown: 'தெரியவில்லை',
};

export function translateStatus(status, lang) {
  if (!status) return '';
  if (lang !== 'ta') return status;
  const key = String(status).trim().toLowerCase();
  return STATUS_MAP[key] || status;
}
