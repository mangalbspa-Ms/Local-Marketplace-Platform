/**
 * Admin Preferences Context
 * 
 * Manages Language (English / हिंदी) and Theme (Dark / Light) for the Admin App.
 * Persists preferences in localStorage.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';

export type AdminLanguage = 'en' | 'hi';
export type AdminTheme = 'dark' | 'light';

interface AdminPreferencesContextType {
  language: AdminLanguage;
  setLanguage: (lang: AdminLanguage) => void;
  theme: AdminTheme;
  setTheme: (theme: AdminTheme) => void;
  toggleTheme: () => void;
  isDarkMode: boolean;
  t: (key: string, fallback?: string) => string;
}

const translations: Record<string, { en: string; hi: string }> = {
  // Navigation & Sections
  'nav.overview': { en: 'Platform Overview', hi: 'प्लेटफ़ॉर्म ओवरव्यू' },
  'nav.orders': { en: 'Master Orders', hi: 'मास्टर ऑर्डर्स' },
  'nav.payments': { en: 'Payment Monitor', hi: 'भुगतान मॉनिटर' },
  'nav.onboard': { en: 'Quick Shop Setup', hi: 'त्वरित दुकान सेटअप' },
  'nav.markets': { en: 'Local Markets', hi: 'स्थानीय मंडियां' },
  'nav.shops': { en: 'Shops & Catalog', hi: 'दुकानें और कैटलॉग' },
  'nav.masterCatalog': { en: 'Master Catalogue', hi: 'मास्टर कैटलॉग' },
  'nav.sellers': { en: 'Seller Accounts', hi: 'विक्रेता खाते' },
  'nav.customers': { en: 'Customer Directory', hi: 'ग्राहक सूची' },
  'nav.products': { en: 'All Shop Products', hi: 'सभी उत्पाद' },
  'nav.commissions': { en: 'Commission Engine', hi: 'कमीशन नीति' },
  'nav.subscriptions': { en: 'Subscriptions & Plans', hi: 'सब्सक्रिप्शन योजनाएं' },
  'nav.settlements': { en: 'Seller Settlements', hi: 'विक्रेता भुगतान' },
  'nav.reports': { en: 'Reports & Analytics', hi: 'रिपोर्ट्स और एनालिटिक्स' },
  'nav.support': { en: 'Support & Disputes', hi: 'सहायता और विवाद' },
  'nav.audit': { en: 'Audit Trail Logs', hi: 'ऑडिट लॉग्स' },
  'nav.settings': { en: 'System Settings', hi: 'सिस्टम सेटिंग्स' },
  'nav.home': { en: 'Home', hi: 'होम' },

  // Header & Subtitles
  'header.subtitle': { en: 'Marketplace Operations & Governance Control', hi: 'मार्केटप्लेस संचालन और नियंत्रण' },
  'header.role': { en: 'PLATFORM ADMIN', hi: 'प्लेटफ़ॉर्म एडमिन' },
  'header.refresh': { en: 'Refresh', hi: 'रिफ्रेश' },
  'header.close': { en: 'Close', hi: 'बंद करें' },
  'header.returnHome': { en: 'Admin Home', hi: 'एडमिन होम' },
  'header.returnHomeTip': { en: 'Tap Close to return to Admin Home Page', hi: 'एडमिन होम पेज पर लौटने के लिए बंद करें दबाएं' },
  'header.alerts': { en: 'Platform Alerts', hi: 'सिस्टम अलर्ट' },
  'header.noAlerts': { en: 'No recent notifications', hi: 'कोई नई सूचना नहीं' },

  // 3-dot Menu
  'menu.title': { en: 'Admin Preferences', hi: 'एडमिन प्राथमिकताएं' },
  'menu.language': { en: 'Language', hi: 'भाषा' },
  'menu.theme': { en: 'Theme', hi: 'थीम' },
  'menu.darkMode': { en: 'Dark Mode', hi: 'डार्क मोड' },
  'menu.lightMode': { en: 'Light Mode', hi: 'लाइट मोड' },
  'menu.signOut': { en: 'Sign Out', hi: 'लॉगआउट' },

  // Orders Screen
  'orders.title': { en: 'Master Orders Monitor', hi: 'मास्टर ऑर्डर मॉनिटर' },
  'orders.subtitle': { en: 'Live marketplace order tracking, fulfillment states & commission splits', hi: 'लाइव ऑर्डर ट्रैकिंग, पूर्ति स्थिति और कमीशन विभाजन' },
  'orders.totalOrders': { en: 'Total Orders', hi: 'कुल ऑर्डर्स' },
  'orders.inProgress': { en: 'In Progress', hi: 'प्रगति पर' },
  'orders.completed': { en: 'Completed', hi: 'पूर्ण' },
  'orders.totalVolume': { en: 'Total Volume', hi: 'कुल बिक्री' },
  'orders.acrossShops': { en: 'Across all shops', hi: 'सभी दुकानों में' },
  'orders.needsFulfillment': { en: 'Needs fulfillment', hi: 'पूर्ति आवश्यक' },
  'orders.deliveredPickedUp': { en: 'Delivered/Picked up', hi: 'डिलीवर/पिकअप हो चुका' },
  'orders.grossValue': { en: 'Gross order value', hi: 'कुल ऑर्डर मूल्य' },
  'orders.searchPlaceholder': { en: 'Search Order ID, Customer, Phone...', hi: 'ऑर्डर संख्या, ग्राहक या फ़ोन खोजें...' },
  'orders.allShops': { en: 'All Shops', hi: 'सभी दुकानें' },
  'orders.allTypes': { en: 'All Types', hi: 'सभी प्रकार' },
  'orders.allStatus': { en: 'All Status', hi: 'सभी स्थितियां' },
  'orders.delivery': { en: 'Delivery', hi: 'डिलीवरी' },
  'orders.pickup': { en: 'Pickup', hi: 'पिकअप' },
  'orders.viewDetails': { en: 'View Details', hi: 'विवरण देखें' },
  'orders.details': { en: 'Details', hi: 'विवरण' },
  'orders.paid': { en: 'Paid', hi: 'भुगतान' },
  'orders.fee': { en: 'Fee', hi: 'शुल्क' },
  'orders.seller': { en: 'Seller', hi: 'विक्रेता' },
  'orders.items': { en: 'items', hi: 'सामान' },
  'orders.noOrders': { en: 'No orders found matching the filter criteria.', hi: 'फ़िल्टर के अनुसार कोई ऑर्डर नहीं मिला।' },
  'orders.loading': { en: 'Querying master orders...', hi: 'ऑर्डर्स लोड हो रहे हैं...' },

  // Order Filters
  'filter.all': { en: 'All', hi: 'सभी' },
  'filter.new': { en: 'New', hi: 'नया' },
  'filter.preparing': { en: 'Preparing', hi: 'तैयारी में' },
  'filter.ready': { en: 'Ready', hi: 'तैयार' },
  'filter.completed': { en: 'Completed', hi: 'पूरा हुआ' },
  'filter.cancelled': { en: 'Cancelled', hi: 'रद्द' },

  // Order Statuses
  'status.PLACED': { en: 'Placed', hi: 'प्राप्त हुआ' },
  'status.CONFIRMED': { en: 'Confirmed', hi: 'पुष्टि' },
  'status.PREPARING': { en: 'Preparing', hi: 'तैयार हो रहा' },
  'status.READY_FOR_PICKUP': { en: 'Ready for Pickup', hi: 'पिकअप हेतु तैयार' },
  'status.OUT_FOR_DELIVERY': { en: 'Out for Delivery', hi: 'डिलीवरी हेतु निकला' },
  'status.COMPLETED': { en: 'Completed', hi: 'पूर्ण' },
  'status.CANCELLED': { en: 'Cancelled', hi: 'रद्द' },
  'status.PAYMENT_PENDING': { en: 'Payment Pending', hi: 'भुगतान लंबित' },
  'status.PAYMENT_FAILED': { en: 'Payment Failed', hi: 'भुगतान विफल' },
  'status.REFUNDED': { en: 'Refunded', hi: 'वापस किया' },

  // Order Details Modal
  'detail.title': { en: 'Order Audit Details', hi: 'ऑर्डर ऑडिट विवरण' },
  'detail.customer': { en: 'Customer Information', hi: 'ग्राहक की जानकारी' },
  'detail.shop': { en: 'Shop Information', hi: 'दुकान की जानकारी' },
  'detail.items': { en: 'Ordered Items', hi: 'ऑर्डर किया गया सामान' },
  'detail.payment': { en: 'Payment Details', hi: 'भुगतान विवरण' },
  'detail.fees': { en: 'Fees & Commission Split', hi: 'शुल्क एवं कमीशन विभाजन' },
  'detail.orderStatus': { en: 'Order Status & Progression', hi: 'ऑर्डर स्थिति एवं प्रगति' },
  'detail.pickupOtp': { en: 'Pickup OTP', hi: 'पिकअप ओटीपी' },
  'detail.itemSubtotal': { en: 'Items Subtotal', hi: 'सामान का उप-योग' },
  'detail.deliveryFee': { en: 'Delivery Fee', hi: 'डिलीवरी शुल्क' },
  'detail.platformFee': { en: 'Platform Fee', hi: 'प्लेटफ़ॉर्म शुल्क' },
  'detail.tax': { en: 'Taxes', hi: 'कर' },
  'detail.customerPaid': { en: 'Customer Total Paid', hi: 'ग्राहक द्वारा कुल भुगतान' },
  'detail.commission': { en: 'Platform Commission', hi: 'प्लेटफ़ॉर्म कमीशन' },
  'detail.sellerPayout': { en: 'Seller Net Payout', hi: 'विक्रेता शुद्ध भुगतान' },
  'detail.gatewayRef': { en: 'Gateway Transaction Ref', hi: 'गेटवे ट्रांजेक्शन रेफ़रेंस' },
  'detail.verified': { en: 'VERIFIED', hi: 'सत्यापित' },
  'detail.pending': { en: 'PENDING', hi: 'लंबित' },

  // Subscriptions & Plans
  'subs.title': { en: 'Subscription & Billing Control', hi: 'सब्सक्रिप्शन और बिलिंग नियंत्रण' },
  'subs.editPlan': { en: 'Edit Subscription Plan', hi: 'सब्सक्रिप्शन प्लान संपादित करें' },
  'subs.createPlan': { en: 'Create Subscription Plan', hi: 'नया सब्सक्रिप्शन प्लान बनाएं' },
  'subs.planName': { en: 'Plan Name', hi: 'प्लान का नाम' },
  'subs.description': { en: 'Description', hi: 'विवरण' },
  'subs.price': { en: 'Price (₹)', hi: 'कीमत (₹)' },
  'subs.interval': { en: 'Billing Interval', hi: 'बिलिंग अवधि' },
  'subs.commissionRate': { en: 'Commission Rate (%)', hi: 'कमीशन दर (%)' },
  'subs.maxProducts': { en: 'Item Limit (Blank = Unlimited)', hi: 'उत्पाद सीमा (खाली = असीमित)' },
  'subs.features': { en: 'Features Included', hi: 'शामिल सुविधाएं' },
  'subs.addFeature': { en: 'Add Feature', hi: 'सुविधा जोड़ें' },
  'subs.activeStatus': { en: 'Active & Available', hi: 'सक्रिय और उपलब्ध' },
  'subs.popularBadge': { en: 'Highlight as "Most Popular"', hi: '"लोकप्रिय" के रूप में चिह्नित करें' },
  'subs.save': { en: 'Save Plan', hi: 'प्लान सुरक्षित करें' },
  'subs.cancel': { en: 'Cancel', hi: 'रद्द करें' },
  'subs.delete': { en: 'Delete Plan', hi: 'प्लान हटाएं' },
  'subs.confirmDelete': { en: 'Confirm Delete', hi: 'हटाने की पुष्टि करें' },
  'subs.deleteWarning': { en: 'This will permanently remove this subscription plan.', hi: 'यह इस सब्सक्रिप्शन प्लान को स्थायी रूप से हटा देगा।' },
};

const LANG_KEY = 'admin_app_language';
const THEME_KEY = 'admin_app_theme';

const AdminPreferencesContext = createContext<AdminPreferencesContextType>({
  language: 'en',
  setLanguage: () => {},
  theme: 'dark',
  setTheme: () => {},
  toggleTheme: () => {},
  isDarkMode: true,
  t: (k: string, fb?: string) => fb || k,
});

export const AdminPreferencesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<AdminLanguage>(() => {
    try {
      const saved = localStorage.getItem(LANG_KEY);
      if (saved === 'en' || saved === 'hi') return saved;
    } catch (e) {
      console.warn('Unable to access localStorage for admin language:', e);
    }
    return 'en';
  });

  const [theme, setThemeState] = useState<AdminTheme>(() => {
    try {
      const saved = localStorage.getItem(THEME_KEY);
      if (saved === 'dark' || saved === 'light') return saved;
    } catch (e) {
      console.warn('Unable to access localStorage for admin theme:', e);
    }
    return 'dark'; // Dark theme is default
  });

  const setLanguage = (lang: AdminLanguage) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(LANG_KEY, lang);
    } catch (e) {
      console.warn('Failed to save admin language', e);
    }
  };

  const setTheme = (newTheme: AdminTheme) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem(THEME_KEY, newTheme);
    } catch (e) {
      console.warn('Failed to save admin theme', e);
    }
  };

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
  };

  const t = (key: string, fallback?: string): string => {
    const entry = translations[key];
    if (entry && entry[language]) {
      return entry[language];
    }
    return fallback !== undefined ? fallback : key;
  };

  return (
    <AdminPreferencesContext.Provider
      value={{
        language,
        setLanguage,
        theme,
        setTheme,
        toggleTheme,
        isDarkMode: theme === 'dark',
        t,
      }}
    >
      {children}
    </AdminPreferencesContext.Provider>
  );
};

export const useAdminPreferences = () => useContext(AdminPreferencesContext);
