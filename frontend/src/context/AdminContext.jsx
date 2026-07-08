import React, { createContext, useState, useEffect, useRef } from 'react';
import axios from '../api/axios';
import { dashboardApi } from '../api/dashboardApi';
import { sellerApi } from '../api/sellerApi';
import { buyerApi } from '../api/buyerApi';
import { animalApi } from '../api/animalApi';
import { categoryApi } from '../api/categoryApi';

export const AdminContext = createContext();

const INITIAL_CATEGORIES = [
  { id: '1', name: 'Cow', slug: 'cow', description: 'Domestic dairy cows', isActive: true, sortOrder: 1 },
  { id: '2', name: 'Buffalo', slug: 'buffalo', description: 'Water buffalo breeds', isActive: true, sortOrder: 2 },
  { id: '3', name: 'Goat', slug: 'goat', description: 'Goats for dairy and meat', isActive: true, sortOrder: 3 },
  { id: '4', name: 'Sheep', slug: 'sheep', description: 'Wool and meat sheep', isActive: true, sortOrder: 4 },
  { id: '5', name: 'Horse', slug: 'horse', description: 'Equestrian and draft horses', isActive: true, sortOrder: 5 },
  { id: '6', name: 'Other', slug: 'other', description: 'Other livestock animals', isActive: true, sortOrder: 6 }
];

const INITIAL_BREEDS = [
  { id: 'b1', categoryId: '1', categoryName: 'Cow', name: 'Gir', description: 'High milk yielding Gir cow', isActive: true },
  { id: 'b2', categoryId: '1', categoryName: 'Cow', name: 'Sahiwal', description: 'Sahiwal native cow', isActive: true },
  { id: 'b3', categoryId: '1', categoryName: 'Cow', name: 'HF', description: 'Holstein Friesian crossbreed', isActive: true },
  { id: 'b4', categoryId: '2', categoryName: 'Buffalo', name: 'Murrah', description: 'High yielding Murrah buffalo', isActive: true },
  { id: 'b5', categoryId: '2', categoryName: 'Buffalo', name: 'Jaffarabadi', description: 'Jaffarabadi buffalo', isActive: true },
  { id: 'b6', categoryId: '3', categoryName: 'Goat', name: 'Osmanabadi', description: 'Osmanabadi local breed', isActive: true },
  { id: 'b7', categoryId: '3', categoryName: 'Goat', name: 'Sirohi', description: 'Sirohi goat from Rajasthan', isActive: true }
];

const INITIAL_LOCATIONS = {
  states: [
    { id: 's1', name: 'Maharashtra', isActive: true },
    { id: 's2', name: 'Gujarat', isActive: true }
  ],
  districts: [
    { id: 'd1', stateId: 's1', name: 'Satara', isActive: true },
    { id: 'd2', stateId: 's1', name: 'Pune', isActive: true },
    { id: 'd3', stateId: 's2', name: 'Anand', isActive: true }
  ],
  talukas: [
    { id: 't1', districtId: 'd1', name: 'Karad', isActive: true },
    { id: 't2', districtId: 'd1', name: 'Koregaon', isActive: true },
    { id: 't3', districtId: 'd2', name: 'Baramati', isActive: true }
  ],
  villages: [
    { id: 'v1', talukaId: 't1', name: 'Wather', isActive: true },
    { id: 'v2', talukaId: 't1', name: 'Vithalpur', isActive: true },
    { id: 'v3', talukaId: 't3', name: 'Shirsuphal', isActive: true }
  ]
};

