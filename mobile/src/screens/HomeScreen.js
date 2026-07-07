import React, { useContext } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppContext } from '../context/AppContext';

export default function HomeScreen() {
  const { userProfile, userToken } = useContext(AppContext);
  const isGuest = userToken === 'guest';
  const name = isGuest ? 'Guest User' : userProfile?.name || 'User';
  const role = isGuest ? 'Guest Mode' : userProfile?.role || 'Farmer';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Welcome Header Card */}
        <LinearGradient colors={['#11998e', '#38ef7d']} style={styles.headerCard}>
          <View style={styles.profileRow}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{name.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={styles.profileDetails}>
              <Text style={styles.welcomeText}>Welcome back,</Text>
              <Text style={styles.nameText}>{name}</Text>
              <Text style={styles.roleBadge}>{role}</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Dashboard Title */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>

        {/* Action Grid */}
        <View style={styles.grid}>
          <TouchableOpacity style={styles.gridCard}>
            <MaterialCommunityIcons name="cow" size={32} color="#00E676" style={styles.gridIcon} />
            <Text style={styles.gridLabel}>Cattle Market</Text>
            <Text style={styles.gridDesc}>Buy & sell cows, buffaloes</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.gridCard}>
            <MaterialCommunityIcons name="stethoscope" size={32} color="#00E676" style={styles.gridIcon} />
            <Text style={styles.gridLabel}>Consult Vet</Text>
            <Text style={styles.gridDesc}>Online medical queries</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.gridCard}>
            <MaterialCommunityIcons name="sprout" size={32} color="#00E676" style={styles.gridIcon} />
            <Text style={styles.gridLabel}>Animal Feed</Text>
            <Text style={styles.gridDesc}>Fodder & minerals shop</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.gridCard}>
            <MaterialCommunityIcons name="weather-partly-cloudy" size={32} color="#00E676" style={styles.gridIcon} />
            <Text style={styles.gridLabel}>Agri Weather</Text>
            <Text style={styles.gridDesc}>Dynamic local updates</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Activities Section */}
        <Text style={styles.sectionTitle}>Recent Updates</Text>
        <View style={styles.updateCard}>
          <Text style={styles.updateBadge}>Alert</Text>
          <Text style={styles.updateTitle}>Fodder prices are projected to rise next week.</Text>
          <Text style={styles.updateTime}>2 hours ago</Text>
        </View>

        <View style={styles.updateCard}>
          <Text style={[styles.updateBadge, styles.doctorBadge]}>Doctor</Text>
          <Text style={styles.updateTitle}>Dr. Sharma is now online for medical consults.</Text>
          <Text style={styles.updateTime}>5 hours ago</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F2027',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  headerCard: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#38ef7d',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  profileDetails: {
    marginLeft: 16,
  },
  welcomeText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  nameText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 2,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 6,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  gridCard: {
    width: '48%',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 16,
    marginBottom: 16,
  },
  gridIcon: {
    marginBottom: 12,
  },
  gridLabel: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  gridDesc: {
    fontSize: 11,
    color: '#B0BEC5',
    marginTop: 4,
  },
  updateCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    padding: 16,
    marginBottom: 12,
  },
  updateBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(235, 48, 14, 0.15)',
    color: '#FF7043',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 4,
    fontSize: 11,
    fontWeight: 'bold',
    overflow: 'hidden',
  },
  doctorBadge: {
    backgroundColor: 'rgba(0, 230, 118, 0.15)',
    color: '#00E676',
  },
  updateTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    marginTop: 8,
    fontWeight: '500',
  },
  updateTime: {
    color: '#90A4AE',
    fontSize: 11,
    marginTop: 6,
  },
});
