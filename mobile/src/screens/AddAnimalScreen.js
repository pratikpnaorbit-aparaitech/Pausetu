import React, { useState, useEffect, useContext, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Switch,
  Alert,
  Image,
  Dimensions,
  Platform,
  ActivityIndicator
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Camera, CameraView } from 'expo-camera';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppContext } from '../context/AppContext';
import { animalApi } from '../api/animalApi';

const { width, height } = Dimensions.get('window');

// API Configurations
const API_BASE_URL = Platform.OS === 'android' ? 'http://10.0.2.2:5000/api' : 'http://localhost:5000/api';
const DRAFTS_KEY = 'PASHUSETU_OFFLINE_DRAFTS';

// Step descriptions
const STEPS = [
  { id: 1, titleEn: 'Select Category', titleMr: 'प्राणी निवडा' },
  { id: 2, titleEn: 'Take Live Photos', titleMr: 'फोटो काढा (५ अनिवार्य)' },
  { id: 3, titleEn: 'Record Live Video', titleMr: 'व्हिडिओ काढा (१ अनिवार्य)' },
  { id: 4, titleEn: 'Animal Details', titleMr: 'जनावराची माहिती' },
  { id: 5, titleEn: 'Health Details', titleMr: 'आरोग्य तपशील' },
  { id: 6, titleEn: 'Pricing', titleMr: 'किंमत' },
  { id: 7, titleEn: 'Location & GPS', titleMr: 'पत्ता आणि जीपीएस' },
  { id: 8, titleEn: 'Preview', titleMr: 'तपासा' },
  { id: 9, titleEn: 'Submit', titleMr: 'जाहिरात पाठवा' }
];

// Steps 2 Photo configuration
const PHOTO_STEPS = [
  { name: 'Front Photo', nameMr: 'समोरून फोटो काढा', instructionEn: 'Take Front Photo of the animal', instructionMr: 'समोरचा भाग स्पष्ट दिसला पाहिजे.' },
  { name: 'Left Side', nameMr: 'डाव्या बाजूने फोटो काढा', instructionEn: 'Take Left Side Photo of the animal', instructionMr: 'डावी बाजू आणि पाय दिसले पाहिजेत.' },
  { name: 'Right Side', nameMr: 'उजव्या बाजूने फोटो काढा', instructionEn: 'Take Right Side Photo of the animal', instructionMr: 'उजवी बाजू स्पष्ट दिसली पाहिजे.' },
  { name: 'Back Side', nameMr: 'मागील बाजूने फोटो काढा', instructionEn: 'Take Back Side Photo of the animal', instructionMr: 'मागील बाजू आणि शेपूट दिसली पाहिजे.' },
  { name: 'Full Body', nameMr: 'पूर्ण शरीराचा फोटो काढा', instructionEn: 'Take Full Body Photo of the animal', instructionMr: 'पूर्ण जनावर एका फ्रेममध्ये आले पाहिजे.' }
];