const INITIAL_SELLERS = [
  { id: 's_1', name: 'Ramesh Patil', email: 'ramesh.patil@gmail.com', phone: '9876543210', village: 'Wather', district: 'Satara', state: 'Maharashtra', totalListings: 5, approvedListings: 4, pendingListings: 1, status: 'Active', isDeleted: false, photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80' },
  { id: 's_2', name: 'Amit Deshmukh', email: 'amit.d@yahoo.com', phone: '8765432109', village: 'Shirsuphal', district: 'Pune', state: 'Maharashtra', totalListings: 3, approvedListings: 2, pendingListings: 0, status: 'Active', isDeleted: false, photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80' },
  { id: 's_3', name: 'Suresh Mehta', email: 'suresh.m@gmail.com', phone: '7654321098', village: 'Hadgood', district: 'Anand', state: 'Gujarat', totalListings: 2, approvedListings: 0, pendingListings: 1, status: 'Blocked', isDeleted: false, photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=120&q=80' }
];

const INITIAL_BUYERS = [
  { id: 'b_1', name: 'Vijay Kadam', email: 'vijay.kadam@gmail.com', phone: '9543210987', village: 'Vithalpur', district: 'Satara', state: 'Maharashtra', interestedListings: 3, status: 'Active', isDeleted: false, photo: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=120&q=80' },
  { id: 'b_2', name: 'Anil Shinde', email: 'anil.shinde@outlook.com', phone: '9432109876', village: 'Karad', district: 'Satara', state: 'Maharashtra', interestedListings: 5, status: 'Active', isDeleted: false, photo: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=120&q=80' }
];

const INITIAL_ANIMALS = [
  { id: 'a_1', sellerId: 's_1', sellerName: 'Ramesh Patil', categoryId: '1', breedId: 'b1', title: 'Pure Gir Cow (Highly Productive)', description: 'Excellent health, giving 14 Liters milk daily. Vaccinated on time.', price: 54000, negotiable: true, photos: ['https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?auto=format&fit=crop&w=400&q=80', 'https://images.unsplash.com/photo-1546445317-29f4545e6d52?auto=format&fit=crop&w=400&q=80'], video: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4', health: { vaccinated: true, healthy: true, pregnant: false, milkCapacity: '14 L/day' }, state: 'Maharashtra', district: 'Satara', taluka: 'Karad', village: 'Wather', status: 'approved', views: 242, isDeleted: false },
  { id: 'a_2', sellerId: 's_2', sellerName: 'Amit Deshmukh', categoryId: '2', breedId: 'b4', title: 'Young Murrah Buffalo', description: 'First lactation Murrah buffalo, very calm, milk capacity 12 Liters.', price: 85000, negotiable: false, photos: ['https://images.unsplash.com/photo-1527153857715-3908f2bacb31?auto=format&fit=crop&w=400&q=80'], video: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4', health: { vaccinated: true, healthy: true, pregnant: true, milkCapacity: '12 L/day' }, state: 'Maharashtra', district: 'Pune', taluka: 'Baramati', village: 'Shirsuphal', status: 'pending', views: 48, isDeleted: false },
  { id: 'a_3', sellerId: 's_3', sellerName: 'Suresh Mehta', categoryId: '3', breedId: 'b6', title: 'Premium Osmanabadi Goat', description: ' Osamanabadi buck for breeding. Weight around 45kg.', price: 15500, negotiable: true, photos: ['https://images.unsplash.com/photo-1500595046783-ed699db91147?auto=format&fit=crop&w=400&q=80'], video: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4', health: { vaccinated: false, healthy: true, pregnant: false, milkCapacity: '' }, state: 'Gujarat', district: 'Anand', taluka: 'Anand Taluka', village: 'Hadgood', status: 'pending', views: 12, isDeleted: false }
];

const INITIAL_AUDIT_LOGS = [
  { id: 'log_1', adminName: 'Admin Nilesh', action: 'Approved Animal Listing', module: 'Animals', dateTime: '2026-07-08 04:12', ipAddress: '192.168.1.45', status: 'Success' },
  { id: 'log_2', adminName: 'Admin Nilesh', action: 'Blocked Seller Profile', module: 'Sellers', dateTime: '2026-07-08 03:50', ipAddress: '192.168.1.45', status: 'Success' },
  { id: 'log_3', adminName: 'Mod Pratik', action: 'Created Category', module: 'Categories', dateTime: '2026-07-07 18:22', ipAddress: '103.24.45.12', status: 'Success' }
];

const INITIAL_ROLES = [
  { role: 'Super Admin', permissions: { Dashboard: 'Read/Write', Animals: 'Approval', Sellers: 'Read/Write', Buyers: 'Read/Write', Categories: 'Read/Write', Breeds: 'Read/Write', Locations: 'Read/Write', Reports: 'Read', Settings: 'Read/Write' } },
  { role: 'Admin', permissions: { Dashboard: 'Read', Animals: 'Approval', Sellers: 'Read/Write', Buyers: 'Read/Write', Categories: 'Read/Write', Breeds: 'Read/Write', Locations: 'Read', Reports: 'Read', Settings: 'Read' } },
  { role: 'Moderator', permissions: { Dashboard: 'Read', Animals: 'Approval', Sellers: 'Read', Buyers: 'Read', Categories: 'Read', Breeds: 'Read', Locations: 'Read', Reports: 'Read', Settings: 'None' } }
];

const INITIAL_WIDGETS = [
  { id: 'sellers', label: 'Total Sellers', visible: true, order: 1 },
  { id: 'buyers', label: 'Total Buyers', visible: true, order: 2 },
  { id: 'animals', label: 'Total Animals', visible: true, order: 3 },
  { id: 'pending', label: 'Pending Approvals', visible: true, order: 4 },
  { id: 'registrations', label: 'Today\'s Registrations', visible: true, order: 5 },
  { id: 'charts', label: 'Weekly Listings & Distribution Charts', visible: true, order: 6 },
  { id: 'timeline', label: 'Latest Activity Timeline', visible: true, order: 7 }
];

export const AdminProvider = ({ children }) => {
  const [currentView, setCurrentView] = useState('Dashboard');
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(true);

  // Global Lists State
  const [animals, setAnimals] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [buyers, setBuyers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [breeds, setBreeds] = useState([]);
  const [locations, setLocations] = useState({ states: [], districts: [], talukas: [], villages: [] });
  const [auditLogs, setAuditLogs] = useState([]);
  const [roles, setRoles] = useState(INITIAL_ROLES);
  const [widgets, setWidgets] = useState(INITIAL_WIDGETS);

  // Global Notification Toast Overlay State
  const [toasts, setToasts] = useState([]);
  
  // Dialog Modals State variables
  const [confirmModal, setConfirmModal] = useState({ visible: false, type: '', data: null, message: '', action: null });
  const [detailsModal, setDetailsModal] = useState({ visible: false, data: null });
  const [rejectionModal, setRejectionModal] = useState({ visible: false, data: null, reason: '' });
  
  // Search and filter globals
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  
  // Settings details
  const [adminDetails, setAdminDetails] = useState({ name: 'Admin Nilesh', email: 'admin@pashusetu.com', phone: '9988776655', role: 'Super Admin', photo: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80' });
  const [passwordForm, setPasswordForm] = useState({ oldPassword: '', newPassword: '', confirmNew: '' });
  const [generalSettings, setGeneralSettings] = useState({ appName: 'PashuSetu Admin', autoApprove: false, maxPhotos: '10', smtpHost: 'smtp.brevo.com' });

  // Column Resizing mouse-drag hook simulation
  const [columnWidths, setColumnWidths] = useState({ title: 200, category: 100, breed: 100, price: 90, status: 110, actions: 120 });
  const resizingRef = useRef(null);

  const [dashboardStats, setDashboardStats] = useState(null);
  const [serverStatus, setServerStatus] = useState('Connected');
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState(null);

  const loadDashboardData = async () => {
    setIsLoading(true);
    setApiError(null);
    try {
      // 1. Fetch Server Status Health
      const health = await dashboardApi.getHealth();
      setServerStatus(health.status);

      // 2. Fetch Dashboard Statistics
      const stats = await dashboardApi.getStats();
      setDashboardStats(stats);

      // 3. Fetch Categories
      const cats = await categoryApi.getAll();
      setCategories(cats);

      // 4. Fetch Animals
      const list = await animalApi.getAll({ limit: 100 });
      const mapped = list.map((a) => ({
        id: a._id,
        sellerId: a.sellerId?._id || 'unknown',
        sellerName: a.sellerId?.name || 'Seller',
        categoryId: a.categoryId?._id || a.categoryId || '1',
        breedId: a.breedId?._id || a.breedId || 'b1',
        title: a.title,
        description: a.description,
        price: a.price,
        negotiable: a.negotiable,
        photos: a.photos || [],
        video: a.video || '',
        health: a.health || {},
        state: a.state,
        district: a.district,
        taluka: a.taluka,
        village: a.village,
        status: a.status,
        views: a.views || 0,
        isDeleted: a.isDeleted || false
      }));
      setAnimals(mapped);

      // 5. Fetch Sellers
      const sellersList = await sellerApi.getAll();
      setSellers(sellersList);

      // 6. Fetch Buyers
      const buyersList = await buyerApi.getAll();
      setBuyers(buyersList);

      // 7. Fetch Breeds
      const breedsRes = await axios.get('/breeds');
      if (breedsRes && breedsRes.data && breedsRes.data.breeds) {
        setBreeds(breedsRes.data.breeds.map(b => ({
          id: b._id,
          categoryId: b.categoryId,
          name: b.name,
          description: b.description,
          isActive: b.isActive
        })));
      }

      // 8. Fetch Locations
      const statesRes = await axios.get('/states');
      const districtsRes = await axios.get('/districts');
      const talukasRes = await axios.get('/talukas');
      const villagesRes = await axios.get('/villages');
      
      const newLocs = {
        states: (statesRes && statesRes.data && statesRes.data.states) ? statesRes.data.states.map(s => ({ id: s._id, name: s.name, isActive: s.isActive })) : [],
        districts: (districtsRes && districtsRes.data && districtsRes.data.districts) ? districtsRes.data.districts.map(d => ({ id: d._id, stateId: d.stateId, name: d.name, isActive: d.isActive })) : [],
        talukas: (talukasRes && talukasRes.data && talukasRes.data.talukas) ? talukasRes.data.talukas.map(t => ({ id: t._id, districtId: t.districtId, name: t.name, isActive: t.isActive })) : [],
        villages: (villagesRes && villagesRes.data && villagesRes.data.villages) ? villagesRes.data.villages.map(v => ({ id: v._id, talukaId: v.talukaId, name: v.name, isActive: v.isActive })) : []
      };
      setLocations(newLocs);

    } catch (e) {
      console.warn('[Admin API Load Warning] Failed to query full backend stats, falling back to mock database:', e.message);
      setApiError(e.message || 'Connection to backend failed.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  const logAudit = (action, module) => {
    const newLog = {
      id: `log_${Date.now()}`,
      adminName: adminDetails.name,
      action,
      module,
      dateTime: new Date().toISOString().replace('T', ' ').substring(0, 16),
      ipAddress: '192.168.1.45',
      status: 'Success'
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  const triggerConfirm = (type, data, message, action) => {
    setConfirmModal({ visible: true, type, data, message, action });
  };

  const handleExecuteConfirm = () => {
    if (confirmModal.action) {
      confirmModal.action();
      showToast(`${confirmModal.type} Action Completed Successfully!`, 'success');
      logAudit(`${confirmModal.type} executed on ${confirmModal.data?.name || confirmModal.data?.title || 'record'}`, confirmModal.type + 's');
    }
    setConfirmModal({ visible: false, type: '', data: null, message: '', action: null });
  };

  const handleApproveListing = async (animal) => {
    try {
      await animalApi.approve(animal.id);
      setAnimals((prev) => prev.map((a) => a.id === animal.id ? { ...a, status: 'approved' } : a));
      showToast('Listing Approved Successfully!', 'success');
      logAudit(`Approved Animal Listing: ${animal.title}`, 'Animals');
    } catch (e) {
      console.warn('[Admin API Warning] Failed to approve listing, fall back to mock update:', e.message);
      setAnimals((prev) => prev.map((a) => a.id === animal.id ? { ...a, status: 'approved' } : a));
      showToast('Listing Approved (Mock Update)', 'success');
    }
  };

  const handleRejectListing = async (animal, reason) => {
    try {
      await animalApi.reject(animal.id, reason);
      setAnimals((prev) => prev.map((a) => a.id === animal.id ? { ...a, status: 'rejected', rejectionReason: reason } : a));
      showToast('Listing Rejected!', 'error');
      logAudit(`Rejected Animal Listing: ${animal.title} (Reason: ${reason})`, 'Animals');
    } catch (e) {
      console.warn('[Admin API Warning] Failed to reject listing, fall back to mock update:', e.message);
      setAnimals((prev) => prev.map((a) => a.id === animal.id ? { ...a, status: 'rejected', rejectionReason: reason } : a));
      showToast('Listing Rejected (Mock Update)', 'error');
    } finally {
      setRejectionModal({ visible: false, data: null, reason: '' });
    }
  };

  const handleMarkSoldListing = (animal) => {
    setAnimals((prev) => prev.map((a) => a.id === animal.id ? { ...a, status: 'sold' } : a));
  };

  const handleSoftDeleteListing = (animal) => {
    setAnimals((prev) => prev.map((a) => a.id === animal.id ? { ...a, isDeleted: true } : a));
  };

  const handleRestoreListing = (animal) => {
    setAnimals((prev) => prev.map((a) => a.id === animal.id ? { ...a, isDeleted: false } : a));
  };

  const handleToggleBlockSeller = async (seller) => {
    const nextStatus = seller.status === 'Blocked' ? 'Active' : 'Blocked';
    try {
      await sellerApi.toggleBlock(seller.id);
    } catch (err) {}
    setSellers((prev) => prev.map((s) => s.id === seller.id ? { ...s, status: nextStatus } : s));
  };

  const handleSoftDeleteSeller = (seller) => {
    setSellers((prev) => prev.map((s) => s.id === seller.id ? { ...s, isDeleted: true } : s));
  };

  const handleRestoreSeller = (seller) => {
    setSellers((prev) => prev.map((s) => s.id === seller.id ? { ...s, isDeleted: false } : s));
  };

  const handleToggleBlockBuyer = async (buyer) => {
    const nextStatus = buyer.status === 'Blocked' ? 'Active' : 'Blocked';
    try {
      await buyerApi.toggleBlock(buyer.id);
    } catch (err) {}
    setBuyers((prev) => prev.map((b) => b.id === buyer.id ? { ...b, status: nextStatus } : b));
  };

  const handleSoftDeleteBuyer = (buyer) => {
    setBuyers((prev) => prev.map((b) => b.id === buyer.id ? { ...b, isDeleted: true } : b));
  };

  const handleRestoreBuyer = (buyer) => {
    setBuyers((prev) => prev.map((b) => b.id === buyer.id ? { ...b, isDeleted: false } : b));
  };

  const handleToggleWidget = (id) => {
    setWidgets((prev) => prev.map((w) => w.id === id ? { ...w, visible: !w.visible } : w));
  };

  const handleMoveWidgetUp = (index) => {
    if (index === 0) return;
    const items = [...widgets];
    const temp = items[index];
    items[index] = items[index - 1];
    items[index - 1] = temp;
    setWidgets(items);
  };

  const handleMouseDownResize = (e, columnKey) => {
    resizingRef.current = {
      columnKey,
      startX: e.clientX,
      startWidth: columnWidths[columnKey]
    };
    document.addEventListener('mousemove', handleMouseMoveResize);
    document.addEventListener('mouseup', handleMouseUpResize);
  };

  const handleMouseMoveResize = (e) => {
    if (!resizingRef.current) return;
    const { columnKey, startX, startWidth } = resizingRef.current;
    const deltaX = e.clientX - startX;
    setColumnWidths((prev) => ({
      ...prev,
      [columnKey]: Math.max(startWidth + deltaX, 60)
    }));
  };

  const handleMouseUpResize = () => {
    resizingRef.current = null;
    document.removeEventListener('mousemove', handleMouseMoveResize);
    document.removeEventListener('mouseup', handleMouseUpResize);
  };

  return (
    <AdminContext.Provider
      value={{
        currentView,
        setCurrentView,
        isAdminLoggedIn,
        setIsAdminLoggedIn,
        animals,
        setAnimals,
        sellers,
        setSellers,
        buyers,
        setBuyers,
        categories,
        setCategories,
        breeds,
        setBreeds,
        locations,
        setLocations,
        auditLogs,
        setAuditLogs,
        roles,
        widgets,
        toasts,
        confirmModal,
        setConfirmModal,
        detailsModal,
        rejectionModal,
        setRejectionModal,
        globalSearchQuery,
        setGlobalSearchQuery,
        adminDetails,
        setAdminDetails,
        passwordForm,
        setPasswordForm,
        generalSettings,
        setGeneralSettings,
        columnWidths,
        showToast,
        logAudit,
        triggerConfirm,
        handleExecuteConfirm,
        handleApproveListing,
        handleRejectListing,
        handleMarkSoldListing,
        handleSoftDeleteListing,
        handleRestoreListing,
        handleToggleBlockSeller,
        handleSoftDeleteSeller,
        handleRestoreSeller,
        handleToggleBlockBuyer,
        handleSoftDeleteBuyer,
        handleRestoreBuyer,
        handleToggleWidget,
        handleMoveWidgetUp,
        handleMouseDownResize,
        dashboardStats,
        serverStatus,
        isLoading,
        apiError,
        loadDashboardData
      }}
    >
      {children}
    </AdminContext.Provider>
  );
};
