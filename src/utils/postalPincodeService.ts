/**
 * Postal PIN Code Lookup Service for Indian Postal Data
 * 
 * Provides reliable offline and online lookup for Indian PIN Codes.
 * Auto-fills:
 * - राज्य (State)
 * - जिला (District)
 * - तहसील (Tehsil / Taluk)
 * - पोस्ट ऑफिस (Post Office)
 * - क्षेत्र / locality (Locality / Area)
 */

export interface PostalData {
  pincode: string;
  state: string;
  district: string;
  tehsil: string;
  postOffice: string;
  locality: string;
  postOffices?: string[];
}

// Curated high-reliability dictionary of prominent markets & hubs
const LOCAL_POSTAL_DIRECTORY: Record<string, PostalData> = {
  // Jaipur / Rajasthan
  '302004': {
    pincode: '302004',
    state: 'राजस्थान (Rajasthan)',
    district: 'जयपुर (Jaipur)',
    tehsil: 'जयपुर (Jaipur)',
    postOffice: 'राजा पार्क SO (Raja Park)',
    locality: 'राजा पार्क मुख्य मंडी (Raja Park Mandi)',
  },
  '302001': {
    pincode: '302001',
    state: 'राजस्थान (Rajasthan)',
    district: 'जयपुर (Jaipur)',
    tehsil: 'जयपुर (Jaipur)',
    postOffice: 'जयपुर GPO (Jaipur GPO)',
    locality: 'एम.आई. रोड / चांदपोल मंडी (M.I. Road / Chandpole)',
  },
  '302020': {
    pincode: '302020',
    state: 'राजस्थान (Rajasthan)',
    district: 'जयपुर (Jaipur)',
    tehsil: 'सांगानेर (Sanganer)',
    postOffice: 'मानसरोवर SO (Mansarovar)',
    locality: 'मानसरोवर फ्रूट व वेज मार्केट (Mansarovar Market)',
  },
  '302015': {
    pincode: '302015',
    state: 'राजस्थान (Rajasthan)',
    district: 'जयपुर (Jaipur)',
    tehsil: 'जयपुर (Jaipur)',
    postOffice: 'गांधी नगर SO (Gandhi Nagar)',
    locality: 'टोंक फाटक / बापू नगर (Tonk Phatak)',
  },
  '302006': {
    pincode: '302006',
    state: 'राजस्थान (Rajasthan)',
    district: 'जयपुर (Jaipur)',
    tehsil: 'जयपुर (Jaipur)',
    postOffice: 'झालाना डूंगरी SO',
    locality: 'मालवीय नगर सब्जी मंडी (Malviya Nagar)',
  },

  // Mumbai / Maharashtra
  '400028': {
    pincode: '400028',
    state: 'महाराष्ट्र (Maharashtra)',
    district: 'मुंबई (Mumbai)',
    tehsil: 'दादर (Dadar)',
    postOffice: 'दादर HO (Dadar Central)',
    locality: 'दादर सेंट्रल सब्जी एवं अनाज मंडी (Dadar Mandi)',
  },
  '400050': {
    pincode: '400050',
    state: 'महाराष्ट्र (Maharashtra)',
    district: 'मुंबई उपनगर (Mumbai Suburban)',
    tehsil: 'बांद्रा (Bandra)',
    postOffice: 'बांद्रा वेस्ट SO (Bandra West)',
    locality: 'हिल रोड / पाली हिल मार्केट (Bandra Market)',
  },
  '400001': {
    pincode: '400001',
    state: 'महाराष्ट्र (Maharashtra)',
    district: 'मुंबई (Mumbai)',
    tehsil: 'फोर्ट (Fort)',
    postOffice: 'मुंबई GPO (Mumbai GPO)',
    locality: 'क्रॉफर्ड मार्केट / फोर्ट (Crawford Market)',
  },
  '400705': {
    pincode: '400705',
    state: 'महाराष्ट्र (Maharashtra)',
    district: 'ठाणे / नवी मुंबई (Thane / Navi Mumbai)',
    tehsil: 'वाशी (Vashi)',
    postOffice: 'वाशी SO (Vashi)',
    locality: 'वाशी APMC थोक मंडी (Vashi APMC Mandi)',
  },

  // Delhi NCR
  '110001': {
    pincode: '110001',
    state: 'दिल्ली (Delhi)',
    district: 'मध्य दिल्ली (Central Delhi)',
    tehsil: 'कनॉट प्लेस (Connaught Place)',
    postOffice: 'नई दिल्ली HO (New Delhi GPO)',
    locality: 'कनॉट प्लेस / बंगाली मार्केट (Connaught Place)',
  },
  '110006': {
    pincode: '110006',
    state: 'दिल्ली (Delhi)',
    district: 'मध्य दिल्ली (Central Delhi)',
    tehsil: 'चांदनी चौक (Chandni Chowk)',
    postOffice: 'चांदनी चौक SO',
    locality: 'खारी बावली किराना मंडी (Khari Baoli)',
  },
  '110033': {
    pincode: '110033',
    state: 'दिल्ली (Delhi)',
    district: 'उत्तरी दिल्ली (North Delhi)',
    tehsil: 'आजादपुर (Azadpur)',
    postOffice: 'आजादपुर SO (Azadpur)',
    locality: 'आजादपुर एशिया की सबसे बड़ी फल व सब्जी मंडी',
  },

  // Bangalore / Karnataka
  '560001': {
    pincode: '560001',
    state: 'कर्नाटक (Karnataka)',
    district: 'बेंगलुरु अर्बन (Bengaluru Urban)',
    tehsil: 'बेंगलुरु उत्तर (Bengaluru North)',
    postOffice: 'बेंगलुरु GPO (Bengaluru GPO)',
    locality: 'एम.जी. रोड / शिवाजीनगर मार्केट',
  },
  '560002': {
    pincode: '560002',
    state: 'कर्नाटक (Karnataka)',
    district: 'बेंगलुरु अर्बन (Bengaluru Urban)',
    tehsil: 'बेंगलुरु दक्षिण (Bengaluru South)',
    postOffice: 'कलसीपलायम SO (Kalasipalyam)',
    locality: 'के.आर. मार्केट / कलसीपलायम मंडी (KR Market)',
  },

  // Pune
  '411001': {
    pincode: '411001',
    state: 'महाराष्ट्र (Maharashtra)',
    district: 'पुणे (Pune)',
    tehsil: 'पुणे शहर (Pune City)',
    postOffice: 'पुणे HO (Pune HO)',
    locality: 'कैंप / एम.जी. रोड मार्केट (Camp Market)',
  },
  '411037': {
    pincode: '411037',
    state: 'महाराष्ट्र (Maharashtra)',
    district: 'पुणे (Pune)',
    tehsil: 'हवेली (Haveli)',
    postOffice: 'गुलटेकडी SO (Gultekdi)',
    locality: 'गुलटेकडी मार्केट यार्ड मुख्य मंडी (Market Yard)',
  },

  // Ahmedabad / Gujarat
  '380001': {
    pincode: '380001',
    state: 'गुजरात (Gujarat)',
    district: 'अहमदाबाद (Ahmedabad)',
    tehsil: 'अहमदाबाद (Ahmedabad)',
    postOffice: 'अहमदाबाद GPO (Ahmedabad GPO)',
    locality: 'कालूपुर / रिलीफ रोड किराना बाजार (Kalupur)',
  },

  // Hyderabad
  '500001': {
    pincode: '500001',
    state: 'तेलंगाना (Telangana)',
    district: 'हैदराबाद (Hyderabad)',
    tehsil: 'हैदराबाद (Hyderabad)',
    postOffice: 'हैदराबाद GPO (Hyderabad GPO)',
    locality: 'अबिड्स / मोज़मजाही मार्केट (Abids Market)',
  },

  // Lucknow / Uttar Pradesh
  '226001': {
    pincode: '226001',
    state: 'उत्तर प्रदेश (Uttar Pradesh)',
    district: 'लखनऊ (Lucknow)',
    tehsil: 'लखनऊ (Lucknow)',
    postOffice: 'लखनऊ GPO (Lucknow GPO)',
    locality: 'हजरतगंज / अमीनाबाद बाजार (Hazratganj)',
  },

  // Indore / MP
  '452001': {
    pincode: '452001',
    state: 'मध्य प्रदेश (Madhya Pradesh)',
    district: 'इंदौर (Indore)',
    tehsil: 'इंदौर (Indore)',
    postOffice: 'इंदौर GPO (Indore GPO)',
    locality: 'राजवाड़ा / सियागंज थोक किराना मंडी (Siyaganj)',
  },
};

