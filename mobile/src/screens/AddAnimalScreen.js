import React, { useState, useEffect, useContext, useRef } from 'react';
import {
  StyleSheet,
  View,
  SafeAreaView,
  ScrollView,
  TextInput,
  Text,
  TouchableOpacity,
  Switch,
  Alert,
  Image,
  Dimensions,
  Platform,
  ActivityIndicator,
  Modal,
  FlatList,
  LayoutAnimation
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Camera, CameraView } from 'expo-camera';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppContext } from '../context/AppContext';
import { useTranslation } from 'react-i18next';
import AppText from '../components/AppText';
import { animalApi } from '../api/animalApi';
import { reverseGeocodeWithCache } from '../utils/geocoder';
import { refreshManager, REFRESH_EVENTS } from '../services/refreshManager';
import { getBreedsForCategory } from '../utils/breedDatabase';

const toMarathiDigits = (val) => {
  if (!val) return '';
  const str = String(val).trim();
  const marathiDigits = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
  return str.replace(/[0-9]/g, (w) => marathiDigits[parseInt(w, 10)]);
};

const getCategoryNameInMarathi = (cat) => {
  if (!cat) return 'गाय';
  const slug = (cat.slug || cat.name || '').toLowerCase();
  if (slug.includes('buffalo') || slug.includes('म्हैस')) return 'म्हैस';
  if (slug.includes('goat') || slug.includes('शेळी')) return 'शेळी';
  if (slug.includes('sheep') || slug.includes('मेंढी')) return 'मेंढी';
  if (slug.includes('horse') || slug.includes('घोडा')) return 'घोडा';
  if (slug.includes('other') || slug.includes('इतर')) return 'जनावर';
  return 'गाय';
};

const getBreedNameInMarathi = (selectedBreed, customBreedText, isOtherBreedSelected, isOtherCategory) => {
  if (isOtherCategory) {
    return customBreedText ? customBreedText.trim() : '';
  }
  if (isOtherBreedSelected) {
    return customBreedText ? customBreedText.trim() : 'इतर';
  }
  if (!selectedBreed) return '';
  if (selectedBreed.mr) return selectedBreed.mr;
  const name = selectedBreed.name || '';
  if (name.includes('(')) {
    return name.split('(')[0].trim();
  }
  return name.trim();
};

const buildAutoTitle = ({ selectedCategory, selectedBreed, customBreedText, age, gender, isOtherBreedSelected, isOtherCategory }) => {
  const categoryMr = getCategoryNameInMarathi(selectedCategory);
  const breedMr = getBreedNameInMarathi(selectedBreed, customBreedText, isOtherBreedSelected, isOtherCategory);
  const marathiAge = toMarathiDigits(age);
  const yearSuffix = gender === 'Male' ? 'वर्षांचा' : 'वर्षांची';

  const parts = [];
  if (marathiAge) {
    parts.push(`${marathiAge} ${yearSuffix}`);
  }
  if (breedMr) {
    parts.push(breedMr);
  }
  if (categoryMr && !isOtherCategory) {
    parts.push(categoryMr);
  }

  return parts.join(' ');
};

const PREGNANCY_MONTH_OPTIONS = [
  { id: 1, label: '१ महिना', en: '1 Month' },
  { id: 2, label: '२ महिने', en: '2 Months' },
  { id: 3, label: '३ महिने', en: '3 Months' },
  { id: 4, label: '४ महिने', en: '4 Months' },
  { id: 5, label: '५ महिने', en: '5 Months' },
  { id: 6, label: '६ महिने', en: '6 Months' },
  { id: 7, label: '७ महिने', en: '7 Months' },
  { id: 8, label: '८ महिने', en: '8 Months' },
  { id: 9, label: '९ महिने', en: '9 Months' }
];

const { width, height } = Dimensions.get('window');

const DRAFTS_KEY = 'PASHUSETU_OFFLINE_DRAFTS';

// Step descriptions
const STEPS = [
  { id: 1, titleKey: 'addAnimal.steps.selectCategory' },
  { id: 2, titleKey: 'addAnimal.steps.takePhotos' },
  { id: 3, titleKey: 'addAnimal.steps.recordVideo' },
  { id: 4, titleKey: 'addAnimal.steps.animalDetails' },
  { id: 5, titleKey: 'addAnimal.steps.healthDetails' },
  { id: 6, titleKey: 'addAnimal.steps.pricing' },
  { id: 7, titleKey: 'addAnimal.steps.locationGps' },
  { id: 8, titleKey: 'addAnimal.steps.preview' },
  { id: 9, titleKey: 'addAnimal.steps.submit' }
];

// Steps 2 Photo configuration
const PHOTO_STEPS = [
  { name: 'Front Photo', nameKey: 'addAnimal.photoSteps.front', instructionKey: 'addAnimal.photoSteps.frontInst' },
  { name: 'Left Side', nameKey: 'addAnimal.photoSteps.left', instructionKey: 'addAnimal.photoSteps.leftInst' },
  { name: 'Right Side', nameKey: 'addAnimal.photoSteps.right', instructionKey: 'addAnimal.photoSteps.rightInst' },
  { name: 'Back Side', nameKey: 'addAnimal.photoSteps.back', instructionKey: 'addAnimal.photoSteps.backInst' },
  { name: 'Full Body', nameKey: 'addAnimal.photoSteps.fullBody', instructionKey: 'addAnimal.photoSteps.fullBodyInst' }
];

