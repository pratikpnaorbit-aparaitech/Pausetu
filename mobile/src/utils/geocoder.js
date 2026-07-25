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

  // If village is identical to taluka or district, make it empty/optional
  let finalVillage = v;
  if (v.toLowerCase() === t.toLowerCase() || v.toLowerCase() === d.toLowerCase()) {
    finalVillage = '';
  }

  const addressParts = Array.from(new Set([finalVillage, t, d, s, p])).filter(Boolean);
  return {
    village: finalVillage,
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
      console.log('[Geocoder] Raw Expo reverseGeocodeAsync response:', addr);
      const isBusinessOrPoi = (name) => {
        if (!name) return true;
        const lower = name.toLowerCase();
        const poiKeywords = ['developer', 'pvt', 'ltd', 'limited', 'hotel', 'restaurant', 'store', 'shop', 'complex', 'plaza', 'trader', 'enterprise', 'service', 'hospital', 'school', 'bank', 'atm', 'clinic', 'mart', 'agency'];
        return poiKeywords.some(keyword => lower.includes(keyword));
      };

      const cleanName = (!isBusinessOrPoi(addr.name) ? addr.name : null);
      const village = addr.subLocality || cleanName || addr.street || '';

      // Priority mapping:
      // State: administrativeArea OR region
      const state = addr.administrativeArea || addr.region || '';

      // District: subAdministrativeArea OR state_district OR subregion (avoid duplicating town/city in district)
      let district = addr.subAdministrativeArea || addr.subregion;
      if (!district && addr.district) {
        const dLower = addr.district.toLowerCase();
        const cityLower = (addr.city || '').toLowerCase();
        const locLower = (addr.locality || '').toLowerCase();
        if (dLower !== cityLower && dLower !== locLower) {
          district = addr.district;
        }
      }
      if (!district) {
        district = addr.subregion || addr.district || '';
      }

      // Taluka: city OR locality OR subdistrict
      const taluka = addr.city || addr.locality || addr.district || '';
      const pincode = addr.postalCode || '';

      if (state || district || taluka || village) {
        console.log('[Geocoder] Expo reverseGeocodeAsync mapped:', { village, taluka, district, state, pincode });
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
        const village = a.suburb || a.village || a.neighbourhood || a.hamlet || '';
        const taluka = a.town || a.subdistrict || a.municipality || a.county || '';
        const district = a.state_district || a.county || a.city || '';
        const state = a.state || '';
        const pincode = a.postcode || '';

        if (state || district || taluka || village) {
          console.log('[Geocoder] OpenStreetMap reverse geocoding mapped:', { village, taluka, district, state, pincode });
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
        const village = data.locality || '';
        const taluka = data.localityInfo?.administrative?.find(item => item.adminLevel === 8)?.name || '';
        const district = data.localityInfo?.administrative?.find(item => item.adminLevel === 6)?.name || data.city || '';
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
