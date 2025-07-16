// JWT utilities - temporarily simplified to avoid version conflicts

export const generateToken = (payload: object): string => {
  // TODO: Implement JWT generation
  return 'mock-token';
};

export const verifyToken = (token: string): any => {
  // TODO: Implement JWT verification
  return { id: 'mock-user-id' };
};