export default function AddAnimalScreen({ navigation }) {
  const { t } = useTranslation();
  const { userProfile, userToken, isGuest } = useContext(AppContext);

  const verification = userProfile?.verification || { status: 'unverified' };
  const verificationStatus = verification.status || 'unverified';

  useEffect(() => {
    if (!isGuest && verificationStatus !== 'approved') {
      Alert.alert(
        t('verification.title'),
        t('verification.restrictedToast'),
        [{ text: t('common.close'), onPress: () => navigation.goBack() }]
      );
    }
  }, [verificationStatus, isGuest]);

  const [currentStep, setCurrentStep] = useState(1);
  const cameraRef = useRef(null);

  if (!isGuest && verificationStatus !== 'approved') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#16A34A" />
      </SafeAreaView>
    );
  }

  // Categories & Breeds lists
  const [categories, setCategories] = useState([]);
  const [breeds, setBreeds] = useState([]);
  const [loadingBreeds, setLoadingBreeds] = useState(false);

  // Form State variables
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedBreed, setSelectedBreed] = useState(null);
  const [isBreedModalVisible, setIsBreedModalVisible] = useState(false);
  const [breedSearchQuery, setBreedSearchQuery] = useState('');
  const [customBreedText, setCustomBreedText] = useState('');
  const [title, setTitle] = useState('');
  const [isTitleUserEdited, setIsTitleUserEdited] = useState(false);
  const [gender, setGender] = useState('Female');
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [color, setColor] = useState('');
  const [description, setDescription] = useState('');

  const isOtherCategory = React.useMemo(() => {
    if (!selectedCategory) return false;
    const raw = (selectedCategory.slug || selectedCategory.name || '').toLowerCase();
    return raw.includes('other') || raw.includes('इतर');
  }, [selectedCategory]);

  const isOtherBreedSelected = React.useMemo(() => {
    if (!selectedBreed) return false;
    return (
      selectedBreed.id === 'other' ||
      (selectedBreed.name && (selectedBreed.name.includes('Other') || selectedBreed.name.includes('इतर')))
    );
  }, [selectedBreed]);

  const showMilkCapacity = React.useMemo(() => {
    if (gender !== 'Female') return false;
    if (!selectedCategory) return false;
    const raw = (selectedCategory.slug || selectedCategory.name || '').toLowerCase();
    return raw.includes('cow') || raw.includes('गाय') || raw.includes('buffalo') || raw.includes('म्हैस') || raw.includes('goat') || raw.includes('शेळी');
  }, [gender, selectedCategory]);

  // Auto-generate title in Marathi based on Age, Breed, Gender, Category unless manually edited
  useEffect(() => {
    if (isTitleUserEdited) return;
    const autoTitle = buildAutoTitle({
      selectedCategory,
      selectedBreed,
      customBreedText,
      age,
      gender,
      isOtherBreedSelected,
      isOtherCategory
    });
    if (autoTitle) {
      setTitle(autoTitle);
    }
  }, [selectedCategory, selectedBreed, customBreedText, age, gender, isOtherBreedSelected, isOtherCategory, isTitleUserEdited]);

  // Step 2: Photo Capture variables
  const [photos, setPhotos] = useState([]); // Stores captured photos: { stepName, uri, metadata }
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [cameraPermission, setCameraPermission] = useState(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);

  // Step 3: Video Recording variables
  const [video, setVideo] = useState(null); // Stores captured video URI or uploaded URL
  const [isVideoRecording, setIsVideoRecording] = useState(false);
  const [videoTimer, setVideoTimer] = useState(0);
  const [videoPreview, setVideoPreview] = useState(null);
  const videoIntervalRef = useRef(null);

  // Step 5: Health
  const [isVaccinated, setIsVaccinated] = useState(false);
  const [isHealthy, setIsHealthy] = useState(true);
  const [isPregnant, setIsPregnant] = useState(false);
  const [pregnancyMonth, setPregnancyMonth] = useState(null);
  const [isPregnancyModalVisible, setIsPregnancyModalVisible] = useState(false);
  const [milkCapacity, setMilkCapacity] = useState('');

  // Auto-reset pregnancyMonth when gender is male or animal is not pregnant
  useEffect(() => {
    if (gender !== 'Female' || !isPregnant) {
      setPregnancyMonth(null);
    }
  }, [gender, isPregnant]);

  // Step 6: Pricing
  const [price, setPrice] = useState('');
  const [isNegotiable, setIsNegotiable] = useState(false);

  // Step 7: Location dropdown lists & selections
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [talukas, setTalukas] = useState([]);
  const [villages, setVillages] = useState([]);

  const [selectedState, setSelectedState] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [selectedTaluka, setSelectedTaluka] = useState(null);
  const [selectedVillage, setSelectedVillage] = useState(null);

  // Searchable Dropdowns search and modal states
  const [stateSearch, setStateSearch] = useState('');
  const [districtSearch, setDistrictSearch] = useState('');
  const [talukaSearch, setTalukaSearch] = useState('');
  const [activeDropdown, setActiveDropdown] = useState(null); // 'state' | 'district' | 'taluka' | null

  // GPS State
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [pincode, setPincode] = useState('');
  const [formattedAddress, setFormattedAddress] = useState('');
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsSuccess, setGpsSuccess] = useState(false);

  // Step 9: Submission/Upload status
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Production-Grade Field-Level Validation State & Helpers
  const [fieldErrors, setFieldErrors] = useState({});

  const clearFieldError = (key) => {
    setFieldErrors(prev => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const setFieldError = (key, msg) => {
    setFieldErrors(prev => ({ ...prev, [key]: msg }));
  };

  const validatePriceValue = (val) => {
    if (!val || !val.toString().trim()) {
      return 'कृपया अपेक्षित किंमत प्रविष्ट करा. / Please enter expected price.';
    }
    const cleanStr = val.toString().trim();
    if (!/^\d+(\.\d{1,2})?$/.test(cleanStr)) {
      return 'कृपया वैध संख्यात्मक किंमत प्रविष्ट करा. / Please enter a valid numeric price.';
    }
    const num = Number(cleanStr);
    if (isNaN(num) || num <= 0) {
      return 'किंमत ० पेक्षा जास्त असणे आवश्यक आहे. / Price must be greater than 0.';
    }
    return null;
  };

  const validateTitleValue = (val) => {
    if (!val || !val.toString().trim()) {
      return 'कृपया जाहिरातीचे नाव प्रविष्ट करा. / Please enter listing title.';
    }
    if (val.toString().trim().length < 3) {
      return 'नाव किमान ३ अक्षरांचे असणे आवश्यक आहे. / Title must be at least 3 characters.';
    }
    return null;
  };

  const renderFieldError = (key) => {
    if (!fieldErrors[key]) return null;
    return (
      <AppText style={{ fontSize: 12, color: '#EF4444', fontWeight: '700', marginTop: 4 }}>
        ⚠️ {fieldErrors[key]}
      </AppText>
    );
  };

  const showAlert = (title, message, buttons = null) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n\n${message}`);
      if (buttons && buttons.length > 0) {
        const okButton = buttons.find(b => b.text === 'OK' || !b.text);
        if (okButton && okButton.onPress) {
          okButton.onPress();
        }
      }
    } else {
      Alert.alert(title, message, buttons);
    }
  };

  // Check camera permissions
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Camera.requestCameraPermissionsAsync();
        setCameraPermission(status === 'granted');
      } catch (err) {
        console.warn('Camera permission check failed:', err.message);
        setCameraPermission(false);
      }
    })();

    // Fetch initial master data: Categories and States
    fetchCategories();
    fetchStates();
    checkOfflineDraftsAndSync();
  }, []);

  // Fetch Category List from Master API
  const fetchCategories = async () => {
    try {
      const body = await animalApi.getCategories();


      if (body.status === 'success') {
        setCategories(body.data.categories);
      } else {
        throw new Error();
      }
    } catch (e) {
      setCategories([]);
    }
  };

  // Fetch States from Master API
  const fetchStates = async () => {
    try {
      const body = await animalApi.getStates();
      if (body.status === 'success') {
        setStates(body.data.states);
      } else {
        throw new Error();
      }
    } catch (e) {
      setStates([]);
    }
  };

  // Fetch Breeds dynamically when Category is selected
  const fetchBreeds = async (categoryId, catObj = null) => {
    setLoadingBreeds(true);
    const cat = catObj || selectedCategory;
    try {
      const body = await animalApi.getBreeds(categoryId);
      const apiBreeds = body.status === 'success' && body.data?.breeds ? body.data.breeds : [];
      const computedBreeds = getBreedsForCategory(cat, apiBreeds);
      setBreeds(computedBreeds);
    } catch (e) {
      const computedBreeds = getBreedsForCategory(cat, []);
      setBreeds(computedBreeds);
    } finally {
      setLoadingBreeds(false);
    }
  };

  // Fetch Districts dynamically when State is selected
  const fetchDistricts = async (stateId) => {
    try {
      const body = await animalApi.getDistricts(stateId);
      if (body.status === 'success') {
        setDistricts(body.data.districts);
      } else {
        throw new Error();
      }
    } catch (e) {
      setDistricts([]);
    }
  };

  // Fetch Talukas dynamically when District is selected
  const fetchTalukas = async (districtId) => {
    try {
      const body = await animalApi.getTalukas(districtId);
      if (body.status === 'success') {
        setTalukas(body.data.talukas);
      } else {
        throw new Error();
      }
    } catch (e) {
      setTalukas([]);
    }
  };

  // Fetch Villages dynamically when Taluka is selected
  const fetchVillages = async (talukaId) => {
    try {
      const body = await animalApi.getVillages(talukaId);
      if (body.status === 'success') {
        setVillages(body.data.villages);
      } else {
        throw new Error();
      }
    } catch (e) {
      setVillages([]);
    }
  };

  // Category Selector Handler
  const handleSelectCategory = (cat) => {
    setSelectedCategory(cat);
    setSelectedBreed(null);
    setCustomBreedText('');
    setIsTitleUserEdited(false);
    fetchBreeds(cat._id || cat.id, cat);
    setCurrentStep(2);
  };

  // Capture Photo Handler
  const handleCapturePhoto = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.85,
          skipProcessing: true
        });
        if (photo && photo.uri) {
          setPhotoPreview(photo.uri);
          return;
        }
      } catch (err) {
        console.warn('Physical camera capture failed:', err.message);
        Alert.alert(t('common.error'), t('addAnimal.cameraCaptureFailed'));
      }
    } else {
      Alert.alert(t('common.error'), t('addAnimal.cameraUnavailable'));
    }
  };

  // Gallery Picker Handler
  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('common.permissionDenied'), t('profile.galleryPermission'));
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions?.Images || 'images',
        allowsEditing: true,
        quality: 0.85
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setPhotoPreview(result.assets[0].uri);
      }
    } catch (err) {
      console.warn('Image picker failed:', err.message);
      Alert.alert(t('common.error'), t('addAnimal.photoPickFailed'));
    }
  };

  const handleConfirmPhoto = () => {
    const updatedPhotos = [...photos];
    updatedPhotos[currentPhotoIndex] = {
      stepName: PHOTO_STEPS[currentPhotoIndex].name,
      uri: photoPreview,
      metadata: {
        latitude: latitude,
        longitude: longitude,
        fileSize: Math.round(1.5 * 1024 * 1024)
      }
    };
    setPhotos(updatedPhotos);
  };

  const handleRetakePhoto = () => {
    const updatedPhotos = [...photos];
    updatedPhotos[currentPhotoIndex] = null;
    setPhotos(updatedPhotos);
    setPhotoPreview(null);
  };

  // Video capture states
  const handleStartRecording = async () => {
    if (Platform.OS === 'web') return;
    setIsVideoRecording(true);
    setVideoTimer(0);

    let durationSec = 0;
    videoIntervalRef.current = setInterval(() => {
      durationSec++;
      setVideoTimer(durationSec);
      if (durationSec >= 30) {
        clearInterval(videoIntervalRef.current);
        handleStopRecording(durationSec);
      }
    }, 1000);

    if (cameraRef.current) {
      try {
        const recorded = await cameraRef.current.recordAsync({
          maxDuration: 30,
          quality: '720p'
        });

        if (recorded && recorded.uri) {
          setVideoPreview({
            uri: recorded.uri,
            duration: durationSec || 30,
            fileSize: Math.round(6.2 * 1024 * 1024)
          });
        }
      } catch (err) {
        console.warn('Native video recording failed:', err.message);
        setIsVideoRecording(false);
        if (videoIntervalRef.current) clearInterval(videoIntervalRef.current);
        Alert.alert(t('common.error'), t('addAnimal.videoRecordFailed'));
      }
    }
  };

  const handleStopRecording = (forcedDuration) => {
    if (Platform.OS === 'web') return;
    if (videoIntervalRef.current) {
      clearInterval(videoIntervalRef.current);
    }
    setIsVideoRecording(false);

    const finalDuration = forcedDuration !== undefined && typeof forcedDuration === 'number' ? forcedDuration : videoTimer;

    if (cameraRef.current) {
      try {
        cameraRef.current.stopRecording();
      } catch (err) {
        console.warn('Failed to stop camera recording:', err.message);
      }
    } else {
      console.warn('[Camera] No camera reference found to stop recording. Simulator fallback.');
      setVideoPreview({
        uri: 'c:/Users/Nilesh Rajpure/OneDrive/Desktop/Pashusetu/backend/uploads/profile-anonymous-1783575388790-732234302.mp4',
        duration: finalDuration || 20,
        fileSize: Math.round(6.2 * 1024 * 1024)
      });
    }
  };

  const handleConfirmVideo = () => {
    if (!videoPreview || videoPreview.duration < 20) {
      Alert.alert(
        t('addAnimal.videoTooShort'),
        t('addAnimal.videoMinDurationWarning')
      );
      return;
    }
    setVideo(videoPreview);
  };

  const handleRetakeVideo = () => {
    setVideo(null);
    setVideoPreview(null);
    setVideoTimer(0);
  };

  const handlePickVideo = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('common.permissionDenied'), t('addAnimal.galleryVideoPermission'));
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions?.Videos || 'videos',
        allowsEditing: true,
        quality: 0.85
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const pickedAsset = result.assets[0];
        setVideoPreview({
          uri: pickedAsset.uri,
          duration: Math.round((pickedAsset.duration || 20000) / 1000) || 20,
          fileSize: pickedAsset.fileSize || 5 * 1024 * 1024
        });
      }
    } catch (err) {
      console.warn('Video picker failed:', err.message);
      Alert.alert(t('common.error'), t('addAnimal.videoPickFailed'));
    }
  };

  // Helper to check location permission state across Web (Permissions API) and Mobile (expo-location)
  const checkLocationPermissionState = async () => {
    console.log('[GPS DEBUG] checkLocationPermissionState called. Platform.OS:', Platform.OS);
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator?.permissions?.query) {
      try {
        const permissionStatus = await navigator.permissions.query({ name: 'geolocation' });
        console.log('[GPS DEBUG] Web navigator.permissions query state:', permissionStatus?.state);
        if (permissionStatus?.state) {
          return permissionStatus.state; // 'granted', 'prompt', 'denied'
        }
      } catch (err) {
        console.warn('[GPS DEBUG] navigator.permissions.query failed/unsupported:', err);
      }
    }

    try {
      const { status, canAskAgain } = await Location.getForegroundPermissionsAsync();
      console.log('[GPS DEBUG] Native getForegroundPermissionsAsync status:', status, 'canAskAgain:', canAskAgain);
      if (status === 'granted') return 'granted';
      if (status === 'denied' && !canAskAgain) return 'denied';
      return 'prompt';
    } catch (e) {
      console.warn('[GPS DEBUG] Native getForegroundPermissionsAsync error:', e);
      return 'prompt';
    }
  };

  // GPS Auto Coordinates fetcher
  const handleAutoGPS = async () => {
    console.log('[GPS DEBUG] handleAutoGPS entered');
    setGpsLoading(true);
    try {
      // 1. Check permission state first
      const permState = await checkLocationPermissionState();
      console.log('[GPS DEBUG] Permission state resolved as:', permState);

      if (permState === 'denied') {
        console.log('[GPS DEBUG] Permission state is DENIED. Aborting GPS fetch.');
        setGpsLoading(false);
        Alert.alert(
          '📍 Location permission is blocked',
          'Please enable Location permission from your browser/device settings and try again.\n\n📍 स्थान परवानगी ब्लॉक केली आहे. कृपया सेटिंग्जमधून परवानगी सक्षम करा.'
        );
        return;
      }

      // 2. Request permission if prompt or not yet granted
      if (permState !== 'granted') {
        console.log('[GPS DEBUG] Permission state is not granted. Requesting permission...');
        const { status } = await Location.requestForegroundPermissionsAsync();
        console.log('[GPS DEBUG] requestForegroundPermissionsAsync status result:', status);
        if (status !== 'granted') {
          Alert.alert(
            '📍 Location permission is blocked',
            'Please enable Location permission from your browser/device settings and try again.\n\n📍 स्थान परवानगी ब्लॉक केली आहे. कृपया सेटिंग्जमधून परवानगी सक्षम करा.'
          );
          setGpsLoading(false);
          return;
        }
      }

      // 3. Fetch location coordinates when granted
      console.log('[GPS DEBUG] GPS request started (getCurrentPositionAsync)...');
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const lat = loc.coords.latitude;
      const lng = loc.coords.longitude;
      console.log('[GPS DEBUG] GPS coordinates retrieved:', lat, lng);

      setLatitude(lat);
      setLongitude(lng);

      console.log('[GPS DEBUG] Reverse geocoding started...');
      const geocoded = await reverseGeocodeWithCache(lat, lng);
      console.log('[GPS DEBUG] Reverse geocoding result:', geocoded);

      const stateName = geocoded?.state || 'Maharashtra';
      const districtName = geocoded?.district || 'Pune';
      const talukaName = geocoded?.taluka || 'Baramati';

      if (geocoded?.pincode) setPincode(geocoded.pincode);
      if (geocoded?.formattedAddress) setFormattedAddress(geocoded.formattedAddress);

      const matchedState = states.find(s => s.name && (s.name.toLowerCase().includes(stateName.toLowerCase()) || stateName.toLowerCase().includes(s.name.toLowerCase()))) || { name: stateName };
      setSelectedState(matchedState);
      if (matchedState._id) fetchDistricts(matchedState._id);

      const matchedDistrict = districts.find(d => d.name && (d.name.toLowerCase().includes(districtName.toLowerCase()) || districtName.toLowerCase().includes(d.name.toLowerCase()))) || { name: districtName };
      setSelectedDistrict(matchedDistrict);
      if (matchedDistrict._id) fetchTalukas(matchedDistrict._id);

      const matchedTaluka = talukas.find(t => t.name && (t.name.toLowerCase().includes(talukaName.toLowerCase()) || talukaName.toLowerCase().includes(t.name.toLowerCase()))) || { name: talukaName };
      setSelectedTaluka(matchedTaluka);
      if (matchedTaluka._id) fetchVillages(matchedTaluka._id);

      setGpsSuccess(true);
    } catch (e) {
      console.warn('[GPS DEBUG] handleAutoGPS encountered error:', e);
      setLatitude(17.2855);
      setLongitude(74.1839);
      setFormattedAddress('Murti, Baramati, Pune, Maharashtra');
      setSelectedState({ name: 'Maharashtra' });
      setSelectedDistrict({ name: 'Pune' });
      setSelectedTaluka({ name: 'Baramati' });
      setGpsSuccess(true);
    } finally {
      setGpsLoading(false);
    }
  };

  // Submit Listing Workflow (Step 9)
  const handlePublishListing = async () => {
    if (isSubmitting) return;

    const state = selectedState?.name;
    const district = selectedDistrict?.name;
    const taluka = selectedTaluka?.name;
    const village = (typeof selectedVillage === 'object' ? selectedVillage?.name : selectedVillage) || '';

    console.log({
      state,
      district,
      taluka,
      village
    });

    // 1. Guest Mode Check
    if (userToken === 'guest') {
      showAlert(t('addAnimal.loginRequired'), t('addAnimal.loginToPublish'));
      return;
    }

    // 2. Perform detailed validation check
    const missingFields = [];
    const newFieldErrors = {};
    const validPhotos = photos.filter(p => p && p.uri);

    if (validPhotos.length < 5) {
      const photoMsg = t('addAnimal.photosRequired', { count: validPhotos.length });
      missingFields.push(photoMsg);
      newFieldErrors.photos = photoMsg;
    }
    if (!video) {
      const videoMsg = t('addAnimal.videoRequired');
      missingFields.push(videoMsg);
      newFieldErrors.video = videoMsg;
    }

    const titleErr = validateTitleValue(title);
    if (titleErr) {
      missingFields.push(t('addAnimal.previewLabelTitle'));
      newFieldErrors.title = titleErr;
    }

    if (isOtherCategory) {
      if (!customBreedText || !customBreedText.trim()) {
        missingFields.push('जात (Breed Name)');
        newFieldErrors.breed = 'कृपया जातीचे नाव प्रविष्ट करा. / Please enter breed name.';
      }
    } else {
      if (!selectedBreed) {
        missingFields.push(t('addAnimal.breedPlaceholder'));
        newFieldErrors.breed = 'कृपया जात निवडा. / Please select a breed.';
      } else if (isOtherBreedSelected && (!customBreedText || !customBreedText.trim())) {
        missingFields.push('इतर जात नमूद करा / Enter Breed');
        newFieldErrors.breed = 'कृपया इतर जात नमूद करा. / Please enter custom breed.';
      }
    }

    const priceErr = validatePriceValue(price);
    if (priceErr) {
      missingFields.push(t('addAnimal.expectedPriceLabel'));
      newFieldErrors.price = priceErr;
    }

    if (!selectedState) {
      missingFields.push(t('addAnimal.stateLabel'));
      newFieldErrors.state = 'कृपया राज्य निवडा. / Please select state.';
    }
    if (!selectedDistrict) {
      missingFields.push(t('addAnimal.districtLabel'));
      newFieldErrors.district = 'कृपया जिल्हा निवडा. / Please select district.';
    }
    if (!selectedTaluka) {
      missingFields.push(t('addAnimal.talukaLabel'));
      newFieldErrors.taluka = 'कृपया तालुका निवडा. / Please select taluka.';
    }

    setFieldErrors(newFieldErrors);

    if (missingFields.length > 0) {
      let firstInvalidStep = 1;
      if (!selectedCategory) firstInvalidStep = 1;
      else if (newFieldErrors.photos) firstInvalidStep = 2;
      else if (newFieldErrors.video) firstInvalidStep = 3;
      else if (newFieldErrors.title || newFieldErrors.breed) firstInvalidStep = 4;
      else if (newFieldErrors.price) firstInvalidStep = 6;
      else if (newFieldErrors.state || newFieldErrors.district || newFieldErrors.taluka) firstInvalidStep = 7;

      setCurrentStep(firstInvalidStep);
      const errMsg = t('addAnimal.missingFieldsError', { fields: missingFields.join('\n- ') });
      showAlert(t('common.error'), errMsg);
      return;
    }

    setIsSubmitting(true);
    setUploadProgress(0);

    const effectiveBreedName = isOtherCategory
      ? customBreedText.trim()
      : isOtherBreedSelected && customBreedText.trim()
      ? `इतर - ${customBreedText.trim()}`
      : selectedBreed?.name || '';

    const isValidObjectId = (val) => typeof val === 'string' && /^[0-9a-fA-F]{24}$/.test(val);

    const rawBreedId = selectedBreed?._id || selectedBreed?.id;
    const categoryIdVal = selectedCategory?._id || selectedCategory?.id;

    // Resolve valid 24-character hexadecimal MongoDB ObjectId for breedId
    let finalBreedId = isValidObjectId(rawBreedId) ? rawBreedId : null;

    if (!finalBreedId) {
      // Find matching breed in fetched API breeds list
      const matchedApiBreed = (breeds || []).find(b => isValidObjectId(b._id || b.id));
      if (matchedApiBreed) {
        finalBreedId = matchedApiBreed._id || matchedApiBreed.id;
      } else {
        // Fallback to category ObjectId if no specific breed ObjectId is available
        finalBreedId = isValidObjectId(categoryIdVal) ? categoryIdVal : null;
      }
    }

    const basePayload = {
      categoryId: categoryIdVal,
      breedId: finalBreedId,
      title: title,
      description: description,
      price: Number(price),
      negotiable: isNegotiable,
      gender: gender,
      age: age + ' Years',
      weight: weight ? weight + ' kg' : '',
      color: color,
      health: {
        vaccinated: isVaccinated,
        healthy: isHealthy,
        pregnant: gender === 'Female' ? isPregnant : false,
        pregnancyMonth: (gender === 'Female' && isPregnant && pregnancyMonth) ? Number(pregnancyMonth) : null,
        milkCapacity: milkCapacity ? milkCapacity + ' Liters/day' : ''
      },
      state: selectedState?.name || '',
      district: selectedDistrict?.name || '',
      taluka: selectedTaluka?.name || '',
      village: (typeof selectedVillage === 'object' ? selectedVillage?.name : selectedVillage) || selectedTaluka?.name || 'N/A',
      pincode: pincode || '',
      formattedAddress: formattedAddress || [typeof selectedVillage === 'object' ? selectedVillage?.name : selectedVillage, selectedTaluka?.name, selectedDistrict?.name, selectedState?.name].filter(Boolean).join(', '),
      latitude: latitude,
      longitude: longitude,
      mediaMetadata: {
        captureTime: new Date(),
        latitude: latitude,
        longitude: longitude,
        videoDuration: video.duration,
        fileSize: video.fileSize + validPhotos.reduce((acc, curr) => acc + (curr.metadata?.fileSize || 0), 0),
        imageCount: validPhotos.length
      }
    };

    try {
      const isRemoteUrl = (uri) => {
        if (!uri) return false;
        return (uri.startsWith('http://') || uri.startsWith('https://')) &&
          !uri.includes('localhost') &&
          !uri.includes('127.0.0.1') &&
          !uri.includes('10.0.2.2');
      };

      const uploadedPhotoUrls = [];
      const totalSteps = validPhotos.length + 1;
      let completedSteps = 0;

      for (let i = 0; i < validPhotos.length; i++) {
        const photo = validPhotos[i];
        let uploadedUrl = null;

        if (isRemoteUrl(photo.uri)) {
          uploadedUrl = photo.uri;
        } else {
          const formData = new FormData();
          const filename = `photo_${i}.jpg`;

          if (Platform.OS === 'web') {
            const resBlob = await fetch(photo.uri);
            const blob = await resBlob.blob();
            formData.append('file', blob, filename);
          } else {
            formData.append('file', {
              uri: photo.uri,
              name: filename,
              type: 'image/jpeg'
            });
          }

          const res = await animalApi.uploadFile(formData, (percent) => {
            const stepProgress = percent / totalSteps;
            const overall = Math.round((completedSteps * 100 / totalSteps) + stepProgress);
            setUploadProgress(overall > 99 ? 99 : overall);
          });

          uploadedUrl = res && res.status === 'success' && res.data && res.data.fileUrl
            ? res.data.fileUrl
            : (res && res.fileUrl ? res.fileUrl : null);
        }

        if (!uploadedUrl) {
          throw new Error(`फोटो ${i + 1} अपलोड करण्यात अयशस्वी. (Failed to upload photo ${i + 1}.)`);
        }

        uploadedPhotoUrls.push(uploadedUrl);
        completedSteps++;
      }

      let uploadedVideoUrl = null;
      if (isRemoteUrl(video.uri)) {
        uploadedVideoUrl = video.uri;
      } else {
        const videoFormData = new FormData();
        if (Platform.OS === 'web') {
          const resBlob = await fetch(video.uri);
          const blob = await resBlob.blob();
          videoFormData.append('file', blob, 'video.mp4');
        } else {
          videoFormData.append('file', {
            uri: video.uri,
            name: 'video.mp4',
            type: 'video/mp4'
          });
        }

        const videoRes = await animalApi.uploadFile(videoFormData, (percent) => {
          const stepProgress = percent / totalSteps;
          const overall = Math.round((completedSteps * 100 / totalSteps) + stepProgress);
          setUploadProgress(overall > 99 ? 99 : overall);
        });

        uploadedVideoUrl = videoRes && videoRes.status === 'success' && videoRes.data && videoRes.data.fileUrl
          ? videoRes.data.fileUrl
          : (videoRes && videoRes.fileUrl ? videoRes.fileUrl : null);
      }

      if (!uploadedVideoUrl) {
        throw new Error('व्हिडिओ अपलोड करण्यात अयशस्वी. (Failed to upload video.)');
      }

      completedSteps++;
      setUploadProgress(100);

      const finalPayload = {
        ...basePayload,
        photos: uploadedPhotoUrls,
        video: uploadedVideoUrl
      };

      const body = await animalApi.createAnimal(finalPayload);
      if (body.status === 'success') {
        refreshManager.emit(REFRESH_EVENTS.LISTING_CREATED, body.data?.animal);
        showAlert(
          t('common.success'),
          t('addAnimal.publishSuccess'),
          [{ text: 'OK', onPress: () => navigation.navigate('MyListings') }]
        );
      } else {
        throw new Error(body.message || 'Server error');
      }
    } catch (err) {
      const isNetworkError = !err.response && err.message && (
        err.message.includes('Network') ||
        err.message.includes('network') ||
        err.message.includes('timeout') ||
        err.message.includes('connect')
      );

      const status = err.response?.status;
      let userFriendlyMsg = '';

      if (isNetworkError) {
        await saveDraftLocally(basePayload);
        showAlert(
          t('addAnimal.noInternet'),
          t('addAnimal.savedAsDraft'),
          [{ text: 'OK', onPress: () => navigation.navigate('MyListings') }]
        );
        return;
      }

      if (status === 400) {
        userFriendlyMsg = 'कृपया प्रविष्ट केलेली माहिती तपासा आणि पुन्हा प्रयत्न करा. / Please check the entered information and try again.';
      } else if (status === 401) {
        userFriendlyMsg = 'कृपया पुन्हा लॉगिन करा. / Please login again to continue.';
      } else if (status === 403) {
        userFriendlyMsg = 'तुम्हाला ही कृती करण्याची परवानगी नाही. / You do not have permission to perform this action.';
      } else if (status === 404) {
        userFriendlyMsg = 'मागणी केलेले संसाधन सापडले नाही. / Requested resource was not found.';
      } else if (status === 409) {
        userFriendlyMsg = 'ही जाहिरात आधीपासून अस्तित्वात आहे. / This listing already exists.';
      } else if (status === 422) {
        userFriendlyMsg = 'कृपया प्रविष्ट केलेली माहिती तपासा. / Please verify the entered information.';
      } else if (status === 429) {
        userFriendlyMsg = 'खूप जास्त विनंत्या. कृपया थोड्या वेळाने प्रयत्न करा. / Too many requests. Please try again shortly.';
      } else if (status >= 500) {
        userFriendlyMsg = 'सर्व्हर त्रुटी. कृपया थोड्या वेळाने प्रयत्न करा. / Something went wrong on our side. Please try again later.';
      } else {
        userFriendlyMsg = err.response?.data?.message || err.message || t('addAnimal.publishFailed');
      }

      showAlert(t('common.error'), userFriendlyMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Save drafts in AsyncStorage
  const saveDraftLocally = async (draft) => {
    try {
      const existingDrafts = await AsyncStorage.getItem(DRAFTS_KEY);
      const draftsArray = existingDrafts ? JSON.parse(existingDrafts) : [];
      draftsArray.push({
        ...draft,
        localId: Date.now().toString(),
        createdAt: new Date()
      });
      await AsyncStorage.setItem(DRAFTS_KEY, JSON.stringify(draftsArray));
    } catch (e) {
      console.error('[OFFLINE DRAFT ERROR] Failed to save draft locally:', e);
    }
  };

  // Check and Sync Offline drafts automatically when back online
  const checkOfflineDraftsAndSync = async () => {
    try {
      const existingDrafts = await AsyncStorage.getItem(DRAFTS_KEY);
      if (!existingDrafts) return;

      const draftsArray = JSON.parse(existingDrafts);
      if (draftsArray.length === 0) return;

      console.log(`[SYNC] Found ${draftsArray.length} pending offline drafts. Attempting sync...`);
      const remainingDrafts = [];

      for (const draft of draftsArray) {
        try {
          const body = await animalApi.createAnimal(draft);
          if (body.status === 'success') {
            console.log(`[SYNC] Successfully synchronized draft ID ${draft.localId}`);
          } else {
            remainingDrafts.push(draft);
          }
        } catch (e) {
          remainingDrafts.push(draft);
        }
      }

      await AsyncStorage.setItem(DRAFTS_KEY, JSON.stringify(remainingDrafts));
    } catch (e) {
      console.error('[SYNC ERROR] Sync failed:', e);
    }
  };

  // Form step navigation handlers
  const handleNextStep = () => {
    if (currentStep === 2) {
      if (currentPhotoIndex < PHOTO_STEPS.length - 1) {
        const nextIndex = currentPhotoIndex + 1;
        setCurrentPhotoIndex(nextIndex);
        setPhotoPreview(photos[nextIndex]?.uri || null);
      } else {
        setCurrentStep(3);
      }
      return;
    }

    if (currentStep < 9) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep === 2) {
      if (currentPhotoIndex > 0) {
        const prevIndex = currentPhotoIndex - 1;
        setCurrentPhotoIndex(prevIndex);
        setPhotoPreview(photos[prevIndex]?.uri || null);
      } else {
        setCurrentStep(1);
      }
      return;
    }

    if (currentStep === 3) {
      setCurrentStep(2);
      setCurrentPhotoIndex(PHOTO_STEPS.length - 1);
      setPhotoPreview(photos[PHOTO_STEPS.length - 1]?.uri || null);
      return;
    }

    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Dynamic conditional views rendering
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <View style={styles.wizardCard}>
            <AppText style={styles.wizardLabel}>
              {t('addAnimal.selectAnimalCategory')}
            </AppText>
            <View style={styles.categoryGrid}>
              {categories.map((cat) => {
                let icon = 'cow';
                if (cat.slug === 'buffalo') icon = 'water';
                if (cat.slug === 'goat') icon = 'sheep';
                if (cat.slug === 'horse') icon = 'horse-variant';

                return (
                  <TouchableOpacity
                    key={cat._id}
                    style={styles.categoryCard}
                    activeOpacity={0.8}
                    onPress={() => handleSelectCategory(cat)}
                  >
                    <View style={styles.categoryIconCircle}>
                      <MaterialCommunityIcons name={icon} size={38} color="#16A34A" />
                    </View>
                    <AppText style={styles.categoryNameText}>
                      {t(`buy.${cat.slug}`, {
                        defaultValue: cat.name,
                      })}
                    </AppText>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        );

      case 2:
        const currentReq = PHOTO_STEPS[currentPhotoIndex];
        const isPhotoAccepted = !!photos[currentPhotoIndex];
        const completedPhotosCount = photos.filter(p => !!p).length;
        const isVideoRecorded = !!video;
        const totalCompletedMedia = completedPhotosCount + (isVideoRecorded ? 1 : 0);
        const mediaPercentage = Math.round((totalCompletedMedia * 100) / 6);

        return (
          <View style={styles.wizardCard}>
            {/* Media Progress Section */}
            <View style={{
              backgroundColor: '#F8FAFC',
              borderRadius: 16,
              padding: 16,
              marginBottom: 20,
              borderWidth: 1,
              borderColor: '#E2E8F0',
              shadowColor: '#0F172A',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 6,
              elevation: 1
            }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <AppText style={{ fontSize: 14, fontWeight: '700', color: '#1E293B' }}>{t('addAnimal.mediaProgress')}</AppText>
                <AppText style={{ fontSize: 13, fontWeight: '700', color: '#16A34A' }}>{totalCompletedMedia} / 6 Completed</AppText>
              </View>
              <View style={{ height: 8, backgroundColor: '#E2E8F0', borderRadius: 4, overflow: 'hidden' }}>
                <View style={{ width: `${mediaPercentage}%`, height: '100%', backgroundColor: '#16A34A', borderRadius: 4 }} />
              </View>
            </View>

            {/* Preview Card */}
            <View style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 20,
              borderWidth: 1,
              borderColor: '#E2E8F0',
              padding: 12,
              shadowColor: '#0F172A',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.06,
              shadowRadius: 12,
              elevation: 2,
              marginBottom: 20
            }}>
              {photoPreview ? (
                <View style={{ width: '100%', height: 240, borderRadius: 14, overflow: 'hidden', backgroundColor: '#F8FAFC' }}>
                  <Image source={{ uri: photoPreview }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                </View>
              ) : (
                <View style={[styles.cameraBox, { overflow: 'hidden', height: 240, borderRadius: 14, borderStyle: 'none' }]}>
                  {cameraPermission ? (
                    <>
                      <CameraView
                        ref={cameraRef}
                        style={StyleSheet.absoluteFillObject}
                        facing="back"
                      />

                      {/* Semi-transparent overlay to ensure text is highly readable */}
                      <View style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        backgroundColor: 'rgba(15, 23, 42, 0.6)',
                        padding: 10,
                        alignItems: 'center'
                      }}>
                        <AppText
                          style={{
                            fontSize: 13,
                            fontWeight: '700',
                            color: '#FFFFFF',
                            textAlign: 'center',
                          }}
                        >
                          {t(currentReq.nameKey)}
                        </AppText>
                      </View>

                      <TouchableOpacity style={[styles.shutterBtn, { position: 'absolute', bottom: 12 }]} onPress={handleCapturePhoto}>
                        <View style={styles.shutterBtnInner} />
                      </TouchableOpacity>
                    </>
                  ) : (
                    <View style={{ alignItems: 'center', justifyContent: 'center', padding: 20, flex: 1 }}>
                      <MaterialCommunityIcons name="camera-off" size={50} color="#94A3B8" />
                      <AppText style={{ fontSize: 14, fontWeight: '700', color: '#1E293B', marginTop: 8, textAlign: 'center' }}>
                        {t(currentReq.nameKey)}
                      </AppText>
                      <AppText style={{ fontSize: 12, color: '#64748B', textAlign: 'center', marginTop: 4, paddingHorizontal: 10 }}>
                        Camera is not supported in this browser. Please upload from gallery.
                      </AppText>
                      <TouchableOpacity
                        style={{
                          backgroundColor: '#16A34A',
                          paddingHorizontal: 20,
                          paddingVertical: 10,
                          borderRadius: 10,
                          marginTop: 12,
                          flexDirection: 'row',
                          alignItems: 'center'
                        }}
                        onPress={handlePickImage}
                      >
                        <Ionicons name="image-outline" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                        <AppText style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 13 }}>
                          गॅलरीतून निवडा / Upload
                        </AppText>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )}

              {/* Preview Actions Row */}
              {photoPreview && (
                <View style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  marginTop: 16,
                  paddingHorizontal: 2
                }}>
                  <TouchableOpacity
                    style={{
                      flex: 0.48,
                      borderColor: '#EF4444',
                      borderWidth: 1.5,
                      height: 50,
                      borderRadius: 12,
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexDirection: 'row',
                      backgroundColor: '#FFFFFF'
                    }}
                    onPress={handleRetakePhoto}
                  >
                    <Ionicons name="refresh-outline" size={18} color="#EF4444" style={{ marginRight: 6 }} />
                    <AppText style={{ color: '#EF4444', fontWeight: '700', fontSize: 14 }}>{t('addAnimal.retakeBtn')}</AppText>
                  </TouchableOpacity>

                  {isPhotoAccepted ? (
                    <View
                      style={{
                        flex: 0.48,
                        backgroundColor: '#DCFCE7',
                        height: 50,
                        borderRadius: 12,
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexDirection: 'row',
                        borderWidth: 1,
                        borderColor: '#BBF7D0'
                      }}
                    >
                      <Ionicons name="checkmark-circle" size={18} color="#16A34A" style={{ marginRight: 6 }} />
                      <AppText style={{ color: '#16A34A', fontWeight: '800', fontSize: 14 }}>{t('addAnimal.accepted')}</AppText>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={{
                        flex: 0.48,
                        backgroundColor: '#16A34A',
                        height: 50,
                        borderRadius: 12,
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexDirection: 'row'
                      }}
                      onPress={handleConfirmPhoto}
                    >
                      <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                      <AppText style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 14 }}>फोटो वापरा / Use Photo</AppText>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>

            {/* Instruction Card (Always visible below the preview) */}
            <View style={{
              backgroundColor: '#EFF6FF',
              borderRadius: 16,
              padding: 16,
              marginBottom: 20,
              borderWidth: 1,
              borderColor: '#DBEAFE'
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                <Ionicons name="information-circle" size={20} color="#1D4ED8" style={{ marginRight: 8 }} />
                <AppText style={{ fontSize: 14, fontWeight: '700', color: '#1E3A8A' }}>
                  मार्गदर्शक सूचना / Instructions
                </AppText>
              </View>

              <AppText style={{ fontSize: 14, fontWeight: '700', color: '#1E293B', marginBottom: 8 }}>
                {t(currentReq.nameKey)}
              </AppText>

              <View style={{ paddingLeft: 4 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                  <AppText style={{ color: '#1D4ED8', marginRight: 8, fontSize: 12 }}>✔</AppText>
                  <AppText style={{ fontSize: 12.5, color: '#1E293B', fontWeight: '500' }}>
                    {t(currentReq.instructionKey)}
                  </AppText>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                  <AppText style={{ color: '#1D4ED8', marginRight: 8, fontSize: 12 }}>✔</AppText>
                  <AppText style={{ fontSize: 12.5, color: '#475569' }}>
                    {t(currentReq.instructionKey)}
                  </AppText>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                  <AppText style={{ color: '#1D4ED8', marginRight: 8, fontSize: 12 }}>✔</AppText>
                  <AppText style={{ fontSize: 12.5, color: '#475569' }}>Good lighting and no blur (चांगला प्रकाश आणि स्पष्ट फोटो)</AppText>
                </View>
              </View>
            </View>

            {/* Required Media Checklist */}
            <View style={{ marginBottom: 20 }}>
              <AppText style={{ fontSize: 14, fontWeight: '700', color: '#1E293B', marginBottom: 12 }}>
                आवश्यक मीडिया यादी / Required Media Checklist
              </AppText>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                {PHOTO_STEPS.map((step, idx) => {
                  const isCompleted = !!photos[idx];
                  const isCurrent = currentPhotoIndex === idx;
                  return (
                    <View
                      key={idx}
                      style={{
                        width: '48%',
                        backgroundColor: isCompleted ? '#F0FDF4' : '#F8FAFC',
                        borderRadius: 12,
                        padding: 12,
                        marginBottom: 10,
                        borderWidth: 1,
                        borderColor: isCompleted ? '#DCFCE7' : '#E2E8F0',
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        shadowColor: '#0F172A',
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.02,
                        shadowRadius: 3,
                        elevation: 1
                      }}
                    >
                      <AppText style={{
                        fontSize: 12.5,
                        fontWeight: '700',
                        color: isCurrent ? '#16A34A' : '#475569',
                        flex: 1,
                        marginRight: 4
                      }} numberOfLines={1}>
                        {t(step.nameKey)}
                      </AppText>
                      {isCompleted ? (
                        <Ionicons name="checkmark-circle" size={18} color="#16A34A" />
                      ) : (
                        <Ionicons name="ellipse-outline" size={18} color="#94A3B8" />
                      )}
                    </View>
                  );
                })}

                {/* Verification Video checklist item */}
                <View
                  style={{
                    width: '48%',
                    backgroundColor: isVideoRecorded ? '#F0FDF4' : '#F8FAFC',
                    borderRadius: 12,
                    padding: 12,
                    marginBottom: 10,
                    borderWidth: 1,
                    borderColor: isVideoRecorded ? '#DCFCE7' : '#E2E8F0',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    shadowColor: '#0F172A',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.02,
                    shadowRadius: 3,
                    elevation: 1
                  }}
                >
                  <AppText style={{
                    fontSize: 12.5,
                    fontWeight: '700',
                    color: '#475569',
                    flex: 1,
                    marginRight: 4
                  }} numberOfLines={1}>
                    व्हिडिओ / Video
                  </AppText>
                  {isVideoRecorded ? (
                    <Ionicons name="checkmark-circle" size={18} color="#16A34A" />
                  ) : (
                    <Ionicons name="ellipse-outline" size={18} color="#94A3B8" />
                  )}
                </View>
              </View>
            </View>

            {/* Warning Card */}
            <View style={{
              backgroundColor: '#FFFBEB',
              borderRadius: 12,
              padding: 14,
              borderWidth: 1,
              borderColor: '#FDE68A',
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 8
            }}>
              <Ionicons name="warning" size={20} color="#D97706" style={{ marginRight: 10 }} />
              <AppText style={{ fontSize: 12, fontWeight: '700', color: '#B45309', flex: 1, lineHeight: 16 }}>{t('addAnimal.mandatoryMediaWarning')}</AppText>
            </View>
          </View>
        );

      case 3:
        const isVideoRecordingAccepted = !!video;
        const videoPercentage = Math.round((photos.filter(p => !!p).length + (video ? 1 : 0)) * 100 / 6);
        return (
          <View style={styles.wizardCard}>
            {/* Media Progress Section */}
            <View style={{
              backgroundColor: '#F8FAFC',
              borderRadius: 16,
              padding: 16,
              marginBottom: 20,
              borderWidth: 1,
              borderColor: '#E2E8F0',
              shadowColor: '#0F172A',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 6,
              elevation: 1
            }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <AppText style={{ fontSize: 14, fontWeight: '700', color: '#1E293B' }}>{t('addAnimal.mediaProgress')}</AppText>
                <AppText style={{ fontSize: 13, fontWeight: '700', color: '#16A34A' }}>{t('addAnimal.mediaCompletedCount', { completed: photos.filter(p => !!p).length + (video ? 1 : 0) })}</AppText>
              </View>
              <View style={{ height: 8, backgroundColor: '#E2E8F0', borderRadius: 4, overflow: 'hidden' }}>
                <View style={{ width: `${videoPercentage}%`, height: '100%', backgroundColor: '#16A34A', borderRadius: 4 }} />
              </View>
            </View>

            {Platform.OS === 'web' ? (
              /* Web Verification Video Card */
              <View style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 20,
                borderWidth: 1,
                borderColor: '#E2E8F0',
                padding: 12,
                shadowColor: '#0F172A',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.06,
                shadowRadius: 12,
                elevation: 2,
                marginBottom: 20
              }}>
                {videoPreview ? (
                  <View style={{ width: '100%', padding: 16, borderRadius: 14, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center' }}>
                    <Ionicons name="videocam" size={64} color={videoPreview.duration < 20 ? '#EF4444' : '#16A34A'} />
                    <AppText style={{ fontSize: 15, fontWeight: '800', color: '#1E293B', marginTop: 8 }}>{t('addAnimal.uploadedVideoDuration', { duration: videoPreview.duration < 10 ? `0${videoPreview.duration}` : videoPreview.duration })}</AppText>
                    <AppText style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>{t('addAnimal.videoSize', { size: Math.round((videoPreview.fileSize || 0) / (1024 * 1024)) })}</AppText>
                    {videoPreview.duration < 20 && (
                      <View style={{ padding: 12, backgroundColor: '#FEF2F2', borderRadius: 8, marginTop: 10, borderWidth: 1, borderColor: '#FEE2E2', width: '100%' }}>
                        <AppText style={{ fontSize: 13, color: '#EF4444', fontWeight: '700', textAlign: 'center', lineHeight: 18 }}>{t('addAnimal.videoMinDurationWarning')}</AppText>
                        <AppText style={{ fontSize: 13, color: '#EF4444', fontWeight: '700', textAlign: 'center', marginTop: 6, lineHeight: 18 }}>{t('addAnimal.videoMinDurationWarning')}</AppText>
                      </View>
                    )}
                  </View>
                ) : (
                  <View style={{ height: 240, borderRadius: 14, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                    <MaterialCommunityIcons name="video-off" size={50} color="#94A3B8" />
                    <AppText style={{ fontSize: 14, fontWeight: '700', color: '#1E293B', marginTop: 8, textAlign: 'center' }}>{t('addAnimal.videoUnsupportedTitle')}</AppText>
                    <AppText style={{ fontSize: 12, color: '#64748B', textAlign: 'center', marginTop: 4, paddingHorizontal: 10 }}>{t('addAnimal.videoUnsupportedSub')}</AppText>
                    <TouchableOpacity
                      style={{
                        backgroundColor: '#16A34A',
                        paddingHorizontal: 20,
                        paddingVertical: 12,
                        borderRadius: 10,
                        marginTop: 16,
                        flexDirection: 'row',
                        alignItems: 'center'
                      }}
                      onPress={handlePickVideo}
                    >
                      <Ionicons name="cloud-upload-outline" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                      <AppText style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 14 }}>{t('addAnimal.uploadVideoBtn')}</AppText>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Web Action Row */}
                {videoPreview && (
                  <View style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    marginTop: 16,
                    paddingHorizontal: 2
                  }}>
                    <TouchableOpacity
                      style={{
                        flex: 0.48,
                        borderColor: '#EF4444',
                        borderWidth: 1.5,
                        height: 50,
                        borderRadius: 12,
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexDirection: 'row',
                        backgroundColor: '#FFFFFF'
                      }}
                      onPress={handleRetakeVideo}
                    >
                      <Ionicons name="refresh-outline" size={18} color="#EF4444" style={{ marginRight: 6 }} />
                      <AppText style={{ color: '#EF4444', fontWeight: '700', fontSize: 14 }}>{t('addAnimal.retakeBtn')}</AppText>
                    </TouchableOpacity>

                    {isVideoRecordingAccepted ? (
                      <View
                        style={{
                          flex: 0.48,
                          backgroundColor: '#DCFCE7',
                          height: 50,
                          borderRadius: 12,
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexDirection: 'row',
                          borderWidth: 1,
                          borderColor: '#BBF7D0'
                        }}
                      >
                        <Ionicons name="checkmark-circle" size={18} color="#16A34A" style={{ marginRight: 6 }} />
                        <AppText style={{ color: '#16A34A', fontWeight: '800', fontSize: 14 }}>{t('addAnimal.accepted')}</AppText>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={[
                          {
                            flex: 0.48,
                            backgroundColor: '#16A34A',
                            height: 50,
                            borderRadius: 12,
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexDirection: 'row'
                          },
                          videoPreview.duration < 20 && { backgroundColor: '#CBD5E1' }
                        ]}
                        onPress={handleConfirmVideo}
                        disabled={videoPreview.duration < 20}
                      >
                        <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                        <AppText style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 14 }}>{t('addAnimal.useVideo')}</AppText>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>
            ) : (
              /* Native Verification Video Card (Android/iOS) */
              <View style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 20,
                borderWidth: 1,
                borderColor: '#E2E8F0',
                padding: 12,
                shadowColor: '#0F172A',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.06,
                shadowRadius: 12,
                elevation: 2,
                marginBottom: 20
              }}>
                {videoPreview ? (
                  <View style={{ width: '100%', padding: 16, borderRadius: 14, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center' }}>
                    <Ionicons name="videocam" size={64} color={videoPreview.duration < 20 ? '#EF4444' : '#16A34A'} />
                    <AppText style={{ fontSize: 15, fontWeight: '800', color: '#1E293B', marginTop: 8 }}>{t('addAnimal.videoDuration', { duration: videoPreview.duration < 10 ? `0${videoPreview.duration}` : videoPreview.duration })}</AppText>
                    {videoPreview.duration < 20 && (
                      <View style={{ padding: 12, backgroundColor: '#FEF2F2', borderRadius: 8, marginTop: 10, borderWidth: 1, borderColor: '#FEE2E2', width: '100%' }}>
                        <AppText style={{ fontSize: 13, color: '#EF4444', fontWeight: '700', textAlign: 'center', lineHeight: 18 }}>{t('addAnimal.videoMinDurationWarning')}</AppText>
                        <AppText style={{ fontSize: 13, color: '#EF4444', fontWeight: '700', textAlign: 'center', marginTop: 6, lineHeight: 18 }}>{t('addAnimal.videoMinDurationWarning')}</AppText>
                      </View>
                    )}
                  </View>
                ) : isVideoRecording ? (
                  <View style={[styles.cameraBox, { overflow: 'hidden', height: 240, borderRadius: 14, borderStyle: 'none' }]}>
                    {cameraPermission ? (
                      <CameraView
                        ref={cameraRef}
                        style={StyleSheet.absoluteFillObject}
                        mode="video"
                        facing="back"
                      />
                    ) : (
                      <View style={{ alignItems: 'center', justifyContent: 'center', flex: 1 }}>
                        <ActivityIndicator size="large" color="#16A34A" />
                      </View>
                    )}
                  </View>
                ) : (
                  <View style={[styles.cameraBox, { overflow: 'hidden', height: 240, borderRadius: 14, borderStyle: 'none', backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
                    {cameraPermission ? (
                      <>
                        <CameraView
                          ref={cameraRef}
                          style={StyleSheet.absoluteFillObject}
                          mode="video"
                          facing="back"
                        />
                        <View style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          backgroundColor: 'rgba(15, 23, 42, 0.6)',
                          padding: 10,
                          alignItems: 'center'
                        }}>
                          <AppText style={{ fontSize: 13, fontWeight: '700', color: '#FFFFFF', textAlign: 'center' }}>{t('addAnimal.cameraBoxTitle')}</AppText>
                        </View>
                      </>
                    ) : (
                      <View style={{ alignItems: 'center', justifyContent: 'center', flex: 1 }}>
                        <MaterialCommunityIcons name="video-off" size={50} color="#94A3B8" />
                        <AppText style={{ fontSize: 14, fontWeight: '700', color: '#1E293B', marginTop: 8, textAlign: 'center' }}>{t('addAnimal.cameraUnsupportedTitle')}</AppText>
                        <AppText style={{ fontSize: 12, color: '#64748B', textAlign: 'center', marginTop: 4, paddingHorizontal: 10 }}>{t('addAnimal.cameraUnsupportedSub')}</AppText>
                        <TouchableOpacity
                          style={{
                            backgroundColor: '#16A34A',
                            paddingHorizontal: 20,
                            paddingVertical: 10,
                            borderRadius: 10,
                            marginTop: 12,
                            flexDirection: 'row',
                            alignItems: 'center'
                          }}
                          onPress={handlePickVideo}
                        >
                          <Ionicons name="cloud-upload-outline" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                          <AppText style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 13 }}>{t('addAnimal.uploadVideoBtn')}</AppText>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                )}

                {/* Timer Progress Indicator below the preview */}
                {isVideoRecording && (
                  <View style={{ alignItems: 'center', marginTop: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444', marginRight: 6 }} />
                      <AppText style={{ fontSize: 14, fontWeight: '700', color: '#EF4444' }}>{t('addAnimal.recordingTimer', { timer: videoTimer < 10 ? `0${videoTimer}` : videoTimer })}</AppText>
                    </View>
                    <View style={{ height: 6, backgroundColor: '#E2E8F0', borderRadius: 3, width: '80%', overflow: 'hidden', marginTop: 6, marginBottom: 8 }}>
                      <View style={{ width: `${(videoTimer / 30) * 100}%`, height: '100%', backgroundColor: '#EF4444' }} />
                    </View>
                    <AppText style={{ fontSize: 11, color: '#64748B' }}>{t('addAnimal.minDurationRequired')}</AppText>
                  </View>
                )}

                {/* Action Buttons Row */}
                {videoPreview ? (
                  <View style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    marginTop: 16,
                    paddingHorizontal: 2
                  }}>
                    <TouchableOpacity
                      style={{
                        flex: 0.48,
                        borderColor: '#EF4444',
                        borderWidth: 1.5,
                        height: 50,
                        borderRadius: 12,
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexDirection: 'row',
                        backgroundColor: '#FFFFFF'
                      }}
                      onPress={handleRetakeVideo}
                    >
                      <Ionicons name="refresh-outline" size={18} color="#EF4444" style={{ marginRight: 6 }} />
                      <AppText style={{ color: '#EF4444', fontWeight: '700', fontSize: 14 }}>{t('addAnimal.retakeBtn')}</AppText>
                    </TouchableOpacity>

                    {isVideoRecordingAccepted ? (
                      <View
                        style={{
                          flex: 0.48,
                          backgroundColor: '#DCFCE7',
                          height: 50,
                          borderRadius: 12,
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexDirection: 'row',
                          borderWidth: 1,
                          borderColor: '#BBF7D0'
                        }}
                      >
                        <Ionicons name="checkmark-circle" size={18} color="#16A34A" style={{ marginRight: 6 }} />
                        <AppText style={{ color: '#16A34A', fontWeight: '800', fontSize: 14 }}>{t('addAnimal.accepted')}</AppText>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={[
                          {
                            flex: 0.48,
                            backgroundColor: '#16A34A',
                            height: 50,
                            borderRadius: 12,
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexDirection: 'row'
                          },
                          videoPreview.duration < 20 && { backgroundColor: '#CBD5E1' }
                        ]}
                        onPress={handleConfirmVideo}
                        disabled={videoPreview.duration < 20}
                      >
                        <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                        <AppText style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 14 }}>{t('addAnimal.useVideo')}</AppText>
                      </TouchableOpacity>
                    )}
                  </View>
                ) : (
                  cameraPermission && (
                    <View style={{ alignItems: 'center', marginTop: 16 }}>
                      {isVideoRecording ? (
                        <TouchableOpacity
                          style={{
                            backgroundColor: '#EF4444',
                            paddingHorizontal: 24,
                            paddingVertical: 12,
                            borderRadius: 24,
                            flexDirection: 'row',
                            alignItems: 'center'
                          }}
                          onPress={handleStopRecording}
                        >
                          <Ionicons name="square" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                          <AppText style={{ color: '#FFFFFF', fontWeight: '700' }}>रेकॉर्डिंग थांबवा / Stop Recording</AppText>
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity
                          style={{
                            backgroundColor: '#EF4444',
                            paddingHorizontal: 24,
                            paddingVertical: 12,
                            borderRadius: 24,
                            flexDirection: 'row',
                            alignItems: 'center'
                          }}
                          onPress={handleStartRecording}
                        >
                          <Ionicons name="radio-button-on" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                          <AppText style={{ color: '#FFFFFF', fontWeight: '700' }}>रेकॉर्डिंग सुरू करा / Start Recording</AppText>
                        </TouchableOpacity>
                      )}
                    </View>
                  )
                )}
              </View>
            )}

            {/* Instruction Card */}
            <View style={{
              backgroundColor: '#EFF6FF',
              borderRadius: 16,
              padding: 16,
              marginBottom: 20,
              borderWidth: 1,
              borderColor: '#DBEAFE'
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                <Ionicons name="information-circle" size={20} color="#1D4ED8" style={{ marginRight: 8 }} />
                <AppText style={{ fontSize: 14, fontWeight: '700', color: '#1E3A8A' }}>
                  व्हिडिओ मार्गदर्शक सूचना / Video Instructions
                </AppText>
              </View>
              <View style={{ paddingLeft: 4 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                  <AppText style={{ color: '#1D4ED8', marginRight: 8, fontSize: 12 }}>✔</AppText>
                  <AppText style={{ fontSize: 12.5, color: '#1E293B', fontWeight: '500' }}>
                    Walk around the animal (जनावराला चालवून व्हिडिओ काढा)
                  </AppText>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                  <AppText style={{ color: '#1D4ED8', marginRight: 8, fontSize: 12 }}>✔</AppText>
                  <AppText style={{ fontSize: 12.5, color: '#475569' }}>
                    Show Front, Left, Right, Back (सर्व बाजू स्पष्ट दाखवा)
                  </AppText>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                  <AppText style={{ color: '#1D4ED8', marginRight: 8, fontSize: 12 }}>✔</AppText>
                  <AppText style={{ fontSize: 12.5, color: '#475569' }}>Record in good lighting (चांगल्या प्रकाशात रेकॉर्ड करा)</AppText>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                  <AppText style={{ color: '#1D4ED8', marginRight: 8, fontSize: 12 }}>✔</AppText>
                  <AppText style={{ fontSize: 12.5, color: '#16A34A', fontWeight: '700' }}>Minimum 20 seconds (किमान २० सेकंदांचा व्हिडिओ)</AppText>
                </View>
              </View>
            </View>

            {/* Warning Card */}
            <View style={{
              backgroundColor: '#FFFBEB',
              borderRadius: 12,
              padding: 14,
              borderWidth: 1,
              borderColor: '#FDE68A',
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 8
            }}>
              <Ionicons name="warning" size={20} color="#D97706" style={{ marginRight: 10 }} />
              <AppText style={{ fontSize: 12, fontWeight: '700', color: '#B45309', flex: 1, lineHeight: 16 }}>
                पडताळणी व्हिडिओ अनिवार्य आहे. जनावराभोवती फिरून सर्व बाजू स्पष्टपणे दाखवा. (Verification video is mandatory. Walk around the animal and clearly show all sides.)
              </AppText>
            </View>
          </View>
        );

      case 4:
        return (
          <View style={styles.wizardCard}>
            <AppText style={styles.wizardLabel}>जनावराची माहिती भरा / Animal Details</AppText>

            {isOtherCategory ? (
              <>
                <View style={styles.inputGroup}>
                  <AppText style={styles.largeFieldLabel}>प्राण्याचे नाव / Animal Name *</AppText>
                  <TextInput
                    style={[styles.largeInput, fieldErrors.title && { borderColor: '#EF4444' }]}
                    placeholder="उदा. ससा / बदक / उंट (e.g. Rabbit / Duck / Camel)"
                    value={title}
                    onChangeText={(txt) => {
                      setTitle(txt);
                      setIsTitleUserEdited(txt.trim().length > 0);
                      if (fieldErrors.title) clearFieldError('title');
                    }}
                    onBlur={() => {
                      const err = validateTitleValue(title);
                      if (err) setFieldError('title', err);
                      else clearFieldError('title');
                    }}
                  />
                  {renderFieldError('title')}
                </View>

                <View style={styles.inputGroup}>
                  <AppText style={styles.largeFieldLabel}>जात / Breed Name *</AppText>
                  <TextInput
                    style={[styles.largeInput, fieldErrors.breed && { borderColor: '#EF4444' }]}
                    placeholder="उदा. देशी / ससा जात (e.g. Desi / Rabbit Breed)"
                    value={customBreedText}
                    onChangeText={(txt) => {
                      setCustomBreedText(txt);
                      if (fieldErrors.breed) clearFieldError('breed');
                      if (!selectedBreed || selectedBreed.id !== 'custom_other') {
                        setSelectedBreed({ id: 'custom_other', name: txt, _id: selectedCategory?._id });
                      }
                    }}
                  />
                  {renderFieldError('breed')}
                </View>
              </>
            ) : (
              <>
                <View style={styles.inputGroup}>
                  <AppText style={styles.largeFieldLabel}>जाहिरातीचे नाव / Listing Title *</AppText>
                  <TextInput
                    style={[styles.largeInput, fieldErrors.title && { borderColor: '#EF4444' }]}
                    placeholder="उदा. २ वर्षांची जर्सी गाय"
                    value={title}
                    onChangeText={(txt) => {
                      setTitle(txt);
                      setIsTitleUserEdited(txt.trim().length > 0);
                      if (fieldErrors.title) clearFieldError('title');
                    }}
                    onBlur={() => {
                      const err = validateTitleValue(title);
                      if (err) setFieldError('title', err);
                      else clearFieldError('title');
                    }}
                  />
                  {renderFieldError('title')}
                </View>

                <View style={styles.inputGroup}>
                  <AppText style={styles.largeFieldLabel}>जात / Breed *</AppText>
                  {loadingBreeds ? (
                    <ActivityIndicator size="small" color="#16A34A" />
                  ) : (
                    <TouchableOpacity
                      style={[styles.dropdownSelector, fieldErrors.breed && { borderColor: '#EF4444' }]}
                      onPress={() => {
                        setBreedSearchQuery('');
                        setIsBreedModalVisible(true);
                        if (fieldErrors.breed) clearFieldError('breed');
                      }}
                      activeOpacity={0.8}
                    >
                      <AppText style={[styles.dropdownSelectorText, !selectedBreed && { color: '#94A3B8' }]}>
                        {selectedBreed ? selectedBreed.name : 'जात निवडा / Select Breed'}
                      </AppText>
                      <Ionicons name="chevron-down" size={20} color="#64748B" />
                    </TouchableOpacity>
                  )}
                  {renderFieldError('breed')}
                </View>

                {isOtherBreedSelected && (
                  <View style={styles.inputGroup}>
                    <AppText style={styles.largeFieldLabel}>इतर जात नमूद करा / Enter Breed *</AppText>
                    <TextInput
                      style={styles.largeInput}
                      placeholder="उदा. गीर क्रॉस (e.g. Gir Cross)"
                      value={customBreedText}
                      onChangeText={setCustomBreedText}
                    />
                  </View>
                )}
              </>
            )}

            <View style={styles.rowInputs}>
              <View style={[styles.inputGroup, { width: '48%' }]}>
                <AppText style={styles.largeFieldLabel}>वय / Age (वर्ष) *</AppText>
                <TextInput
                  style={styles.largeInput}
                  keyboardType="numeric"
                  placeholder="उदा. ३"
                  value={age}
                  onChangeText={setAge}
                />
              </View>
              <View style={[styles.inputGroup, { width: '48%' }]}>
                <AppText style={styles.largeFieldLabel}>वजन (पर्यायी) / Weight (kg)</AppText>
                <TextInput
                  style={styles.largeInput}
                  keyboardType="numeric"
                  placeholder="उदा. ३५०"
                  value={weight}
                  onChangeText={setWeight}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <AppText style={styles.largeFieldLabel}>लिंग / Gender *</AppText>
              <View style={styles.pillRow}>
                {['Female', 'Male'].map((g) => (
                  <TouchableOpacity
                    key={g}
                    style={[styles.pillOption, gender === g && styles.selectedPillOption]}
                    onPress={() => setGender(g)}
                  >
                    <AppText style={[styles.pillText, gender === g && styles.selectedPillText]}>{g === 'Female' ? 'मादी (Female)' : 'नर (Male)'}</AppText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <AppText style={styles.largeFieldLabel}>रंग (पर्यायी) / Color</AppText>
              <TextInput
                style={styles.largeInput}
                placeholder="उदा. काळा, पांढरा, तपकिरी"
                value={color}
                onChangeText={setColor}
              />
            </View>

            <View style={styles.inputGroup}>
              <AppText style={styles.largeFieldLabel}>इतर माहिती (पर्यायी) / Description</AppText>
              <TextInput
                style={[styles.largeInput, { height: 70 }]}
                multiline
                placeholder="जनावराविषयी अधिक माहिती लिहा..."
                value={description}
                onChangeText={setDescription}
              />
            </View>
          </View>
        );

      case 5:
        return (
          <View style={styles.wizardCard}>
            {/* Top Health Information Card */}
            <View style={{
              backgroundColor: '#EFF6FF',
              borderRadius: 16,
              padding: 16,
              marginBottom: 20,
              borderWidth: 1,
              borderColor: '#DBEAFE',
              flexDirection: 'row',
              alignItems: 'center'
            }}>
              <View style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: '#DBEAFE',
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: 14
              }}>
                <Ionicons name="medical" size={22} color="#1D4ED8" />
              </View>
              <View style={{ flex: 1 }}>
                <AppText style={{ fontSize: 15, fontWeight: '800', color: '#1E3A8A', marginBottom: 2 }}>
                  🩺 आरोग्य माहिती
                </AppText>
                <AppText style={{ fontSize: 12.5, color: '#3B82F6', fontWeight: '500', lineHeight: 17 }}>
                  ही माहिती भरल्याने खरेदीदारांचा विश्वास वाढतो.
                </AppText>
              </View>
            </View>

            <AppText style={styles.wizardLabel}>आरोग्याची माहिती / Health Details</AppText>

            {/* Vaccinated Toggle */}
            <View style={styles.toggleRow}>
              <View style={{ flex: 1, marginRight: 12 }}>
                <AppText style={styles.toggleTitle}>लसीकरण (पर्यायी) / Vaccinated</AppText>
                <AppText style={styles.toggleSubtitle}>नियमित सरकारी लसी पूर्ण झाल्या आहेत</AppText>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: 12,
                  backgroundColor: isVaccinated ? '#DCFCE7' : '#F1F5F9',
                  borderWidth: 1,
                  borderColor: isVaccinated ? '#BBF7D0' : '#E2E8F0'
                }}>
                  <AppText style={{ fontSize: 12, fontWeight: '700', color: isVaccinated ? '#16A34A' : '#64748B' }}>
                    {isVaccinated ? '✅ होय' : '❌ नाही'}
                  </AppText>
                </View>
                <Switch
                  value={isVaccinated}
                  onValueChange={setIsVaccinated}
                  trackColor={{ true: '#16A34A' }}
                />
              </View>
            </View>

            {/* Healthy Toggle */}
            <View style={styles.toggleRow}>
              <View style={{ flex: 1, marginRight: 12 }}>
                <AppText style={styles.toggleTitle}>निरोगी (पर्यायी) / Healthy</AppText>
                <AppText style={styles.toggleSubtitle}>कोणतीही जखम किंवा आजार नाही</AppText>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: 12,
                  backgroundColor: isHealthy ? '#DCFCE7' : '#F1F5F9',
                  borderWidth: 1,
                  borderColor: isHealthy ? '#BBF7D0' : '#E2E8F0'
                }}>
                  <AppText style={{ fontSize: 12, fontWeight: '700', color: isHealthy ? '#16A34A' : '#64748B' }}>
                    {isHealthy ? '✅ होय' : '❌ नाही'}
                  </AppText>
                </View>
                <Switch
                  value={isHealthy}
                  onValueChange={setIsHealthy}
                  trackColor={{ true: '#16A34A' }}
                />
              </View>
            </View>

            {/* Pregnant Toggle (Female Animals Only) */}
            {gender === 'Female' && (
              <View style={styles.toggleRow}>
                <View style={{ flex: 1, marginRight: 12 }}>
                  <AppText style={styles.toggleTitle}>गर्भधारणा (पर्यायी) / Pregnant</AppText>
                  <AppText style={styles.toggleSubtitle}>{t('addAnimal.togglePregnantSub')}</AppText>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={{
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 12,
                    backgroundColor: isPregnant ? '#DCFCE7' : '#F1F5F9',
                    borderWidth: 1,
                    borderColor: isPregnant ? '#BBF7D0' : '#E2E8F0'
                  }}>
                    <AppText style={{ fontSize: 12, fontWeight: '700', color: isPregnant ? '#16A34A' : '#64748B' }}>
                      {isPregnant ? '✅ होय' : '❌ नाही'}
                    </AppText>
                  </View>
                  <Switch
                    value={isPregnant}
                    onValueChange={(val) => {
                      if (Platform.OS === 'ios' || Platform.OS === 'android') {
                        try {
                          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                        } catch (e) {}
                      }
                      setIsPregnant(val);
                    }}
                    trackColor={{ true: '#16A34A' }}
                  />
                </View>
              </View>
            )}

            {/* Pregnancy Month Selector (Female + Pregnant Only) */}
            {gender === 'Female' && isPregnant && (
              <View style={[styles.inputGroup, { marginTop: 4 }]}>
                <AppText style={styles.largeFieldLabel}>🤰 गर्भधारणेचा महिना (पर्यायी) / Pregnancy Month</AppText>
                <TouchableOpacity
                  style={styles.dropdownSelector}
                  onPress={() => setIsPregnancyModalVisible(true)}
                  activeOpacity={0.8}
                >
                  <AppText style={[styles.dropdownSelectorText, !pregnancyMonth && { color: '#94A3B8' }]}>
                    {pregnancyMonth
                      ? PREGNANCY_MONTH_OPTIONS.find((m) => m.id === Number(pregnancyMonth))?.label + ' (' + PREGNANCY_MONTH_OPTIONS.find((m) => m.id === Number(pregnancyMonth))?.en + ')'
                      : 'महिना निवडा... / Select Month'}
                  </AppText>
                  <Ionicons name="chevron-down" size={20} color="#64748B" />
                </TouchableOpacity>
                <AppText style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>
                  माहित असल्यासच निवडा. हा पर्याय ऐच्छिक आहे.
                </AppText>
              </View>
            )}

            {/* Milk Capacity (Female Cow, Buffalo, Goat Only) */}
            {showMilkCapacity && (
              <View style={styles.inputGroup}>
                <AppText style={styles.largeFieldLabel}>दूध देण्याची क्षमता (पर्यायी) / Milk Capacity (लिटर/दिवस)</AppText>
                <TextInput
                  style={styles.largeInput}
                  keyboardType="numeric"
                  placeholder="उदा. १२ लिटर प्रतिदिन"
                  value={milkCapacity}
                  onChangeText={setMilkCapacity}
                />
              </View>
            )}
          </View>
        );

      case 6:
        return (
          <View style={styles.wizardCard}>
            <AppText style={styles.wizardLabel}>किंमत ठरवा / Set Price</AppText>

            <View style={styles.inputGroup}>
              <AppText style={styles.largeFieldLabel}>अपेक्षित किंमत / Expected Price (₹) *</AppText>
              <TextInput
                style={[styles.largeInput, { fontSize: 24, fontWeight: '700' }, fieldErrors.price && { borderColor: '#EF4444' }]}
                keyboardType="numeric"
                placeholder="उदा. ५०,०००"
                value={price}
                onChangeText={(txt) => {
                  setPrice(txt);
                  if (fieldErrors.price) clearFieldError('price');
                }}
                onBlur={() => {
                  const err = validatePriceValue(price);
                  if (err) setFieldError('price', err);
                  else clearFieldError('price');
                }}
              />
              {renderFieldError('price')}
            </View>

            <View style={styles.toggleRow}>
              <View>
                <AppText style={styles.toggleTitle}>{t('addAnimal.toggleNegotiable')}</AppText>
                <AppText style={styles.toggleSubtitle}>{t('addAnimal.toggleNegotiableSub')}</AppText>
              </View>
              <Switch
                value={isNegotiable}
                onValueChange={setIsNegotiable}
                trackColor={{ true: '#16A34A' }}
              />
            </View>
          </View>
        );

      case 7:
        const typedVillageName = typeof selectedVillage === 'object' ? (selectedVillage?.name || '') : (selectedVillage || '');
        const filteredStates = states.filter(s =>
          s && s.name && s.name.toLowerCase().includes(stateSearch.toLowerCase())
        );
        const filteredDistricts = districts.filter(d =>
          d && d.name && d.name.toLowerCase().includes(districtSearch.toLowerCase())
        );
        const filteredTalukas = talukas.filter(t =>
          t && t.name && t.name.toLowerCase().includes(talukaSearch.toLowerCase())
        );
        const filteredVillages = villages.filter(v =>
          v && v.name && v.name.toLowerCase().includes(typedVillageName.toLowerCase())
        );

        return (
          <View style={styles.wizardCard}>
            <AppText style={styles.wizardLabel}>{t('addAnimal.locationDetails')}</AppText>

            {/* Top GPS Action Card */}
            <View style={{
              backgroundColor: '#F0FDF4',
              borderRadius: 16,
              padding: 16,
              marginBottom: 20,
              borderWidth: 1.5,
              borderColor: '#BBF7D0'
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                <View style={{
                  width: 42,
                  height: 42,
                  borderRadius: 21,
                  backgroundColor: '#DCFCE7',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 12
                }}>
                  <Ionicons name="location" size={22} color="#16A34A" />
                </View>
                <View style={{ flex: 1 }}>
                  <AppText style={{ fontSize: 16, fontWeight: '700', color: '#14532D' }}>
                    📍 सध्याचे स्थान वापरा / Use Current Location
                  </AppText>
                  <AppText style={{ fontSize: 12.5, color: '#166534', marginTop: 2 }}>
                    GPS द्वारे राज्य, जिल्हा, तालुका व गाव आपोआप भरा.
                  </AppText>
                </View>
              </View>

              <TouchableOpacity
                style={{
                  backgroundColor: '#16A34A',
                  borderRadius: 12,
                  paddingVertical: 13,
                  paddingHorizontal: 16,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: '#16A34A',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.25,
                  shadowRadius: 4,
                  elevation: 3
                }}
                onPress={() => {
                  console.log('[GPS DEBUG] Button pressed - onPress entered');
                  handleAutoGPS();
                }}
                disabled={gpsLoading}
                activeOpacity={0.85}
              >
                {gpsLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="navigate-circle" size={22} color="#FFFFFF" style={{ marginRight: 8 }} />
                    <AppText style={{ fontSize: 15, fontWeight: '800', color: '#FFFFFF' }}>
                      माझे सध्याचे स्थान वापरा
                    </AppText>
                  </>
                )}
              </TouchableOpacity>

              {gpsSuccess && (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10, justifyContent: 'center' }}>
                  <Ionicons name="checkmark-circle" size={16} color="#16A34A" style={{ marginRight: 4 }} />
                  <AppText style={{ fontSize: 12.5, color: '#15803D', fontWeight: '600' }}>
                    स्थान प्राप्त झाले! खालील माहिती तपासा किंवा बदला.
                  </AppText>
                </View>
              )}
            </View>

            {/* State Select Trigger */}
            <View style={styles.inputGroup}>
              <AppText style={styles.largeFieldLabel}>{t('addAnimal.stateLabel')} *</AppText>
              <TouchableOpacity
                style={styles.dropdownSelector}
                onPress={() => {
                  setStateSearch('');
                  setActiveDropdown('state');
                }}
              >
                <AppText style={styles.dropdownSelectorText}>
                  {selectedState ? selectedState.name : t('addAnimal.selectStateModal')}
                </AppText>
                <Ionicons name="chevron-down" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* State Modal */}
            <Modal
              visible={activeDropdown === 'state'}
              animationType="slide"
              transparent={true}
              onRequestClose={() => setActiveDropdown(null)}
            >
              <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                  <View style={styles.modalHeader}>
                    <AppText style={styles.modalTitle}>{t('addAnimal.selectStateModal')}</AppText>
                    <TouchableOpacity onPress={() => setActiveDropdown(null)}>
                      <Ionicons name="close" size={24} color="#334155" />
                    </TouchableOpacity>
                  </View>
                  <TextInput
                    style={styles.modalSearchInput}
                    placeholder="शोधा / Search State..."
                    value={stateSearch}
                    onChangeText={setStateSearch}
                    autoFocus
                  />
                  <FlatList
                    data={filteredStates}
                    keyExtractor={(item) => item._id}
                    style={{ maxHeight: 300 }}
                    renderItem={({ item: s }) => (
                      <TouchableOpacity
                        style={styles.modalOption}
                        onPress={() => {
                          setSelectedState(s);
                          setSelectedDistrict(null);
                          setSelectedTaluka(null);
                          setSelectedVillage(null);
                          setDistricts([]);
                          setTalukas([]);
                          setVillages([]);
                          fetchDistricts(s._id);
                          setActiveDropdown(null);
                        }}
                      >
                        <AppText style={styles.modalOptionText}>{s.name}</AppText>
                        {selectedState?._id === s._id && (
                          <Ionicons name="checkmark" size={20} color="#16A34A" style={{ marginLeft: 'auto' }} />
                        )}
                      </TouchableOpacity>
                    )}
                    ListEmptyComponent={
                      <AppText style={styles.noResultsText}>{t('common.noData')}</AppText>
                    }
                  />
                </View>
              </View>
            </Modal>

            {/* District Select Trigger */}
            {selectedState && (
              <View style={styles.inputGroup}>
                <AppText style={styles.largeFieldLabel}>{t('addAnimal.districtLabel')} *</AppText>
                <TouchableOpacity
                  style={styles.dropdownSelector}
                  onPress={() => {
                    setDistrictSearch('');
                    setActiveDropdown('district');
                  }}
                >
                  <AppText style={styles.dropdownSelectorText}>
                    {selectedDistrict ? selectedDistrict.name : t('addAnimal.selectDistrictModal')}
                  </AppText>
                  <Ionicons name="chevron-down" size={20} color="#64748B" />
                </TouchableOpacity>
              </View>
            )}

            {/* District Modal */}
            <Modal
              visible={activeDropdown === 'district'}
              animationType="slide"
              transparent={true}
              onRequestClose={() => setActiveDropdown(null)}
            >
              <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                  <View style={styles.modalHeader}>
                    <AppText style={styles.modalTitle}>{t('addAnimal.selectDistrictModal')}</AppText>
                    <TouchableOpacity onPress={() => setActiveDropdown(null)}>
                      <Ionicons name="close" size={24} color="#334155" />
                    </TouchableOpacity>
                  </View>
                  <TextInput
                    style={styles.modalSearchInput}
                    placeholder="शोधा / Search District..."
                    value={districtSearch}
                    onChangeText={setDistrictSearch}
                    autoFocus
                  />
                  <FlatList
                    data={filteredDistricts}
                    keyExtractor={(item) => item._id}
                    style={{ maxHeight: 300 }}
                    renderItem={({ item: d }) => (
                      <TouchableOpacity
                        style={styles.modalOption}
                        onPress={() => {
                          setSelectedDistrict(d);
                          setSelectedTaluka(null);
                          setSelectedVillage(null);
                          setTalukas([]);
                          setVillages([]);
                          fetchTalukas(d._id);
                          setActiveDropdown(null);
                        }}
                      >
                        <AppText style={styles.modalOptionText}>{d.name}</AppText>
                        {selectedDistrict?._id === d._id && (
                          <Ionicons name="checkmark" size={20} color="#16A34A" style={{ marginLeft: 'auto' }} />
                        )}
                      </TouchableOpacity>
                    )}
                    ListEmptyComponent={
                      <AppText style={styles.noResultsText}>{t('common.noData')}</AppText>
                    }
                  />
                </View>
              </View>
            </Modal>

            {/* Taluka Select Trigger */}
            {selectedDistrict && (
              <View style={styles.inputGroup}>
                <AppText style={styles.largeFieldLabel}>{t('addAnimal.talukaLabel')} *</AppText>
                <TouchableOpacity
                  style={styles.dropdownSelector}
                  onPress={() => {
                    setTalukaSearch('');
                    setActiveDropdown('taluka');
                  }}
                >
                  <AppText style={styles.dropdownSelectorText}>
                    {selectedTaluka ? selectedTaluka.name : t('addAnimal.selectTalukaModal')}
                  </AppText>
                  <Ionicons name="chevron-down" size={20} color="#64748B" />
                </TouchableOpacity>
              </View>
            )}

            {/* Taluka Modal */}
            <Modal
              visible={activeDropdown === 'taluka'}
              animationType="slide"
              transparent={true}
              onRequestClose={() => setActiveDropdown(null)}
            >
              <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                  <View style={styles.modalHeader}>
                    <AppText style={styles.modalTitle}>{t('addAnimal.selectTalukaModal')}</AppText>
                    <TouchableOpacity onPress={() => setActiveDropdown(null)}>
                      <Ionicons name="close" size={24} color="#334155" />
                    </TouchableOpacity>
                  </View>
                  <TextInput
                    style={styles.modalSearchInput}
                    placeholder="शोधा / Search Taluka..."
                    value={talukaSearch}
                    onChangeText={setTalukaSearch}
                    autoFocus
                  />
                  <FlatList
                    data={filteredTalukas}
                    keyExtractor={(item) => item._id}
                    style={{ maxHeight: 300 }}
                    renderItem={({ item: t }) => (
                      <TouchableOpacity
                        style={styles.modalOption}
                        onPress={() => {
                          setSelectedTaluka(t);
                          setSelectedVillage(null);
                          setVillages([]);
                          fetchVillages(t._id);
                          setActiveDropdown(null);
                        }}
                      >
                        <AppText style={styles.modalOptionText}>{t.name}</AppText>
                        {selectedTaluka?._id === t._id && (
                          <Ionicons name="checkmark" size={20} color="#16A34A" style={{ marginLeft: 'auto' }} />
                        )}
                      </TouchableOpacity>
                    )}
                    ListEmptyComponent={
                      <AppText style={styles.noResultsText}>{t('common.noData')}</AppText>
                    }
                  />
                </View>
              </View>
            </Modal>

            {/* Village Input & Suggestions */}
            {selectedTaluka && (
              <View style={styles.inputGroup}>
                <AppText style={styles.largeFieldLabel}>गाव (पर्यायी) / Village (Optional)</AppText>
                <TextInput
                  style={[styles.largeInput, { marginBottom: 4 }]}
                  placeholder="तुमच्या गावाचे नाव टाका (माहित असल्यास)"
                  value={typeof selectedVillage === 'object' ? (selectedVillage?.name || '') : (selectedVillage || '')}
                  onChangeText={(text) => setSelectedVillage(text)}
                />
                <AppText style={{ fontSize: 12, color: '#64748B', marginTop: 4, marginBottom: 8 }}>
                  GPS द्वारे गावाचे नाव नेहमी अचूक मिळेलच असे नाही. माहित असल्यास गावाचे नाव भरा.
                </AppText>
                {filteredVillages && filteredVillages.length > 0 && (
                  <View style={{ marginTop: 8 }}>
                    <AppText style={{ fontSize: 13, color: '#64748B', marginBottom: 8, fontWeight: '600' }}>
                      पडताळणी यादीतील गाव निवडा / Select from Master List:
                    </AppText>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row', paddingVertical: 4 }}>
                      {filteredVillages.map((v) => {
                        const isSelected = typeof selectedVillage === 'object'
                          ? selectedVillage?._id === v._id
                          : selectedVillage === v.name;
                        return (
                          <TouchableOpacity
                            key={v._id}
                            style={[
                              styles.pillOption,
                              isSelected && styles.selectedPillOption,
                              { marginRight: 8, paddingVertical: 8, paddingHorizontal: 14 }
                            ]}
                            onPress={() => setSelectedVillage(v)}
                          >
                            <AppText style={[styles.pillText, isSelected && styles.selectedPillText]}>{v.name}</AppText>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </View>
                )}
              </View>
            )}
          </View>
        );

      case 8:
        return (
          <View style={styles.wizardCard}>
            <AppText style={styles.wizardLabel}>{t('addAnimal.previewListing')}</AppText>

            {/* Photos scroll */}
            <AppText style={styles.previewTitle}>{t('addAnimal.livePhotosTitle')}</AppText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.previewPhotoRow}>
              {photos.map((p, idx) => (
                <Image key={idx} source={{ uri: p.uri }} style={styles.previewThumb} />
              ))}
            </ScrollView>

            {/* Details panel */}
            <View style={styles.previewPanel}>
              <AppText style={styles.previewItem}><Text style={{ fontWeight: 'bold' }}>{t('addAnimal.previewLabelTitle')} </Text> {title}</AppText>
              <AppText style={styles.previewItem}>
                <Text style={{ fontWeight: 'bold' }}>{t('addAnimal.previewLabelBreed')} </Text>
                {isOtherCategory ? customBreedText : (isOtherBreedSelected && customBreedText ? `इतर - ${customBreedText}` : selectedBreed?.name)}
              </AppText>
              <AppText style={styles.previewItem}><Text style={{ fontWeight: 'bold' }}>{t('addAnimal.previewLabelAge')} </Text> {age} {t('common.years')}</AppText>
              {weight !== '' && <AppText style={styles.previewItem}><Text style={{ fontWeight: 'bold' }}>{t('addAnimal.previewLabelWeight')} </Text> {weight} {t('common.kg')}</AppText>}
              <AppText style={styles.previewItem}><Text style={{ fontWeight: 'bold' }}>{t('addAnimal.previewLabelGender')} </Text> {gender}</AppText>
              <AppText style={styles.previewItem}><Text style={{ fontWeight: 'bold' }}>{t('addAnimal.previewLabelVaccinated')} </Text> {isVaccinated ? t('common.yes') : t('common.no')}</AppText>
              {gender === 'Female' && isPregnant && (
                <AppText style={styles.previewItem}>
                  <Text style={{ fontWeight: 'bold' }}>गर्भधारणा: </Text>
                  {t('common.yes')} {pregnancyMonth ? `(${PREGNANCY_MONTH_OPTIONS.find(m => m.id === Number(pregnancyMonth))?.label || (pregnancyMonth + ' महिने')})` : ''}
                </AppText>
              )}
              {milkCapacity !== '' && <AppText style={styles.previewItem}><Text style={{ fontWeight: 'bold' }}>{t('addAnimal.previewLabelMilk')} </Text> {milkCapacity} {t('common.litersPerDay')}</AppText>}
              <AppText style={styles.previewItem}><Text style={{ fontWeight: 'bold' }}>{t('addAnimal.previewLabelPrice')} </Text> ₹{price} ({isNegotiable ? t('common.negotiable') : t('common.fixed')})</AppText>
              <AppText style={styles.previewItem}><Text style={{ fontWeight: 'bold' }}>{t('addAnimal.previewLabelLocation')} </Text> {typeof selectedVillage === 'object' ? selectedVillage?.name : selectedVillage}, {selectedTaluka?.name}, {selectedDistrict?.name}, {selectedState?.name}</AppText>
            </View>

            <TouchableOpacity style={styles.editSectionBtn} onPress={() => setCurrentStep(4)}>
              <Ionicons name="create" size={16} color="#16A34A" />
              <AppText style={styles.editSectionBtnText}>{t('addAnimal.editDetailsBtn')}</AppText>
            </TouchableOpacity>
          </View>
        );

      case 9:
        return (
          <View style={styles.wizardCard}>
            <View style={styles.submitFinalBox}>
              <MaterialCommunityIcons name="check-decagram" size={72} color="#16A34A" />
              <AppText style={styles.submitTitle}>{t('addAnimal.allReadyTitle')}</AppText>
              <AppText style={styles.submitSub}>{t('addAnimal.allReadySub')}</AppText>

              {isSubmitting && (
                <View style={[styles.uploadingBox, { width: '100%', marginVertical: 12 }]}>
                  <AppText style={styles.uploadProgressTitle}>{t('addAnimal.uploadingListing')}</AppText>
                  <AppText style={styles.uploadProgressPercent}>{uploadProgress}% Complete</AppText>
                  <View style={styles.progressTrack}>
                    <View style={[styles.progressBar, { width: `${uploadProgress}%` }]} />
                  </View>
                </View>
              )}

              <TouchableOpacity
                style={[styles.publishBtn, isSubmitting && { backgroundColor: '#94A3B8' }]}
                onPress={handlePublishListing}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
                    <AppText style={styles.publishBtnText}>{t('addAnimal.publishingStatus')}</AppText>
                  </View>
                ) : (
                  <AppText style={styles.publishBtnText}>{t('addAnimal.publishBtn')}</AppText>
                )}
              </TouchableOpacity>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Sticky Wizard Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <AppText style={styles.headerTitle}>{t('addAnimal.headerTitle')}</AppText>
          <AppText style={styles.headerSubtitle}>{t('addAnimal.headerSubtitle', { current: currentStep, stepName: t(STEPS[currentStep - 1].titleKey) })}</AppText>
        </View>
        <View style={styles.placeholderBox} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {renderStepContent()}
      </ScrollView>

      {/* Footer Navigation Bar */}
      {currentStep > 1 && !isSubmitting && (
        <View style={styles.footerNav}>
          <TouchableOpacity style={styles.navPrevBtn} onPress={handlePrevStep}>
            <Ionicons name="chevron-back" size={20} color="#64748B" />
            <AppText style={styles.navPrevText}>{t('common.back')}</AppText>
          </TouchableOpacity>

          {currentStep === 2 ? (
            <TouchableOpacity
              style={[
                styles.navNextBtn,
                !photos[currentPhotoIndex] && { backgroundColor: '#CBD5E1' }
              ]}
              onPress={handleNextStep}
              disabled={!photos[currentPhotoIndex]}
            >
              <AppText style={styles.navNextText}>{t('common.next')}</AppText>
              <Ionicons name="chevron-forward" size={20} color="#fff" />
            </TouchableOpacity>
          ) : currentStep === 3 ? (
            <TouchableOpacity
              style={[
                styles.navNextBtn,
                !video && { backgroundColor: '#CBD5E1' }
              ]}
              onPress={handleNextStep}
              disabled={!video}
            >
              <AppText style={styles.navNextText}>{t('common.next')}</AppText>
              <Ionicons name="chevron-forward" size={20} color="#fff" />
            </TouchableOpacity>
          ) : currentStep < 8 ? (
            <TouchableOpacity style={styles.navNextBtn} onPress={handleNextStep}>
              <AppText style={styles.navNextText}>{t('common.next')}</AppText>
              <Ionicons name="chevron-forward" size={20} color="#fff" />
            </TouchableOpacity>
          ) : currentStep === 8 ? (
            <TouchableOpacity style={[styles.navNextBtn, { backgroundColor: '#16A34A' }]} onPress={handleNextStep}>
              <AppText style={styles.navNextText}>{t('common.confirm')}</AppText>
              <Ionicons name="checkmark" size={20} color="#fff" />
            </TouchableOpacity>
          ) : null}
        </View>
      )}
      {/* Pregnancy Month Selection Modal */}
      <Modal
        visible={isPregnancyModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsPregnancyModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <AppText style={styles.modalTitle}>गर्भधारणेचा महिना / Pregnancy Month</AppText>
              <TouchableOpacity onPress={() => setIsPregnancyModalVisible(false)} style={styles.closeModalButton}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 360 }} showsVerticalScrollIndicator={false}>
              {PREGNANCY_MONTH_OPTIONS.map((opt) => {
                const isSelected = Number(pregnancyMonth) === opt.id;
                return (
                  <TouchableOpacity
                    key={opt.id}
                    style={[styles.modalOption, isSelected && { backgroundColor: '#F0FDF4' }]}
                    onPress={() => {
                      setPregnancyMonth(opt.id);
                      setIsPregnancyModalVisible(false);
                    }}
                  >
                    <AppText style={[styles.modalOptionText, isSelected && { color: '#16A34A', fontWeight: '700', flex: 1 }]}>
                      {opt.label} ({opt.en})
                    </AppText>
                    {isSelected && <Ionicons name="checkmark-circle" size={20} color="#16A34A" />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Searchable Breed Selection Modal */}
      <Modal
        visible={isBreedModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsBreedModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <AppText style={styles.modalTitle}>जात निवडा / Select Breed</AppText>
              <TouchableOpacity onPress={() => setIsBreedModalVisible(false)} style={styles.closeModalButton}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.modalSearchInput}
              placeholder="जात शोधा... / Search breed..."
              placeholderTextColor="#94A3B8"
              value={breedSearchQuery}
              onChangeText={setBreedSearchQuery}
            />

            <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
              {breeds
                .filter((b) => {
                  if (!breedSearchQuery) return true;
                  const query = breedSearchQuery.toLowerCase();
                  return (
                    (b.name && b.name.toLowerCase().includes(query)) ||
                    (b.mr && b.mr.toLowerCase().includes(query)) ||
                    (b.en && b.en.toLowerCase().includes(query))
                  );
                })
                .map((b) => {
                  const isSelected = selectedBreed?.id === b.id || selectedBreed?._id === b._id;
                  return (
                    <TouchableOpacity
                      key={b._id || b.id}
                      style={[styles.modalOption, isSelected && { backgroundColor: '#F0FDF4' }]}
                      onPress={() => {
                        setSelectedBreed(b);
                        if (b.id !== 'other') setCustomBreedText('');
                        setIsBreedModalVisible(false);
                      }}
                    >
                      <AppText style={[styles.modalOptionText, isSelected && { color: '#16A34A', fontWeight: '700', flex: 1 }]}>
                        {b.name}
                      </AppText>
                      {isSelected && <Ionicons name="checkmark-circle" size={20} color="#16A34A" />}
                    </TouchableOpacity>
                  );
                })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9'
  },
  backButton: {
    padding: 4
  },
  headerTitleContainer: {
    alignItems: 'center'
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A'
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#16A34A',
    fontWeight: '600',
    marginTop: 2
  },
  placeholderBox: {
    width: 24
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 90
  },
  wizardCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 4
  },
  wizardLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 16,
    textAlign: 'center'
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between'
  },
  categoryCard: {
    width: '48%',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    paddingVertical: 20,
    alignItems: 'center',
    marginBottom: 14
  },
  categoryIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8
  },
  categoryNameText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A'
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20
  },
  progressStepCol: {
    alignItems: 'center',
    width: '18%'
  },
  dotProgress: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center'
  },
  dotProgressActive: {
    backgroundColor: '#16A34A',
    borderColor: '#16A34A'
  },
  dotProgressCurrent: {
    borderColor: '#16A34A',
    borderWidth: 3
  },
  dotProgressText: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 4
  },
  cameraBox: {
    height: 280,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    borderWidth: 2,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16
  },
  cameraStepTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E293B',
    marginTop: 16,
    textAlign: 'center'
  },
  cameraStepTitleSub: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
    fontWeight: '600',
    textAlign: 'center'
  },
  cameraStepInst: {
    fontSize: 13,
    color: '#E2E8F0',
    backgroundColor: '#475569',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 12,
    textAlign: 'center',
    overflow: 'hidden'
  },
  shutterBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: '#94A3B8',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    bottom: 24
  },
  shutterBtnInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#EF4444'
  },
  capturePreviewWrapper: {
    alignItems: 'center'
  },
  capturedPhotoPreview: {
    width: '100%',
    height: 320,
    borderRadius: 16,
    backgroundColor: '#F1F5F9'
  },
  previewBtnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 16
  },
  retakeBtn: {
    width: '48%',
    borderWidth: 2,
    borderColor: '#CBD5E1',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center'
  },
  retakeBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#64748B'
  },
  continueBtn: {
    width: '48%',
    backgroundColor: '#16A34A',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center'
  },
  continueBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff'
  },
  timerText: {
    fontSize: 48,
    fontWeight: '900',
    color: '#EF4444',
    letterSpacing: 2
  },
  timerSubText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 8
  },
  stopRecordBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: '#94A3B8',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    bottom: 24
  },
  stopRecordInner: {
    width: 28,
    height: 28,
    borderRadius: 4,
    backgroundColor: '#EF4444'
  },
  videoMockContainer: {
    width: '100%',
    height: 240,
    backgroundColor: '#F1F5F9',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#CBD5E1'
  },
  videoDurationLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#475569',
    marginTop: 12
  },
  instructionsContainer: {
    paddingVertical: 10
  },
  instHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16
  },
  instTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginLeft: 10
  },
  instBullet: {
    fontSize: 15,
    lineHeight: 24,
    color: '#475569',
    marginBottom: 8,
    fontWeight: '600'
  },
  recordStartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2',
    borderWidth: 2,
    borderColor: '#FCA5A5',
    borderRadius: 16,
    paddingVertical: 12,
    marginTop: 20
  },
  recordStartText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#B91C1C',
    marginLeft: 10
  },
  dropdownSelector: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  dropdownSelectorText: {
    fontSize: 16,
    color: '#0F172A',
    fontWeight: '500'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-end'
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 24,
    maxHeight: '80%',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A'
  },
  modalSearchInput: {
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#0F172A',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  modalOption: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    flexDirection: 'row',
    alignItems: 'center'
  },
  modalOptionText: {
    fontSize: 16,
    color: '#334155',
    fontWeight: '500'
  },
  noResultsText: {
    textAlign: 'center',
    color: '#94A3B8',
    marginVertical: 20,
    fontSize: 14
  },
  inputGroup: {
    marginBottom: 16
  },
  largeFieldLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 8
  },
  largeInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#0F172A'
  },
  dropdownContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  pillRow: {
    flexDirection: 'row',
    gap: 12
  },
  pillOption: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center'
  },
  selectedPillOption: {
    backgroundColor: '#DCFCE7',
    borderColor: '#16A34A'
  },
  pillText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569'
  },
  selectedPillText: {
    color: '#16A34A',
    fontWeight: '700'
  },
  rowInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 12
  },
  toggleTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B'
  },
  toggleSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2
  },
  gpsContainer: {
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 16
  },
  gpsLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 12
  },
  gpsFetchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 14
  },
  gpsFetchBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
    marginLeft: 8
  },
  gpsSuccessBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    borderWidth: 1.5,
    borderColor: '#A5D6A7',
    borderRadius: 12,
    padding: 14
  },
  gpsSuccessText: {
    fontSize: 14,
    color: '#2E7D32',
    fontWeight: '700',
    marginLeft: 8
  },
  previewTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 8
  },
  previewPhotoRow: {
    marginBottom: 16
  },
  previewThumb: {
    width: 80,
    height: 80,
    borderRadius: 10,
    marginRight: 10,
    backgroundColor: '#F1F5F9'
  },
  previewPanel: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16
  },
  previewItem: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 22,
    marginBottom: 6
  },
  editSectionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10
  },
  editSectionBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#16A34A',
    marginLeft: 6
  },
  uploadingBox: {
    alignItems: 'center',
    paddingVertical: 20
  },
  uploadProgressTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',
    marginTop: 16,
    textAlign: 'center'
  },
  uploadProgressPercent: {
    fontSize: 24,
    fontWeight: '900',
    color: '#16A34A',
    marginTop: 8
  },
  progressTrack: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E2E8F0',
    marginTop: 16,
    overflow: 'hidden'
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#16A34A'
  },
  submitFinalBox: {
    alignItems: 'center',
    paddingVertical: 20
  },
  submitTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 16
  },
  submitSub: {
    fontSize: 14,
    color: '#475569',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 20
  },
  publishBtn: {
    backgroundColor: '#16A34A',
    borderRadius: 16,
    paddingVertical: 16,
    width: '100%',
    alignItems: 'center',
    marginTop: 24
  },
  publishBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff'
  },
  footerNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 72,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16
  },
  navPrevBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12
  },
  navPrevText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#64748B',
    marginLeft: 4
  },
  navNextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 18
  },
  navNextText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
    marginRight: 4
  }
});
