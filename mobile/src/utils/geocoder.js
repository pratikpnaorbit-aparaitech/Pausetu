import * as Location from 'expo-location';

const geocodeCache = {};

/**
 * Normalizes reverse geocoded data into standard PashuSetu structure.
 */
const createResultObject = (village, taluka, district, state, pincode) => {
  const v = (village || '').trim();
  const t = (taluka || '').trim();
  const d = (district || '').trim();
  const s = (state || '').trim();
  const p = (pincode || '').trim();

  const addressParts = Array.from(new Set([v, t, d, s, p])).filter(Boolean);
  return {
    village: v || t || d || 'Murti',
    taluka: t || d || 'Baramati',
    district: d || 'Pune',
    state: s || 'Maharashtra',
    pincode: p || '',
    formattedAddress: addressParts.length > 0 ? addressParts.join(', ') : 'Baramati, Pune, Maharashtra'
  };
};

/**
 * Provider 1: Expo Location.reverseGeocodeAsync
 */
const geocodeWithExpo = async (lat, lng) => {
  try {
    const reverse = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
    if (reverse && reverse.length > 0) {
      const addr = reverse[0];
      const isBusinessOrPoi = (name) => {
        if (!name) return true;
        const lower = name.toLowerCase();
        const poiKeywords = ['developer', 'pvt', 'ltd', 'limited', 'hotel', 'restaurant', 'store', 'shop', 'complex', 'plaza', 'trader', 'enterprise', 'service', 'hospital', 'school', 'bank', 'atm', 'clinic', 'mart', 'agency'];
        return poiKeywords.some(keyword => lower.includes(keyword));
      };

      const cleanName = (!isBusinessOrPoi(addr.name) ? addr.name : null);
      const village = cleanName || addr.subregion || addr.city || addr.district || '';
      const taluka = addr.district || addr.subregion || '';
      const district = addr.city || addr.subregion || addr.district || '';
      const state = addr.region || '';
      const pincode = addr.postalCode || '';

      if (state || district || taluka || village) {
        console.log('[Geocoder] Expo reverseGeocodeAsync succeeded');
        return createResultObject(village, taluka, district, state, pincode);
      }
    }
  } catch (e) {
    console.warn('[Geocoder] Expo reverseGeocodeAsync failed:', e.message);
  }
  return null;
};

/**
 * Provider 2: OpenStreetMap Nominatim API
 */
const geocodeWithOSM = async (lat, lng) => {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
    const res = await fetch(url, { headers: { 'User-Agent': 'PashuSetuApp/1.0' } });
    if (res.ok) {
      const data = await res.json();
      if (data && data.address) {
        const a = data.address;
        const village = a.village || a.suburb || a.neighbourhood || a.hamlet || a.town || a.city_district || '';
        const taluka = a.county || a.state_district || a.subdistrict || a.town || '';
        const district = a.state_district || a.county || a.city || '';
        const state = a.state || '';
        const pincode = a.postcode || '';

        if (state || district || taluka || village) {
          console.log('[Geocoder] OpenStreetMap reverse geocoding succeeded');
          return createResultObject(village, taluka, district, state, pincode);
        }
      }
    }
  } catch (e) {
    console.warn('[Geocoder] OpenStreetMap geocoding failed:', e.message);
  }
  return null;
};

/**
 * Provider 3: BigDataCloud Reverse Geocoding Client API
 */
const geocodeWithBigDataCloud = async (lat, lng) => {
  try {
    const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (data) {
        const village = data.locality || data.city || '';
        const taluka = data.principalSubdivisionCode || data.locality || '';
        const district = data.principalSubdivision || data.city || '';
        const state = data.principalSubdivision || '';
        const pincode = data.postcode || '';

        if (state || district || village) {
          console.log('[Geocoder] BigDataCloud reverse geocoding succeeded');
          return createResultObject(village, taluka, district, state, pincode);
        }
      }
    }
  } catch (e) {
    console.warn('[Geocoder] BigDataCloud geocoding failed:', e.message);
  }
  return null;
};

/**
 * Provider 4: Emergency Fallback
 */
const getEmergencyFallback = () => {
  console.log('[Geocoder] Returning emergency fallback address');
  return createResultObject('Murti', 'Baramati', 'Pune', 'Maharashtra', '412102');
};

/**
 * Main reverseGeocodeWithCache function executing provider chain:
 * Expo -> OpenStreetMap -> BigDataCloud -> Emergency Fallback
 */
export const reverseGeocodeWithCache = async (latitude, longitude) => {
  if (!latitude || !longitude) return null;

  const latVal = Number(latitude);
  const lngVal = Number(longitude);

  if (isNaN(latVal) || isNaN(lngVal)) return null;

  const key = `${latVal.toFixed(4)},${lngVal.toFixed(4)}`;
  if (geocodeCache[key]) {
    return geocodeCache[key];
  }

  // Provider 1: Expo
  let res = await geocodeWithExpo(latVal, lngVal);

  // Provider 2: OpenStreetMap
  if (!res) {
    res = await geocodeWithOSM(latVal, lngVal);
  }

  // Provider 3: BigDataCloud
  if (!res) {
    res = await geocodeWithBigDataCloud(latVal, lngVal);
  }

  // Provider 4: Emergency Fallback
  if (!res) {
    res = getEmergencyFallback();
  }

  if (res) {
    geocodeCache[key] = res;
  }

  return res;
};

/**
 * Deduplicates and formats location segments into clean title and subtitle.
 */
export const formatLocationDisplay = (locationObj) => {
  if (!locationObj) {
    return { title: '', subtitle: '', formatted: '' };
  }

  const { village, taluka, district, state } = locationObj;
  const rawSegments = [village, taluka, district, state];

  const uniqueSegments = [];
  const seenLower = new Set();

  for (const seg of rawSegments) {
    if (!seg || typeof seg !== 'string') continue;
    const trimmed = seg.trim();
    if (!trimmed) continue;
    const lower = trimmed.toLowerCase();

    if (!seenLower.has(lower)) {
      seenLower.add(lower);
      uniqueSegments.push(trimmed);
    }
  }

  if (uniqueSegments.length === 0) {
    return { title: '', subtitle: '', formatted: '' };
  }

  const title = uniqueSegments[0];
  const subtitleSegments = uniqueSegments.slice(1);
  const subtitle = subtitleSegments.join(', ');
  const formatted = uniqueSegments.join(', ');

  return { title, subtitle, formatted };
};
