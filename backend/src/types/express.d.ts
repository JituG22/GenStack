declare global {
  namespace Express {
    interface User {
      id: string;
      email: string;
      role: string;
      organization: string;
    }
  }
}

export {};
