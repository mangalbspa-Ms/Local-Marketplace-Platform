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

  // Common UI Actions
  'common.close': { hi: 'बंद करें', en: 'Close' },
  'common.cancel': { hi: 'रद्द करें', en: 'Cancel' },
  'common.save': { hi: 'सुरक्षित करें', en: 'Save' },
  'common.change': { hi: 'बदलें', en: 'Change' },
  'common.edit': { hi: 'संपादित करें', en: 'Edit' },
  'common.active': { hi: 'सक्रिय', en: 'Active' },
  'common.disabled': { hi: 'अक्षम', en: 'Disabled' },
  'common.open': { hi: 'खुली', en: 'OPEN' },
  'common.closed': { hi: 'बंद', en: 'CLOSED' },
  'common.verified': { hi: 'सत्यापित', en: 'Verified' },
  'common.uploading': { hi: 'अपलोड...', en: 'Uploading...' },

  // Quick Menu (SellerHeader)
  'menu.quick_menu': { hi: 'त्वरित मेनू', en: 'Quick Menu' },
  'menu.close': { hi: 'मेनू बंद करें', en: 'Close Menu' },
  'menu.shop_info': { hi: '1. 🏪 दुकान जानकारी', en: '1. 🏪 Shop Information' },
  'menu.personal_info': { hi: '2. 👤 दुकानदार की जानकारी', en: '2. 👤 Shopkeeper Information' },
  'menu.contact_address': { hi: '3. 📞 संपर्क और पता', en: '3. 📞 Contact & Address' },
  'menu.language': { hi: '4. 🌐 भाषा', en: '4. 🌐 Language' },
  'menu.settings': { hi: '5. ⚙️ सेटिंग', en: '5. ⚙️ Settings' },
  'menu.lock_security': { hi: '6. 🔒 ताला और सुरक्षा (Lock & Security)', en: '6. 🔒 Lock & Security' },
  'menu.support': { hi: '7. ❓ सहायता और सपोर्ट', en: '7. ❓ Help & Support' },
  'menu.theme_dark': { hi: '8. 🌙 डार्क मोड', en: '8. 🌙 Dark Mode' },
  'menu.theme_light': { hi: '8. ☀️ लाइट मोड', en: '8. ☀️ Light Mode' },
  'menu.logout': { hi: '9. 🚪 लॉग आउट', en: '9. 🚪 Logout' },

  // Contact & Address Modal
  'contact.title': { hi: '3. 📞 संपर्क और पता', en: '3. 📞 Contact & Address' },
  'contact.subtitle': { hi: 'ग्राहकों व डिलीवरी पार्टनर के लिए दुकान संपर्क एवं पता विवरण', en: 'Store contact and address details for customers and delivery partners' },
  'contact.phone': { hi: 'दुकान का मोबाइल नंबर', en: 'Shop Mobile Number' },
  'contact.whatsapp': { hi: 'WhatsApp नंबर', en: 'WhatsApp Number' },
  'contact.same_as_phone': { hi: 'दुकान मोबाइल जैसा ही', en: 'Same as shop phone' },
  'contact.email': { hi: 'दुकान का Email', en: 'Shop Email' },
  'contact.address': { hi: 'दुकान का पंजीकृत पता', en: 'Shop Registered Address' },
  'contact.pincode': { hi: 'पिन कोड:', en: 'Pincode:' },
  'contact.success': { hi: 'संपर्क जानकारी सफलतापूर्वक अपडेट हो गई!', en: 'Contact details updated successfully!' },

  // Personal Info Modal
  'personal.title': { hi: 'व्यक्तिगत जानकारी', en: 'Personal Information' },
  'personal.subtitle': { hi: 'दुकानदार की व्यक्तिगत जानकारी', en: 'Shopkeeper personal details' },
  'personal.photo': { hi: 'प्रोफाइल फोटो', en: 'Profile Photo' },
  'personal.photo_sub': { hi: 'व्यक्तिगत खाता पहचान फोटो', en: 'Personal account identity photo' },
  'personal.change_photo': { hi: 'फोटो बदलें', en: 'Change Photo' },
  'personal.name': { hi: 'दुकानदार का नाम', en: 'Shopkeeper Name' },
  'personal.name_placeholder': { hi: 'दुकानदार का पूरा नाम दर्ज करें', en: 'Enter full name of shopkeeper' },
  'personal.phone': { hi: 'मोबाइल नंबर', en: 'Mobile Number' },
  'personal.phone_placeholder': { hi: 'उदा. +91 98200 00001', en: 'e.g. +91 98200 00001' },
  'personal.email': { hi: 'ईमेल ID', en: 'Email ID' },
  'personal.email_placeholder': { hi: 'उदा. ramesh@example.com', en: 'e.g. ramesh@example.com' },
  'personal.verification': { hi: 'सत्यापन स्थिति', en: 'Verification Status' },
  'personal.verified_account': { hi: 'सत्यापित खाता', en: 'Verified Account' },
  'personal.verified_badge': { hi: 'सत्यापित / Verified', en: 'Verified' },
  'personal.no_phone': { hi: 'मोबाइल नंबर दर्ज नहीं है', en: 'Mobile number not registered' },
  'personal.no_email': { hi: 'ईमेल दर्ज नहीं है', en: 'Email not registered' },
  'personal.uploading': { hi: 'अपलोड...', en: 'Uploading...' },
  'personal.name_saved': { hi: 'नाम सफलतापूर्वक सुरक्षित किया गया', en: 'Name updated successfully' },
  'personal.phone_saved': { hi: 'मोबाइल नंबर सुरक्षित किया गया', en: 'Phone number updated' },
  'personal.email_saved': { hi: 'ईमेल ID सफलतापूर्वक सुरक्षित की गई', en: 'Email updated successfully' },
  'personal.photo_saved': { hi: 'प्रोफाइल फोटो सफलतापूर्वक बदली गई', en: 'Photo updated successfully' },

  // Settings Modal
  'settings.title': { hi: 'सेटिंग्स', en: 'Settings' },
  'settings.subtitle': { hi: 'दुकान संचालन, ऑर्डर एवं नोटिफिकेशन प्राथमिकताएं', en: 'Store operations, orders & notification preferences' },
  'settings.shop_status': { hi: 'दुकान की चालू/बंद स्थिति', en: 'Store Operational Status' },
  'settings.shop_open_desc': { hi: 'दुकान ग्राहकों के लिए खुली है', en: 'Store is open for customers' },
  'settings.shop_closed_desc': { hi: 'दुकान बंद है (ऑर्डर नहीं आएंगे)', en: 'Store is closed (No orders accepted)' },
  'settings.accept_orders': { hi: 'नए ऑर्डर स्वीकार करें', en: 'Accept New Orders' },
  'settings.accept_orders_on': { hi: 'नए ऑर्डर स्वीकार किए जा रहे हैं', en: 'Accepting incoming customer orders' },
  'settings.accept_orders_off': { hi: 'अस्थायी रूप से ऑर्डर रोके गए', en: 'Orders temporarily paused' },
  'settings.fulfillment_title': { hi: 'डिलीवरी एवं पिकअप प्राथमिकताएं', en: 'Delivery & Pickup Preferences' },
  'settings.pickup': { hi: 'काउंटर पिकअप', en: 'Counter Pickup' },
  'settings.delivery': { hi: 'होम डिलीवरी', en: 'Home Delivery' },
  'settings.notifications_title': { hi: 'सूचना एवं रिंगटोन प्राथमिकताएं', en: 'Notification & Ringtone Preferences' },
  'settings.sound_alert': { hi: 'ऑर्डर आने पर रिंगटोन / साउंड', en: 'Ringtone / Sound on New Order' },
  'settings.sound_desc': { hi: 'ध्वनि अलर्ट बजाएं', en: 'Play audio alert' },
  'settings.push_alerts': { hi: 'पुश और स्क्रीन अलर्ट्स', en: 'Push & Screen Alerts' },
  'settings.push_desc': { hi: 'नए ग्राहक ऑर्डर की सूचना', en: 'New customer order notifications' },
  'settings.open_status_screen': { hi: 'विस्तृत स्टेटस स्क्रीन खोलें', en: 'Open Detailed Status Screen' },

  // Support Modal
  'support.title': { hi: 'सहायता और सपोर्ट', en: 'Help & Support' },
  'support.subtitle': { hi: 'मंडी सहायता डेस्क एवं विक्रेता हेल्पलाइन', en: 'Market Help Desk & Seller Helpline' },
  'support.helpline': { hi: 'टोल-फ्री विक्रेता हेल्पलाइन', en: 'Toll-Free Seller Helpline' },
  'support.whatsapp': { hi: 'व्हाट्सएप सहायता', en: 'WhatsApp Support' },
  'support.email': { hi: 'ईमेल सहायता', en: 'Email Support' },
  'support.chat_now': { hi: 'चैट करें', en: 'Chat Now' },
  'support.reply_time': { hi: 'जवाब 2 घंटे में', en: 'Response in 2 hours' },

  // Logout Modal
  'logout.confirm_title': { hi: 'लॉग आउट पुष्टि', en: 'Logout Confirmation' },
  'logout.confirm_desc': { hi: 'क्या आप वाकई अपने विक्रेता खाते से लॉग आउट करना चाहते हैं? दोबारा जुड़ने के लिए मोबाइल ओटीपी दर्ज करना होगा।', en: 'Are you sure you want to log out from your seller account? You will need to enter your mobile OTP to sign in again.' },
  'logout.confirm_btn': { hi: 'हाँ, लॉग आउट करें', en: 'Yes, Logout' },

  // Language Modal
  'lang.modal_title': { hi: '4. 🌐 भाषा', en: '4. 🌐 Language' },
  'lang.modal_subtitle': { hi: 'विक्रेता ऐप की प्रदर्शन भाषा चुनें', en: 'Select display language for Seller App' },
  'lang.notice_title': { hi: 'भाषा संबंधी सूचना', en: 'Language Notice' },
  'lang.notice_desc': { hi: 'भाषा बदलने पर बटन, लेबल, आदेश स्थिति व सूचनाएं चुनी गई भाषा में प्रदर्शित होंगी।', en: 'Changing the language will display buttons, labels, order status and notices in the selected language.' },
  'lang.hi_badge': { hi: 'प्राथमिक भाषा', en: 'Primary Language' },
  'lang.en_badge': { hi: 'अंग्रेज़ी इंटरफ़ेस', en: 'English Interface' },
  'lang.hi_desc': { hi: 'विक्रेता ऐप का संपूर्ण इंटरफ़ेस हिन्दी में प्रदर्शित होगा', en: 'The entire seller app interface will be displayed in Hindi' },
  'lang.en_desc': { hi: 'विक्रेता ऐप का संपूर्ण इंटरफ़ेस अंग्रेज़ी में प्रदर्शित होगा', en: 'The entire seller app interface will be displayed in English' },
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
