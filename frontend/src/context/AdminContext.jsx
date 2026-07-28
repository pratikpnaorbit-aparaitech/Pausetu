import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios, { API_BASE_URL } from '../api/axios';
import { dashboardApi } from '../api/dashboardApi';
import { sellerApi } from '../api/sellerApi';
import { buyerApi } from '../api/buyerApi';
import { animalApi } from '../api/animalApi';
import { categoryApi } from '../api/categoryApi';
import { verificationApi } from '../api/verificationApi';
import { refreshManager, REFRESH_EVENTS } from '../services/refreshManager';

// AdminContext (plain context object) lives in its own file so this file
// only exports the AdminProvider component, satisfying Vite Fast Refresh.
import { AdminContext } from './AdminContextObject';

// Re-export so all consumers can continue using:
//   import { AdminContext } from '../context/AdminContext';
export { AdminContext };

// Resolve a media URL: if it starts with /uploads, prepend the API server base (without /api suffix)
const resolveMediaUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  // Strip the /api suffix from API_BASE_URL to get the server root
  const serverBase = API_BASE_URL.replace(/\/api$/, '');
  if (url.startsWith('/')) return `${serverBase}${url}`;
  return url;
};

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
  { id: 'verifications', label: 'Pending Verification Requests', visible: true, order: 5 },
  { id: 'registrations', label: "Today's Registrations", visible: true, order: 6 },
  { id: 'charts', label: 'Weekly Listings & Distribution Charts', visible: true, order: 7 },
  { id: 'timeline', label: 'Latest Activity Timeline', visible: true, order: 8 }
];

