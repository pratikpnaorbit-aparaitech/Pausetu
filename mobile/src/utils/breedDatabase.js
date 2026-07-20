// breedDatabase.js
// Production-grade dynamic livestock breed database for PashuSetu

export const MASTER_BREED_DATABASE = {
  cow: [
    { id: 'gir', name: 'गीर (Gir)', mr: 'गीर', en: 'Gir' },
    { id: 'hf', name: 'एचएफ (Holstein Friesian)', mr: 'एचएफ', en: 'Holstein Friesian' },
    { id: 'jersey', name: 'जर्सी (Jersey)', mr: 'जर्सी', en: 'Jersey' },
    { id: 'sahiwal', name: 'साहीवाल (Sahiwal)', mr: 'साहीवाल', en: 'Sahiwal' },
    { id: 'red_sindhi', name: 'रेड सिंधी (Red Sindhi)', mr: 'रेड सिंधी', en: 'Red Sindhi' },
    { id: 'tharparkar', name: 'थारपारकर (Tharparkar)', mr: 'थारपारकर', en: 'Tharparkar' },
    { id: 'rathi', name: 'राठी (Rathi)', mr: 'राठी', en: 'Rathi' },
    { id: 'kankrej', name: 'कांकरेज (Kankrej)', mr: 'कांकरेज', en: 'Kankrej' },
    { id: 'deoni', name: 'देवणी (Deoni)', mr: 'देवणी', en: 'Deoni' },
    { id: 'dangi', name: 'डांगी (Dangi)', mr: 'डांगी', en: 'Dangi' },
    { id: 'khillar', name: 'खिल्लार (Khillar)', mr: 'खिल्लार', en: 'Khillar' },
    { id: 'gaolao', name: 'गवळाऊ (Gaolao)', mr: 'गवळाऊ', en: 'Gaolao' },
    { id: 'lal_kandhari', name: 'लाल कंधारी (Lal Kandhari)', mr: 'लाल कंधारी', en: 'Lal Kandhari' },
    { id: 'krishna_valley', name: 'कृष्णा व्हॅली (Krishna Valley)', mr: 'कृष्णा व्हॅली', en: 'Krishna Valley' },
    { id: 'crossbreed', name: 'क्रॉसब्रीड (Crossbreed)', mr: 'क्रॉसब्रीड', en: 'Crossbreed' },
    { id: 'desi', name: 'देशी (Desi)', mr: 'देशी', en: 'Desi' },
    { id: 'other', name: 'इतर (Other)', mr: 'इतर', en: 'Other' }
  ],
  buffalo: [
    { id: 'murrah', name: 'मुर्रा (Murrah)', mr: 'मुर्रा', en: 'Murrah' },
    { id: 'jaffarabadi', name: 'जाफराबादी (Jaffarabadi)', mr: 'जाफराबादी', en: 'Jaffarabadi' },
    { id: 'pandharpuri', name: 'पंढरपुरी (Pandharpuri)', mr: 'पंढरपुरी', en: 'Pandharpuri' },
    { id: 'nagpuri', name: 'नागपुरी (Nagpuri)', mr: 'नागपुरी', en: 'Nagpuri' },
    { id: 'surti', name: 'सुरती (Surti)', mr: 'सुरती', en: 'Surti' },
    { id: 'mehsana', name: 'मेहसाणा (Mehsana)', mr: 'मेहसाणा', en: 'Mehsana' },
    { id: 'bhadawari', name: 'भदावरी (Bhadawari)', mr: 'भदावरी', en: 'Bhadawari' },
    { id: 'nili_ravi', name: 'निली-रावी (Nili-Ravi)', mr: 'निली-रावी', en: 'Nili-Ravi' },
    { id: 'toda', name: 'टोडा (Toda)', mr: 'टोडा', en: 'Toda' },
    { id: 'marathwadi', name: 'मराठवाडी (Marathwadi)', mr: 'मराठवाडी', en: 'Marathwadi' },
    { id: 'crossbreed', name: 'क्रॉसब्रीड (Crossbreed)', mr: 'क्रॉसब्रीड', en: 'Crossbreed' },
    { id: 'desi', name: 'देशी (Desi)', mr: 'देशी', en: 'Desi' },
    { id: 'other', name: 'इतर (Other)', mr: 'इतर', en: 'Other' }
  ],
  goat: [
    { id: 'osmanabadi', name: 'उस्मानाबादी (Osmanabadi)', mr: 'उस्मानाबादी', en: 'Osmanabadi' },
    { id: 'sangamneri', name: 'सांगमनेरी (Sangamneri)', mr: 'सांगमनेरी', en: 'Sangamneri' },
    { id: 'boer', name: 'बोअर (Boer)', mr: 'बोअर', en: 'Boer' },
    { id: 'sirohi', name: 'सिरोही (Sirohi)', mr: 'सिरोही', en: 'Sirohi' },
    { id: 'jamunapari', name: 'जमुनापारी (Jamunapari)', mr: 'जमुनापारी', en: 'Jamunapari' },
    { id: 'beetal', name: 'बीटल (Beetal)', mr: 'बीटल', en: 'Beetal' },
    { id: 'black_bengal', name: 'ब्लॅक बंगाल (Black Bengal)', mr: 'ब्लॅक बंगाल', en: 'Black Bengal' },
    { id: 'barbari', name: 'बारबरी (Barbari)', mr: 'बारबरी', en: 'Barbari' },
    { id: 'jakhrana', name: 'जाखराना (Jakhrana)', mr: 'जाखराना', en: 'Jakhrana' },
    { id: 'malabari', name: 'मालाबारी (Malabari)', mr: 'मालाबारी', en: 'Malabari' },
    { id: 'sojat', name: 'सोजत (Sojat)', mr: 'सोजत', en: 'Sojat' },
    { id: 'ganjam', name: 'गंजाम (Ganjam)', mr: 'गंजाम', en: 'Ganjam' },
    { id: 'crossbreed', name: 'क्रॉसब्रीड (Crossbreed)', mr: 'क्रॉसब्रीड', en: 'Crossbreed' },
    { id: 'desi', name: 'देशी (Desi)', mr: 'देशी', en: 'Desi' },
    { id: 'other', name: 'इतर (Other)', mr: 'इतर', en: 'Other' }
  ],
  sheep: [
    { id: 'deccani', name: 'दखनी (Deccani)', mr: 'दखनी', en: 'Deccani' },
    { id: 'madgyal', name: 'माडग्याळ (Madgyal)', mr: 'माडग्याळ', en: 'Madgyal' },
    { id: 'lonand', name: 'लोणंद (Lonand)', mr: 'लोणंद', en: 'Lonand' },
    { id: 'sangamneri', name: 'सांगमनेरी (Sangamneri)', mr: 'सांगमनेरी', en: 'Sangamneri' },
    { id: 'nellore', name: 'नेल्लोर (Nellore)', mr: 'नेल्लोर', en: 'Nellore' },
    { id: 'marwari', name: 'मारवाडी (Marwari)', mr: 'मारवाडी', en: 'Marwari' },
    { id: 'mandya', name: 'मांड्या (Mandya)', mr: 'मांड्या', en: 'Mandya' },
    { id: 'bellary', name: 'बेल्लारी (Bellary)', mr: 'बेल्लारी', en: 'Bellary' },
    { id: 'patanwadi', name: 'पाटनवाडी (Patanwadi)', mr: 'पाटनवाडी', en: 'Patanwadi' },
    { id: 'malpura', name: 'मालपुरा (Malpura)', mr: 'मालपुरा', en: 'Malpura' },
    { id: 'crossbreed', name: 'क्रॉसब्रीड (Crossbreed)', mr: 'क्रॉसब्रीड', en: 'Crossbreed' },
    { id: 'desi', name: 'देशी (Desi)', mr: 'देशी', en: 'Desi' },
    { id: 'other', name: 'इतर (Other)', mr: 'इतर', en: 'Other' }
  ],
  horse: [
    { id: 'marwari', name: 'मारवाडी (Marwari)', mr: 'मारवाडी', en: 'Marwari' },
    { id: 'kathiawari', name: 'काठियावाडी (Kathiawari)', mr: 'काठियावाडी', en: 'Kathiawari' },
    { id: 'spiti', name: 'स्पिती (Spiti)', mr: 'स्पिती', en: 'Spiti' },
    { id: 'bhutia', name: 'भुटिया (Bhutia)', mr: 'भुटिया', en: 'Bhutia' },
    { id: 'manipuri', name: 'मणिपुरी (Manipuri)', mr: 'मणिपुरी', en: 'Manipuri' },
    { id: 'zanskari', name: 'झान्स्कारी (Zanskari)', mr: 'झान्स्कारी', en: 'Zanskari' },
    { id: 'thoroughbred', name: 'थरॉब्रेड (Thoroughbred)', mr: 'थरॉब्रेड', en: 'Thoroughbred' },
    { id: 'arabian', name: 'अरेबियन (Arabian)', mr: 'अरेबियन', en: 'Arabian' },
    { id: 'quarter_horse', name: 'क्वार्टर हॉर्स (Quarter Horse)', mr: 'क्वार्टर हॉर्स', en: 'Quarter Horse' },
    { id: 'friesian', name: 'फ्रिजियन (Friesian)', mr: 'फ्रिजियन', en: 'Friesian' },
    { id: 'other', name: 'इतर (Other)', mr: 'इतर', en: 'Other' }
  ]
};

