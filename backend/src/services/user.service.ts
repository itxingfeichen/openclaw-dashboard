// Mock user storage service (replace with database in production)
export interface User {
  id: string;
  username: string;
  email: string;
  password: string;
  displayName?: string;
  createdAt: string;
  updatedAt: string;
}

class UserService {
  private users: Map<string, User> = new Map();

  create(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): User {
    const newUser: User = {
      ...user,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
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
      updatedAt: new Date().toISOString(),
    };
    this.users.set(id, updatedUser);
    return updatedUser;
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
