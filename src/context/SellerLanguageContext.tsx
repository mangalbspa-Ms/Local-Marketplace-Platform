/**
 * Seller Language Context (Hindi & English Localization)
 * Tailored specifically for local Indian shopkeepers (किराना / फल / सब्जी / डेयरी विक्रेता)
 */

import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'hi' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, defaultText?: string) => string;
}

const translations: Record<string, { hi: string; en: string }> = {
  // App Title
  'app.name': { hi: 'व्यापार केंद्र (विक्रेता)', en: 'Vyapar Kendra (Seller Hub)' },
  'app.subtitle': { hi: 'लोकल मार्केट मर्चेंट ऐप', en: 'Local Market Merchant Portal' },

  // Auth & Login
  'login.title': { hi: 'विक्रेता लॉगिन', en: 'Seller Login' },
  'login.phone_label': { hi: 'मोबाइल नंबर', en: 'Mobile Number' },
  'login.phone_placeholder': { hi: '10 अंकों का मोबाइल नंबर दर्ज करें', en: 'Enter 10-digit mobile number' },
  'login.otp_label': { hi: 'ओटीपी (OTP) दर्ज करें', en: 'Enter 6-digit OTP' },
  'login.send_otp': { hi: 'ओटीपी प्राप्त करें', en: 'Get OTP' },
  'login.verify_otp': { hi: 'लॉगिन करें', en: 'Verify & Login' },
  'login.resend_otp': { hi: 'ओटीपी पुनः भेजें', en: 'Resend OTP' },
  'login.quick_demo': { hi: '⚡ त्वरित टेस्ट खाता चुनें (Demo)', en: '⚡ Select Demo Test Account' },
  'login.logout': { hi: 'लॉगआउट', en: 'Logout' },

  // Shop Status
  'shop.status.open': { hi: 'दुकान चालू है (Online)', en: 'Shop is OPEN' },
  'shop.status.closed': { hi: 'दुकान बंद है (Offline)', en: 'Shop is CLOSED' },
  'shop.status.toggle_online': { hi: 'दुकान चालू करें', en: 'Go Online' },
  'shop.status.toggle_offline': { hi: 'दुकान बंद करें', en: 'Go Offline' },
  'shop.status.pickup_enabled': { hi: 'दुकान से पिकअप चालू', en: 'Store Pickup Enabled' },
  'shop.status.delivery_enabled': { hi: 'होम डिलीवरी चालू', en: 'Home Delivery Enabled' },

  // Orders
  'order.new': { hi: 'नया आर्डर', en: 'New Order' },
  'order.incoming_alert': { hi: '🔔 नया भुगतान आर्डर आया है!', en: '🔔 New Paid Order Received!' },
  'order.accept': { hi: 'आर्डर स्वीकार करें', en: 'Accept Order' },
  'order.reject': { hi: 'आर्डर रद्द करें', en: 'Reject Order' },
  'order.start_packing': { hi: 'पैकिंग शुरू करें', en: 'Start Packing' },
  'order.mark_ready': { hi: 'तैयार है (Ready)', en: 'Mark Ready' },
  'order.mark_dispatched': { hi: 'डिलीवरी के लिए रवाना', en: 'Dispatch Delivery' },
  'order.mark_completed': { hi: 'आर्डर पूरा हुआ', en: 'Complete Order' },
  'order.verify_pickup_pin': { hi: 'पिकअप पिन (PIN) सत्यापित करें', en: 'Verify Pickup PIN' },
  'order.customer': { hi: 'ग्राहक', en: 'Customer' },
  'order.items': { hi: 'सामग्री सूची', en: 'Items List' },
  'order.subtotal': { hi: 'सामान का मूल्य', en: 'Items Subtotal' },
  'order.delivery_fee': { hi: 'डिलीवरी शुल्क', en: 'Delivery Fee' },
  'order.platform_fee': { hi: 'प्लेटफॉर्म सुविधा शुल्क', en: 'Platform Fee' },
  'order.customer_paid': { hi: 'ग्राहक ने भुगतान किया (UPI)', en: 'Customer Paid (UPI)' },
  'order.commission_deducted': { hi: 'प्लेटफॉर्म कमीशन (5%)', en: 'Platform Commission (5%)' },
  'order.seller_receivable': { hi: 'दुकानदार को मिलने वाली शुद्ध राशि', en: 'Net Seller Receivable' },
  'order.fulfillment.pickup': { hi: 'दुकान से पिकअप (Store Pickup)', en: 'Store Pickup' },
  'order.fulfillment.delivery': { hi: 'होम डिलीवरी (Home Delivery)', en: 'Home Delivery' },

  // Statuses
  'status.CONFIRMED': { hi: 'नया भुगतान प्राप्त', en: 'New Paid Order' },
  'status.ACCEPTED': { hi: 'स्वीकृत', en: 'Accepted' },
  'status.PREPARING': { hi: 'पैकिंग जारी', en: 'Packing' },
  'status.READY_FOR_PICKUP': { hi: 'पिकअप हेतु तैयार', en: 'Ready for Pickup' },
  'status.OUT_FOR_DELIVERY': { hi: 'डिलीवरी रास्ते में', en: 'Out for Delivery' },
  'status.COMPLETED': { hi: 'सफलतापूर्वक पूर्ण', en: 'Completed' },
  'status.CANCELLED': { hi: 'रद्द', en: 'Cancelled' },

  // Packing
  'packing.title': { hi: 'काउंटर पैकिंग चेकलिस्ट', en: 'Packing Checklist' },
  'packing.instruction': { hi: 'सामान को सही वजन/मात्रा में तौलकर बैग में रखें', en: 'Weigh items accurately & pack into bags' },
  'packing.all_checked': { hi: 'सभी सामान पैक हो गए', en: 'All Items Packed' },

  // Products & Inventory
  'nav.home': { hi: 'होम', en: 'Home' },
  'nav.orders': { hi: 'आर्डर', en: 'Orders' },
  'nav.packing': { hi: 'पैकिंग', en: 'Packing' },
  'nav.products': { hi: 'प्रोडक्ट्स', en: 'Products' },
  'nav.inventory': { hi: 'स्टॉक / इन्वेंट्री', en: 'Inventory' },
  'nav.earnings': { hi: 'कमाई व हिसाब', en: 'Earnings' },
  'nav.more': { hi: 'अधिक', en: 'More' },

  'product.add_new': { hi: '+ नया सामान जोड़ें', en: '+ Add New Product' },
  'product.base_price': { hi: 'मूल भाव (Base Price)', en: 'Base Price' },
  'product.stock': { hi: 'उपलब्ध स्टॉक', en: 'Current Stock' },
  'product.fractional_options': { hi: 'तौल / मात्रा के विकल्प', en: 'Fractional Quantities' },
  'product.low_stock': { hi: 'कम स्टॉक अलर्ट', en: 'Low Stock Alert' },

  // Earnings & Settlement
  'earnings.today': { hi: 'आज की कमाई', en: "Today's Earnings" },
  'earnings.gross_sales': { hi: 'कुल बिक्री (Gross Sales)', en: 'Gross Sales' },
  'earnings.net_payout': { hi: 'शुद्ध भुगतान (Net Payout)', en: 'Net Payout' },
  'earnings.commission_paid': { hi: 'कमीशन कटौती', en: 'Commission Deducted' },
  'settlement.batch': { hi: 'सेटलमेंट बैच', en: 'Settlement Batch' },
  'settlement.status.COMPLETED': { hi: 'बैंक खाते में जमा (Paid)', en: 'Settled to Bank / UPI' },
  'settlement.status.PENDING': { hi: 'प्रक्रियाधीन (Pending)', en: 'Processing' },

  // Notifications
  'notif.title': { hi: 'सूचनाएं', en: 'Notifications' },
  'notif.mark_all_read': { hi: 'सभी को पढ़ा हुआ मार्क करें', en: 'Mark All as Read' },
};

const LanguageContext = createContext<LanguageContextType>({
  language: 'hi',
  setLanguage: () => {},
  t: (key: string) => key,
});

export const SellerLanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem('seller_app_lang') as Language) || 'hi';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('seller_app_lang', lang);
  };

  const t = (key: string, defaultText?: string): string => {
    if (translations[key] && translations[key][language]) {
      return translations[key][language];
    }
    return defaultText || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useSellerLanguage = () => useContext(LanguageContext);
