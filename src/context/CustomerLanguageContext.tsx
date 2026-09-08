/**
 * Customer Language Context
 * 
 * Provides bilingual English and Hindi localization for the Customer Marketplace App.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'hi';

const translations = {
  en: {
    // Header & Location
    appTitle: 'Local Mandi',
    deliveringTo: 'Delivering to',
    searchPlaceholder: 'Search shops, atta, paneer, veggies, medicines...',
    selectMarket: 'Select Local Market',
    allShops: 'All Neighborhood Shops',
    categories: 'Categories',
    allCategories: 'All Categories',
    openNow: 'Open Now',
    closed: 'Closed',
    pickup: 'Store Pickup',
    delivery: 'Home Delivery',
    minOrder: 'Min. Order',
    prepTime: 'Prep time',
    rating: 'Rating',
    reviews: 'reviews',
    freeDeliveryAbove: 'Free delivery above',
    deliveryFee: 'Delivery Fee',
    
    // Storefront
    searchInShop: 'Search in this shop...',
    itemsInStock: 'in stock',
    outOfStock: 'Out of Stock',
    customPortion: 'Custom Portion',
    addToCart: 'Add to Cart',
    added: 'Added',
    selectPortion: 'Select Weight / Portion',
    perBaseUnit: 'per',
    approxWeight: 'Approx.',
    
    // Cart & Checkout
    cart: 'My Cart',
    cartEmpty: 'Your Cart is Empty',
    cartEmptySub: 'Explore local shops in your mandi and add fresh items.',
    browseShops: 'Browse Shops',
    billDetails: 'Bill Details',
    itemTotal: 'Item Total',
    deliveryPartnerFee: 'Delivery Partner Fee',
    platformFee: 'Platform Fee',
    toPay: 'To Pay',
    free: 'FREE',
    deliveryAddress: 'Delivery Address',
    changeAddress: 'Change',
    addNewAddress: 'Add New Address',
    specialInstructions: 'Special Instructions for Shopkeeper (e.g., ripe tomatoes only)',
    addInstructions: 'Add shop notes / packaging instructions...',
    selectFulfillment: 'Select Fulfillment Method',
    selfPickupDesc: 'Pick up freshly packed order at shop counter with 4-digit PIN',
    homeDeliveryDesc: 'Direct contactless delivery to your doorstep',
    proceedToPay: 'Proceed to Pay',
    payNow: 'Pay & Place Order',
    cartConflictTitle: 'Replace Cart Items?',
    cartConflictMsg: 'Your cart already contains items from',
    cartConflictDiscard: 'Discard Cart & Add New',
    cancel: 'Cancel',
    
    // Payment
    paymentHeader: 'Secure Payment',
    simulatedGateway: 'Instant UPI & Card Gateway',
    choosePaymentMethod: 'Choose Payment Method',
    upiGooglePay: 'Google Pay / PhonePe / Paytm (UPI)',
    upiId: 'Enter UPI ID (e.g. yourname@okhdfcbank)',
    card: 'Credit / Debit Card',
    netBanking: 'Net Banking',
    verifyingPayment: 'Verifying Payment with Market Server...',
    paymentSuccess: 'Payment Verified & Confirmed!',
    
    // Order Tracking & History
    myOrders: 'My Orders',
    activeOrder: 'Active Order',
    pastOrders: 'Past Orders',
    orderId: 'Order ID',
    orderStatus: 'Order Status',
    pickupPin: 'Pickup Verification PIN',
    sharePinWithSeller: 'Show this 4-digit PIN to the shopkeeper at the counter',
    estimatedTime: 'Estimated Time',
    trackLive: 'Live Tracking',
    callShop: 'Call Shop',
    needHelp: 'Need Help',
    reorder: 'Reorder Items',
    viewDetails: 'View Details',
    
    // Status Timeline
    status_PLACED: 'Order Placed (Payment Pending)',
    status_CONFIRMED: 'Payment Confirmed & Sent to Shop',
    status_ACCEPTED: 'Shopkeeper Accepted Order',
    status_PREPARING: 'Weighing & Packing Fresh Items',
    status_READY_FOR_PICKUP: 'Packed & Ready at Counter',
    status_OUT_FOR_DELIVERY: 'Out for Delivery to Your Address',
    status_COMPLETED: 'Delivered / Handed Over Successfully',
    status_CANCELLED: 'Order Cancelled & Refunded',
    
    // Profile
    profile: 'Customer Profile',
    switchAccount: 'Switch Demo Customer',
    savedAddresses: 'Saved Addresses',
    notifications: 'Notifications',
    support: 'Market Helpdesk & Safety',
  },
  hi: {
    // Header & Location
    appTitle: 'स्थानीय मंडी',
    deliveringTo: 'डिलीवरी का पता',
    searchPlaceholder: 'दुकानें, आटा, पनीर, ताजी सब्जियां, दवाइयां खोजें...',
    selectMarket: 'स्थानीय मंडी चुनें',
    allShops: 'आस-पास की सभी दुकानें',
    categories: 'श्रेणियां (Categories)',
    allCategories: 'सभी श्रेणियां',
    openNow: 'खुली है (Open)',
    closed: 'बंद है (Closed)',
    pickup: 'दुकान से पिकअप',
    delivery: 'घर पर डिलीवरी',
    minOrder: 'न्यूनतम ऑर्डर',
    prepTime: 'तैयारी का समय',
    rating: 'रेटिंग',
    reviews: 'समीक्षाएं',
    freeDeliveryAbove: 'मुफ्त डिलीवरी न्यूनतम',
    deliveryFee: 'डिलीवरी शुल्क',
    
    // Storefront
    searchInShop: 'इस दुकान में उत्पाद खोजें...',
    itemsInStock: 'उपलब्ध स्टॉक',
    outOfStock: 'स्टॉक समाप्त',
    customPortion: 'कस्टम वजन दर्ज करें',
    addToCart: 'कार्ट में जोड़ें',
    added: 'जोड़ दिया गया',
    selectPortion: 'मात्रा / वजन चुनें',
    perBaseUnit: 'प्रति',
    approxWeight: 'अनुमानित वजन',
    
    // Cart & Checkout
    cart: 'मेरी कार्ट',
    cartEmpty: 'आपकी कार्ट खाली है',
    cartEmptySub: 'अपनी पसंदीदा दुकान चुनें और ताजे उत्पाद जोड़ें।',
    browseShops: 'दुकानें देखें',
    billDetails: 'बिल का विवरण',
    itemTotal: 'सामान का कुल मूल्य',
    deliveryPartnerFee: 'डिलीवरी शुल्क',
    platformFee: 'प्लेटफॉर्म शुल्क',
    toPay: 'कुल भुगतान',
    free: 'मुफ्त (FREE)',
    deliveryAddress: 'डिलीवरी का पता',
    changeAddress: 'बदलें',
    addNewAddress: 'नया पता जोड़ें',
    specialInstructions: 'दुकानदार के लिए निर्देश (जैसे: ताजे लाल टमाटर ही दें)',
    addInstructions: 'दुकानदार के लिए विशेष निर्देश लिखें...',
    selectFulfillment: 'ऑर्डर प्राप्ति का तरीका चुनें',
    selfPickupDesc: 'दुकान के काउंटर पर ४-अंकों का पिन दिखाकर सामान प्राप्त करें',
    homeDeliveryDesc: 'सीधे आपके घर के पते पर सुरक्षित डिलीवरी',
    proceedToPay: 'भुगतान के लिए आगे बढ़ें',
    payNow: 'भुगतान करें और ऑर्डर दें',
    cartConflictTitle: 'क्या कार्ट बदलना चाहते हैं?',
    cartConflictMsg: 'आपकी कार्ट में पहले से इस दुकान का सामान है:',
    cartConflictDiscard: 'पुरानी कार्ट हटाएं और नया सामान जोड़ें',
    cancel: 'रद्द करें',
    
    // Payment
    paymentHeader: 'सुरक्षित भुगतान',
    simulatedGateway: 'त्वरित UPI व कार्ड गेटवे',
    choosePaymentMethod: 'भुगतान का माध्यम चुनें',
    upiGooglePay: 'गूगल पे / फोनपे / पेटीएम (UPI)',
    upiId: 'UPI ID दर्ज करें (उदा. username@okhdfcbank)',
    card: 'क्रेडिट / डेबिट कार्ड',
    netBanking: 'नेट बैंकिंग',
    verifyingPayment: 'मंडी सर्वर से भुगतान सत्यापित हो रहा है...',
    paymentSuccess: 'भुगतान सफलतापूर्वक सत्यापित हो गया!',
    
    // Order Tracking & History
    myOrders: 'मेरे ऑर्डर्स',
    activeOrder: 'चालू ऑर्डर (Active)',
    pastOrders: 'पुराने ऑर्डर्स',
    orderId: 'ऑर्डर संख्या',
    orderStatus: 'ऑर्डर की स्थिति',
    pickupPin: 'पिकअप सत्यापन पिन (PIN)',
    sharePinWithSeller: 'सामान लेते समय दुकानदार को यह ४-अंकों का पिन दिखाएं',
    estimatedTime: 'अनुमानित समय',
    trackLive: 'लाइव ट्रैकिंग देखें',
    callShop: 'दुकान पर कॉल करें',
    needHelp: 'सहायता चाहिए',
    reorder: 'पुनः ऑर्डर करें',
    viewDetails: 'विवरण देखें',
    
    // Status Timeline
    status_PLACED: 'ऑर्डर दर्ज हुआ (भुगतान लंबित)',
    status_CONFIRMED: 'भुगतान सफल • दुकान को भेजा गया',
    status_ACCEPTED: 'दुकानदार ने ऑर्डर स्वीकार किया',
    status_PREPARING: 'सामान तौला और पैक किया जा रहा है',
    status_READY_FOR_PICKUP: 'पैक हो चुका है • काउंटर से लें',
    status_OUT_FOR_DELIVERY: 'डिलीवरी के लिए निकल चुका है',
    status_COMPLETED: 'सफलतापूर्वक प्राप्त हुआ (Completed)',
    status_CANCELLED: 'ऑर्डर रद्द और धनवापसी पूर्ण',
    
    // Profile
    profile: 'ग्राहक प्रोफाइल',
    switchAccount: 'डेमो ग्राहक खाता बदलें',
    savedAddresses: 'सहेजे गए पते',
    notifications: 'सूचनाएं (Alerts)',
    support: 'मंडी सहायता व सुरक्षा केंद्र',
  },
};

interface CustomerLanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof typeof translations['en']) => string;
}

const CustomerLanguageContext = createContext<CustomerLanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  t: (key) => translations.en[key] || String(key),
});

export const CustomerLanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    return (localStorage.getItem('customer_language') as Language) || 'en';
  });

  useEffect(() => {
    localStorage.setItem('customer_language', language);
  }, [language]);

  const t = (key: keyof typeof translations['en']): string => {
    return translations[language]?.[key] || translations.en[key] || String(key);
  };

  return (
    <CustomerLanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </CustomerLanguageContext.Provider>
  );
};

export const useCustomerLanguage = () => useContext(CustomerLanguageContext);