export const AdminProvider = ({ children }) => {
  const [currentView, setCurrentView] = useState('Dashboard');
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);

  // Auth readiness gate — prevents API calls before token is secured
  const [isAuthReady, setIsAuthReady] = useState(false);

  // Global Lists State
  const [animals, setAnimals] = useState([]);
  const [verificationRequests, setVerificationRequests] = useState([]);
  const [pendingVerificationCount, setPendingVerificationCount] = useState(0);
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

  // Column Resizing mouse-drag hook
  const [columnWidths, setColumnWidths] = useState({ title: 200, category: 100, breed: 100, price: 90, status: 110, actions: 120 });
  const resizingRef = useRef(null);
  const isFetchingRef = useRef(false);

  const [dashboardStats, setDashboardStats] = useState(null);
  const [serverStatus, setServerStatus] = useState('Connected');
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  /**
   * Step 1: Ensure admin is authenticated with a non-expired token.
   *
   * Fast path: if a token exists in localStorage AND it has not expired
   * (with a 60-second safety margin), return immediately.
   *
   * Slow path: if no token exists, or the existing token is expired/expiring,
   * clear localStorage and exchange the admin bypass OTP for a fresh JWT.
   *
   * THROWS on any failure — callers must not continue without a valid token,
   * because the backend silently restricts pending/rejected listings to
   * approved-only when no Authorization header is present.
   */
  const ensureAdminAuth = useCallback(async () => {
    const existingToken = localStorage.getItem('pashusetu_admin_token');

    if (existingToken) {
      try {
        const payloadBase64 = existingToken.split('.')[1];
        const padded = payloadBase64.replace(/-/g, '+').replace(/_/g, '/')
          + '=='.slice(0, (4 - payloadBase64.length % 4) % 4);
        const payload = JSON.parse(atob(padded));
        const nowSeconds = Math.floor(Date.now() / 1000);

        if (payload.exp && payload.exp > nowSeconds) {
          setIsAdminLoggedIn(true);
          return true;
        }
        localStorage.removeItem('pashusetu_admin_token');
      } catch {
        localStorage.removeItem('pashusetu_admin_token');
      }
    }

    setIsAdminLoggedIn(false);
    return false;
  }, []);

  const loginAdmin = useCallback(async (email, password, rememberMe = true) => {
    let authRes;
    try {
      authRes = await axios.post('/auth/admin-login', { email, password });
    } catch (err) {
      throw new Error(err.response?.data?.message || err.message || 'Invalid email or password.');
    }

    const token = authRes?.accessToken || authRes?.data?.accessToken || authRes?.token || authRes?.data?.token;
    if (!token) {
      throw new Error('Authentication failed: no access token returned by server.');
    }

    localStorage.setItem('pashusetu_admin_token', token);
    setIsAdminLoggedIn(true);
    setIsAuthReady(true);

    if (authRes?.data?.user) {
      setAdminDetails((prev) => ({
        ...prev,
        name: authRes.data.user.name || prev.name,
        email: authRes.data.user.email || prev.email,
        role: authRes.data.user.role === 'admin' ? 'Super Admin' : prev.role
      }));
    }

    return authRes;
  }, []);

  const logoutAdmin = useCallback(() => {
    localStorage.removeItem('pashusetu_admin_token');
    sessionStorage.clear();
    setIsAdminLoggedIn(false);
    setConfirmModal({ visible: false, type: '', data: null, message: '', action: null });
  }, []);

  /**
   * Maps a raw API animal object to the normalized admin shape.
   * Resolves all media URLs and extracts nested populate fields.
   */
  const mapAnimal = (a) => ({
    id: a._id,
    // Seller
    sellerId: a.sellerId?._id || a.sellerId || 'unknown',
    sellerName: a.sellerId?.name || 'Seller',
    sellerEmail: a.sellerId?.email || '',
    sellerMobile: a.sellerId?.mobile || '',
    // Category & Breed
    categoryId: a.categoryId?._id || a.categoryId || '',
    categoryName: a.categoryId?.name || '',
    breedId: a.breedId?._id || a.breedId || '',
    breedName: a.breedId?.name || '',
    // Core fields
    title: a.title || '',
    description: a.description || '',
    price: a.price || 0,
    negotiable: a.negotiable || false,
    gender: a.gender || 'Female',
    age: a.age || '',
    weight: a.weight || '',
    color: a.color || '',
    // Media — resolve relative upload paths to full URLs
    photos: (a.photos || []).map(resolveMediaUrl),
    video: resolveMediaUrl(a.video || ''),
    health: a.health || {},
    // Location
    state: a.state || '',
    district: a.district || '',
    taluka: a.taluka || '',
    village: a.village || '',
    latitude: a.latitude,
    longitude: a.longitude,
    // Status & audit
    status: a.status || 'pending',
    rejectionReason: a.rejectionReason || '',
    approvedBy: a.approvedBy || null,
    approvedAt: a.approvedAt || null,
    rejectedBy: a.rejectedBy || null,
    rejectedAt: a.rejectedAt || null,
    views: a.views || 0,
    isDeleted: a.isDeleted || false,
    createdAt: a.createdAt || null,
    updatedAt: a.updatedAt || null
  });

  /**
   * Step 2: Fetch all dashboard data.
   * Calls ensureAdminAuth() as the first operation on EVERY invocation —
   * including manual Refresh button clicks — so the axios request interceptor
   * always finds a valid token in localStorage before any protected API call.
   *
   * Without this guard, a cleared-localStorage session (fresh browser, Atlas
   * migration wipe) causes the backend to treat GET /api/animals as a public
   * request and silently filter out all pending/rejected listings.
   */
  const loadDashboardData = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    setIsLoading(true);
    setApiError(null);
    try {
      // 0. CRITICAL GUARD: Guarantee a valid admin JWT is in localStorage
      //    before any protected API call. The axios interceptor reads from
      //    localStorage synchronously on every request, so the token must
      //    already be stored at this point.
      await ensureAdminAuth();

      // 1. Fetch Server Status Health
      const health = await dashboardApi.getHealth();
      setServerStatus(health.status);

      // 2. Fetch Dashboard Statistics
      const stats = await dashboardApi.getStats();
      setDashboardStats(stats);
      if (stats?.kpis?.pendingVerificationRequests !== undefined) {
        const val = Number(stats.kpis.pendingVerificationRequests);
        if (!isNaN(val) && val >= 0) {
          setPendingVerificationCount(val);
        }
      }

      // 3. Fetch Categories
      const cats = await categoryApi.getAll();
      setCategories(cats);

      // 4. Fetch ALL Animals with admin JWT attached.
      //    The backend checks Authorization header: if role === 'admin',
      //    no status filter is applied and all statuses (pending, rejected,
      //    approved, sold) are returned. Limit 500 covers all real-world
      //    Atlas collections without pagination overhead.
      const list = await animalApi.getAll({ limit: 500 });
      setAnimals(list.map(mapAnimal));

      // 5. Fetch Sellers
      const sellersList = await sellerApi.getAll();
      setSellers(sellersList);

      // 6. Fetch Buyers
      const buyersList = await buyerApi.getAll();
      setBuyers(buyersList);

      // 6b. Fetch Verification Requests
      try {
        const verificationsList = await verificationApi.getRequests();
        setVerificationRequests(verificationsList || []);
      } catch (err) {
        console.warn('Failed to load verification requests:', err.message);
      }

      // 6c. Fetch Pending Verification Count
      try {
        const verificationCountRes = await axios.get('/verification/pending-count');
        if (verificationCountRes && verificationCountRes.data && verificationCountRes.data.data) {
          const val = Number(verificationCountRes.data.data.pendingVerificationCount);
          if (!isNaN(val) && val >= 0) {
            setPendingVerificationCount(val);
          }
        }
      } catch (err) {
        console.warn('Failed to load pending verification count:', err.message);
      }

      // 7. Fetch Breeds
      const breedsRes = await axios.get('/breeds');
      if (breedsRes && breedsRes.data && breedsRes.data.breeds) {
        setBreeds(breedsRes.data.breeds.map((b) => ({
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

      setLocations({
        states: (statesRes?.data?.states || []).map((s) => ({ id: s._id, name: s.name, isActive: s.isActive })),
        districts: (districtsRes?.data?.districts || []).map((d) => ({ id: d._id, stateId: d.stateId, name: d.name, isActive: d.isActive })),
        talukas: (talukasRes?.data?.talukas || []).map((t) => ({ id: t._id, districtId: t.districtId, name: t.name, isActive: t.isActive })),
        villages: (villagesRes?.data?.villages || []).map((v) => ({ id: v._id, talukaId: v.talukaId, name: v.name, isActive: v.isActive }))
      });
    } catch (e) {
      setApiError(e.message || 'Connection to backend failed.');
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  }, [ensureAdminAuth]);

  useEffect(() => {
    const unsubUpdated = refreshManager.subscribe(REFRESH_EVENTS.VERIFICATION_UPDATED, () => loadDashboardData());
    const unsubCreated = refreshManager.subscribe(REFRESH_EVENTS.VERIFICATION_CREATED, () => loadDashboardData());
    const unsubApproved = refreshManager.subscribe(REFRESH_EVENTS.VERIFICATION_APPROVED, () => loadDashboardData());
    const unsubRejected = refreshManager.subscribe(REFRESH_EVENTS.VERIFICATION_REJECTED, () => loadDashboardData());

    return () => {
      unsubUpdated();
      unsubCreated();
      unsubApproved();
      unsubRejected();
    };
  }, [loadDashboardData]);

  /**
   * Bootstrap on mount: authenticate first, then trigger data load.
   * Auth errors are surfaced as apiError so the UI shows a retry state
   * rather than an unhandled promise rejection crashing the app.
   */
  useEffect(() => {
    (async () => {
      try {
        await ensureAdminAuth();
      } catch (authErr) {
        setApiError(authErr.message);
      } finally {
        setIsAuthReady(true);
      }
    })();
  }, [ensureAdminAuth]);

  useEffect(() => {
    if (isAuthReady && isAdminLoggedIn) {
      loadDashboardData();
    }
  }, [isAuthReady, isAdminLoggedIn, loadDashboardData]);



  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
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
      logAudit(`${confirmModal.type} executed on ${confirmModal.data?.name || confirmModal.data?.title || 'record'}`, confirmModal.type + 's');
    }
    setConfirmModal({ visible: false, type: '', data: null, message: '', action: null });
  };

  const handleApproveListing = async (animal) => {
    setIsActionLoading(true);
    try {
      await animalApi.approve(animal.id);
      showToast(`"${animal.title}" approved and is now live!`, 'success');
      logAudit(`Approved Animal Listing: ${animal.title}`, 'Animals');
      await loadDashboardData();
    } catch (e) {
      showToast(`Approval failed: ${e.message}`, 'error');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleRejectListing = async (animal, reason) => {
    if (!reason || reason.trim() === '') {
      showToast('A rejection reason is required.', 'error');
      return;
    }
    setIsActionLoading(true);
    try {
      await animalApi.reject(animal.id, reason);
      showToast(`"${animal.title}" rejected.`, 'error');
      logAudit(`Rejected Animal Listing: ${animal.title} (Reason: ${reason})`, 'Animals');
      await loadDashboardData();
    } catch (e) {
      showToast(`Rejection failed: ${e.message}`, 'error');
    } finally {
      setIsActionLoading(false);
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
      setSellers((prev) => prev.map((s) => s.id === seller.id ? { ...s, status: nextStatus } : s));
      await loadDashboardData();
    } catch (err) {
      showToast(`Failed to update status: ${err.message}`, 'error');
    }
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
      setBuyers((prev) => prev.map((b) => b.id === buyer.id ? { ...b, status: nextStatus } : b));
      await loadDashboardData();
    } catch (err) {
      showToast(`Failed to update status: ${err.message}`, 'error');
    }
  };

  const handleSoftDeleteBuyer = (buyer) => {
    setBuyers((prev) => prev.map((b) => b.id === buyer.id ? { ...b, isDeleted: true } : b));
  };

  const handleRestoreBuyer = (buyer) => {
    setBuyers((prev) => prev.map((b) => b.id === buyer.id ? { ...b, isDeleted: false } : b));
  };

  const handleTogglePremiumSeller = async (seller) => {
    try {
      await sellerApi.togglePremium(seller.id);
      showToast(`Premium status updated for ${seller.name}!`, 'success');
      await loadDashboardData();
    } catch (err) {
      showToast(`Failed to update premium: ${err.message}`, 'error');
    }
  };

  const handleTogglePremiumBuyer = async (buyer) => {
    try {
      await buyerApi.togglePremium(buyer.id);
      showToast(`Premium status updated for ${buyer.name}!`, 'success');
      await loadDashboardData();
    } catch (err) {
      showToast(`Failed to update premium: ${err.message}`, 'error');
    }
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
        loginAdmin,
        logoutAdmin,
        isAuthReady,
        animals,
        setAnimals,
        verificationRequests,
        setVerificationRequests,
        pendingVerificationCount,
        setPendingVerificationCount,
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
        setDetailsModal,
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
        handleTogglePremiumSeller,
        handleTogglePremiumBuyer,
        handleToggleWidget,
        handleMoveWidgetUp,
        handleMouseDownResize,
        dashboardStats,
        serverStatus,
        isLoading,
        isActionLoading,
        apiError,
        loadDashboardData
      }}
    >
      {children}
    </AdminContext.Provider>
  );
};
