import React, { useState } from 'react';
import { StyleSheet, View, Text, SafeAreaView, ScrollView, TextInput, TouchableOpacity, Switch, Alert, Image } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const CATEGORY_OPTIONS = ['Cow', 'Buffalo', 'Goat', 'Sheep', 'Horse', 'Other'];
const GENDER_OPTIONS = ['Female', 'Male'];

export default function AddAnimalScreen({ navigation }) {
  // Form State
  const [images, setImages] = useState([]); // Array of mock URIs
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Cow');
  const [breed, setBreed] = useState('');
  const [gender, setGender] = useState('Female');
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [color, setColor] = useState('');

  // Health State
  const [isVaccinated, setIsVaccinated] = useState(false);
  const [isHealthy, setIsHealthy] = useState(true);
  const [isPregnant, setIsPregnant] = useState(false);
  const [milkCapacity, setMilkCapacity] = useState('');

  // Pricing & Location
  const [price, setPrice] = useState('');
  const [isNegotiable, setIsNegotiable] = useState(false);
  const [village, setVillage] = useState('');
  const [taluka, setTaluka] = useState('');
  const [district, setDistrict] = useState('');
  const [state, setState] = useState('');
  const [description, setDescription] = useState('');

  // Video State
  const [hasVideo, setHasVideo] = useState(false);

  const handleAddMockImage = () => {
    if (images.length >= 6) {
      Alert.alert('Limit Reached', 'You can upload a maximum of 6 images.');
      return;
    }
    // Add a mock random animal photo as preview
    const mockUris = [
      'https://images.unsplash.com/photo-1546445317-29f4545e6d52?auto=format&fit=crop&w=300&q=80',
      'https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?auto=format&fit=crop&w=300&q=80',
      'https://images.unsplash.com/photo-1527153857715-3908f2bacb31?auto=format&fit=crop&w=300&q=80',
    ];
    const newUri = mockUris[images.length % mockUris.length];
    setImages([...images, newUri]);
  };

  const handleRemoveImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleAddMockVideo = () => {
    setHasVideo(!hasVideo);
  };

  const handlePostListing = () => {
    if (!name.trim()) {
      Alert.alert('Required Field', 'Please enter animal name.');
      return;
    }
    if (!breed.trim()) {
      Alert.alert('Required Field', 'Please enter breed.');
      return;
    }
    if (!price.trim()) {
      Alert.alert('Required Field', 'Please specify a price.');
      return;
    }
    if (images.length === 0) {
      Alert.alert('Required Field', 'Please upload at least 1 image of the animal.');
      return;
    }

    Alert.alert(
      'Listing Posted Successfully!',
      'Your animal listing has been created and sent for approval.',
      [
        {
          text: 'OK',
          onPress: () => {
            navigation.goBack();
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header bar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Post New Listing</Text>
        <View style={styles.placeholderBox} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* 1. Upload Images */}
        <Text style={styles.sectionTitle}>Upload Images (Max 6)</Text>
        <View style={styles.imageUploadSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.imageScrollContainer}>
            {images.map((uri, index) => (
              <View key={index} style={styles.imagePreviewWrapper}>
                <Image source={{ uri }} style={styles.previewImage} />
                {index === 0 && (
                  <View style={styles.mainImageBadge}>
                    <Text style={styles.mainImageBadgeText}>Cover</Text>
                  </View>
                )}
                <TouchableOpacity style={styles.removeImageBtn} onPress={() => handleRemoveImage(index)}>
                  <Ionicons name="close-circle" size={20} color="#EF4444" />
                </TouchableOpacity>
              </View>
            ))}

            {images.length < 6 && (
              <TouchableOpacity style={styles.uploadPlaceholderCard} onPress={handleAddMockImage}>
                <Ionicons name="camera" size={28} color="#16A34A" />
                <Text style={styles.uploadCardText}>Add Photo</Text>
                <Text style={styles.uploadCardCounter}>({images.length}/6)</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>

        {/* 2. Animal Information */}
        <Text style={styles.sectionTitle}>Animal Information</Text>
        <View style={styles.formCard}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Animal Name / Title</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Pure HF Cow, Beetal Goat"
              placeholderTextColor="#94A3B8"
              value={name}
              onChangeText={setName}
            />
          </View>

          {/* Category Selector */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Category</Text>
            <View style={styles.pillRow}>
              {CATEGORY_OPTIONS.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.pillOption, category === cat && styles.selectedPillOption]}
                  onPress={() => setCategory(cat)}
                >
                  <Text style={[styles.pillText, category === cat && styles.selectedPillText]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Breed</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Sahiwal, Murrah, Sirohi"
              placeholderTextColor="#94A3B8"
              value={breed}
              onChangeText={setBreed}
            />
          </View>

          {/* Gender Select */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Gender</Text>
            <View style={styles.pillRow}>
              {GENDER_OPTIONS.map((g) => (
                <TouchableOpacity
                  key={g}
                  style={[styles.pillOption, gender === g && styles.selectedPillOption]}
                  onPress={() => setGender(g)}
                >
                  <Text style={[styles.pillText, gender === g && styles.selectedPillText]}>{g}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.rowInputs}>
            <View style={[styles.inputGroup, { width: '48%' }]}>
              <Text style={styles.inputLabel}>Age</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. 3 Years"
                placeholderTextColor="#94A3B8"
                value={age}
                onChangeText={setAge}
              />
            </View>
            <View style={[styles.inputGroup, { width: '48%' }]}>
              <Text style={styles.inputLabel}>Weight (kg)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. 380"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
                value={weight}
                onChangeText={setWeight}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Color</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Brown, White & Black"
              placeholderTextColor="#94A3B8"
              value={color}
              onChangeText={setColor}
            />
          </View>
        </View>

        {/* 3. Animal Health */}
        <Text style={styles.sectionTitle}>Animal Health Details</Text>
        <View style={styles.formCard}>
          <View style={styles.switchRow}>
            <View>
              <Text style={styles.switchLabel}>Vaccinated</Text>
              <Text style={styles.switchSubtitle}>Is animal vaccinated regularly?</Text>
            </View>
            <Switch
              value={isVaccinated}
              onValueChange={setIsVaccinated}
              trackColor={{ false: '#E2E8F0', true: '#DCFCE7' }}
              thumbColor={isVaccinated ? '#16A34A' : '#94A3B8'}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.switchRow}>
            <View>
              <Text style={styles.switchLabel}>Healthy Condition</Text>
              <Text style={styles.switchSubtitle}>Free from any current diseases?</Text>
            </View>
            <Switch
              value={isHealthy}
              onValueChange={setIsHealthy}
              trackColor={{ false: '#E2E8F0', true: '#DCFCE7' }}
              thumbColor={isHealthy ? '#16A34A' : '#94A3B8'}
            />
          </View>

          {/* Conditional Pregnant field for Female cattle */}
          {gender === 'Female' && (category === 'Cow' || category === 'Buffalo' || category === 'Goat') && (
            <>
              <View style={styles.divider} />
              <View style={styles.switchRow}>
                <View>
                  <Text style={styles.switchLabel}>Is Pregnant</Text>
                  <Text style={styles.switchSubtitle}>Is the animal currently pregnant?</Text>
                </View>
                <Switch
                  value={isPregnant}
                  onValueChange={setIsPregnant}
                  trackColor={{ false: '#E2E8F0', true: '#DCFCE7' }}
                  thumbColor={isPregnant ? '#16A34A' : '#94A3B8'}
                />
              </View>

              <View style={styles.divider} />

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Milk Capacity (Liters/day - optional)</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. 15 Liters"
                  placeholderTextColor="#94A3B8"
                  value={milkCapacity}
                  onChangeText={setMilkCapacity}
                />
              </View>
            </>
          )}
        </View>

        {/* 4. Pricing */}
        <Text style={styles.sectionTitle}>Pricing</Text>
        <View style={styles.formCard}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Price (₹)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. 65000"
              placeholderTextColor="#94A3B8"
              keyboardType="numeric"
              value={price}
              onChangeText={setPrice}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.switchRow}>
            <View>
              <Text style={styles.switchLabel}>Price Negotiable</Text>
              <Text style={styles.switchSubtitle}>Are you open to bargaining?</Text>
            </View>
            <Switch
              value={isNegotiable}
              onValueChange={setIsNegotiable}
              trackColor={{ false: '#E2E8F0', true: '#DCFCE7' }}
              thumbColor={isNegotiable ? '#16A34A' : '#94A3B8'}
            />
          </View>
        </View>

        {/* 5. Location */}
        <Text style={styles.sectionTitle}>Location Information</Text>
        <View style={styles.formCard}>
          <View style={styles.rowInputs}>
            <View style={[styles.inputGroup, { width: '48%' }]}>
              <Text style={styles.inputLabel}>Village</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Saswad"
                placeholderTextColor="#94A3B8"
                value={village}
                onChangeText={setVillage}
              />
            </View>
            <View style={[styles.inputGroup, { width: '48%' }]}>
              <Text style={styles.inputLabel}>Taluka</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Purandar"
                placeholderTextColor="#94A3B8"
                value={taluka}
                onChangeText={setTaluka}
              />
            </View>
          </View>

          <View style={styles.rowInputs}>
            <View style={[styles.inputGroup, { width: '48%' }]}>
              <Text style={styles.inputLabel}>District</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Pune"
                placeholderTextColor="#94A3B8"
                value={district}
                onChangeText={setDistrict}
              />
            </View>
            <View style={[styles.inputGroup, { width: '48%' }]}>
              <Text style={styles.inputLabel}>State</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Maharashtra"
                placeholderTextColor="#94A3B8"
                value={state}
                onChangeText={setState}
              />
            </View>
          </View>
        </View>

        {/* 6. Description */}
        <Text style={styles.sectionTitle}>Description</Text>
        <View style={styles.formCard}>
          <TextInput
            style={styles.multilineInput}
            placeholder="Describe your animal's feeding habits, milk yield history, temperament, or breed certification..."
            placeholderTextColor="#94A3B8"
            multiline={true}
            numberOfLines={4}
            value={description}
            onChangeText={setDescription}
          />
        </View>

        {/* 7. Upload Video */}
        <Text style={styles.sectionTitle}>Upload Video (Optional)</Text>
        <View style={styles.formCard}>
          <TouchableOpacity
            style={[styles.videoUploadBox, hasVideo && styles.videoUploadBoxActive]}
            onPress={handleAddMockVideo}
          >
            <Ionicons name={hasVideo ? "videocam" : "videocam-outline"} size={32} color={hasVideo ? "#16A34A" : "#94A3B8"} />
            <Text style={[styles.videoUploadTitle, hasVideo && styles.videoUploadTitleActive]}>
              {hasVideo ? "Video Added Successfully!" : "Add a video of your animal"}
            </Text>
            <Text style={styles.videoUploadSubtitle}>
              {hasVideo ? "Tap to remove video" : "Make sure it shows the animal clearly"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* 8. Submit Section */}
        <TouchableOpacity style={styles.submitButton} onPress={handlePostListing}>
          <Text style={styles.submitButtonText}>Post Animal</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  placeholderBox: {
    width: 36,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginLeft: 16,
    marginTop: 20,
    marginBottom: 10,
  },
  imageUploadSection: {
    paddingLeft: 16,
  },
  imageScrollContainer: {
    paddingRight: 16,
  },
  imagePreviewWrapper: {
    position: 'relative',
    marginRight: 12,
  },
  previewImage: {
    width: 100,
    height: 100,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
  },
  mainImageBadge: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#16A34A',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    paddingVertical: 2,
    alignItems: 'center',
  },
  mainImageBadgeText: {
    fontSize: 9,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  removeImageBtn: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
  },
  uploadPlaceholderCard: {
    width: 100,
    height: 100,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#16A34A',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#DCFCE7' + '15',
  },
  uploadCardText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#16A34A',
    marginTop: 6,
  },
  uploadCardCounter: {
    fontSize: 9,
    color: '#16A34A',
    marginTop: 2,
    fontWeight: '600',
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    padding: 16,
    marginHorizontal: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 1,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 46,
    fontSize: 13,
    color: '#0F172A',
  },
  multilineInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 13,
    color: '#0F172A',
    textAlignVertical: 'top',
    height: 100,
  },
  rowInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  pillOption: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginHorizontal: 4,
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
  },
  selectedPillOption: {
    backgroundColor: '#DCFCE7',
    borderColor: '#16A34A',
  },
  pillText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  selectedPillText: {
    color: '#16A34A',
    fontWeight: '700',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  switchLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  switchSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 14,
  },
  videoUploadBox: {
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
  videoUploadBoxActive: {
    borderColor: '#16A34A',
    backgroundColor: '#DCFCE7' + '10',
  },
  videoUploadTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
    marginTop: 10,
  },
  videoUploadTitleActive: {
    color: '#16A34A',
  },
  videoUploadSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 4,
  },
  submitButton: {
    backgroundColor: '#16A34A',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginTop: 28,
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
