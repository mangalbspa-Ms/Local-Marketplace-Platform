/**
 * Auth Controller
 */

import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service.ts';
import { ResponseUtil } from '../utils/response.ts';
import { ValidationError, NotFoundError, ForbiddenError } from '../utils/errors.ts';
import { db } from '../storage/db.ts';
import { UserRole } from '../../types/auth.ts';
import { ImageStorageService } from '../services/imageStorage.service.ts';

export class AuthController {
  public static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { phone, userId } = req.body;
      const target = phone || userId;

      if (!target) {
        throw new ValidationError('Phone number or userId is required for login.');
      }

      const session = AuthService.authenticateUser(target);
      return ResponseUtil.success(res, session, 'Authentication successful');
    } catch (err) {
      next(err);
    }
  }

  public static async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const profile = AuthService.getUserProfile(req.user!.userId);
      return ResponseUtil.success(res, profile);
    } catch (err) {
      next(err);
    }
  }

  public static async listTestAccounts(req: Request, res: Response, next: NextFunction) {
    try {
      const accounts = AuthService.listAvailableRoleAccounts();
      return ResponseUtil.success(res, accounts, 'Test accounts retrieved');
    } catch (err) {
      next(err);
    }
  }

  public static async addAddress(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const user = db.getUserById(userId);
      const {
        tag,
        label,
        recipientName,
        recipientPhone,
        addressLine1,
        streetAddress,
        addressLine2,
        landmark,
        area,
        city,
        state,
        district,
        postOffice,
        pincode,
        coordinates,
        isDefault,
      } = req.body;

      const finalStreet = (streetAddress || addressLine1 || '').trim();
      const finalCity = (city || 'Mumbai').trim();
      const finalPincode = (pincode || '').trim();

      if (!finalStreet || !finalPincode) {
        throw new ValidationError('Street address and pincode are required.');
      }

      const finalTag = label || tag || 'Home';
      const finalName = recipientName || user?.fullName || 'Customer';
      const finalPhone = recipientPhone || user?.phone || '';

      const updated = AuthService.addAddress(userId, {
        tag: finalTag,
        label: finalTag,
        recipientName: finalName,
        recipientPhone: finalPhone,
        addressLine1: finalStreet,
        streetAddress: finalStreet,
        addressLine2,
        landmark: landmark ? landmark.trim() : undefined,
        area: area ? area.trim() : undefined,
        city: finalCity,
        state: state ? state.trim() : undefined,
        district: district ? district.trim() : undefined,
        postOffice: postOffice ? postOffice.trim() : undefined,
        pincode: finalPincode,
        coordinates: coordinates && typeof coordinates.lat === 'number' && typeof coordinates.lng === 'number'
          ? { lat: Number(coordinates.lat), lng: Number(coordinates.lng) }
          : undefined,
        isDefault: !!isDefault,
      });

      return ResponseUtil.created(res, updated, 'Address added successfully');
    } catch (err) {
      next(err);
    }
  }

  public static async deleteAddress(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const updated = AuthService.deleteAddress(userId, req.params.id);
      return ResponseUtil.success(res, updated, 'Address removed');
    } catch (err) {
      next(err);
    }
  }

  public static async setDefaultAddress(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const updated = AuthService.setDefaultAddress(userId, req.params.id);
      return ResponseUtil.success(res, updated, 'Default address updated');
    } catch (err) {
      next(err);
    }
  }

  public static async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const updated = AuthService.updateProfile(userId, req.body);
      return ResponseUtil.success(res, updated, 'Profile updated successfully');
    } catch (err) {
      next(err);
    }
  }

  public static async getInvitationDetails(req: Request, res: Response, next: NextFunction) {
    try {
      const { token } = req.params;
      if (!token) throw new ValidationError('Invitation token is required');
      const inv = db.getSellerInvitationByToken(token);
      if (!inv) throw new NotFoundError('Invalid invitation token');
      const shop = db.getShopById(inv.shopId);
      return ResponseUtil.success(res, {
        invitation: inv,
        shop,
      }, 'Invitation details retrieved');
    } catch (err) {
      next(err);
    }
  }

  public static async acceptInvitation(req: Request, res: Response, next: NextFunction) {
    try {
      const { token } = req.body;
      if (!token) throw new ValidationError('Invitation token is required');
      const { seller, shop, invitation } = db.acceptSellerInvitation(token);
      const session = AuthService.authenticateUser(seller.phone || seller.id);
      return ResponseUtil.success(res, {
        ...session,
        shop,
        invitation,
      }, 'Seller invitation accepted. Logged in successfully!');
    } catch (err) {
      next(err);
    }
  }

  public static async manageUserPhoto(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      const caller = req.user!;

      // Authorization check (Requirement 12):
      // Admin can update any user's photos.
      // Non-admin can ONLY update their own photos.
      if (caller.role !== UserRole.ADMIN && caller.userId !== userId) {
        throw new ForbiddenError('You do not have permission to manage photos for another user.');
      }

      const { type, action, url, imageData } = req.body;
      if (!type || !['profile', 'cover'].includes(type)) {
        throw new ValidationError('Photo type must be either "profile" or "cover".');
      }
      if (!action || !['set', 'remove'].includes(action)) {
        throw new ValidationError('Action must be either "set" or "remove".');
      }

      const user = db.getUserById(userId);
      if (!user) throw new NotFoundError('User', userId);

      let finalUrl = '';
      if (action === 'set') {
        if (imageData) {
          const uploadFolder = type === 'cover' ? 'covers' : 'profiles';
          const uploadRes = await ImageStorageService.uploadImage(imageData, uploadFolder);
          finalUrl = uploadRes.url;
        } else if (url && typeof url === 'string') {
          finalUrl = url.trim();
        } else {
          throw new ValidationError('Either imageUrl or imageData must be provided when setting photo.');
        }
      }

      if (type === 'profile') {
        user.avatarUrl = finalUrl;
        user.profilePhotoUrl = finalUrl;
      } else {
        user.coverPhotoUrl = finalUrl;
      }

      const saved = db.saveUser(user);
      return ResponseUtil.success(
        res,
        saved,
        `User ${type} photo ${action === 'set' ? 'updated' : 'removed'} successfully`
      );
    } catch (err) {
      next(err);
    }
  }

  public static async manageMyPhoto(req: Request, res: Response, next: NextFunction) {
    req.params.userId = req.user!.userId;
    return AuthController.manageUserPhoto(req, res, next);
  }

  public static async registerSeller(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        sellerName,
        phone,
        email,
        shopName,
        category,
        description,
        address,
        pincode,
        postalData,
        coordinates,
        locationAccuracy,
        locationSource,
        upiPayoutId,
        paymentName,
        whatsapp,
        photoUrl,
        coverPhotoUrl,
        marketId,
      } = req.body;

      if (!sellerName || !sellerName.trim()) {
        throw new ValidationError('विक्रेता का नाम (Seller Name) आवश्यक है।');
      }
      if (!phone || !phone.trim() || phone.replace(/\D/g, '').length < 10) {
        throw new ValidationError('मान्य 10-अंकीय मोबाइल नंबर आवश्यक है।');
      }
      if (!shopName || !shopName.trim()) {
        throw new ValidationError('दुकान का नाम (Shop Name) आवश्यक है।');
      }
      if (!category || !category.trim()) {
        throw new ValidationError('दुकान की श्रेणी (Category) आवश्यक है।');
      }
      if (!address || !address.trim()) {
        throw new ValidationError('दुकान का पूरा पता (Address) आवश्यक है।');
      }
      if (!coordinates || typeof coordinates.lat !== 'number' || typeof coordinates.lng !== 'number') {
        throw new ValidationError('दुकान की सटीक लोकेशन (GPS Coordinates) आवश्यक है।');
      }

      const { seller, shop } = db.registerSellerAndShop({
        sellerName: sellerName.trim(),
        phone: phone.trim(),
        email: email?.trim(),
        shopName: shopName.trim(),
        category: category.trim(),
        description: description?.trim(),
        address: address.trim(),
        pincode: pincode?.trim(),
        postalData,
        coordinates,
        locationAccuracy: typeof locationAccuracy === 'number' ? locationAccuracy : undefined,
        locationSource: locationSource || 'gps',
        upiPayoutId: upiPayoutId?.trim(),
        paymentName: paymentName?.trim(),
        whatsapp: whatsapp?.trim(),
        photoUrl,
        coverPhotoUrl,
        marketId,
      });

      const token = `token_${seller.id}`;

      return ResponseUtil.success(
        res,
        {
          token,
          user: seller,
          shop,
        },
        'दुकान का पंजीकरण सफलतापूर्वक जमा हो गया है। एडमिन सत्यापन के उपरांत यह चालू हो जाएगी।'
      );
    } catch (err) {
      next(err);
    }
  }
}