/**
 * Returns dynamic bilingual breed list for a selected category
 * merges API breed ObjectIds when available
 */
export const getBreedsForCategory = (categoryInput, apiBreeds = []) => {
  if (!categoryInput) return [];

  const rawKey = (
    typeof categoryInput === 'string'
      ? categoryInput
      : categoryInput.slug || categoryInput.name || ''
  ).toLowerCase();

  let key = 'cow';
  if (rawKey.includes('buffalo') || rawKey.includes('म्हैस')) key = 'buffalo';
  else if (rawKey.includes('goat') || rawKey.includes('शेळी')) key = 'goat';
  else if (rawKey.includes('sheep') || rawKey.includes('मेंढी')) key = 'sheep';
  else if (rawKey.includes('horse') || rawKey.includes('घोडा')) key = 'horse';
  else if (rawKey.includes('other') || rawKey.includes('इतर')) return [];

  const masterList = MASTER_BREED_DATABASE[key] || MASTER_BREED_DATABASE.cow;

  return masterList.map((item) => {
    // Match against API breeds array to preserve MongoDB ObjectId
    const matchedApiBreed = (apiBreeds || []).find((b) => {
      if (!b || !b.name) return false;
      const bName = b.name.toLowerCase();
      return (
        bName === item.en.toLowerCase() ||
        bName === item.mr.toLowerCase() ||
        bName.includes(item.en.toLowerCase())
      );
    });

    return {
      ...item,
      _id: matchedApiBreed?._id || matchedApiBreed?.id || item.id,
      originalName: matchedApiBreed?.name || item.en
    };
  });
};
