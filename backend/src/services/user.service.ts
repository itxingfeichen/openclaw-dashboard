/**
 * User Service
 * Handles user-related business logic
 */

export interface User {
  id: string;
  username: string;
  email: string;
  password: string;
  name?: string;
  displayName?: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserInput {
  email: string;
  username: string;
  password: string;
  name?: string;
  role?: string;
}

export interface UpdateUserInput {
  email?: string;
  username?: string;
  name?: string;
  displayName?: string;
  role?: string;
}

export interface FindAllOptions {
  offset: number;
  limit: number;
}

class UserService {
  private users: Map<string, User> = new Map();

  constructor() {
    // Initialize with a default admin user
    const adminUser: User = {
      id: 'admin-001',
      email: 'admin@example.com',
      username: 'admin',
      password: 'admin123',
      name: 'Administrator',
      displayName: 'Admin',
      role: 'admin',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(adminUser.id, adminUser);
  }

  /**
   * Find all users with pagination
   */
  findAll(options: FindAllOptions): User[] {
    const allUsers = Array.from(this.users.values());
    return allUsers.slice(options.offset, options.offset + options.limit);
  }

  /**
   * Count total users
   */
  count(): number {
    return this.users.size;
  }

  create(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): User {
    const newUser: User = {
      ...user,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(newUser.id, newUser);
    return newUser;
  }

  findById(id: string): User | undefined {
    return this.users.get(id);
  }

  findByEmail(email: string): User | undefined {
    return Array.from(this.users.values()).find((u) => u.email === email);
  }

  findByUsername(username: string): User | undefined {
    return Array.from(this.users.values()).find((u) => u.username === username);
  }

  update(id: string, updates: Partial<User>): User | undefined {
    const user = this.users.get(id);
    if (!user) return undefined;

    const updatedUser: User = {
      ...user,
      ...updates,
      displayName: updates.displayName || updates.name || user.displayName,
      updatedAt: new Date(),
    };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  delete(id: string): boolean {
    return this.users.delete(id);
  }

  exists(email?: string, username?: string, excludeId?: string): boolean {
    return Array.from(this.users.values()).some(
      (u) =>
        u.id !== excludeId &&
        ((email && u.email === email) || (username && u.username === username))
    );
  }
}

export const userService = new UserService();
