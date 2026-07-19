import * as Location from 'expo-location';

const geocodeCache = {};

/**
 * Performs reverse geocoding with caching to avoid repeated API requests for the same coordinates.
 * Coordinates are formatted to 4 decimal places (approx. 10 meters) for cache lookup.
 * Handles offline mode and errors gracefully.
 * 
 * @param {number} latitude 
 * @param {number} longitude 
 * @returns {Promise<{village: string, taluka: string, district: string, state: string, pincode: string, formattedAddress: string}|null>}
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

  try {
    const reverse = await Location.reverseGeocodeAsync({ latitude: latVal, longitude: lngVal });
    
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
      
      const addressParts = Array.from(new Set([
        village,
        taluka,
        district,
        state,
        pincode
      ])).filter(part => part && part.trim() !== '');

      const result = {
        village,
        taluka,
        district,
        state,
        pincode,
        formattedAddress: addressParts.join(', ')
      };

      geocodeCache[key] = result;
      return result;
    }
  } catch (e) {
    console.warn('[Geocoder] Failed to reverse geocode:', e.message);
  }
  return null;
};

/**
 * Deduplicates and formats location segments into clean title and subtitle.
 * 
 * Rules:
 * 1. Filter out empty/null/undefined strings.
 * 2. Case-insensitively deduplicate duplicate segments (e.g. ['Baramati', 'Baramati', 'Pune', 'Maharashtra'] -> ['Baramati', 'Pune', 'Maharashtra']).
 * 3. First segment is the Title.
 * 4. Remaining segments are joined as Subtitle.
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
