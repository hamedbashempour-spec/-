/**
 * User Source Abstraction Layer
 *
 * Separates user data retrieval and authentication from the rest of the application.
 * Currently backed by users.xlsx (Temporary / Test User Source), but can easily be
 * swapped with a Dynamic API, External Portal, or Remote Database in the future
 * without rewriting any application components.
 *
 * Architecture:
 * UserSource (e.g. Excel / API / Webhook) -> UserRepository -> Application
 */

export interface AppUserRecord {
  id?: string;
  username: string;
  password?: string;
  name: string;
  phone?: string;
  licenseNumber?: string;
  nationalId?: string;
  role: 'admin' | 'user';
  membershipExpireDate?: string;
  licenseExpireDate?: string;
  capacity?: number;
  meterage?: number;
  city?: string;
  province?: string;
  extra?: Record<string, any>;
}

export interface IUserSource {
  readonly sourceName: string;
  readonly isDynamic: boolean;
  getAllUsers(): Promise<AppUserRecord[]> | AppUserRecord[];
  getUserByUsername(username: string): Promise<AppUserRecord | null> | AppUserRecord | null;
  verifyCredentials(username: string, password: string): Promise<AppUserRecord | null> | AppUserRecord | null;
  saveUser?(user: AppUserRecord): Promise<boolean> | boolean;
  deleteUser?(username: string): Promise<boolean> | boolean;
}

/**
 * Repository wrapper that exposes user services to the rest of the application.
 * In the future, switching from Excel to a dynamic external API only requires
 * setting a new IUserSource instance here.
 */
class UserRepository {
  private source: IUserSource;

  constructor(source: IUserSource) {
    this.source = source;
  }

  public setSource(newSource: IUserSource) {
    console.log(`[UserRepository] Switching user source from ${this.source.sourceName} to ${newSource.sourceName}`);
    this.source = newSource;
  }

  public getSourceInfo() {
    return {
      name: this.source.sourceName,
      isDynamic: this.source.isDynamic,
    };
  }

  public async getAllUsers(): Promise<AppUserRecord[]> {
    return await this.source.getAllUsers();
  }

  public async getUserByUsername(username: string): Promise<AppUserRecord | null> {
    return await this.source.getUserByUsername(username);
  }

  public async verifyCredentials(username: string, password: string): Promise<AppUserRecord | null> {
    return await this.source.verifyCredentials(username, password);
  }

  public async saveUser(user: AppUserRecord): Promise<boolean> {
    if (this.source.saveUser) {
      return await this.source.saveUser(user);
    }
    return false;
  }

  public async deleteUser(username: string): Promise<boolean> {
    if (this.source.deleteUser) {
      return await this.source.deleteUser(username);
    }
    return false;
  }
}

/**
 * Default User Source: Memory / Bridge placeholder for client-side or
 * fallback usage. Server-side uses ExcelUserSource in server.ts.
 */
class TemporaryLocalUserSource implements IUserSource {
  public readonly sourceName = 'TemporaryLocalExcelBridge';
  public readonly isDynamic = false;

  public async getAllUsers(): Promise<AppUserRecord[]> {
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      return data.users || [];
    } catch {
      return [];
    }
  }

  public async getUserByUsername(username: string): Promise<AppUserRecord | null> {
    const users = await this.getAllUsers();
    return users.find((u) => u.username === username) || null;
  }

  public async verifyCredentials(username: string, password: string): Promise<AppUserRecord | null> {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (data.success && data.user) {
        return data.user;
      }
      return null;
    } catch {
      return null;
    }
  }
}

export const userRepository = new UserRepository(new TemporaryLocalUserSource());
