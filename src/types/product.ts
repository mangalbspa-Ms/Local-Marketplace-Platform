/**
 * Product, Fractional Units, and Inventory Types
 */

export enum ProductUnitType {
  WEIGHT = 'WEIGHT',     // Measured in kg, g
  VOLUME = 'VOLUME',     // Measured in L, ml
  PIECE = 'PIECE',       // Measured in piece, packet, box, bunch, dozen
}

// Alias for ease of use
export const UnitType = ProductUnitType;
export type UnitType = ProductUnitType;

export type BaseUnit =
  | 'kg'
  | 'g'
  | 'gram'
  | 'L'
  | 'litre'
  | 'ml'
  | 'piece'
  | 'packet'
  | 'pack'
  | 'loaf'
  | 'strip'
  | 'kit'
  | 'set'
  | 'box'
  | 'bottle'
  | 'can'
  | 'tray'
  | 'bunch'
  | 'dozen'
  | 'pouch'
  | 'bundle'
  | 'pair';

export interface PredefinedQuantityOption {
  id: string;
  label: string;         // e.g. "250 g", "500 g", "1 kg", "5 kg", "1 Dozen"
  multiplier: number;    // Multiplier relative to the base unit price (e.g. 250g in kg = 0.25)
  unitLabel: string;     // e.g. "grams", "kg", "pieces"
  isDefault?: boolean;
}

export interface FractionalUnitConfig {
  unitType: ProductUnitType;
  baseUnit: BaseUnit;                    // Standard reference unit (e.g. 'kg', 'L', 'piece')
  basePrice: number;                     // Server price for 1 baseUnit (e.g. ₹100 per 1 kg)
  minQuantityMultiplier: number;         // e.g. 0.05 (50g) or 1 (1 piece)
  maxQuantityMultiplier: number;         // e.g. 50 (50 kg)
  stepQuantityMultiplier: number;        // e.g. 0.05 (steps of 50g)
  allowCustomFractionalInput: boolean;   // Whether user can enter arbitrary amounts (e.g. 350g)
  allowAmountBasedPurchase?: boolean;    // e.g. "Buy for ₹50" (calculates 500g at ₹100/kg)
  amountQuickPills?: number[];           // e.g. [20, 50, 100, 200, 500]
  predefinedOptions: PredefinedQuantityOption[]; // Quick select options
}

export interface ProductInventory {
  currentStockInBaseUnits: number;
  lowStockThreshold: number;
  isLowStock?: boolean;
}

export interface Product {
  id: string;
  shopId: string;                        // Scoped strictly to shop
  masterProductId?: string;              // Optional reference to Central Master Catalogue item
  name: string;
  nameHindi?: string;
  brand?: string;
  category: string;
  subCategory?: string;
  description: string;
  imageUrl: string;
  sku?: string;
  barcode?: string;
  baseUnit?: BaseUnit;
  basePricePerUnit?: number;
  fractionalConfig: FractionalUnitConfig;
  currentStockInBaseUnits: number;       // e.g. 100.0 (100 kg)
  lowStockThresholdInBaseUnits: number;  // e.g. 5.0 (5 kg)
  minStockAlert?: number;
  inventory?: ProductInventory;
  isAvailable: boolean;                  // Manual seller toggle
  isActive?: boolean;
  isFeatured?: boolean;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Central Master Catalogue Item
 * Admin defines name, photo, category, subcategory, Hindi/English names and aliases once centrally.
 * Prices and stock are strictly NOT set in the Master Catalogue; each shop sets them independently.
 */
export interface MasterProduct {
  id: string;
  name: string;                          // सामान का नाम (Canonical English / General Name)
  nameHindi: string;                     // सामान का नाम (Hindi Name)
  aliases?: string[];                    // English name / aliases केवल पहचान के लिए
  category: string;                      // Category
  subCategory?: string;                  // Subcategory
  imageUrl?: string;                     // सामान की फोटो
  brand?: string;                        // Brand (optional)
  defaultUnit?: BaseUnit | string;       // Default measuring unit (e.g. 'kg', 'packet', 'piece', 'L')
  barcode?: string;                      // Barcode / SKU code for scanning
  description?: string;                  // Generic item description
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMasterProductDTO {
  name: string;
  nameHindi: string;
  aliases?: string[];
  category: string;
  subCategory?: string;
  imageUrl?: string;
  brand?: string;
  defaultUnit?: string;
  barcode?: string;
  description?: string;
}

export interface UpdateMasterProductDTO extends Partial<CreateMasterProductDTO> {
  isActive?: boolean;
}

export interface CreateProductDTO {
  name: string;
  nameHindi?: string;
  brand?: string;
  category: string;
  subCategory?: string;
  description: string;
  imageUrl?: string;
  sku?: string;
  barcode?: string;
  unitType: ProductUnitType;
  baseUnit: BaseUnit;
  basePrice: number;
  currentStock: number;
  lowStockThreshold: number;
  minStockAlert?: number;
  allowCustomFractionalInput?: boolean;
  predefinedOptions?: Array<{
    label: string;
    multiplier: number;
    unitLabel: string;
  }>;
}

export interface UpdateProductDTO extends Partial<CreateProductDTO> {
  isAvailable?: boolean;
  isActive?: boolean;
}
