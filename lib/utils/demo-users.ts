import demoUsersData from '@/data/demo-users.json';

export interface DemoUser {
  id: string;
  username: string;
  password: string;
  email: string;
  role: 'admin' | 'viewer';
  organization: string;
}

export interface DemoCredentials {
  username: string;
  password: string;
  role: string;
}

export function getDemoUsers(): DemoUser[] {
  return demoUsersData.users.map(user => ({
    ...user,
    role: user.role as 'admin' | 'viewer'
  }));
}

export function getDemoCredentials(): DemoCredentials[] {
  return demoUsersData.users.map(user => ({
    username: user.username,
    password: user.password,
    role: user.role
  }));
}

export function getDemoCredentialsForDisplay(): string[] {
  return demoUsersData.users.map(user => 
    `${user.role.charAt(0).toUpperCase() + user.role.slice(1)}: ${user.username} / ${user.password}`
  );
}
