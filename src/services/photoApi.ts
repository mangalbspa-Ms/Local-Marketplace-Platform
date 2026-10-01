/**
 * Photo Management API Service
 * 
 * Provides unified, role-safe photo management (Profile Photo & Cover Photo)
 * for Admin, Seller, and Customer profiles with gallery file uploads,
 * URL setting, and photo deletion.
 */

export interface ManagePhotoParams {
  type: 'profile' | 'cover';
  action: 'set' | 'remove';
  url?: string;
  imageData?: string; // base64 or data URL from file picker
}

export class PhotoApiService {
  private static getHeaders(role: 'admin' | 'seller' | 'customer' = 'customer'): HeadersInit {
    let token = '';
    let userId = '';

    if (role === 'admin') {
      token = localStorage.getItem('admin_auth_token') || 'token_usr_admin_01';
      userId = localStorage.getItem('admin_user_id') || 'usr_admin_01';
    } else if (role === 'seller') {
      userId = localStorage.getItem('seller_user_id') || 'usr_seller_01';
      token = localStorage.getItem('seller_auth_token') || `token_${userId}`;
    } else {
      token = localStorage.getItem('customer_auth_token') || 'token_usr_cust_01';
      userId = localStorage.getItem('customer_user_id') || 'usr_cust_01';
    }

    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'x-auth-user-id': userId,
    };
  }

  /**
   * Manage User Photo (Profile or Cover)
   * Enforces backend authorization checks:
   * - Admin can update any user's photos
   * - Non-admin can only update their own photos
   */
  public static async manageUserPhoto(
    userId: string,
    params: ManagePhotoParams,
    role: 'admin' | 'seller' | 'customer' = 'customer'
  ): Promise<any> {
    const res = await fetch(`/api/users/${userId}/photos`, {
      method: 'PATCH',
      headers: this.getHeaders(role),
      body: JSON.stringify(params),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error?.message || 'Failed to update user photo');
    }
    return data.data;
  }

  /**
   * Manage Shop Photo (Profile or Cover)
   * Enforces backend authorization checks:
   * - Admin can update any shop's photos
   * - Seller can only update their own shop's photos
   * - Customer is forbidden
   */
  public static async manageShopPhoto(
    shopId: string,
    params: ManagePhotoParams,
    role: 'admin' | 'seller' = 'seller'
  ): Promise<any> {
    const res = await fetch(`/api/shops/${shopId}/photos`, {
      method: 'PATCH',
      headers: this.getHeaders(role),
      body: JSON.stringify(params),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error?.message || 'Failed to update shop photo');
    }
    return data.data;
  }
}
