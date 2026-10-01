import { Product } from '../types/product.ts';

/**
 * Built-in fallback products for offline resilience and immediate storefront rendering.
 */
export const FALLBACK_PRODUCTS: Product[] = [
  {
    "id": "prd_sugar_m30",
    "shopId": "shp_krishna_grocers",
    "name": "Sugar (Pure Refined Crystal M-30)",
    "category": "Grains & Sweeteners",
    "subCategory": "Sugar & Jaggery",
    "description": "Clean, sparkling crystal sugar. Ideal for tea, baking, and daily household sweets.",
    "imageUrl": "https://images.unsplash.com/photo-1581441363689-1f3c3c414635?w=500&auto=format&fit=crop&q=80",
    "fractionalConfig": {
      "unitType": "WEIGHT",
      "baseUnit": "kg",
      "basePrice": 100,
      "minQuantityMultiplier": 0.1,
      "maxQuantityMultiplier": 25,
      "stepQuantityMultiplier": 0.05,
      "allowCustomFractionalInput": true,
      "predefinedOptions": [
        {
          "id": "opt_sug_250g",
          "label": "250 g",
          "multiplier": 0.25,
          "unitLabel": "grams",
          "isDefault": true
        },
        {
          "id": "opt_sug_500g",
          "label": "500 g",
          "multiplier": 0.5,
          "unitLabel": "grams"
        },
        {
          "id": "opt_sug_1kg",
          "label": "1 kg",
          "multiplier": 1,
          "unitLabel": "kg"
        },
        {
          "id": "opt_sug_2kg",
          "label": "2 kg",
          "multiplier": 2,
          "unitLabel": "kg"
        },
        {
          "id": "opt_sug_5kg",
          "label": "5 kg",
          "multiplier": 5,
          "unitLabel": "kg"
        }
      ]
    },
    "currentStockInBaseUnits": 93.5,
    "lowStockThresholdInBaseUnits": 20,
    "isAvailable": true,
    "isFeatured": true,
    "tags": [
      "staple",
      "sugar",
      "baking",
      "daily essentials"
    ],
    "createdAt": "2026-08-05T00:00:00Z",
    "updatedAt": "2026-09-11T14:33:29.545Z"
  },
  {
    "id": "prd_jaggery_gur",
    "shopId": "shp_krishna_grocers",
    "name": "Organic Kolhapuri Jaggery (शुद्ध देशी गुड़)",
    "category": "Grains & Sweeteners",
    "subCategory": "Sugar & Jaggery",
    "description": "Natural unrefined traditional chemical-free Kolhapuri Gur.",
    "imageUrl": "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500&auto=format&fit=crop&q=80",
    "fractionalConfig": {
      "unitType": "WEIGHT",
      "baseUnit": "kg",
      "basePrice": 80,
      "minQuantityMultiplier": 0.25,
      "maxQuantityMultiplier": 10,
      "stepQuantityMultiplier": 0.25,
      "allowCustomFractionalInput": true,
      "predefinedOptions": [
        {
          "id": "opt_gur_250g",
          "label": "250 g",
          "multiplier": 0.25,
          "unitLabel": "grams"
        },
        {
          "id": "opt_gur_500g",
          "label": "500 g (आधा किलो)",
          "multiplier": 0.5,
          "unitLabel": "grams",
          "isDefault": true
        },
        {
          "id": "opt_gur_1kg",
          "label": "1 kg",
          "multiplier": 1,
          "unitLabel": "kg"
        }
      ]
    },
    "currentStockInBaseUnits": 75,
    "lowStockThresholdInBaseUnits": 15,
    "isAvailable": true,
    "isFeatured": true,
    "tags": [
      "jaggery",
      "gud",
      "sweetener",
      "organic"
    ],
    "createdAt": "2026-08-05T00:00:00Z",
    "updatedAt": "2026-08-25T00:00:00Z"
  },
  {
    "id": "prd_basmati_rice",
    "shopId": "shp_krishna_grocers",
    "name": "Royal Daawat Basmati Rice (Aged 2 Years)",
    "category": "Grains & Sweeteners",
    "subCategory": "Rice",
    "description": "Long grain, aromatic aged basmati rice for biryanis and pulao.",
    "imageUrl": "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500&auto=format&fit=crop&q=80",
    "fractionalConfig": {
      "unitType": "WEIGHT",
      "baseUnit": "kg",
      "basePrice": 140,
      "minQuantityMultiplier": 0.5,
      "maxQuantityMultiplier": 20,
      "stepQuantityMultiplier": 0.5,
      "allowCustomFractionalInput": true,
      "predefinedOptions": [
        {
          "id": "opt_rice_500g",
          "label": "500 g",
          "multiplier": 0.5,
          "unitLabel": "grams"
        },
        {
          "id": "opt_rice_1kg",
          "label": "1 kg",
          "multiplier": 1,
          "unitLabel": "kg",
          "isDefault": true
        },
        {
          "id": "opt_rice_5kg",
          "label": "5 kg",
          "multiplier": 5,
          "unitLabel": "kg"
        }
      ]
    },
    "currentStockInBaseUnits": 200,
    "lowStockThresholdInBaseUnits": 25,
    "isAvailable": true,
    "isFeatured": true,
    "tags": [
      "rice",
      "basmati",
      "grains"
    ],
    "createdAt": "2026-08-05T00:00:00Z",
    "updatedAt": "2026-08-25T00:00:00Z"
  },
  {
    "id": "prd_toor_dal",
    "shopId": "shp_krishna_grocers",
    "name": "Unpolished Desi Toor / Arhar Dal",
    "category": "Pulses & Lentils",
    "subCategory": "Dals",
    "description": "Chemical-free unpolished protein rich yellow pigeon pea dal.",
    "imageUrl": "https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=500&auto=format&fit=crop&q=80",
    "fractionalConfig": {
      "unitType": "WEIGHT",
      "baseUnit": "kg",
      "basePrice": 160,
      "minQuantityMultiplier": 0.25,
      "maxQuantityMultiplier": 10,
      "stepQuantityMultiplier": 0.25,
      "allowCustomFractionalInput": true,
      "predefinedOptions": [
        {
          "id": "opt_dal_250g",
          "label": "250 g",
          "multiplier": 0.25,
          "unitLabel": "grams"
        },
        {
          "id": "opt_dal_500g",
          "label": "500 g",
          "multiplier": 0.5,
          "unitLabel": "grams",
          "isDefault": true
        },
        {
          "id": "opt_dal_1kg",
          "label": "1 kg",
          "multiplier": 1,
          "unitLabel": "kg"
        }
      ]
    },
    "currentStockInBaseUnits": 80,
    "lowStockThresholdInBaseUnits": 15,
    "isAvailable": true,
    "tags": [
      "dal",
      "protein",
      "staples"
    ],
    "createdAt": "2026-08-05T00:00:00Z",
    "updatedAt": "2026-08-25T00:00:00Z"
  },
  {
    "id": "prd_wheat_flour",
    "shopId": "shp_krishna_grocers",
    "name": "Sharbati Wheat Flour (Atta)",
    "category": "Grains & Sweeteners",
    "subCategory": "Flour",
    "description": "100% MP Sharbati whole wheat stone-ground chakki fresh atta.",
    "imageUrl": "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&auto=format&fit=crop&q=80",
    "fractionalConfig": {
      "unitType": "WEIGHT",
      "baseUnit": "kg",
      "basePrice": 45,
      "minQuantityMultiplier": 1,
      "maxQuantityMultiplier": 25,
      "stepQuantityMultiplier": 1,
      "allowCustomFractionalInput": true,
      "predefinedOptions": [
        {
          "id": "opt_atta_1kg",
          "label": "1 kg",
          "multiplier": 1,
          "unitLabel": "kg",
          "isDefault": true
        },
        {
          "id": "opt_atta_5kg",
          "label": "5 kg",
          "multiplier": 5,
          "unitLabel": "kg"
        },
        {
          "id": "opt_atta_10kg",
          "label": "10 kg",
          "multiplier": 10,
          "unitLabel": "kg"
        }
      ]
    },
    "currentStockInBaseUnits": 300,
    "lowStockThresholdInBaseUnits": 50,
    "isAvailable": true,
    "isFeatured": true,
    "tags": [
      "atta",
      "flour",
      "staple"
    ],
    "createdAt": "2026-08-05T00:00:00Z",
    "updatedAt": "2026-08-25T00:00:00Z"
  },
  {
    "id": "prd_mustard_oil",
    "shopId": "shp_krishna_grocers",
    "name": "Fortune Kachi Ghani Mustard Oil",
    "category": "Oils & Ghee",
    "subCategory": "Cooking Oil",
    "description": "Cold-pressed traditional mustard oil with strong pungency and aroma.",
    "imageUrl": "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=500&auto=format&fit=crop&q=80",
    "fractionalConfig": {
      "unitType": "VOLUME",
      "baseUnit": "L",
      "basePrice": 130,
      "minQuantityMultiplier": 0.5,
      "maxQuantityMultiplier": 15,
      "stepQuantityMultiplier": 0.5,
      "allowCustomFractionalInput": true,
      "predefinedOptions": [
        {
          "id": "opt_oil_500ml",
          "label": "500 ml",
          "multiplier": 0.5,
          "unitLabel": "ml"
        },
        {
          "id": "opt_oil_1l",
          "label": "1 Liter",
          "multiplier": 1,
          "unitLabel": "L",
          "isDefault": true
        },
        {
          "id": "opt_oil_5l",
          "label": "5 Liters Jar",
          "multiplier": 5,
          "unitLabel": "L"
        }
      ]
    },
    "currentStockInBaseUnits": 120,
    "lowStockThresholdInBaseUnits": 20,
    "isAvailable": true,
    "isFeatured": true,
    "tags": [
      "oil",
      "mustard",
      "cooking"
    ],
    "createdAt": "2026-08-05T00:00:00Z",
    "updatedAt": "2026-08-25T00:00:00Z"
  },
  {
    "id": "prd_tata_salt",
    "shopId": "shp_krishna_grocers",
    "name": "Tata Salt Vacuum Evaporated",
    "category": "Spices & Seasoning",
    "subCategory": "Salt",
    "description": "Desh Ka Namak. Pure vacuum evaporated iodized table salt.",
    "imageUrl": "https://images.unsplash.com/photo-1626197031507-c17099753214?w=500&auto=format&fit=crop&q=80",
    "fractionalConfig": {
      "unitType": "WEIGHT",
      "baseUnit": "kg",
      "basePrice": 25,
      "minQuantityMultiplier": 1,
      "maxQuantityMultiplier": 10,
      "stepQuantityMultiplier": 1,
      "allowCustomFractionalInput": false,
      "predefinedOptions": [
        {
          "id": "opt_salt_1kg",
          "label": "1 kg Pack",
          "multiplier": 1,
          "unitLabel": "kg",
          "isDefault": true
        }
      ]
    },
    "currentStockInBaseUnits": 150,
    "lowStockThresholdInBaseUnits": 30,
    "isAvailable": true,
    "tags": [
      "salt",
      "iodized",
      "staple"
    ],
    "createdAt": "2026-08-05T00:00:00Z",
    "updatedAt": "2026-08-25T00:00:00Z"
  },
  {
    "id": "prd_parleg_biscuits",
    "shopId": "shp_krishna_grocers",
    "name": "Parle-G Gold Biscuits",
    "category": "Packaged Foods & Snacks",
    "subCategory": "Biscuits",
    "description": "Crisp glucose biscuits, perfect companion for morning chai.",
    "imageUrl": "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=500&auto=format&fit=crop&q=80",
    "fractionalConfig": {
      "unitType": "PIECE",
      "baseUnit": "pack",
      "basePrice": 20,
      "minQuantityMultiplier": 1,
      "maxQuantityMultiplier": 20,
      "stepQuantityMultiplier": 1,
      "allowCustomFractionalInput": false,
      "predefinedOptions": [
        {
          "id": "opt_pg_1pk",
          "label": "1 Pack (200g)",
          "multiplier": 1,
          "unitLabel": "pack",
          "isDefault": true
        },
        {
          "id": "opt_pg_3pk",
          "label": "3 Packs",
          "multiplier": 3,
          "unitLabel": "pack"
        }
      ]
    },
    "currentStockInBaseUnits": 100,
    "lowStockThresholdInBaseUnits": 15,
    "isAvailable": true,
    "tags": [
      "biscuits",
      "snacks",
      "parleg"
    ],
    "createdAt": "2026-08-05T00:00:00Z",
    "updatedAt": "2026-08-25T00:00:00Z"
  },
  {
    "id": "prd_dettol_soap",
    "shopId": "shp_krishna_grocers",
    "name": "Dettol Original Bathing Soap",
    "category": "Personal Care & Hygiene",
    "subCategory": "Soaps",
    "description": "Antibacterial trusted germ protection bathing bar (125g).",
    "imageUrl": "https://images.unsplash.com/photo-1600857544200-b2f666a9a2ec?w=500&auto=format&fit=crop&q=80",
    "fractionalConfig": {
      "unitType": "PIECE",
      "baseUnit": "piece",
      "basePrice": 35,
      "minQuantityMultiplier": 1,
      "maxQuantityMultiplier": 12,
      "stepQuantityMultiplier": 1,
      "allowCustomFractionalInput": false,
      "predefinedOptions": [
        {
          "id": "opt_det_1pc",
          "label": "1 Bar (125g)",
          "multiplier": 1,
          "unitLabel": "piece",
          "isDefault": true
        },
        {
          "id": "opt_det_3pc",
          "label": "Pack of 3",
          "multiplier": 3,
          "unitLabel": "piece"
        }
      ]
    },
    "currentStockInBaseUnits": 90,
    "lowStockThresholdInBaseUnits": 10,
    "isAvailable": true,
    "tags": [
      "soap",
      "hygiene",
      "dettol"
    ],
    "createdAt": "2026-08-05T00:00:00Z",
    "updatedAt": "2026-08-25T00:00:00Z"
  },
  {
    "id": "prd_santoor_sabun_10rs",
    "shopId": "shp_krishna_grocers",
    "name": "Santoor Sabun ₹10",
    "nameHindi": "संतूर साबुन ₹10",
    "category": "Personal Care & Hygiene",
    "subCategory": "Soaps",
    "description": "Santoor Sandal & Turmeric Bathing Soap ₹10 Pack",
    "imageUrl": "https://images.unsplash.com/photo-1608248597359-00994f068c2d?w=500&auto=format&fit=crop&q=60",
    "fractionalConfig": {
      "unitType": "PIECE",
      "baseUnit": "packet",
      "basePrice": 10.0,
      "minQuantityMultiplier": 1.0,
      "maxQuantityMultiplier": 50.0,
      "stepQuantityMultiplier": 1.0,
      "allowCustomFractionalInput": false,
      "predefinedOptions": [
        { "id": "opt_santoor_1pk", "label": "1 Packet (₹10)", "multiplier": 1.0, "unitLabel": "packet", "isDefault": true },
        { "id": "opt_santoor_10pk", "label": "10 Packets (₹100)", "multiplier": 10.0, "unitLabel": "packet" }
      ]
    },
    "currentStockInBaseUnits": 150.0,
    "lowStockThresholdInBaseUnits": 20.0,
    "isAvailable": true,
    "tags": ["soap", "santoor", "sabun", "संतूर", "साबुन", "10 वाला", "₹10"],
    "createdAt": "2026-08-05T00:00:00Z",
    "updatedAt": "2026-08-25T00:00:00Z"
  },
  {
    "id": "prd_fresh_potato_aloo",
    "shopId": "shp_krishna_grocers",
    "name": "Aloo",
    "nameHindi": "आलू",
    "category": "Fresh Vegetables & Staples",
    "subCategory": "Vegetables",
    "description": "Fresh local farm potatoes (Aloo)",
    "imageUrl": "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=500&auto=format&fit=crop&q=80",
    "fractionalConfig": {
      "unitType": "WEIGHT",
      "baseUnit": "kg",
      "basePrice": 30.0,
      "minQuantityMultiplier": 0.25,
      "maxQuantityMultiplier": 25.0,
      "stepQuantityMultiplier": 0.25,
      "allowCustomFractionalInput": true,
      "predefinedOptions": [
        { "id": "opt_aloo_1kg", "label": "1 kg", "multiplier": 1.0, "unitLabel": "kg", "isDefault": true },
        { "id": "opt_aloo_2kg", "label": "2 kg", "multiplier": 2.0, "unitLabel": "kg" }
      ]
    },
    "currentStockInBaseUnits": 200.0,
    "lowStockThresholdInBaseUnits": 25.0,
    "isAvailable": true,
    "tags": ["aloo", "potato", "आलू", "बटाटा"],
    "createdAt": "2026-08-05T00:00:00Z",
    "updatedAt": "2026-08-25T00:00:00Z"
  },
  {
    "id": "prd_fresh_onion_pyaz",
    "shopId": "shp_krishna_grocers",
    "name": "Pyaz",
    "nameHindi": "प्याज",
    "category": "Fresh Vegetables & Staples",
    "subCategory": "Vegetables",
    "description": "Fresh Nashik red onions (Pyaz)",
    "imageUrl": "https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=500&auto=format&fit=crop&q=80",
    "fractionalConfig": {
      "unitType": "WEIGHT",
      "baseUnit": "kg",
      "basePrice": 35.0,
      "minQuantityMultiplier": 0.25,
      "maxQuantityMultiplier": 25.0,
      "stepQuantityMultiplier": 0.25,
      "allowCustomFractionalInput": true,
      "predefinedOptions": [
        { "id": "opt_pyaz_1kg", "label": "1 kg", "multiplier": 1.0, "unitLabel": "kg", "isDefault": true },
        { "id": "opt_pyaz_2kg", "label": "2 kg", "multiplier": 2.0, "unitLabel": "kg" }
      ]
    },
    "currentStockInBaseUnits": 180.0,
    "lowStockThresholdInBaseUnits": 20.0,
    "isAvailable": true,
    "tags": ["pyaz", "onion", "प्याज", "कांदा"],
    "createdAt": "2026-08-05T00:00:00Z",
    "updatedAt": "2026-08-25T00:00:00Z"
  },
  {
    "id": "prd_fresh_banana_kela",
    "shopId": "shp_krishna_grocers",
    "name": "Kela",
    "nameHindi": "केला",
    "category": "Fresh Produce",
    "subCategory": "Fruits",
    "description": "Fresh ripe bananas (Kela)",
    "imageUrl": "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=500&auto=format&fit=crop&q=80",
    "fractionalConfig": {
      "unitType": "PIECE",
      "baseUnit": "dozen",
      "basePrice": 60.0,
      "minQuantityMultiplier": 0.5,
      "maxQuantityMultiplier": 5.0,
      "stepQuantityMultiplier": 0.5,
      "allowCustomFractionalInput": true,
      "predefinedOptions": [
        { "id": "opt_kela_half_dozen", "label": "½ Dozen", "multiplier": 0.5, "unitLabel": "dozen" },
        { "id": "opt_kela_1_dozen", "label": "1 Dozen", "multiplier": 1.0, "unitLabel": "dozen", "isDefault": true }
      ]
    },
    "currentStockInBaseUnits": 40.0,
    "lowStockThresholdInBaseUnits": 5.0,
    "isAvailable": true,
    "tags": ["kela", "banana", "केला", "दर्जन"],
    "createdAt": "2026-08-05T00:00:00Z",
    "updatedAt": "2026-08-25T00:00:00Z"
  },
  {
    "id": "prd_veg_chowmein",
    "shopId": "shp_krishna_grocers",
    "name": "Chowmein",
    "nameHindi": "चाउमीन",
    "category": "Cooked & Ready Food",
    "subCategory": "Fast Food",
    "description": "Fresh hot vegetable hakka noodles chowmein",
    "imageUrl": "https://images.unsplash.com/photo-1585032226651-759b368d7246?w=500&auto=format&fit=crop&q=80",
    "fractionalConfig": {
      "unitType": "PIECE",
      "baseUnit": "plate",
      "basePrice": 80.0,
      "minQuantityMultiplier": 0.5,
      "maxQuantityMultiplier": 10.0,
      "stepQuantityMultiplier": 0.5,
      "allowCustomFractionalInput": false,
      "predefinedOptions": [
        { "id": "opt_chow_half", "label": "½ Plate (Half)", "multiplier": 0.5, "unitLabel": "plate" },
        { "id": "opt_chow_full", "label": "1 Plate (Full)", "multiplier": 1.0, "unitLabel": "plate", "isDefault": true }
      ]
    },
    "currentStockInBaseUnits": 50.0,
    "lowStockThresholdInBaseUnits": 5.0,
    "isAvailable": true,
    "tags": ["chowmein", "noodles", "चाउमीन", "चाउमिन", "fast food"],
    "createdAt": "2026-08-05T00:00:00Z",
    "updatedAt": "2026-08-25T00:00:00Z"
  },
  {
    "id": "prd_veg_manchurian",
    "shopId": "shp_krishna_grocers",
    "name": "Manchurian",
    "nameHindi": "मंचूरियन",
    "category": "Cooked & Ready Food",
    "subCategory": "Fast Food",
    "description": "Crispy fried veg manchurian dumplings",
    "imageUrl": "https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?w=500&auto=format&fit=crop&q=80",
    "fractionalConfig": {
      "unitType": "PIECE",
      "baseUnit": "piece",
      "basePrice": 8.0,
      "minQuantityMultiplier": 1.0,
      "maxQuantityMultiplier": 50.0,
      "stepQuantityMultiplier": 1.0,
      "allowCustomFractionalInput": false,
      "predefinedOptions": [
        { "id": "opt_manch_10pc", "label": "10 Pieces", "multiplier": 10.0, "unitLabel": "piece", "isDefault": true }
      ]
    },
    "currentStockInBaseUnits": 100.0,
    "lowStockThresholdInBaseUnits": 10.0,
    "isAvailable": true,
    "tags": ["manchurian", "मंचूरियन", "fast food", "chinese"],
    "createdAt": "2026-08-05T00:00:00Z",
    "updatedAt": "2026-08-25T00:00:00Z"
  },
  {
    "id": "prd_fresh_green_coriander",
    "shopId": "shp_krishna_grocers",
    "name": "हरा धनिया",
    "nameHindi": "हरा धनिया",
    "category": "Fresh Vegetables & Staples",
    "subCategory": "Herbs & Greens",
    "description": "Fresh farm green coriander bunch (हरा धनिया)",
    "imageUrl": "https://images.unsplash.com/photo-1588879462559-0010c2c1a851?w=500&auto=format&fit=crop&q=80",
    "fractionalConfig": {
      "unitType": "PIECE",
      "baseUnit": "bunch",
      "basePrice": 10.0,
      "minQuantityMultiplier": 1.0,
      "maxQuantityMultiplier": 10.0,
      "stepQuantityMultiplier": 1.0,
      "allowCustomFractionalInput": false,
      "predefinedOptions": [
        { "id": "opt_dhaniya_1bunch", "label": "1 Bunch (₹10)", "multiplier": 1.0, "unitLabel": "bunch", "isDefault": true }
      ]
    },
    "currentStockInBaseUnits": 50.0,
    "lowStockThresholdInBaseUnits": 5.0,
    "isAvailable": true,
    "tags": ["coriander", "dhaniya", "हरा धनिया", "हरी धनिया", "greens"],
    "createdAt": "2026-08-05T00:00:00Z",
    "updatedAt": "2026-08-25T00:00:00Z"
  },
  {
    "id": "prd_aloo_tikiya",
    "shopId": "shp_krishna_grocers",
    "name": "Tikiya",
    "nameHindi": "टिकिया",
    "category": "Cooked & Ready Food",
    "subCategory": "Fast Food",
    "description": "Crispy spiced golden potato cutlets (Aloo Tikiya)",
    "imageUrl": "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500&auto=format&fit=crop&q=80",
    "fractionalConfig": {
      "unitType": "PIECE",
      "baseUnit": "piece",
      "basePrice": 15.0,
      "minQuantityMultiplier": 1.0,
      "maxQuantityMultiplier": 20.0,
      "stepQuantityMultiplier": 1.0,
      "allowCustomFractionalInput": false,
      "predefinedOptions": [
        { "id": "opt_tikiya_2pc", "label": "2 Pieces (₹30)", "multiplier": 2.0, "unitLabel": "piece", "isDefault": true }
      ]
    },
    "currentStockInBaseUnits": 80.0,
    "lowStockThresholdInBaseUnits": 10.0,
    "isAvailable": true,
    "tags": ["tikiya", "tikki", "टिकिया", "टिक्की", "aloo tikiya"],
    "createdAt": "2026-08-05T00:00:00Z",
    "updatedAt": "2026-08-25T00:00:00Z"
  },
  {
    "id": "prd_desi_chhola",
    "shopId": "shp_krishna_grocers",
    "name": "Chhola",
    "nameHindi": "छोला",
    "category": "Cooked & Ready Food",
    "subCategory": "Fast Food",
    "description": "Hot spiced North Indian chickpea curry plate",
    "imageUrl": "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=500&auto=format&fit=crop&q=80",
    "fractionalConfig": {
      "unitType": "PIECE",
      "baseUnit": "plate",
      "basePrice": 40.0,
      "minQuantityMultiplier": 1.0,
      "maxQuantityMultiplier": 10.0,
      "stepQuantityMultiplier": 1.0,
      "allowCustomFractionalInput": false,
      "predefinedOptions": [
        { "id": "opt_chhola_1plate", "label": "1 Plate (₹40)", "multiplier": 1.0, "unitLabel": "plate", "isDefault": true },
        { "id": "opt_chhola_2plate", "label": "2 Plates (₹80)", "multiplier": 2.0, "unitLabel": "plate" }
      ]
    },
    "currentStockInBaseUnits": 40.0,
    "lowStockThresholdInBaseUnits": 5.0,
    "isAvailable": true,
    "tags": ["chhola", "chole", "छोला", "छोले", "plate"],
    "createdAt": "2026-08-05T00:00:00Z",
    "updatedAt": "2026-08-25T00:00:00Z"
  },
  {
    "id": "prd_tata_tea",
    "shopId": "shp_krishna_grocers",
    "name": "Tata Tea Gold Rich Taste",
    "category": "Beverages",
    "subCategory": "Tea",
    "description": "Exquisite aroma and strength with gently rolled aromatic long leaves.",
    "imageUrl": "https://images.unsplash.com/photo-1597481499750-3e6b22637e12?w=500&auto=format&fit=crop&q=80",
    "fractionalConfig": {
      "unitType": "WEIGHT",
      "baseUnit": "kg",
      "basePrice": 360,
      "minQuantityMultiplier": 0.25,
      "maxQuantityMultiplier": 5,
      "stepQuantityMultiplier": 0.25,
      "allowCustomFractionalInput": true,
      "predefinedOptions": [
        {
          "id": "opt_tea_250g",
          "label": "250 g",
          "multiplier": 0.25,
          "unitLabel": "grams"
        },
        {
          "id": "opt_tea_500g",
          "label": "500 g",
          "multiplier": 0.5,
          "unitLabel": "grams",
          "isDefault": true
        },
        {
          "id": "opt_tea_1kg",
          "label": "1 kg",
          "multiplier": 1,
          "unitLabel": "kg"
        }
      ]
    },
    "currentStockInBaseUnits": 60,
    "lowStockThresholdInBaseUnits": 10,
    "isAvailable": true,
    "isFeatured": true,
    "tags": [
      "tea",
      "chai",
      "beverages"
    ],
    "createdAt": "2026-08-05T00:00:00Z",
    "updatedAt": "2026-08-25T00:00:00Z"
  },
  {
    "id": "prd_garam_masala",
    "shopId": "shp_krishna_grocers",
    "name": "Everest Garam Masala Powder",
    "category": "Spices & Seasoning",
    "subCategory": "Spices",
    "description": "A rich blend of whole spices providing authentic curry aroma and flavor.",
    "imageUrl": "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=500&auto=format&fit=crop&q=80",
    "fractionalConfig": {
      "unitType": "WEIGHT",
      "baseUnit": "kg",
      "basePrice": 175,
      "minQuantityMultiplier": 0.1,
      "maxQuantityMultiplier": 2,
      "stepQuantityMultiplier": 0.1,
      "allowCustomFractionalInput": true,
      "predefinedOptions": [
        {
          "id": "opt_gm_100g",
          "label": "100 g",
          "multiplier": 0.1,
          "unitLabel": "grams"
        },
        {
          "id": "opt_gm_200g",
          "label": "200 g",
          "multiplier": 0.2,
          "unitLabel": "grams",
          "isDefault": true
        },
        {
          "id": "opt_gm_500g",
          "label": "500 g",
          "multiplier": 0.5,
          "unitLabel": "grams"
        }
      ]
    },
    "currentStockInBaseUnits": 40,
    "lowStockThresholdInBaseUnits": 5,
    "isAvailable": true,
    "tags": [
      "spices",
      "masala",
      "curry"
    ],
    "createdAt": "2026-08-05T00:00:00Z",
    "updatedAt": "2026-08-25T00:00:00Z"
  },
  {
    "id": "prd_amul_milk",
    "shopId": "shp_krishna_grocers",
    "name": "Amul Taaza Homogenised Milk",
    "category": "Dairy & Sweets",
    "subCategory": "Milk",
    "description": "Fresh toned pasteurized cow & buffalo milk (1 Liter pouch).",
    "imageUrl": "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=500&auto=format&fit=crop&q=80",
    "fractionalConfig": {
      "unitType": "VOLUME",
      "baseUnit": "L",
      "basePrice": 60,
      "minQuantityMultiplier": 1,
      "maxQuantityMultiplier": 10,
      "stepQuantityMultiplier": 1,
      "allowCustomFractionalInput": false,
      "predefinedOptions": [
        {
          "id": "opt_amul_1l",
          "label": "1 Liter Pouch",
          "multiplier": 1,
          "unitLabel": "L",
          "isDefault": true
        },
        {
          "id": "opt_amul_2l",
          "label": "2 Liters",
          "multiplier": 2,
          "unitLabel": "L"
        }
      ]
    },
    "currentStockInBaseUnits": 75,
    "lowStockThresholdInBaseUnits": 15,
    "isAvailable": true,
    "tags": [
      "milk",
      "dairy",
      "fresh"
    ],
    "createdAt": "2026-08-05T00:00:00Z",
    "updatedAt": "2026-08-25T00:00:00Z"
  },
  {
    "id": "prd_nirma_powder",
    "shopId": "shp_krishna_grocers",
    "name": "Nirma Washing Powder (छोटा पैक)",
    "category": "Cleaning & Household",
    "subCategory": "Detergent",
    "description": "Iconic Washing Powder Nirma for spotless clothes washing.",
    "imageUrl": "https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=500&auto=format&fit=crop&q=80",
    "fractionalConfig": {
      "unitType": "PIECE",
      "baseUnit": "pack",
      "basePrice": 20,
      "minQuantityMultiplier": 1,
      "maxQuantityMultiplier": 10,
      "stepQuantityMultiplier": 1,
      "allowCustomFractionalInput": false,
      "predefinedOptions": [
        {
          "id": "opt_nirma_small",
          "label": "छोटा वाला पैकेट (150g)",
          "multiplier": 1,
          "unitLabel": "pack",
          "isDefault": true
        },
        {
          "id": "opt_nirma_1kg",
          "label": "1 kg Pack",
          "multiplier": 3.5,
          "unitLabel": "pack"
        }
      ]
    },
    "currentStockInBaseUnits": 50,
    "lowStockThresholdInBaseUnits": 10,
    "isAvailable": true,
    "tags": [
      "detergent",
      "nirma",
      "cleaning",
      "laundry"
    ],
    "createdAt": "2026-08-05T00:00:00Z",
    "updatedAt": "2026-08-25T00:00:00Z"
  },
  {
    "id": "prd_rajesh_masala_5rs",
    "shopId": "shp_krishna_grocers",
    "name": "Rajesh Meat / Sabzi Masala (₹5 Pack)",
    "category": "Spices & Seasoning",
    "subCategory": "Spices",
    "description": "Popular ₹5 sachet of authentic aromatic Rajesh Masala.",
    "imageUrl": "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=500&auto=format&fit=crop&q=80",
    "fractionalConfig": {
      "unitType": "PIECE",
      "baseUnit": "packet",
      "basePrice": 5,
      "minQuantityMultiplier": 1,
      "maxQuantityMultiplier": 50,
      "stepQuantityMultiplier": 1,
      "allowCustomFractionalInput": false,
      "predefinedOptions": [
        {
          "id": "opt_rajesh_5rs",
          "label": "1 Sachet (₹5)",
          "multiplier": 1,
          "unitLabel": "packet",
          "isDefault": true
        },
        {
          "id": "opt_rajesh_2pkt",
          "label": "2 Sachets (₹10)",
          "multiplier": 2,
          "unitLabel": "packet"
        }
      ]
    },
    "currentStockInBaseUnits": 200,
    "lowStockThresholdInBaseUnits": 20,
    "isAvailable": true,
    "tags": [
      "spices",
      "rajesh",
      "masala",
      "curry"
    ],
    "createdAt": "2026-08-05T00:00:00Z",
    "updatedAt": "2026-08-25T00:00:00Z"
  },
  {
    "id": "prd_clinic_plus_shampoo",
    "shopId": "shp_krishna_grocers",
    "name": "Clinic Plus Strong & Long Shampoo (क्लिनिक प्लस शैंपू)",
    "category": "Personal Care & Hygiene",
    "subCategory": "Hair Care",
    "description": "Trusted hair nourishing milk protein formula shampoo.",
    "imageUrl": "https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=500&auto=format&fit=crop&q=80",
    "fractionalConfig": {
      "unitType": "PIECE",
      "baseUnit": "packet",
      "basePrice": 20,
      "minQuantityMultiplier": 1,
      "maxQuantityMultiplier": 20,
      "stepQuantityMultiplier": 1,
      "allowCustomFractionalInput": false,
      "predefinedOptions": [
        {
          "id": "opt_cp_1pk",
          "label": "1 Packet",
          "multiplier": 1,
          "unitLabel": "packet",
          "isDefault": true
        },
        {
          "id": "opt_cp_10pk",
          "label": "10 Packets",
          "multiplier": 10,
          "unitLabel": "packet"
        }
      ]
    },
    "currentStockInBaseUnits": 120,
    "lowStockThresholdInBaseUnits": 20,
    "isAvailable": true,
    "tags": [
      "shampoo",
      "hair",
      "clinic plus",
      "क्लिनिक प्लस",
      "शैंपू"
    ],
    "createdAt": "2026-08-05T00:00:00Z",
    "updatedAt": "2026-08-25T00:00:00Z"
  },
  {
    "id": "prd_farm_tomatoes",
    "shopId": "shp_green_harvest",
    "name": "Farm Fresh Ripe Red Tomatoes",
    "category": "Fresh Vegetables & Fruits",
    "subCategory": "Vegetables",
    "description": "Juicy, naturally ripened local farm tomatoes.",
    "imageUrl": "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=500&auto=format&fit=crop&q=80",
    "fractionalConfig": {
      "unitType": "WEIGHT",
      "baseUnit": "kg",
      "basePrice": 40,
      "minQuantityMultiplier": 0.25,
      "maxQuantityMultiplier": 10,
      "stepQuantityMultiplier": 0.25,
      "allowCustomFractionalInput": true,
      "predefinedOptions": [
        {
          "id": "opt_tom_250g",
          "label": "250 g",
          "multiplier": 0.25,
          "unitLabel": "grams"
        },
        {
          "id": "opt_tom_500g",
          "label": "500 g",
          "multiplier": 0.5,
          "unitLabel": "grams"
        },
        {
          "id": "opt_tom_1kg",
          "label": "1 kg",
          "multiplier": 1,
          "unitLabel": "kg",
          "isDefault": true
        },
        {
          "id": "opt_tom_2kg",
          "label": "2 kg",
          "multiplier": 2,
          "unitLabel": "kg"
        }
      ]
    },
    "currentStockInBaseUnits": 65,
    "lowStockThresholdInBaseUnits": 10,
    "isAvailable": true,
    "isFeatured": true,
    "tags": [
      "vegetable",
      "tomato",
      "fresh"
    ],
    "createdAt": "2026-08-06T00:00:00Z",
    "updatedAt": "2026-08-26T00:00:00Z"
  },
  {
    "id": "prd_fresh_coriander",
    "shopId": "shp_green_harvest",
    "name": "Fresh Green Coriander (Kothmir Bunch)",
    "category": "Fresh Vegetables & Fruits",
    "subCategory": "Herbs & Greens",
    "description": "Crisp, fragrant farm-picked coriander leaves.",
    "imageUrl": "https://images.unsplash.com/photo-1588879462559-0010c2c1a851?w=500&auto=format&fit=crop&q=80",
    "fractionalConfig": {
      "unitType": "PIECE",
      "baseUnit": "bunch",
      "basePrice": 15,
      "minQuantityMultiplier": 1,
      "maxQuantityMultiplier": 10,
      "stepQuantityMultiplier": 1,
      "allowCustomFractionalInput": false,
      "predefinedOptions": [
        {
          "id": "opt_cor_1bunch",
          "label": "1 Bunch",
          "multiplier": 1,
          "unitLabel": "bunch",
          "isDefault": true
        },
        {
          "id": "opt_cor_2bunch",
          "label": "2 Bunches",
          "multiplier": 2,
          "unitLabel": "bunch"
        },
        {
          "id": "opt_cor_5bunch",
          "label": "5 Bunches",
          "multiplier": 5,
          "unitLabel": "bunch"
        }
      ]
    },
    "currentStockInBaseUnits": 40,
    "lowStockThresholdInBaseUnits": 5,
    "isAvailable": true,
    "tags": [
      "greens",
      "herbs",
      "fresh"
    ],
    "createdAt": "2026-08-06T00:00:00Z",
    "updatedAt": "2026-08-26T00:00:00Z"
  },
  {
    "id": "prd_buffalo_milk",
    "shopId": "shp_city_dairy",
    "name": "Fresh Full Cream Buffalo Milk (6.5% Fat)",
    "category": "Dairy & Sweets",
    "subCategory": "Milk",
    "description": "Pasteurized, thick, fresh morning milk delivered chilled.",
    "imageUrl": "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=500&auto=format&fit=crop&q=80",
    "fractionalConfig": {
      "unitType": "VOLUME",
      "baseUnit": "L",
      "basePrice": 70,
      "minQuantityMultiplier": 0.5,
      "maxQuantityMultiplier": 10,
      "stepQuantityMultiplier": 0.5,
      "allowCustomFractionalInput": true,
      "predefinedOptions": [
        {
          "id": "opt_milk_500ml",
          "label": "500 ml",
          "multiplier": 0.5,
          "unitLabel": "ml",
          "isDefault": true
        },
        {
          "id": "opt_milk_1l",
          "label": "1 Liter",
          "multiplier": 1,
          "unitLabel": "L"
        },
        {
          "id": "opt_milk_2l",
          "label": "2 Liters",
          "multiplier": 2,
          "unitLabel": "L"
        }
      ]
    },
    "currentStockInBaseUnits": 90,
    "lowStockThresholdInBaseUnits": 15,
    "isAvailable": true,
    "isFeatured": true,
    "tags": [
      "milk",
      "dairy",
      "fresh",
      "breakfast"
    ],
    "createdAt": "2026-08-07T00:00:00Z",
    "updatedAt": "2026-08-27T00:00:00Z"
  },
  {
    "id": "prd_malai_paneer",
    "shopId": "shp_city_dairy",
    "name": "Soft Fresh Malai Paneer (Cottage Cheese)",
    "category": "Dairy & Sweets",
    "subCategory": "Paneer",
    "description": "Melt-in-the-mouth creamy paneer made freshly twice daily.",
    "imageUrl": "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=500&auto=format&fit=crop&q=80",
    "fractionalConfig": {
      "unitType": "WEIGHT",
      "baseUnit": "kg",
      "basePrice": 420,
      "minQuantityMultiplier": 0.2,
      "maxQuantityMultiplier": 5,
      "stepQuantityMultiplier": 0.1,
      "allowCustomFractionalInput": true,
      "predefinedOptions": [
        {
          "id": "opt_pan_200g",
          "label": "200 g",
          "multiplier": 0.2,
          "unitLabel": "grams",
          "isDefault": true
        },
        {
          "id": "opt_pan_250g",
          "label": "250 g",
          "multiplier": 0.25,
          "unitLabel": "grams"
        },
        {
          "id": "opt_pan_500g",
          "label": "500 g",
          "multiplier": 0.5,
          "unitLabel": "grams"
        },
        {
          "id": "opt_pan_1kg",
          "label": "1 kg",
          "multiplier": 1,
          "unitLabel": "kg"
        }
      ]
    },
    "currentStockInBaseUnits": 25,
    "lowStockThresholdInBaseUnits": 4,
    "isAvailable": true,
    "isFeatured": true,
    "tags": [
      "paneer",
      "dairy",
      "protein"
    ],
    "createdAt": "2026-08-07T00:00:00Z",
    "updatedAt": "2026-08-27T00:00:00Z"
  },
  {
    "id": "prd_ladi_pav",
    "shopId": "shp_golden_bakery",
    "name": "Fresh Baked Mumbai Ladi Pav (Pack of 6)",
    "nameHindi": "ताज़ा लादी पाव",
    "category": "Bakery",
    "subCategory": "Breads & Buns",
    "description": "Soft, airy, golden-brown freshly baked Mumbai ladi pav.",
    "imageUrl": "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&auto=format&fit=crop&q=80",
    "fractionalConfig": {
      "unitType": "PIECE",
      "baseUnit": "pack",
      "basePrice": 30,
      "minQuantityMultiplier": 1,
      "maxQuantityMultiplier": 20,
      "stepQuantityMultiplier": 1,
      "allowCustomFractionalInput": false,
      "predefinedOptions": [
        {
          "id": "opt_pav_1pack",
          "label": "1 Pack (6 Pav)",
          "multiplier": 1,
          "unitLabel": "pack",
          "isDefault": true
        },
        {
          "id": "opt_pav_2pack",
          "label": "2 Packs (12 Pav)",
          "multiplier": 2,
          "unitLabel": "pack"
        },
        {
          "id": "opt_pav_4pack",
          "label": "4 Packs (24 Pav)",
          "multiplier": 4,
          "unitLabel": "pack"
        }
      ]
    },
    "currentStockInBaseUnits": 80,
    "lowStockThresholdInBaseUnits": 15,
    "isAvailable": true,
    "isFeatured": true,
    "tags": [
      "pav",
      "bread",
      "breakfast",
      "bakery"
    ],
    "createdAt": "2026-08-08T00:00:00Z",
    "updatedAt": "2026-08-26T00:00:00Z"
  },
  {
    "id": "prd_sourdough_bread",
    "shopId": "shp_golden_bakery",
    "name": "Whole Wheat Country Sourdough Loaf (400g)",
    "nameHindi": "होल व्हीट सावरडो ब्रेड",
    "category": "Bakery",
    "subCategory": "Artisan Breads",
    "description": "Naturally fermented artisanal sourdough bread with crisp crust.",
    "imageUrl": "https://images.unsplash.com/photo-1589367920969-ab8e050bbb04?w=500&auto=format&fit=crop&q=80",
    "fractionalConfig": {
      "unitType": "PIECE",
      "baseUnit": "loaf",
      "basePrice": 120,
      "minQuantityMultiplier": 1,
      "maxQuantityMultiplier": 10,
      "stepQuantityMultiplier": 1,
      "allowCustomFractionalInput": false,
      "predefinedOptions": [
        {
          "id": "opt_sourdough_1",
          "label": "1 Loaf (400g)",
          "multiplier": 1,
          "unitLabel": "loaf",
          "isDefault": true
        },
        {
          "id": "opt_sourdough_2",
          "label": "2 Loaves",
          "multiplier": 2,
          "unitLabel": "loaf"
        }
      ]
    },
    "currentStockInBaseUnits": 25,
    "lowStockThresholdInBaseUnits": 5,
    "isAvailable": true,
    "tags": [
      "bread",
      "sourdough",
      "healthy",
      "bakery"
    ],
    "createdAt": "2026-08-08T00:00:00Z",
    "updatedAt": "2026-08-26T00:00:00Z"
  },
  {
    "id": "prd_butter_khari",
    "shopId": "shp_golden_bakery",
    "name": "Crispy Butter Khari Biscuits (250g Box)",
    "nameHindi": "मक्खन खारी बिस्कुट",
    "category": "Bakery",
    "subCategory": "Puff Pastries & Cookies",
    "description": "Flaky, buttery, crisp tea-time puff pastry biscuits.",
    "imageUrl": "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=500&auto=format&fit=crop&q=80",
    "fractionalConfig": {
      "unitType": "WEIGHT",
      "baseUnit": "kg",
      "basePrice": 280,
      "minQuantityMultiplier": 0.25,
      "maxQuantityMultiplier": 5,
      "stepQuantityMultiplier": 0.25,
      "allowCustomFractionalInput": true,
      "predefinedOptions": [
        {
          "id": "opt_khari_250g",
          "label": "250 g",
          "multiplier": 0.25,
          "unitLabel": "grams",
          "isDefault": true
        },
        {
          "id": "opt_khari_500g",
          "label": "500 g",
          "multiplier": 0.5,
          "unitLabel": "grams"
        },
        {
          "id": "opt_khari_1kg",
          "label": "1 kg",
          "multiplier": 1,
          "unitLabel": "kg"
        }
      ]
    },
    "currentStockInBaseUnits": 30,
    "lowStockThresholdInBaseUnits": 6,
    "isAvailable": true,
    "tags": [
      "khari",
      "biscuits",
      "chai",
      "bakery"
    ],
    "createdAt": "2026-08-08T00:00:00Z",
    "updatedAt": "2026-08-26T00:00:00Z"
  },
  {
    "id": "prd_kaju_katli",
    "shopId": "shp_mahalaxmi_sweets",
    "name": "Royal Diamond Kaju Katli (Pure Cashew)",
    "nameHindi": "शुद्ध काजू कतली",
    "category": "Sweets",
    "subCategory": "Mithai",
    "description": "Melt-in-mouth diamond cut kaju katli made from premium cashews and silver foil.",
    "imageUrl": "https://images.unsplash.com/photo-1599785209707-a456fc1337bb?w=500&auto=format&fit=crop&q=80",
    "fractionalConfig": {
      "unitType": "WEIGHT",
      "baseUnit": "kg",
      "basePrice": 900,
      "minQuantityMultiplier": 0.1,
      "maxQuantityMultiplier": 10,
      "stepQuantityMultiplier": 0.05,
      "allowCustomFractionalInput": true,
      "predefinedOptions": [
        {
          "id": "opt_kaju_100g",
          "label": "100 g",
          "multiplier": 0.1,
          "unitLabel": "grams"
        },
        {
          "id": "opt_kaju_250g",
          "label": "250 g",
          "multiplier": 0.25,
          "unitLabel": "grams",
          "isDefault": true
        },
        {
          "id": "opt_kaju_500g",
          "label": "500 g",
          "multiplier": 0.5,
          "unitLabel": "grams"
        },
        {
          "id": "opt_kaju_1kg",
          "label": "1 kg",
          "multiplier": 1,
          "unitLabel": "kg"
        }
      ]
    },
    "currentStockInBaseUnits": 45,
    "lowStockThresholdInBaseUnits": 8,
    "isAvailable": true,
    "isFeatured": true,
    "tags": [
      "kaju katli",
      "mithai",
      "sweets",
      "festival"
    ],
    "createdAt": "2026-08-09T00:00:00Z",
    "updatedAt": "2026-08-26T00:00:00Z"
  },
  {
    "id": "prd_motichoor_ladoo",
    "shopId": "shp_mahalaxmi_sweets",
    "name": "Pure Desi Ghee Motichoor Ladoo",
    "nameHindi": "देसी घी मोतीचूर लड्डू",
    "category": "Sweets",
    "subCategory": "Mithai",
    "description": "Fragrant saffron and cardamom infused fine pearl besan ladoos in pure cow ghee.",
    "imageUrl": "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=500&auto=format&fit=crop&q=80",
    "fractionalConfig": {
      "unitType": "WEIGHT",
      "baseUnit": "kg",
      "basePrice": 480,
      "minQuantityMultiplier": 0.25,
      "maxQuantityMultiplier": 10,
      "stepQuantityMultiplier": 0.25,
      "allowCustomFractionalInput": true,
      "predefinedOptions": [
        {
          "id": "opt_ladoo_250g",
          "label": "250 g",
          "multiplier": 0.25,
          "unitLabel": "grams",
          "isDefault": true
        },
        {
          "id": "opt_ladoo_500g",
          "label": "500 g",
          "multiplier": 0.5,
          "unitLabel": "grams"
        },
        {
          "id": "opt_ladoo_1kg",
          "label": "1 kg",
          "multiplier": 1,
          "unitLabel": "kg"
        }
      ]
    },
    "currentStockInBaseUnits": 50,
    "lowStockThresholdInBaseUnits": 10,
    "isAvailable": true,
    "tags": [
      "ladoo",
      "motichoor",
      "sweets",
      "ghee"
    ],
    "createdAt": "2026-08-09T00:00:00Z",
    "updatedAt": "2026-08-26T00:00:00Z"
  },
  {
    "id": "prd_paracetamol_650",
    "shopId": "shp_sanjeevani_chemist",
    "name": "Dolo 650mg Paracetamol Tablets (Strip of 15)",
    "nameHindi": "डोलो ६५० पैरासिटामोल",
    "category": "Medicine",
    "subCategory": "Fever & Pain Relief",
    "description": "Fast acting fever and pain relief tablets. Trusted OTC medication.",
    "imageUrl": "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&auto=format&fit=crop&q=80",
    "fractionalConfig": {
      "unitType": "PIECE",
      "baseUnit": "strip",
      "basePrice": 32,
      "minQuantityMultiplier": 1,
      "maxQuantityMultiplier": 10,
      "stepQuantityMultiplier": 1,
      "allowCustomFractionalInput": false,
      "predefinedOptions": [
        {
          "id": "opt_dolo_1",
          "label": "1 Strip (15 Tabs)",
          "multiplier": 1,
          "unitLabel": "strip",
          "isDefault": true
        },
        {
          "id": "opt_dolo_2",
          "label": "2 Strips",
          "multiplier": 2,
          "unitLabel": "strip"
        }
      ]
    },
    "currentStockInBaseUnits": 120,
    "lowStockThresholdInBaseUnits": 20,
    "isAvailable": true,
    "isFeatured": true,
    "tags": [
      "fever",
      "pain",
      "medicine",
      "paracetamol"
    ],
    "createdAt": "2026-08-10T00:00:00Z",
    "updatedAt": "2026-08-26T00:00:00Z"
  },
  {
    "id": "prd_first_aid_kit",
    "shopId": "shp_sanjeevani_chemist",
    "name": "First Aid Emergency Bandage & Antiseptic Kit",
    "nameHindi": "फर्स्ट एड पट्टी व दवाई किट",
    "category": "Medicine",
    "subCategory": "First Aid & Wound Care",
    "description": "Complete home kit with sterile cotton, Dettol antiseptic lotion, adhesive tape & waterproof band-aids.",
    "imageUrl": "https://images.unsplash.com/photo-1603398938378-e54eab446dde?w=500&auto=format&fit=crop&q=80",
    "fractionalConfig": {
      "unitType": "PIECE",
      "baseUnit": "kit",
      "basePrice": 185,
      "minQuantityMultiplier": 1,
      "maxQuantityMultiplier": 5,
      "stepQuantityMultiplier": 1,
      "allowCustomFractionalInput": false,
      "predefinedOptions": [
        {
          "id": "opt_kit_1",
          "label": "1 Complete Kit",
          "multiplier": 1,
          "unitLabel": "kit",
          "isDefault": true
        }
      ]
    },
    "currentStockInBaseUnits": 40,
    "lowStockThresholdInBaseUnits": 5,
    "isAvailable": true,
    "tags": [
      "first aid",
      "bandage",
      "antiseptic",
      "emergency"
    ],
    "createdAt": "2026-08-10T00:00:00Z",
    "updatedAt": "2026-08-26T00:00:00Z"
  },
  {
    "id": "prd_led_bulb_9w",
    "shopId": "shp_modern_electricals",
    "name": "Philips 9W Cool Daylight LED Bulb (B22)",
    "nameHindi": "फिलिप्स ९ वाट एलईडी बल्ब",
    "category": "Electronics",
    "subCategory": "Lighting",
    "description": "Energy saving bright 9-watt LED bulb with 25,000 hours life and B22 regular holder.",
    "imageUrl": "https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=500&auto=format&fit=crop&q=80",
    "fractionalConfig": {
      "unitType": "PIECE",
      "baseUnit": "piece",
      "basePrice": 95,
      "minQuantityMultiplier": 1,
      "maxQuantityMultiplier": 20,
      "stepQuantityMultiplier": 1,
      "allowCustomFractionalInput": false,
      "predefinedOptions": [
        {
          "id": "opt_bulb_1",
          "label": "1 Bulb",
          "multiplier": 1,
          "unitLabel": "piece",
          "isDefault": true
        },
        {
          "id": "opt_bulb_2",
          "label": "2 Bulbs (Pack)",
          "multiplier": 2,
          "unitLabel": "piece"
        },
        {
          "id": "opt_bulb_4",
          "label": "4 Bulbs Combo",
          "multiplier": 4,
          "unitLabel": "piece"
        }
      ]
    },
    "currentStockInBaseUnits": 60,
    "lowStockThresholdInBaseUnits": 10,
    "isAvailable": true,
    "isFeatured": true,
    "tags": [
      "led",
      "light",
      "bulb",
      "electricals"
    ],
    "createdAt": "2026-08-11T00:00:00Z",
    "updatedAt": "2026-08-26T00:00:00Z"
  },
  {
    "id": "prd_type_c_cable",
    "shopId": "shp_modern_electricals",
    "name": "65W Fast Charge Braided Type-C USB Cable (1.2m)",
    "nameHindi": "फास्ट चार्जिंग टाइप-सी केबल",
    "category": "Electronics",
    "subCategory": "Mobile Accessories",
    "description": "Heavy duty nylon braided tangle-free USB Type-C fast charging and high-speed data sync cable.",
    "imageUrl": "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=500&auto=format&fit=crop&q=80",
    "fractionalConfig": {
      "unitType": "PIECE",
      "baseUnit": "piece",
      "basePrice": 199,
      "minQuantityMultiplier": 1,
      "maxQuantityMultiplier": 10,
      "stepQuantityMultiplier": 1,
      "allowCustomFractionalInput": false,
      "predefinedOptions": [
        {
          "id": "opt_cable_1",
          "label": "1 Cable (1.2m)",
          "multiplier": 1,
          "unitLabel": "piece",
          "isDefault": true
        },
        {
          "id": "opt_cable_2",
          "label": "2 Cables Combo",
          "multiplier": 2,
          "unitLabel": "piece"
        }
      ]
    },
    "currentStockInBaseUnits": 45,
    "lowStockThresholdInBaseUnits": 8,
    "isAvailable": true,
    "tags": [
      "charger",
      "cable",
      "type-c",
      "mobile"
    ],
    "createdAt": "2026-08-11T00:00:00Z",
    "updatedAt": "2026-08-26T00:00:00Z"
  },
  {
    "id": "prd_cotton_bath_towel",
    "shopId": "shp_vastra_sangam",
    "name": "Solapur Pure Handloom Cotton Bath Towel (Extra Large)",
    "nameHindi": "सोलापुरी शुद्ध सूती तौलिया",
    "category": "Clothing",
    "subCategory": "Bath & Home Linen",
    "description": "100% pure absorbent combed cotton jacquard weave bath towel. Fast drying and skin friendly.",
    "imageUrl": "https://images.unsplash.com/photo-1616627547584-bf28cee262db?w=500&auto=format&fit=crop&q=80",
    "fractionalConfig": {
      "unitType": "PIECE",
      "baseUnit": "piece",
      "basePrice": 240,
      "minQuantityMultiplier": 1,
      "maxQuantityMultiplier": 10,
      "stepQuantityMultiplier": 1,
      "allowCustomFractionalInput": false,
      "predefinedOptions": [
        {
          "id": "opt_towel_1",
          "label": "1 Towel (75x150cm)",
          "multiplier": 1,
          "unitLabel": "piece",
          "isDefault": true
        },
        {
          "id": "opt_towel_2",
          "label": "Set of 2 Towels",
          "multiplier": 2,
          "unitLabel": "piece"
        }
      ]
    },
    "currentStockInBaseUnits": 50,
    "lowStockThresholdInBaseUnits": 10,
    "isAvailable": true,
    "isFeatured": true,
    "tags": [
      "towel",
      "cotton",
      "handloom",
      "linen"
    ],
    "createdAt": "2026-08-12T00:00:00Z",
    "updatedAt": "2026-08-26T00:00:00Z"
  },
  {
    "id": "prd_cotton_bedsheet",
    "shopId": "shp_vastra_sangam",
    "name": "Jaipuri Floral Print Double Bedsheet with 2 Pillow Covers",
    "nameHindi": "जयपुरी प्रिंट डबल बेडशीट",
    "category": "Clothing",
    "subCategory": "Bedding Linen",
    "description": "High thread count soft breathable pure cotton bedsheet in classic block print pattern.",
    "imageUrl": "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=500&auto=format&fit=crop&q=80",
    "fractionalConfig": {
      "unitType": "PIECE",
      "baseUnit": "set",
      "basePrice": 599,
      "minQuantityMultiplier": 1,
      "maxQuantityMultiplier": 5,
      "stepQuantityMultiplier": 1,
      "allowCustomFractionalInput": false,
      "predefinedOptions": [
        {
          "id": "opt_bed_1",
          "label": "1 King Set (Bedsheet + 2 Covers)",
          "multiplier": 1,
          "unitLabel": "set",
          "isDefault": true
        }
      ]
    },
    "currentStockInBaseUnits": 25,
    "lowStockThresholdInBaseUnits": 5,
    "isAvailable": true,
    "tags": [
      "bedsheet",
      "cotton",
      "jaipuri",
      "home"
    ],
    "createdAt": "2026-08-12T00:00:00Z",
    "updatedAt": "2026-08-26T00:00:00Z"
  },
  {
    "id": "prd_screwdriver_set",
    "shopId": "shp_dadar_hardware",
    "name": "Taparia 8-in-1 Magnetic Multi-Bit Screwdriver Kit",
    "nameHindi": "तपारिया स्क्रूड्राइवर किट",
    "category": "Hardware",
    "subCategory": "Hand Tools",
    "description": "High grade alloy steel chrome plated screwdriver set with comfortable anti-slip neon grip.",
    "imageUrl": "https://images.unsplash.com/photo-1530124566582-a618bc2615dc?w=500&auto=format&fit=crop&q=80",
    "fractionalConfig": {
      "unitType": "PIECE",
      "baseUnit": "set",
      "basePrice": 220,
      "minQuantityMultiplier": 1,
      "maxQuantityMultiplier": 10,
      "stepQuantityMultiplier": 1,
      "allowCustomFractionalInput": false,
      "predefinedOptions": [
        {
          "id": "opt_screw_1",
          "label": "1 Screwdriver Set (8 Bits)",
          "multiplier": 1,
          "unitLabel": "set",
          "isDefault": true
        }
      ]
    },
    "currentStockInBaseUnits": 35,
    "lowStockThresholdInBaseUnits": 5,
    "isAvailable": true,
    "isFeatured": true,
    "tags": [
      "tools",
      "hardware",
      "screwdriver",
      "repair"
    ],
    "createdAt": "2026-08-13T00:00:00Z",
    "updatedAt": "2026-08-26T00:00:00Z"
  },
  {
    "id": "prd_fevikwik_adhesive",
    "shopId": "shp_dadar_hardware",
    "name": "Pidilite Fevikwik Instant Super Glue (Pack of 3 x 3g)",
    "nameHindi": "फेविक्विक सुपर ग्लू",
    "category": "Hardware",
    "subCategory": "Adhesives & Sealants",
    "description": "Instant bonding adhesive for plastics, ceramics, rubber, and metals.",
    "imageUrl": "https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?w=500&auto=format&fit=crop&q=80",
    "fractionalConfig": {
      "unitType": "PIECE",
      "baseUnit": "pack",
      "basePrice": 45,
      "minQuantityMultiplier": 1,
      "maxQuantityMultiplier": 20,
      "stepQuantityMultiplier": 1,
      "allowCustomFractionalInput": false,
      "predefinedOptions": [
        {
          "id": "opt_glue_1",
          "label": "1 Pack (3 Tubes)",
          "multiplier": 1,
          "unitLabel": "pack",
          "isDefault": true
        },
        {
          "id": "opt_glue_2",
          "label": "2 Packs (6 Tubes)",
          "multiplier": 2,
          "unitLabel": "pack"
        }
      ]
    },
    "currentStockInBaseUnits": 150,
    "lowStockThresholdInBaseUnits": 25,
    "isAvailable": true,
    "tags": [
      "glue",
      "adhesive",
      "fevikwik",
      "hardware"
    ],
    "createdAt": "2026-08-13T00:00:00Z",
    "updatedAt": "2026-08-26T00:00:00Z"
  },
  {
    "id": "prd_french_croissant",
    "shopId": "shp_bandra_bakes",
    "name": "Artisanal French Butter Croissant (Box of 2)",
    "nameHindi": "फ्रेंच बटर क्रोइसैंट",
    "category": "Bakery",
    "subCategory": "Pastries",
    "description": "Flaky, buttery Parisian style laminated croissants baked freshly every morning.",
    "imageUrl": "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=500&auto=format&fit=crop&q=80",
    "fractionalConfig": {
      "unitType": "PIECE",
      "baseUnit": "box",
      "basePrice": 180,
      "minQuantityMultiplier": 1,
      "maxQuantityMultiplier": 10,
      "stepQuantityMultiplier": 1,
      "allowCustomFractionalInput": false,
      "predefinedOptions": [
        {
          "id": "opt_crois_1",
          "label": "1 Box (2 Croissants)",
          "multiplier": 1,
          "unitLabel": "box",
          "isDefault": true
        },
        {
          "id": "opt_crois_2",
          "label": "2 Boxes (4 Croissants)",
          "multiplier": 2,
          "unitLabel": "box"
        }
      ]
    },
    "currentStockInBaseUnits": 30,
    "lowStockThresholdInBaseUnits": 6,
    "isAvailable": true,
    "isFeatured": true,
    "tags": [
      "croissant",
      "bakery",
      "french",
      "breakfast"
    ],
    "createdAt": "2026-08-14T00:00:00Z",
    "updatedAt": "2026-08-27T00:00:00Z"
  },
  {
    "id": "prod-1789137194954-8778",
    "shopId": "shp_krishna_grocers",
    "name": "Fresh Cashews Premium (Kaju)",
    "nameHindi": "काजू",
    "category": "Dry Fruits",
    "description": "Fresh Cashews (Kaju) fresh stock",
    "imageUrl": "https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=60",
    "baseUnit": "kg",
    "basePricePerUnit": 950,
    "fractionalConfig": {
      "unitType": "WEIGHT",
      "baseUnit": "kg",
      "basePrice": 900,
      "minQuantityMultiplier": 0.1,
      "maxQuantityMultiplier": 50,
      "stepQuantityMultiplier": 0.1,
      "allowCustomFractionalInput": true,
      "predefinedOptions": [
        {
          "id": "opt-1",
          "label": "250 g",
          "multiplier": 0.25,
          "unitLabel": "grams"
        },
        {
          "id": "opt-2",
          "label": "500 g",
          "multiplier": 0.5,
          "unitLabel": "grams"
        },
        {
          "id": "opt-3",
          "label": "1 kg",
          "multiplier": 1,
          "unitLabel": "kg",
          "isDefault": true
        }
      ]
    },
    "currentStockInBaseUnits": 25,
    "lowStockThresholdInBaseUnits": 5,
    "minStockAlert": 5,
    "isAvailable": true,
    "isActive": true,
    "tags": [
      "Dry Fruits"
    ],
    "createdAt": "2026-09-11T14:33:14.954Z",
    "updatedAt": "2026-09-11T14:33:14.956Z"
  },
  {
    "id": "prod-1789137205203-5422",
    "shopId": "shp_krishna_grocers",
    "name": "प्रोडक्ट , काजू",
    "category": "Grocery & Kirana",
    "description": "प्रोडक्ट , काजू fresh stock",
    "imageUrl": "https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=60",
    "baseUnit": "kg",
    "basePricePerUnit": 900,
    "fractionalConfig": {
      "unitType": "WEIGHT",
      "baseUnit": "kg",
      "basePrice": 900,
      "minQuantityMultiplier": 0.1,
      "maxQuantityMultiplier": 50,
      "stepQuantityMultiplier": 0.1,
      "allowCustomFractionalInput": true,
      "predefinedOptions": [
        {
          "id": "p-1",
          "label": "1 kg",
          "multiplier": 1,
          "unitLabel": "kg",
          "isDefault": true
        }
      ]
    },
    "currentStockInBaseUnits": 20,
    "lowStockThresholdInBaseUnits": 5,
    "minStockAlert": 5,
    "isAvailable": true,
    "isActive": true,
    "tags": [
      "Grocery & Kirana"
    ],
    "createdAt": "2026-09-11T14:33:25.203Z",
    "updatedAt": "2026-09-11T14:33:25.203Z"
  },
  {
    "id": "prod-1789137205212-2207",
    "shopId": "shp_krishna_grocers",
    "name": "चना दाल",
    "category": "Grocery & Kirana",
    "description": "चना दाल fresh stock",
    "imageUrl": "https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=60",
    "baseUnit": "kg",
    "basePricePerUnit": 120,
    "fractionalConfig": {
      "unitType": "WEIGHT",
      "baseUnit": "kg",
      "basePrice": 120,
      "minQuantityMultiplier": 0.1,
      "maxQuantityMultiplier": 50,
      "stepQuantityMultiplier": 0.1,
      "allowCustomFractionalInput": true,
      "predefinedOptions": [
        {
          "id": "opt-1",
          "label": "250 g",
          "multiplier": 0.25,
          "unitLabel": "grams"
        },
        {
          "id": "opt-2",
          "label": "500 g",
          "multiplier": 0.5,
          "unitLabel": "grams"
        },
        {
          "id": "opt-3",
          "label": "1 kg",
          "multiplier": 1,
          "unitLabel": "kg",
          "isDefault": true
        }
      ]
    },
    "currentStockInBaseUnits": 40,
    "lowStockThresholdInBaseUnits": 5,
    "minStockAlert": 5,
    "isAvailable": true,
    "isActive": true,
    "tags": [
      "grocery"
    ],
    "createdAt": "2026-09-11T14:33:25.212Z",
    "updatedAt": "2026-09-11T14:33:25.212Z"
  },
  {
    "id": "prod-1789137205212-1438",
    "shopId": "shp_krishna_grocers",
    "name": "सरसों तेल",
    "category": "Grocery & Kirana",
    "description": "सरसों तेल fresh stock",
    "imageUrl": "https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=60",
    "baseUnit": "L",
    "basePricePerUnit": 150,
    "fractionalConfig": {
      "unitType": "WEIGHT",
      "baseUnit": "L",
      "basePrice": 150,
      "minQuantityMultiplier": 0.1,
      "maxQuantityMultiplier": 50,
      "stepQuantityMultiplier": 0.1,
      "allowCustomFractionalInput": true,
      "predefinedOptions": [
        {
          "id": "opt-1",
          "label": "250 g",
          "multiplier": 0.25,
          "unitLabel": "grams"
        },
        {
          "id": "opt-2",
          "label": "500 g",
          "multiplier": 0.5,
          "unitLabel": "grams"
        },
        {
          "id": "opt-3",
          "label": "1 kg",
          "multiplier": 1,
          "unitLabel": "kg",
          "isDefault": true
        }
      ]
    },
    "currentStockInBaseUnits": 30,
    "lowStockThresholdInBaseUnits": 5,
    "minStockAlert": 5,
    "isAvailable": true,
    "isActive": true,
    "tags": [
      "grocery"
    ],
    "createdAt": "2026-09-11T14:33:25.212Z",
    "updatedAt": "2026-09-11T14:33:25.212Z"
  },
  {
    "id": "prod-1789137205212-7798",
    "shopId": "shp_krishna_grocers",
    "name": "लाइफबॉय साबुन",
    "category": "Grocery & Kirana",
    "description": "लाइफबॉय साबुन fresh stock",
    "imageUrl": "https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=60",
    "baseUnit": "piece",
    "basePricePerUnit": 25,
    "fractionalConfig": {
      "unitType": "WEIGHT",
      "baseUnit": "piece",
      "basePrice": 25,
      "minQuantityMultiplier": 0.1,
      "maxQuantityMultiplier": 50,
      "stepQuantityMultiplier": 0.1,
      "allowCustomFractionalInput": true,
      "predefinedOptions": [
        {
          "id": "opt-1",
          "label": "250 g",
          "multiplier": 0.25,
          "unitLabel": "grams"
        },
        {
          "id": "opt-2",
          "label": "500 g",
          "multiplier": 0.5,
          "unitLabel": "grams"
        },
        {
          "id": "opt-3",
          "label": "1 kg",
          "multiplier": 1,
          "unitLabel": "kg",
          "isDefault": true
        }
      ]
    },
    "currentStockInBaseUnits": 50,
    "lowStockThresholdInBaseUnits": 5,
    "minStockAlert": 5,
    "isAvailable": true,
    "isActive": true,
    "tags": [
      "grocery"
    ],
    "createdAt": "2026-09-11T14:33:25.212Z",
    "updatedAt": "2026-09-11T14:33:25.212Z"
  },
  {
    "id": "prod-1789137205356-8479",
    "shopId": "shop-1789137205356-318",
    "name": "Toor Dal Premium",
    "category": "Grocery & Kirana",
    "description": "Toor Dal Premium fresh stock",
    "imageUrl": "https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=60",
    "baseUnit": "kg",
    "basePricePerUnit": 160,
    "fractionalConfig": {
      "unitType": "WEIGHT",
      "baseUnit": "kg",
      "basePrice": 160,
      "minQuantityMultiplier": 0.1,
      "maxQuantityMultiplier": 50,
      "stepQuantityMultiplier": 0.1,
      "allowCustomFractionalInput": true,
      "predefinedOptions": [
        {
          "id": "opt-1",
          "label": "250 g",
          "multiplier": 0.25,
          "unitLabel": "grams"
        },
        {
          "id": "opt-2",
          "label": "500 g",
          "multiplier": 0.5,
          "unitLabel": "grams"
        },
        {
          "id": "opt-3",
          "label": "1 kg",
          "multiplier": 1,
          "unitLabel": "kg",
          "isDefault": true
        }
      ]
    },
    "currentStockInBaseUnits": 50,
    "lowStockThresholdInBaseUnits": 5,
    "minStockAlert": 5,
    "isAvailable": true,
    "isActive": true,
    "tags": [
      "grocery"
    ],
    "createdAt": "2026-09-11T14:33:25.356Z",
    "updatedAt": "2026-09-11T14:33:25.356Z"
  },
  {
    "id": "prod-1789137205356-7953",
    "shopId": "shop-1789137205356-318",
    "name": "Sunflower Cooking Oil",
    "category": "Grocery & Kirana",
    "description": "Sunflower Cooking Oil fresh stock",
    "imageUrl": "https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=60",
    "baseUnit": "litre",
    "basePricePerUnit": 140,
    "fractionalConfig": {
      "unitType": "WEIGHT",
      "baseUnit": "litre",
      "basePrice": 140,
      "minQuantityMultiplier": 0.1,
      "maxQuantityMultiplier": 50,
      "stepQuantityMultiplier": 0.1,
      "allowCustomFractionalInput": true,
      "predefinedOptions": [
        {
          "id": "opt-1",
          "label": "250 g",
          "multiplier": 0.25,
          "unitLabel": "grams"
        },
        {
          "id": "opt-2",
          "label": "500 g",
          "multiplier": 0.5,
          "unitLabel": "grams"
        },
        {
          "id": "opt-3",
          "label": "1 kg",
          "multiplier": 1,
          "unitLabel": "kg",
          "isDefault": true
        }
      ]
    },
    "currentStockInBaseUnits": 40,
    "lowStockThresholdInBaseUnits": 5,
    "minStockAlert": 5,
    "isAvailable": true,
    "isActive": true,
    "tags": [
      "grocery"
    ],
    "createdAt": "2026-09-11T14:33:25.356Z",
    "updatedAt": "2026-09-11T14:33:25.356Z"
  },
  {
    "id": "prod-1789137205356-6762",
    "shopId": "shop-1789137205356-318",
    "name": "Tea Leaves Pouch",
    "category": "Grocery & Kirana",
    "description": "Tea Leaves Pouch fresh stock",
    "imageUrl": "https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=60",
    "baseUnit": "pouch",
    "basePricePerUnit": 120,
    "fractionalConfig": {
      "unitType": "WEIGHT",
      "baseUnit": "pouch",
      "basePrice": 120,
      "minQuantityMultiplier": 0.1,
      "maxQuantityMultiplier": 50,
      "stepQuantityMultiplier": 0.1,
      "allowCustomFractionalInput": true,
      "predefinedOptions": [
        {
          "id": "opt-1",
          "label": "250 g",
          "multiplier": 0.25,
          "unitLabel": "grams"
        },
        {
          "id": "opt-2",
          "label": "500 g",
          "multiplier": 0.5,
          "unitLabel": "grams"
        },
        {
          "id": "opt-3",
          "label": "1 kg",
          "multiplier": 1,
          "unitLabel": "kg",
          "isDefault": true
        }
      ]
    },
    "currentStockInBaseUnits": 60,
    "lowStockThresholdInBaseUnits": 5,
    "minStockAlert": 5,
    "isAvailable": true,
    "isActive": true,
    "tags": [
      "grocery"
    ],
    "createdAt": "2026-09-11T14:33:25.356Z",
    "updatedAt": "2026-09-11T14:33:25.356Z"
  },
  {
    "id": "prod-1789137209564-565",
    "shopId": "shop-1789137209564-317",
    "name": "Chana Dal Premium (चना दाल)",
    "category": "Grocery & Kirana",
    "description": "Chana Dal Premium (चना दाल) fresh stock",
    "imageUrl": "https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=60",
    "baseUnit": "kg",
    "basePricePerUnit": 120,
    "fractionalConfig": {
      "unitType": "WEIGHT",
      "baseUnit": "kg",
      "basePrice": 120,
      "minQuantityMultiplier": 0.1,
      "maxQuantityMultiplier": 50,
      "stepQuantityMultiplier": 0.1,
      "allowCustomFractionalInput": true,
      "predefinedOptions": [
        {
          "id": "opt-1",
          "label": "250 g",
          "multiplier": 0.25,
          "unitLabel": "grams"
        },
        {
          "id": "opt-2",
          "label": "500 g",
          "multiplier": 0.5,
          "unitLabel": "grams"
        },
        {
          "id": "opt-3",
          "label": "1 kg",
          "multiplier": 1,
          "unitLabel": "kg",
          "isDefault": true
        }
      ]
    },
    "currentStockInBaseUnits": 49.5,
    "lowStockThresholdInBaseUnits": 5,
    "minStockAlert": 5,
    "isAvailable": true,
    "isActive": true,
    "tags": [
      "grocery"
    ],
    "createdAt": "2026-09-11T14:33:29.564Z",
    "updatedAt": "2026-09-11T14:33:29.582Z"
  },
  {
    "id": "prd_gupta_cow_milk",
    "shopId": "shop-1789137194944-2",
    "name": "Fresh Cow Milk (ताजा गाय का दूध)",
    "nameHindi": "ताज़ा गाय का दूध",
    "category": "Dairy",
    "subCategory": "Fresh Milk",
    "description": "Fresh farm cow milk boiled and chilled, daily morning supply",
    "imageUrl": "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=500&auto=format&fit=crop&q=80",
    "fractionalConfig": {
      "unitType": "VOLUME",
      "baseUnit": "L",
      "basePrice": 65,
      "minQuantityMultiplier": 0.5,
      "maxQuantityMultiplier": 10,
      "stepQuantityMultiplier": 0.5,
      "allowCustomFractionalInput": true,
      "predefinedOptions": [
        {
          "id": "opt_milk_500ml",
          "label": "500 ml",
          "multiplier": 0.5,
          "unitLabel": "ml"
        },
        {
          "id": "opt_milk_1l",
          "label": "1 Litre",
          "multiplier": 1,
          "unitLabel": "L",
          "isDefault": true
        },
        {
          "id": "opt_milk_2l",
          "label": "2 Litre",
          "multiplier": 2,
          "unitLabel": "L"
        }
      ]
    },
    "currentStockInBaseUnits": 60,
    "lowStockThresholdInBaseUnits": 10,
    "isAvailable": true,
    "isFeatured": true,
    "tags": [
      "dairy",
      "milk",
      "fresh",
      "daily"
    ],
    "createdAt": "2026-09-17T09:56:42.153Z",
    "updatedAt": "2026-09-17T09:56:42.153Z"
  },
  {
    "id": "prd_gupta_malai_paneer",
    "shopId": "shop-1789137194944-2",
    "name": "Fresh Malai Paneer (ताजा मलाई पनीर)",
    "nameHindi": "ताज़ा मलाई पनीर",
    "category": "Dairy",
    "subCategory": "Cottage Cheese",
    "description": "Soft melt-in-mouth fresh cottage cheese made from creamy buffalo milk",
    "imageUrl": "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=500&auto=format&fit=crop&q=80",
    "fractionalConfig": {
      "unitType": "WEIGHT",
      "baseUnit": "kg",
      "basePrice": 420,
      "minQuantityMultiplier": 0.2,
      "maxQuantityMultiplier": 10,
      "stepQuantityMultiplier": 0.05,
      "allowCustomFractionalInput": true,
      "predefinedOptions": [
        {
          "id": "opt_pan_250g",
          "label": "250 g",
          "multiplier": 0.25,
          "unitLabel": "g",
          "isDefault": true
        },
        {
          "id": "opt_pan_500g",
          "label": "500 g",
          "multiplier": 0.5,
          "unitLabel": "g"
        },
        {
          "id": "opt_pan_1kg",
          "label": "1 kg",
          "multiplier": 1,
          "unitLabel": "kg"
        }
      ]
    },
    "currentStockInBaseUnits": 25,
    "lowStockThresholdInBaseUnits": 5,
    "isAvailable": true,
    "isFeatured": true,
    "tags": [
      "paneer",
      "dairy",
      "fresh",
      "sweets"
    ],
    "createdAt": "2026-09-17T09:56:42.153Z",
    "updatedAt": "2026-09-17T09:56:42.153Z"
  },
  {
    "id": "prd_gupta_mathura_peda",
    "shopId": "shop-1789137194944-2",
    "name": "Special Mathura Peda (मथुरा पेड़ा)",
    "nameHindi": "मथुरा पेड़ा",
    "category": "Sweets & Confectionery",
    "subCategory": "Traditional Mithai",
    "description": "Authentic roasted khoya peda with cardamom and pure desi ghee",
    "imageUrl": "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=500&auto=format&fit=crop&q=80",
    "fractionalConfig": {
      "unitType": "WEIGHT",
      "baseUnit": "kg",
      "basePrice": 480,
      "minQuantityMultiplier": 0.25,
      "maxQuantityMultiplier": 10,
      "stepQuantityMultiplier": 0.25,
      "allowCustomFractionalInput": true,
      "predefinedOptions": [
        {
          "id": "opt_peda_250g",
          "label": "250 g Box",
          "multiplier": 0.25,
          "unitLabel": "g",
          "isDefault": true
        },
        {
          "id": "opt_peda_500g",
          "label": "500 g Box",
          "multiplier": 0.5,
          "unitLabel": "g"
        },
        {
          "id": "opt_peda_1kg",
          "label": "1 kg Box",
          "multiplier": 1,
          "unitLabel": "kg"
        }
      ]
    },
    "currentStockInBaseUnits": 40,
    "lowStockThresholdInBaseUnits": 8,
    "isAvailable": true,
    "isFeatured": true,
    "tags": [
      "sweets",
      "mithai",
      "peda",
      "khoya"
    ],
    "createdAt": "2026-09-17T09:56:42.153Z",
    "updatedAt": "2026-09-17T09:56:42.153Z"
  },
  {
    "id": "prd_gupta_desi_ghee",
    "shopId": "shop-1789137194944-2",
    "name": "Pure Desi Danedar Ghee (शुद्ध दानेदार घी)",
    "nameHindi": "शुद्ध दानेदार घी",
    "category": "Dairy",
    "subCategory": "Ghee & Butter",
    "description": "Traditional aromatic bilona style churned pure cow ghee",
    "imageUrl": "https://images.unsplash.com/photo-1631452180539-96aca7d48617?w=500&auto=format&fit=crop&q=80",
    "fractionalConfig": {
      "unitType": "VOLUME",
      "baseUnit": "L",
      "basePrice": 650,
      "minQuantityMultiplier": 0.5,
      "maxQuantityMultiplier": 15,
      "stepQuantityMultiplier": 0.5,
      "allowCustomFractionalInput": true,
      "predefinedOptions": [
        {
          "id": "opt_ghee_500ml",
          "label": "500 ml Jar",
          "multiplier": 0.5,
          "unitLabel": "ml"
        },
        {
          "id": "opt_ghee_1l",
          "label": "1 Litre Jar",
          "multiplier": 1,
          "unitLabel": "L",
          "isDefault": true
        }
      ]
    },
    "currentStockInBaseUnits": 30,
    "lowStockThresholdInBaseUnits": 5,
    "isAvailable": true,
    "isFeatured": true,
    "tags": [
      "ghee",
      "dairy",
      "pure",
      "desi"
    ],
    "createdAt": "2026-09-17T09:56:42.153Z",
    "updatedAt": "2026-09-17T09:56:42.153Z"
  },
  {
    "id": "prd_mandi_sharbati_wheat",
    "shopId": "shop-1789137194947-701",
    "name": "MP Sharbati Premium Gehu / Wheat (शरबती गेहूं)",
    "nameHindi": "शरबती गेहूं",
    "category": "Grains & Staples",
    "subCategory": "Wholesale Mandi Grains",
    "description": "Golden clean MP Sehore Sharbati wheat grains direct from mandi auction",
    "imageUrl": "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=500&auto=format&fit=crop&q=80",
    "fractionalConfig": {
      "unitType": "WEIGHT",
      "baseUnit": "kg",
      "basePrice": 42,
      "minQuantityMultiplier": 1,
      "maxQuantityMultiplier": 100,
      "stepQuantityMultiplier": 1,
      "allowCustomFractionalInput": true,
      "predefinedOptions": [
        {
          "id": "opt_wheat_5kg",
          "label": "5 kg Bag",
          "multiplier": 5,
          "unitLabel": "kg"
        },
        {
          "id": "opt_wheat_10kg",
          "label": "10 kg Bag",
          "multiplier": 10,
          "unitLabel": "kg",
          "isDefault": true
        },
        {
          "id": "opt_wheat_25kg",
          "label": "25 kg Sack",
          "multiplier": 25,
          "unitLabel": "kg"
        }
      ]
    },
    "currentStockInBaseUnits": 850,
    "lowStockThresholdInBaseUnits": 100,
    "isAvailable": true,
    "isFeatured": true,
    "tags": [
      "mandi",
      "wheat",
      "grains",
      "wholesale"
    ],
    "createdAt": "2026-09-17T09:56:42.153Z",
    "updatedAt": "2026-09-17T09:56:42.153Z"
  },
  {
    "id": "prd_mandi_basmati_rice",
    "shopId": "shop-1789137194947-701",
    "name": "Classic XXL Basmati Chawal (बासमती चावल)",
    "nameHindi": "बासमती चावल",
    "category": "Grains & Staples",
    "subCategory": "Rice & Grains",
    "description": "Aged long grain aromatic basmati rice for biryani and daily meals",
    "imageUrl": "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500&auto=format&fit=crop&q=80",
    "fractionalConfig": {
      "unitType": "WEIGHT",
      "baseUnit": "kg",
      "basePrice": 95,
      "minQuantityMultiplier": 1,
      "maxQuantityMultiplier": 50,
      "stepQuantityMultiplier": 1,
      "allowCustomFractionalInput": true,
      "predefinedOptions": [
        {
          "id": "opt_rice_1kg",
          "label": "1 kg",
          "multiplier": 1,
          "unitLabel": "kg"
        },
        {
          "id": "opt_rice_5kg",
          "label": "5 kg Bag",
          "multiplier": 5,
          "unitLabel": "kg",
          "isDefault": true
        },
        {
          "id": "opt_rice_10kg",
          "label": "10 kg Bag",
          "multiplier": 10,
          "unitLabel": "kg"
        }
      ]
    },
    "currentStockInBaseUnits": 600,
    "lowStockThresholdInBaseUnits": 50,
    "isAvailable": true,
    "isFeatured": true,
    "tags": [
      "rice",
      "basmati",
      "mandi",
      "grains"
    ],
    "createdAt": "2026-09-17T09:56:42.153Z",
    "updatedAt": "2026-09-17T09:56:42.153Z"
  },
  {
    "id": "prd_mandi_desi_toor_dal",
    "shopId": "shop-1789137194947-701",
    "name": "Desi Unpolished Toor / Arhar Dal (तूर दाल)",
    "nameHindi": "तूर / अरहर दाल",
    "category": "Pulses & Legumes",
    "subCategory": "Lentils",
    "description": "High protein rich unpolished pigeon pea lentil straight from farmer mandi",
    "imageUrl": "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=500&auto=format&fit=crop&q=80",
    "fractionalConfig": {
      "unitType": "WEIGHT",
      "baseUnit": "kg",
      "basePrice": 160,
      "minQuantityMultiplier": 0.5,
      "maxQuantityMultiplier": 30,
      "stepQuantityMultiplier": 0.5,
      "allowCustomFractionalInput": true,
      "predefinedOptions": [
        {
          "id": "opt_dal_500g",
          "label": "500 g",
          "multiplier": 0.5,
          "unitLabel": "g"
        },
        {
          "id": "opt_dal_1kg",
          "label": "1 kg",
          "multiplier": 1,
          "unitLabel": "kg",
          "isDefault": true
        },
        {
          "id": "opt_dal_2kg",
          "label": "2 kg",
          "multiplier": 2,
          "unitLabel": "kg"
        }
      ]
    },
    "currentStockInBaseUnits": 450,
    "lowStockThresholdInBaseUnits": 40,
    "isAvailable": true,
    "isFeatured": true,
    "tags": [
      "dal",
      "pulses",
      "toor",
      "mandi"
    ],
    "createdAt": "2026-09-17T09:56:42.153Z",
    "updatedAt": "2026-09-17T09:56:42.153Z"
  },
  {
    "id": "prd_sharma_tata_salt",
    "shopId": "shop-1789137194950-164",
    "name": "Tata Salt Vacuum Evaporated 1kg",
    "nameHindi": "टाटा नमक 1kg",
    "category": "Spices & Seasonings",
    "subCategory": "Salt & Sugar",
    "description": "Desh ka namak - pure vacuum evaporated iodized salt",
    "imageUrl": "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=500&auto=format&fit=crop&q=80",
    "fractionalConfig": {
      "unitType": "PIECE",
      "baseUnit": "packet",
      "basePrice": 28,
      "minQuantityMultiplier": 1,
      "maxQuantityMultiplier": 10,
      "stepQuantityMultiplier": 1,
      "allowCustomFractionalInput": false,
      "predefinedOptions": [
        {
          "id": "opt_salt_1pkt",
          "label": "1 Packet (1kg)",
          "multiplier": 1,
          "unitLabel": "pkt",
          "isDefault": true
        }
      ]
    },
    "currentStockInBaseUnits": 120,
    "lowStockThresholdInBaseUnits": 20,
    "isAvailable": true,
    "isFeatured": true,
    "tags": [
      "salt",
      "grocery",
      "tata",
      "daily"
    ],
    "createdAt": "2026-09-17T09:56:42.153Z",
    "updatedAt": "2026-09-17T09:56:42.153Z"
  },
  {
    "id": "prd_sharma_fortune_oil",
    "shopId": "shop-1789137194950-164",
    "name": "Fortune Sunlite Refined Sunflower Oil 1L Pouch",
    "nameHindi": "फॉर्च्यून रिफाइंड तेल 1L",
    "category": "Oils & Ghee",
    "subCategory": "Cooking Oil",
    "description": "Enriched with Vitamin A and D, light and healthy sunflower cooking oil",
    "imageUrl": "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=500&auto=format&fit=crop&q=80",
    "fractionalConfig": {
      "unitType": "VOLUME",
      "baseUnit": "L",
      "basePrice": 142,
      "minQuantityMultiplier": 1,
      "maxQuantityMultiplier": 10,
      "stepQuantityMultiplier": 1,
      "allowCustomFractionalInput": false,
      "predefinedOptions": [
        {
          "id": "opt_oil_1l",
          "label": "1 Litre Pouch",
          "multiplier": 1,
          "unitLabel": "L",
          "isDefault": true
        }
      ]
    },
    "currentStockInBaseUnits": 80,
    "lowStockThresholdInBaseUnits": 15,
    "isAvailable": true,
    "isFeatured": true,
    "tags": [
      "oil",
      "cooking",
      "grocery",
      "fortune"
    ],
    "createdAt": "2026-09-17T09:56:42.153Z",
    "updatedAt": "2026-09-17T09:56:42.153Z"
  },
  {
    "id": "prd_sharma_wagh_bakri_tea",
    "shopId": "shop-1789137194950-164",
    "name": "Wagh Bakri Premium CTC Tea 500g",
    "nameHindi": "वाघ बकरी चाय 500g",
    "category": "Beverages",
    "subCategory": "Tea & Chai",
    "description": "Rich aroma and strong taste CTC leaf blend for authentic Indian chai",
    "imageUrl": "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=500&auto=format&fit=crop&q=80",
    "fractionalConfig": {
      "unitType": "PIECE",
      "baseUnit": "pack",
      "basePrice": 265,
      "minQuantityMultiplier": 1,
      "maxQuantityMultiplier": 6,
      "stepQuantityMultiplier": 1,
      "allowCustomFractionalInput": false,
      "predefinedOptions": [
        {
          "id": "opt_tea_500g",
          "label": "500g Pack",
          "multiplier": 1,
          "unitLabel": "pack",
          "isDefault": true
        }
      ]
    },
    "currentStockInBaseUnits": 50,
    "lowStockThresholdInBaseUnits": 10,
    "isAvailable": true,
    "isFeatured": true,
    "tags": [
      "tea",
      "chai",
      "beverages",
      "grocery"
    ],
    "createdAt": "2026-09-17T09:56:42.153Z",
    "updatedAt": "2026-09-17T09:56:42.153Z"
  },
  {
    "id": "prd_sub_fresh_atta",
    "shopId": "shop-1789137205330-897",
    "name": "Chakki Fresh Shuddh Atta (चक्की ताजा आटा)",
    "nameHindi": "चक्की ताजा आटा",
    "category": "Flour & Grains",
    "subCategory": "Wheat Flour",
    "description": "100% stone ground whole wheat flour with 0% maida for soft rotis",
    "imageUrl": "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=500&auto=format&fit=crop&q=80",
    "fractionalConfig": {
      "unitType": "WEIGHT",
      "baseUnit": "kg",
      "basePrice": 42,
      "minQuantityMultiplier": 1,
      "maxQuantityMultiplier": 30,
      "stepQuantityMultiplier": 1,
      "allowCustomFractionalInput": true,
      "predefinedOptions": [
        {
          "id": "opt_atta_1kg",
          "label": "1 kg",
          "multiplier": 1,
          "unitLabel": "kg"
        },
        {
          "id": "opt_atta_5kg",
          "label": "5 kg Bag",
          "multiplier": 5,
          "unitLabel": "kg",
          "isDefault": true
        },
        {
          "id": "opt_atta_10kg",
          "label": "10 kg Bag",
          "multiplier": 10,
          "unitLabel": "kg"
        }
      ]
    },
    "currentStockInBaseUnits": 180,
    "lowStockThresholdInBaseUnits": 25,
    "isAvailable": true,
    "isFeatured": true,
    "tags": [
      "atta",
      "flour",
      "kirana",
      "staples"
    ],
    "createdAt": "2026-09-17T09:56:42.153Z",
    "updatedAt": "2026-09-17T09:56:42.153Z"
  },
  {
    "id": "prd_sub_sugar_crystal",
    "shopId": "shop-1789137205330-897",
    "name": "Sulfur-Free Crystal Sugar (सफेद चीनी)",
    "nameHindi": "सफेद चीनी",
    "category": "Grains & Sweeteners",
    "subCategory": "Sugar & Jaggery",
    "description": "Sparkling clean refined crystal sugar for tea, sweets, and kitchen",
    "imageUrl": "https://images.unsplash.com/photo-1581441363689-1f3c3c414635?w=500&auto=format&fit=crop&q=80",
    "fractionalConfig": {
      "unitType": "WEIGHT",
      "baseUnit": "kg",
      "basePrice": 46,
      "minQuantityMultiplier": 0.5,
      "maxQuantityMultiplier": 25,
      "stepQuantityMultiplier": 0.5,
      "allowCustomFractionalInput": true,
      "predefinedOptions": [
        {
          "id": "opt_sugar_500g",
          "label": "500 g",
          "multiplier": 0.5,
          "unitLabel": "g"
        },
        {
          "id": "opt_sugar_1kg",
          "label": "1 kg",
          "multiplier": 1,
          "unitLabel": "kg",
          "isDefault": true
        },
        {
          "id": "opt_sugar_2kg",
          "label": "2 kg",
          "multiplier": 2,
          "unitLabel": "kg"
        }
      ]
    },
    "currentStockInBaseUnits": 150,
    "lowStockThresholdInBaseUnits": 20,
    "isAvailable": true,
    "isFeatured": true,
    "tags": [
      "sugar",
      "kirana",
      "daily",
      "staples"
    ],
    "createdAt": "2026-09-17T09:56:42.153Z",
    "updatedAt": "2026-09-17T09:56:42.153Z"
  },
  {
    "id": "prd_sub_moong_dal",
    "shopId": "shop-1789137205330-897",
    "name": "Yellow Moong Dal Dhuli (मूंग दाल धुली)",
    "nameHindi": "मूंग दाल धुली",
    "category": "Pulses & Legumes",
    "subCategory": "Lentils",
    "description": "Easy to digest washed yellow moong lentils for khichdi and dal",
    "imageUrl": "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=500&auto=format&fit=crop&q=80",
    "fractionalConfig": {
      "unitType": "WEIGHT",
      "baseUnit": "kg",
      "basePrice": 135,
      "minQuantityMultiplier": 0.25,
      "maxQuantityMultiplier": 10,
      "stepQuantityMultiplier": 0.25,
      "allowCustomFractionalInput": true,
      "predefinedOptions": [
        {
          "id": "opt_moong_250g",
          "label": "250 g",
          "multiplier": 0.25,
          "unitLabel": "g"
        },
        {
          "id": "opt_moong_500g",
          "label": "500 g",
          "multiplier": 0.5,
          "unitLabel": "g"
        },
        {
          "id": "opt_moong_1kg",
          "label": "1 kg",
          "multiplier": 1,
          "unitLabel": "kg",
          "isDefault": true
        }
      ]
    },
    "currentStockInBaseUnits": 90,
    "lowStockThresholdInBaseUnits": 15,
    "isAvailable": true,
    "isFeatured": true,
    "tags": [
      "dal",
      "moong",
      "kirana",
      "pulses"
    ],
    "createdAt": "2026-09-17T09:56:42.153Z",
    "updatedAt": "2026-09-17T09:56:42.153Z"
  },
  {
    "id": "prd_hybrid_dettol_wash",
    "shopId": "shop-1789137205333-986",
    "name": "Dettol Original Liquid Handwash Refill 750ml",
    "nameHindi": "डेटॉल हैंडवॉश 750ml",
    "category": "Household & Cleaning",
    "subCategory": "Personal Care",
    "description": "Germ protection trusted handwash refill pack",
    "imageUrl": "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&auto=format&fit=crop&q=80",
    "fractionalConfig": {
      "unitType": "PIECE",
      "baseUnit": "pouch",
      "basePrice": 99,
      "minQuantityMultiplier": 1,
      "maxQuantityMultiplier": 6,
      "stepQuantityMultiplier": 1,
      "allowCustomFractionalInput": false,
      "predefinedOptions": [
        {
          "id": "opt_handwash_1",
          "label": "750ml Pouch",
          "multiplier": 1,
          "unitLabel": "pouch",
          "isDefault": true
        }
      ]
    },
    "currentStockInBaseUnits": 60,
    "lowStockThresholdInBaseUnits": 10,
    "isAvailable": true,
    "isFeatured": true,
    "tags": [
      "hygiene",
      "cleaning",
      "superstore"
    ],
    "createdAt": "2026-09-17T09:56:42.153Z",
    "updatedAt": "2026-09-17T09:56:42.153Z"
  },
  {
    "id": "prd_hybrid_surf_excel",
    "shopId": "shop-1789137205333-986",
    "name": "Surf Excel Easy Wash Detergent Powder 1kg",
    "nameHindi": "सर्फ एक्सेल 1kg",
    "category": "Household & Cleaning",
    "subCategory": "Laundry",
    "description": "Removes tough stains easily in bucket wash",
    "imageUrl": "https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?w=500&auto=format&fit=crop&q=80",
    "fractionalConfig": {
      "unitType": "WEIGHT",
      "baseUnit": "kg",
      "basePrice": 145,
      "minQuantityMultiplier": 1,
      "maxQuantityMultiplier": 5,
      "stepQuantityMultiplier": 1,
      "allowCustomFractionalInput": false,
      "predefinedOptions": [
        {
          "id": "opt_surf_1kg",
          "label": "1 kg Pack",
          "multiplier": 1,
          "unitLabel": "kg",
          "isDefault": true
        }
      ]
    },
    "currentStockInBaseUnits": 80,
    "lowStockThresholdInBaseUnits": 12,
    "isAvailable": true,
    "isFeatured": true,
    "tags": [
      "laundry",
      "detergent",
      "cleaning",
      "superstore"
    ],
    "createdAt": "2026-09-17T09:56:42.153Z",
    "updatedAt": "2026-09-17T09:56:42.153Z"
  },
  {
    "id": "prd_hybrid_colgate_paste",
    "shopId": "shop-1789137205333-986",
    "name": "Colgate Strong Teeth Toothpaste Saver Pack (150g x 2)",
    "nameHindi": "कोलगेट टूथपेस्ट कॉम्बो",
    "category": "Personal Care",
    "subCategory": "Oral Care",
    "description": "Amino Shakti formula adds natural calcium to strengthen teeth",
    "imageUrl": "https://images.unsplash.com/photo-1559591937-e1032c253457?w=500&auto=format&fit=crop&q=80",
    "fractionalConfig": {
      "unitType": "PIECE",
      "baseUnit": "pack",
      "basePrice": 160,
      "minQuantityMultiplier": 1,
      "maxQuantityMultiplier": 6,
      "stepQuantityMultiplier": 1,
      "allowCustomFractionalInput": false,
      "predefinedOptions": [
        {
          "id": "opt_colgate_pack",
          "label": "Twin Pack (300g)",
          "multiplier": 1,
          "unitLabel": "pack",
          "isDefault": true
        }
      ]
    },
    "currentStockInBaseUnits": 75,
    "lowStockThresholdInBaseUnits": 15,
    "isAvailable": true,
    "isFeatured": true,
    "tags": [
      "toothpaste",
      "oral care",
      "superstore"
    ],
    "createdAt": "2026-09-17T09:56:42.153Z",
    "updatedAt": "2026-09-17T09:56:42.153Z"
  },
  {
    "id": "prd_gupta_gen_atta",
    "shopId": "shop-1789137209564-317",
    "name": "Aashirvaad Shuddh Chakki Atta 5kg",
    "nameHindi": "आशीर्वाद चक्की आटा 5kg",
    "category": "Flour & Grains",
    "subCategory": "Wheat Flour",
    "description": "100% whole wheat flour crafted with superior wheat grains",
    "imageUrl": "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=500&auto=format&fit=crop&q=80",
    "fractionalConfig": {
      "unitType": "WEIGHT",
      "baseUnit": "kg",
      "basePrice": 48,
      "minQuantityMultiplier": 1,
      "maxQuantityMultiplier": 20,
      "stepQuantityMultiplier": 1,
      "allowCustomFractionalInput": true,
      "predefinedOptions": [
        {
          "id": "opt_ash_5kg",
          "label": "5 kg Pack",
          "multiplier": 5,
          "unitLabel": "kg",
          "isDefault": true
        },
        {
          "id": "opt_ash_10kg",
          "label": "10 kg Pack",
          "multiplier": 10,
          "unitLabel": "kg"
        }
      ]
    },
    "currentStockInBaseUnits": 120,
    "lowStockThresholdInBaseUnits": 20,
    "isAvailable": true,
    "isFeatured": true,
    "tags": [
      "atta",
      "wheat",
      "flour",
      "general store"
    ],
    "createdAt": "2026-09-17T09:56:42.153Z",
    "updatedAt": "2026-09-17T09:56:42.153Z"
  },
  {
    "id": "prd_gupta_gen_mustard_oil",
    "shopId": "shop-1789137209564-317",
    "name": "Fortune Kachi Ghani Mustard Oil 1L Bottle",
    "nameHindi": "फॉर्च्यून सरसों का तेल 1L",
    "category": "Oils & Ghee",
    "subCategory": "Mustard Oil",
    "description": "Cold-pressed authentic pungent mustard oil for traditional cooking",
    "imageUrl": "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=500&auto=format&fit=crop&q=80",
    "fractionalConfig": {
      "unitType": "VOLUME",
      "baseUnit": "L",
      "basePrice": 155,
      "minQuantityMultiplier": 1,
      "maxQuantityMultiplier": 8,
      "stepQuantityMultiplier": 1,
      "allowCustomFractionalInput": false,
      "predefinedOptions": [
        {
          "id": "opt_mustard_1l",
          "label": "1 Litre Bottle",
          "multiplier": 1,
          "unitLabel": "L",
          "isDefault": true
        }
      ]
    },
    "currentStockInBaseUnits": 65,
    "lowStockThresholdInBaseUnits": 10,
    "isAvailable": true,
    "isFeatured": true,
    "tags": [
      "oil",
      "mustard",
      "cooking",
      "general store"
    ],
    "createdAt": "2026-09-17T09:56:42.153Z",
    "updatedAt": "2026-09-17T09:56:42.153Z"
  }
] as unknown as Product[];

export function getFallbackProductsForShop(shopId: string): Product[] {
  if (!shopId) return [];
  const normalizedId = shopId.toLowerCase();
  return FALLBACK_PRODUCTS.filter(
    (p) => p.shopId?.toLowerCase() === normalizedId || (p as any).shopId?.includes(normalizedId)
  );
}
