import { env } from '@config/index';
import jwt, { JwtPayload, SignOptions } from 'jsonwebtoken';

export type TokenPayload = JwtPayload & {
  sub: string;
  roles: string[];
  email?: string;
  tokenId?: string;
};

//JWT has three main methods 
// sign -> sign the token (Create the token)
// verify -> verify that token is created by this backend
// defcode -> decode the token
export const signAccessToken = (
  payload: TokenPayload,
  options: SignOptions = {}
) => {
  //@ts-ignore
  return jwt.sign(
    { ...payload, tokenId: undefined },
    env.JWT_ACCESS_SECRET as any,
    {
      expiresIn: env.JWT_ACCESS_EXPIRES_IN,
      ...options,
    }
  );
};

export const signRefreshToken = (payload: TokenPayload, options: SignOptions = {}) => {
    //@ts-ignore
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
    ...options
  });
};

export const verifyAccessToken = (token: string): TokenPayload => {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as TokenPayload;
};

export const verifyRefreshToken = (token: string): TokenPayload => {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as TokenPayload;
};

export const decodeToken = (token: string): TokenPayload | null => {
  try {
    return jwt.decode(token) as TokenPayload | null;
  } catch {
    return null;
  }
};

