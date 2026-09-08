/**
 * Authentication Service
 */

import { User, UserRole, AuthSession } from '../../types/auth.ts';
import { db } from '../storage/db.ts';
import { UnauthorizedError, NotFoundError, ValidationError } from '../utils/errors.ts';

export class AuthService {
  /**
   * Mock / Passwordless OTP or fast role switcher for development & sandbox testing
   */
  public static authenticateUser(phoneOrId: string): AuthSession {
    const clean = phoneOrId.trim();
    let user = db.getUserById(clean) || db.getUserByPhone(clean);

    if (!user) {
      throw new UnauthorizedError(`User account matching '${clean}' was not found.`);
    }

    if (!user.isActive) {
      throw new UnauthorizedError('User account is suspended.');
    }

    // Standard bearer token identifier
    const token = `token_${user.id}`;
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    return {
      token,
      user,
      expiresAt,
    };
  }

  public static getUserProfile(userId: string): User {
    const user = db.getUserById(userId);
    if (!user) {
      throw new NotFoundError('User', userId);
    }
    return user;
  }

  public static listAvailableRoleAccounts(): User[] {
    return db.getUsers();
  }

  public static addAddress(userId: string, addressData: any): User {
    return db.addUserAddress(userId, addressData);
  }

  public static deleteAddress(userId: string, addressId: string): User {
    return db.deleteUserAddress(userId, addressId);
  }

  public static setDefaultAddress(userId: string, addressId: string): User {
    return db.setDefaultUserAddress(userId, addressId);
  }

  public static updateProfile(userId: string, updates: Partial<User>): User {
    return db.updateUserProfile(userId, updates);
  }
}