export default function AddAnimalScreen({ navigation }) {
  const { userToken } = useContext(AppContext);
  const [currentStep, setCurrentStep] = useState(1);
  const cameraRef = useRef(null);

  // Categories & Breeds lists
  const [categories, setCategories] = useState([]);
  const [breeds, setBreeds] = useState([]);
  const [loadingBreeds, setLoadingBreeds] = useState(false);

  // Form State variables
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedBreed, setSelectedBreed] = useState(null);
  const [title, setTitle] = useState('');
  const [gender, setGender] = useState('Female');
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [color, setColor] = useState('');
  const [description, setDescription] = useState('');

  // Step 2: Photo Capture variables
  const [photos, setPhotos] = useState([]); // Stores captured photos: { stepName, uri, metadata }
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [cameraPermission, setCameraPermission] = useState(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);

  // Step 3: Video Recording variables
  const [video, setVideo] = useState(null); // Stores captured video path or mock URL
  const [isVideoRecording, setIsVideoRecording] = useState(false);
  const [videoTimer, setVideoTimer] = useState(0);
  const [videoPreview, setVideoPreview] = useState(null);
  const videoIntervalRef = useRef(null);

  // Step 5: Health
  const [isVaccinated, setIsVaccinated] = useState(false);
  const [isHealthy, setIsHealthy] = useState(true);
  const [isPregnant, setIsPregnant] = useState(false);
  const [milkCapacity, setMilkCapacity] = useState('');

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
  
  // GPS State
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsSuccess, setGpsSuccess] = useState(false);

  // Step 9: Submission/Upload status
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

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
  const fetchBreeds = async (categoryId) => {
    setLoadingBreeds(true);
    try {
      const body = await animalApi.getBreeds(categoryId);
      if (body.status === 'success') {
        setBreeds(body.data.breeds);
      } else {
        throw new Error();
      }
    } catch (e) {
      setBreeds([]);
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
    fetchBreeds(cat._id || cat.id);
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
        Alert.alert('त्रुटी (Error)', 'कॅमेरा फोटो काढण्यात अयशस्वी झाला. (Camera capture failed.)');
      }
    } else {
      Alert.alert('त्रुटी (Error)', 'कॅमेरा उपलब्ध नाही. (Camera not ready/available.)');
    }
  };

  // Gallery Picker Handler
  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('परवानगी नाकारली (Permission Denied)', 'गॅलरी परवानगी आवश्यक आहे. (Gallery permissions are required to select photos.)');
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
      Alert.alert('त्रुटी (Error)', 'फोटो निवडण्यात अयशस्वी. (Failed to pick photo.)');
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
    if (cameraRef.current) {
      try {
        setIsVideoRecording(true);
        setVideoTimer(0);
        
        videoIntervalRef.current = setInterval(() => {
          setVideoTimer((prev) => {
            if (prev >= 120) {
              clearInterval(videoIntervalRef.current);
              handleStopRecording();
              return 120;
            }
            return prev + 1;
          });
        }, 1000);

        const recorded = await cameraRef.current.recordAsync({
          maxDuration: 120,
          quality: '720p'
        });
        
        if (recorded && recorded.uri) {
          setVideoPreview({
            uri: recorded.uri,
            duration: videoTimer,
            fileSize: Math.round(5 * 1024 * 1024)
          });
        }
      } catch (err) {
        console.warn('Native video recording failed:', err.message);
        setIsVideoRecording(false);
        clearInterval(videoIntervalRef.current);
        Alert.alert('त्रुटी (Error)', 'व्हिडिओ रेकॉर्डिंग सुरू करण्यात अयशस्वी. (Failed to start video recording.)');
      }
    } else {
      // Fallback for Simulator
      setIsVideoRecording(true);
      setVideoTimer(0);
      videoIntervalRef.current = setInterval(() => {
        setVideoTimer((prev) => {
          if (prev >= 120) {
            clearInterval(videoIntervalRef.current);
            handleStopRecording();
            return 120;
          }
          return prev + 1;
        });
      }, 1000);
    }
  };

  const handleStopRecording = () => {
    if (Platform.OS === 'web') return;
    clearInterval(videoIntervalRef.current);
    setIsVideoRecording(false);
    
    if (cameraRef.current) {
      try {
        cameraRef.current.stopRecording();
      } catch (err) {
        console.warn('Failed to stop camera recording:', err.message);
      }
    } else {
      console.warn('[Camera] No camera reference found to stop recording.');
    }
  };

  const handleConfirmVideo = () => {
    if (!videoPreview || videoPreview.duration < 20) {
      Alert.alert(
        'कमी वेळ (Too Short)',
        'कृपया किमान २० सेकंदांचा व्हिडिओ रेकॉर्ड करा. (Please record at least 20 seconds.)'
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
        Alert.alert('परवानगी नाकारली (Permission Denied)', 'गॅलरी परवानगी आवश्यक आहे. (Gallery permissions are required to select video.)');
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
      Alert.alert('त्रुटी (Error)', 'व्हिडिओ निवडण्यात अयशस्वी. (Failed to pick video.)');
    }
  };

  // GPS Auto Coordinates fetcher
  const handleAutoGPS = async () => {
    setGpsLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'GPS permission is required to fetch coordinates.');
        setGpsLoading(false);
        return;
      }
      
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setLatitude(loc.coords.latitude);
      setLongitude(loc.coords.longitude);
      setGpsSuccess(true);
    } catch (e) {
      setLatitude(17.2855);
      setLongitude(74.1839);
      setGpsSuccess(true);
    } finally {
      setGpsLoading(false);
    }
  };

  // Submit Listing Workflow (Step 9)
  const handlePublishListing = async () => {
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
      const guestMsg = 'जाहिरात प्रसिद्ध करण्यासाठी कृपया लॉग इन करा. (Please log in to publish a listing.)';
      showAlert('लॉगिन आवश्यक (Login Required)', guestMsg);
      return;
    }

    // 2. Perform detailed validation check
    const missingFields = [];
    const validPhotos = photos.filter(p => p && p.uri);
    if (validPhotos.length < 5) {
      missingFields.push(`किमान ५ फोटो आवश्यक आहेत (At least 5 photos are required. Current count: ${validPhotos.length})`);
    }
    if (!video) {
      missingFields.push("१ पडताळणी व्हिडिओ आवश्यक आहे (1 verification video is required)");
    }
    if (!title || !title.trim()) {
      missingFields.push("जाहिरातीचे नाव (Listing Title)");
    }
    if (!selectedBreed) {
      missingFields.push("जात (Breed)");
    }
    if (!price || !price.toString().trim()) {
      missingFields.push("अपेक्षित किंमत (Expected Price)");
    }
    if (!selectedState) {
      missingFields.push("राज्य (State)");
    }
    if (!selectedDistrict) {
      missingFields.push("जिल्हा (District)");
    }
    if (!selectedTaluka) {
      missingFields.push("तालुका (Taluka)");
    }

    if (missingFields.length > 0) {
      const errMsg = `कृपया खालील माहिती अपूर्ण आहे:\n- ${missingFields.join('\n- ')}`;
      showAlert('त्रुटी (Error)', errMsg);
      return;
    }

    setIsSubmitting(true);
    setUploadProgress(0);

    const basePayload = {
      categoryId: selectedCategory._id || selectedCategory.id,
      breedId: selectedBreed._id || selectedBreed.id,
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
        pregnant: isPregnant,
        milkCapacity: milkCapacity ? milkCapacity + ' Liters/day' : ''
      },
      state: selectedState?.name || '',
      district: selectedDistrict?.name || '',
      taluka: selectedTaluka?.name || '',
      village: (typeof selectedVillage === 'object' ? selectedVillage?.name : selectedVillage) || '',
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
          throw new Error(`फोटो ${i+1} अपलोड करण्यात अयशस्वी. (Failed to upload photo ${i+1}.)`);
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
        showAlert(
          'यशस्वी! (Success)',
          'तुमची जाहिरात यशस्वीरित्या पाठवली गेली आहे आणि मंजुरीसाठी प्रलंबित आहे. (Your listing was posted and is pending admin approval.)',
          [{ text: 'OK', onPress: () => navigation.navigate('MyListings') }]
        );
      } else {
        throw new Error(body.message || 'Server error');
      }
    } catch (err) {
      const isNetworkError = err.message && (
        err.message.includes('Network') ||
        err.message.includes('network') ||
        err.message.includes('timeout') ||
        err.message.includes('connect')
      );

      if (isNetworkError) {
        await saveDraftLocally(basePayload);
        showAlert(
          'नेटवर्क नाही (No Internet)',
          'तुमची जाहिरात ड्राफ्ट म्हणून जतन केली आहे. कनेक्शन उपलब्ध झाल्यावर ती अपलोड होईल.',
          [{ text: 'OK', onPress: () => navigation.navigate('MyListings') }]
        );
      } else {
        showAlert('त्रुटी (Error)', err.message || 'जाहिरात प्रसिद्ध करण्यात अडचण आली. (Failed to publish listing.)');
      }
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
            <Text style={styles.wizardLabel}>जनावराचा प्रकार निवडा / Select Animal Category</Text>
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
                    <Text style={styles.categoryNameText}>{cat.name}</Text>
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
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#1E293B' }}>माध्यम प्रगती / Media Progress</Text>
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#16A34A' }}>{totalCompletedMedia} / 6 Completed</Text>
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
                        <Text style={{ fontSize: 13, fontWeight: '700', color: '#FFFFFF', textAlign: 'center' }}>
                          {currentReq.nameMr} ({currentReq.name})
                        </Text>
                      </View>
                      
                      <TouchableOpacity style={[styles.shutterBtn, { position: 'absolute', bottom: 12 }]} onPress={handleCapturePhoto}>
                        <View style={styles.shutterBtnInner} />
                      </TouchableOpacity>
                    </>
                  ) : (
                    <View style={{ alignItems: 'center', justifyContent: 'center', padding: 20, flex: 1 }}>
                      <MaterialCommunityIcons name="camera-off" size={50} color="#94A3B8" />
                      <Text style={{ fontSize: 14, fontWeight: '700', color: '#1E293B', marginTop: 8, textAlign: 'center' }}>
                        {currentReq.nameMr}
                      </Text>
                      <Text style={{ fontSize: 12, color: '#64748B', textAlign: 'center', marginTop: 4, paddingHorizontal: 10 }}>
                        Camera is not supported in this browser. Please upload from gallery.
                      </Text>
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
                        <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 13 }}>
                          गॅलरीतून निवडा / Upload
                        </Text>
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
                    <Text style={{ color: '#EF4444', fontWeight: '700', fontSize: 14 }}>पुन्हा काढा / Retake</Text>
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
                      <Text style={{ color: '#16A34A', fontWeight: '800', fontSize: 14 }}>स्वीकारले / Accepted</Text>
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
                      <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 14 }}>फोटो वापरा / Use Photo</Text>
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
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#1E3A8A' }}>
                  मार्गदर्शक सूचना / Instructions
                </Text>
              </View>
              
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#1E293B', marginBottom: 8 }}>
                {currentReq.nameMr} ({currentReq.name})
              </Text>
              
              <View style={{ paddingLeft: 4 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                  <Text style={{ color: '#1D4ED8', marginRight: 8, fontSize: 12 }}>✔</Text>
                  <Text style={{ fontSize: 12.5, color: '#1E293B', fontWeight: '500' }}>
                    {currentReq.instructionEn}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                  <Text style={{ color: '#1D4ED8', marginRight: 8, fontSize: 12 }}>✔</Text>
                  <Text style={{ fontSize: 12.5, color: '#475569' }}>
                    {currentReq.instructionMr}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                  <Text style={{ color: '#1D4ED8', marginRight: 8, fontSize: 12 }}>✔</Text>
                  <Text style={{ fontSize: 12.5, color: '#475569' }}>Good lighting and no blur (चांगला प्रकाश आणि स्पष्ट फोटो)</Text>
                </View>
              </View>
            </View>

            {/* Required Media Checklist */}
            <View style={{ marginBottom: 20 }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#1E293B', marginBottom: 12 }}>
                आवश्यक मीडिया यादी / Required Media Checklist
              </Text>
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
                      <Text style={{
                        fontSize: 12.5,
                        fontWeight: '700',
                        color: isCurrent ? '#16A34A' : '#475569',
                        flex: 1,
                        marginRight: 4
                      }} numberOfLines={1}>
                        {step.nameMr}
                      </Text>
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
                  <Text style={{
                    fontSize: 12.5,
                    fontWeight: '700',
                    color: '#475569',
                    flex: 1,
                    marginRight: 4
                  }} numberOfLines={1}>
                    व्हिडिओ / Video
                  </Text>
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
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#B45309', flex: 1, lineHeight: 16 }}>
                पुढील प्रक्रियेसाठी सर्व ५ फोटो आणि १ पडताळणी व्हिडिओ अनिवार्य आहेत. (All 5 Photos and Verification Video are mandatory before proceeding.)
              </Text>
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
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#1E293B' }}>माध्यम प्रगती / Media Progress</Text>
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#16A34A' }}>
                  {photos.filter(p => !!p).length + (video ? 1 : 0)} / 6 Completed
                </Text>
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
                  <View style={{ width: '100%', height: 240, borderRadius: 14, overflow: 'hidden', backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center' }}>
                    <Ionicons name="videocam" size={64} color="#16A34A" />
                    <Text style={{ fontSize: 14, fontWeight: '700', color: '#475569', marginTop: 8 }}>
                      Uploaded Video
                    </Text>
                    <Text style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                      Duration: {videoPreview.duration}s | Size: {Math.round((videoPreview.fileSize || 0) / (1024 * 1024))} MB
                    </Text>
                    {videoPreview.duration < 20 && (
                      <Text style={{ fontSize: 12, color: '#EF4444', fontWeight: '600', marginTop: 4 }}>
                        Duration too short (min. 20s required)
                      </Text>
                    )}
                  </View>
                ) : (
                  <View style={{ height: 240, borderRadius: 14, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                    <MaterialCommunityIcons name="video-off" size={50} color="#94A3B8" />
                    <Text style={{ fontSize: 14, fontWeight: '700', color: '#1E293B', marginTop: 8, textAlign: 'center' }}>
                      Video recording is available only on Android and iOS devices.
                    </Text>
                    <Text style={{ fontSize: 12, color: '#64748B', textAlign: 'center', marginTop: 4, paddingHorizontal: 10 }}>
                      Please select and upload an existing video file of the animal.
                    </Text>
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
                      <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 14 }}>
                        Upload Verification Video
                      </Text>
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
                      <Text style={{ color: '#EF4444', fontWeight: '700', fontSize: 14 }}>पुन्हा काढा / Retake</Text>
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
                        <Text style={{ color: '#16A34A', fontWeight: '800', fontSize: 14 }}>स्वीकारले / Accepted</Text>
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
                        <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 14 }}>वापरा / Use Video</Text>
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
                  <View style={{ width: '100%', height: 240, borderRadius: 14, overflow: 'hidden', backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center' }}>
                    <Ionicons name="videocam" size={64} color="#16A34A" />
                    <Text style={{ fontSize: 14, fontWeight: '700', color: '#475569', marginTop: 8 }}>
                      Video Recorded: {videoPreview.duration}s
                    </Text>
                    {videoPreview.duration < 20 && (
                      <Text style={{ fontSize: 12, color: '#EF4444', fontWeight: '600', marginTop: 4 }}>
                        Duration too short (min. 20s required)
                      </Text>
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
                          <Text style={{ fontSize: 13, fontWeight: '700', color: '#FFFFFF', textAlign: 'center' }}>
                            पडताळणी व्हिडिओ / Verification Video
                          </Text>
                        </View>
                      </>
                    ) : (
                      <View style={{ alignItems: 'center', justifyContent: 'center', flex: 1 }}>
                        <MaterialCommunityIcons name="video-off" size={50} color="#94A3B8" />
                        <Text style={{ fontSize: 14, fontWeight: '700', color: '#1E293B', marginTop: 8, textAlign: 'center' }}>
                          Camera Unsupported
                        </Text>
                        <Text style={{ fontSize: 12, color: '#64748B', textAlign: 'center', marginTop: 4, paddingHorizontal: 10 }}>
                          Recording is not supported in this browser. Please upload from gallery.
                        </Text>
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
                          <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 13 }}>
                            गॅलरीतून व्हिडिओ निवडा / Upload Video
                          </Text>
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
                      <Text style={{ fontSize: 14, fontWeight: '700', color: '#EF4444' }}>
                        Recording: 00:{videoTimer < 10 ? `0${videoTimer}` : videoTimer} / 02:00
                      </Text>
                    </View>
                    <Text style={{ fontSize: 11, color: '#64748B' }}>
                      (Min. 20s required / किमान २० सेकंद रेकॉर्ड करा)
                    </Text>
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
                      <Text style={{ color: '#EF4444', fontWeight: '700', fontSize: 14 }}>पुन्हा काढा / Retake</Text>
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
                        <Text style={{ color: '#16A34A', fontWeight: '800', fontSize: 14 }}>स्वीकारले / Accepted</Text>
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
                        <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 14 }}>वापरा / Use Video</Text>
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
                          <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>रेकॉर्डिंग थांबवा / Stop Recording</Text>
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
                          <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>रेकॉर्डिंग सुरू करा / Start Recording</Text>
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
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#1E3A8A' }}>
                  व्हिडिओ मार्गदर्शक सूचना / Video Instructions
                </Text>
              </View>
              <View style={{ paddingLeft: 4 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                  <Text style={{ color: '#1D4ED8', marginRight: 8, fontSize: 12 }}>✔</Text>
                  <Text style={{ fontSize: 12.5, color: '#1E293B', fontWeight: '500' }}>
                    Walk around the animal (जनावराला चालवून व्हिडिओ काढा)
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                  <Text style={{ color: '#1D4ED8', marginRight: 8, fontSize: 12 }}>✔</Text>
                  <Text style={{ fontSize: 12.5, color: '#475569' }}>
                    Show Front, Left, Right, Back (सर्व बाजू स्पष्ट दाखवा)
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                  <Text style={{ color: '#1D4ED8', marginRight: 8, fontSize: 12 }}>✔</Text>
                  <Text style={{ fontSize: 12.5, color: '#475569' }}>Record in good lighting (चांगल्या प्रकाशात रेकॉर्ड करा)</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                  <Text style={{ color: '#1D4ED8', marginRight: 8, fontSize: 12 }}>✔</Text>
                  <Text style={{ fontSize: 12.5, color: '#16A34A', fontWeight: '700' }}>Minimum 20 seconds (किमान २० सेकंदांचा व्हिडिओ)</Text>
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
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#B45309', flex: 1, lineHeight: 16 }}>
                पडताळणी व्हिडिओ अनिवार्य आहे. जनावराभोवती फिरून सर्व बाजू स्पष्टपणे दाखवा. (Verification video is mandatory. Walk around the animal and clearly show all sides.)
              </Text>
            </View>
          </View>
        );

      case 4:
        return (
          <View style={styles.wizardCard}>
            <Text style={styles.wizardLabel}>जनावराची माहिती भरा / Animal Details</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.largeFieldLabel}>जाहिरातीचे नाव / Listing Title *</Text>
              <TextInput
                style={styles.largeInput}
                placeholder="उदा. २ वर्षांची जर्सी गाय (e.g. 2 Yr Jersey Cow)"
                value={title}
                onChangeText={setTitle}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.largeFieldLabel}>जात / Breed *</Text>
              {loadingBreeds ? (
                <ActivityIndicator size="small" color="#16A34A" />
              ) : (
                <View style={styles.dropdownContainer}>
                  {breeds.map((b) => (
                    <TouchableOpacity
                      key={b._id}
                      style={[styles.pillOption, selectedBreed?._id === b._id && styles.selectedPillOption]}
                      onPress={() => setSelectedBreed(b)}
                    >
                      <Text style={[styles.pillText, selectedBreed?._id === b._id && styles.selectedPillText]}>{b.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            <View style={styles.rowInputs}>
              <View style={[styles.inputGroup, { width: '48%' }]}>
                <Text style={styles.largeFieldLabel}>वय / Age (वर्ष) *</Text>
                <TextInput
                  style={styles.largeInput}
                  keyboardType="numeric"
                  placeholder="उदा. ३"
                  value={age}
                  onChangeText={setAge}
                />
              </View>
              <View style={[styles.inputGroup, { width: '48%' }]}>
                <Text style={styles.largeFieldLabel}>वजन / Weight (किलो)</Text>
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
              <Text style={styles.largeFieldLabel}>लिंग / Gender</Text>
              <View style={styles.pillRow}>
                {['Female', 'Male'].map((g) => (
                  <TouchableOpacity
                    key={g}
                    style={[styles.pillOption, gender === g && styles.selectedPillOption]}
                    onPress={() => setGender(g)}
                  >
                    <Text style={[styles.pillText, gender === g && styles.selectedPillText]}>{g === 'Female' ? 'मादी (Female)' : 'नर (Male)'}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.largeFieldLabel}>रंग / Color</Text>
              <TextInput
                style={styles.largeInput}
                placeholder="उदा. तांबडा / काळा (e.g. Red / Black)"
                value={color}
                onChangeText={setColor}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.largeFieldLabel}>इतर माहिती / Description</Text>
              <TextInput
                style={[styles.largeInput, { height: 70 }]}
                multiline
                placeholder="उदा. जनावर दूध देण्यास अतिशय शांत आहे."
                value={description}
                onChangeText={setDescription}
              />
            </View>
          </View>
        );

      case 5:
        return (
          <View style={styles.wizardCard}>
            <Text style={styles.wizardLabel}>आरोग्याची माहिती / Health Details</Text>

            <View style={styles.toggleRow}>
              <View>
                <Text style={styles.toggleTitle}>लसीकरण केले आहे का? (Vaccinated)</Text>
                <Text style={styles.toggleSubtitle}>नियमित सरकारी लसी पूर्ण झाल्या आहेत</Text>
              </View>
              <Switch
                value={isVaccinated}
                onValueChange={setIsVaccinated}
                trackColor={{ true: '#16A34A' }}
              />
            </View>

            <View style={styles.toggleRow}>
              <View>
                <Text style={styles.toggleTitle}>जनावर पूर्ण निरोगी आहे? (Healthy)</Text>
                <Text style={styles.toggleSubtitle}>कोणतीही जखम किंवा आजार नाही</Text>
              </View>
              <Switch
                value={isHealthy}
                onValueChange={setIsHealthy}
                trackColor={{ true: '#16A34A' }}
              />
            </View>

            {gender === 'Female' && (
              <View style={styles.toggleRow}>
                <View>
                  <Text style={styles.toggleTitle}>गाभण आहे का? (Pregnant)</Text>
                  <Text style={styles.toggleSubtitle}>सध्या जनावराला गाभ आहे का</Text>
                </View>
                <Switch
                  value={isPregnant}
                  onValueChange={setIsPregnant}
                  trackColor={{ true: '#16A34A' }}
                />
              </View>
            )}

            {gender === 'Female' && (
              <View style={styles.inputGroup}>
                <Text style={styles.largeFieldLabel}>दूध देण्याची क्षमता / Milk Capacity (लिटर/दिवस)</Text>
                <TextInput
                  style={styles.largeInput}
                  keyboardType="numeric"
                  placeholder="उदा. १२ लिटर"
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
            <Text style={styles.wizardLabel}>किंमत ठरवा / Set Price</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.largeFieldLabel}>अपेक्षित किंमत / Expected Price (₹) *</Text>
              <TextInput
                style={[styles.largeInput, { fontSize: 24, fontWeight: '700' }]}
                keyboardType="numeric"
                placeholder="उदा. ५०,०००"
                value={price}
                onChangeText={setPrice}
              />
            </View>

            <View style={styles.toggleRow}>
              <View>
                <Text style={styles.toggleTitle}>दर कमी-जास्त होईल? (Negotiable)</Text>
                <Text style={styles.toggleSubtitle}>किंमतीमध्ये तडजोड करता येईल का</Text>
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
        return (
          <View style={styles.wizardCard}>
            <Text style={styles.wizardLabel}>पत्ता आणि जीपीएस / Location Details</Text>

            {/* Dropdowns representing dependent dropdown location selections */}
            <View style={styles.inputGroup}>
              <Text style={styles.largeFieldLabel}>राज्य / State *</Text>
              <View style={styles.dropdownContainer}>
                {states.map((s) => (
                  <TouchableOpacity
                    key={s._id}
                    style={[styles.pillOption, selectedState?._id === s._id && styles.selectedPillOption]}
                    onPress={() => {
                      setSelectedState(s);
                      setSelectedDistrict(null);
                      setSelectedTaluka(null);
                      setSelectedVillage(null);
                      setDistricts([]);
                      setTalukas([]);
                      setVillages([]);
                      fetchDistricts(s._id);
                    }}
                  >
                    <Text style={[styles.pillText, selectedState?._id === s._id && styles.selectedPillText]}>{s.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {selectedState && (
              <View style={styles.inputGroup}>
                <Text style={styles.largeFieldLabel}>जिल्हा / District *</Text>
                <View style={styles.dropdownContainer}>
                  {districts.map((d) => (
                    <TouchableOpacity
                      key={d._id}
                      style={[styles.pillOption, selectedDistrict?._id === d._id && styles.selectedPillOption]}
                      onPress={() => {
                        setSelectedDistrict(d);
                        setSelectedTaluka(null);
                        setSelectedVillage(null);
                        setTalukas([]);
                        setVillages([]);
                        fetchTalukas(d._id);
                      }}
                    >
                      <Text style={[styles.pillText, selectedDistrict?._id === d._id && styles.selectedPillText]}>{d.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {selectedDistrict && (
              <View style={styles.inputGroup}>
                <Text style={styles.largeFieldLabel}>तालुका / Taluka *</Text>
                <View style={styles.dropdownContainer}>
                  {talukas.map((t) => (
                    <TouchableOpacity
                      key={t._id}
                      style={[styles.pillOption, selectedTaluka?._id === t._id && styles.selectedPillOption]}
                      onPress={() => {
                        setSelectedTaluka(t);
                        setSelectedVillage(null);
                        setVillages([]);
                        fetchVillages(t._id);
                      }}
                    >
                      <Text style={[styles.pillText, selectedTaluka?._id === t._id && styles.selectedPillText]}>{t.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {selectedTaluka && (
              <View style={styles.inputGroup}>
                <Text style={styles.largeFieldLabel}>गाव / Village</Text>
                <TextInput
                  style={[styles.largeInput, { marginBottom: 12 }]}
                  placeholder="Enter your village name / गावचे नाव टाका"
                  value={typeof selectedVillage === 'object' ? (selectedVillage?.name || '') : (selectedVillage || '')}
                  onChangeText={(text) => setSelectedVillage(text)}
                />
                {villages && villages.length > 0 && (
                  <View style={{ marginTop: 8 }}>
                    <Text style={{ fontSize: 13, color: '#64748B', marginBottom: 6, fontWeight: '600' }}>
                      पडताळणी यादीतील गाव निवडा / Select from Master List:
                    </Text>
                    <View style={styles.dropdownContainer}>
                      {villages.map((v) => {
                        const isSelected = typeof selectedVillage === 'object' 
                          ? selectedVillage?._id === v._id 
                          : selectedVillage === v.name;
                        return (
                          <TouchableOpacity
                            key={v._id}
                            style={[styles.pillOption, isSelected && styles.selectedPillOption]}
                            onPress={() => setSelectedVillage(v)}
                          >
                            <Text style={[styles.pillText, isSelected && styles.selectedPillText]}>{v.name}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* GPS Trigger */}
            <View style={styles.gpsContainer}>
              <Text style={styles.gpsLabel}>जनावराचे मूळ स्थान (GPS Coordinates) *</Text>
              
              {gpsSuccess ? (
                <View style={styles.gpsSuccessBox}>
                  <Ionicons name="checkmark-circle" size={24} color="#16A34A" />
                  <Text style={styles.gpsSuccessText}>GPS Location Attached ({latitude.toFixed(4)}, {longitude.toFixed(4)})</Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.gpsFetchBtn}
                  onPress={handleAutoGPS}
                  disabled={gpsLoading}
                >
                  {gpsLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="locate" size={20} color="#fff" />
                      <Text style={styles.gpsFetchBtnText}>स्वयंचलित जीपीएस मिळवा / Get Auto GPS</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </View>
        );

      case 8:
        return (
          <View style={styles.wizardCard}>
            <Text style={styles.wizardLabel}>जाहिरातीची तपासणी / Preview Listing</Text>

            {/* Photos scroll */}
            <Text style={styles.previewTitle}>Live Photos:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.previewPhotoRow}>
              {photos.map((p, idx) => (
                <Image key={idx} source={{ uri: p.uri }} style={styles.previewThumb} />
              ))}
            </ScrollView>

            {/* Details panel */}
            <View style={styles.previewPanel}>
              <Text style={styles.previewItem}><strong>नाव / Title:</strong> {title}</Text>
              <Text style={styles.previewItem}><strong>जात / Breed:</strong> {selectedBreed?.name}</Text>
              <Text style={styles.previewItem}><strong>वय / Age:</strong> {age} Years</Text>
              {weight !== '' && <Text style={styles.previewItem}><strong>वजन / Weight:</strong> {weight} kg</Text>}
              <Text style={styles.previewItem}><strong>लिंग / Gender:</strong> {gender}</Text>
              <Text style={styles.previewItem}><strong>लसीकरण / Vaccinated:</strong> {isVaccinated ? 'होय / Yes' : 'नाही / No'}</Text>
              {milkCapacity !== '' && <Text style={styles.previewItem}><strong>दूध देण्याची क्षमता / Milk:</strong> {milkCapacity} L/day</Text>}
              <Text style={styles.previewItem}><strong>अपेक्षित किंमत / Price:</strong> ₹{price} ({isNegotiable ? 'Negotiable' : 'Fixed'})</Text>
              <Text style={styles.previewItem}><strong>पत्ता / Location:</strong> {typeof selectedVillage === 'object' ? selectedVillage?.name : selectedVillage}, {selectedTaluka?.name}, {selectedDistrict?.name}, {selectedState?.name}</Text>
            </View>

            <TouchableOpacity style={styles.editSectionBtn} onPress={() => setCurrentStep(4)}>
              <Ionicons name="create" size={16} color="#16A34A" />
              <Text style={styles.editSectionBtnText}>माहिती बदला / Edit Details</Text>
            </TouchableOpacity>
          </View>
        );

      case 9:
        return (
          <View style={styles.wizardCard}>
            <View style={styles.submitFinalBox}>
              <MaterialCommunityIcons name="check-decagram" size={72} color="#16A34A" />
              <Text style={styles.submitTitle}>सर्व माहिती तयार आहे! (All Ready!)</Text>
              <Text style={styles.submitSub}>खालच्या बटणावर दाबून तुमची जाहिरात पाठवा. (Click button below to post listing.)</Text>

              {isSubmitting && (
                <View style={[styles.uploadingBox, { width: '100%', marginVertical: 12 }]}>
                  <Text style={styles.uploadProgressTitle}>जाहिरात अपलोड होत आहे... (Uploading Listing...)</Text>
                  <Text style={styles.uploadProgressPercent}>{uploadProgress}% Complete</Text>
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
                    <Text style={styles.publishBtnText}>प्रसिद्ध होत आहे... / Publishing...</Text>
                  </View>
                ) : (
                  <Text style={styles.publishBtnText}>जाहिरात प्रसिद्ध करा / Publish Listing</Text>
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
          <Text style={styles.headerTitle}>जाहिरात टाका / Post Listing</Text>
          <Text style={styles.headerSubtitle}>
            Step {currentStep} of 9 - {STEPS[currentStep - 1].titleMr}
          </Text>
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
            <Text style={styles.navPrevText}>मागे / Back</Text>
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
              <Text style={styles.navNextText}>पुढे / Next</Text>
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
              <Text style={styles.navNextText}>पुढे / Next</Text>
              <Ionicons name="chevron-forward" size={20} color="#fff" />
            </TouchableOpacity>
          ) : currentStep < 8 ? (
            <TouchableOpacity style={styles.navNextBtn} onPress={handleNextStep}>
              <Text style={styles.navNextText}>पुढे / Next</Text>
              <Ionicons name="chevron-forward" size={20} color="#fff" />
            </TouchableOpacity>
          ) : currentStep === 8 ? (
            <TouchableOpacity style={[styles.navNextBtn, { backgroundColor: '#16A34A' }]} onPress={handleNextStep}>
              <Text style={styles.navNextText}>नक्की करा / Confirm</Text>
              <Ionicons name="checkmark" size={20} color="#fff" />
            </TouchableOpacity>
          ) : null}
        </View>
      )}
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