/**
 * Lookup Indian Postal Data by 6-digit PIN code
 */
export async function lookupPostalPincode(pincode: string): Promise<PostalData | null> {
  const cleanPin = pincode.replace(/\D/g, '').trim();
  if (cleanPin.length !== 6) {
    return null;
  }

  // 1. Instant check in local directory
  if (LOCAL_POSTAL_DIRECTORY[cleanPin]) {
    return { ...LOCAL_POSTAL_DIRECTORY[cleanPin] };
  }

  // 2. Query through local server proxy to prevent browser cross-origin failures
  try {
    const res = await fetch(`/api/postal/${cleanPin}`).catch(() => null);
    if (res && res.ok) {
      const json = await res.json().catch(() => null);
      const data = json?.data;
      if (Array.isArray(data) && data[0]?.Status === 'Success' && data[0]?.PostOffice?.length > 0) {
        const poList = data[0].PostOffice;
        const po = poList[0];
        const allPostOffices = Array.from(new Set(poList.map((p: any) => p.Name).filter(Boolean))) as string[];
        const result: PostalData = {
          pincode: cleanPin,
          state: po.State || '',
          district: po.District || '',
          tehsil: po.Taluk || po.Block || po.District || '',
          postOffice: `${po.Name} ${po.BranchType || ''}`.trim(),
          locality: po.Name || '',
          postOffices: allPostOffices,
        };
        LOCAL_POSTAL_DIRECTORY[cleanPin] = result;
        return result;
      }
    }
  } catch (_) {
    // API failed or timeout safely handled
  }

  return null;
}
