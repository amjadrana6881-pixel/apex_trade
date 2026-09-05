import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';
import { connectToDatabase } from './db';
import User from '@/models/User';

export const JWT_SECRET = process.env.JWT_SECRET || 'apextrade_super_secure_jwt_secret_key_2026_x991';

export function signJwtToken(payload, expiresIn = '30d') {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

export function verifyJwtToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

export async function getAuthenticatedUser(request) {
  try {
    let token = null;

    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else {
      const cookieHeader = request.headers.get('cookie');
      if (cookieHeader) {
        const match = cookieHeader.match(/token=([^;]+)/);
        if (match) token = match[1];
      }
    }

    if (!token) return null;

    const decoded = verifyJwtToken(token);
    if (!decoded || !decoded.id) return null;

    await connectToDatabase();
    const user = await User.findById(decoded.id);
    if (!user || user.status === 'BANNED') return null;

    return user;
  } catch (err) {
    console.error('getAuthenticatedUser error:', err);
    return null;
  }
}

export async function requireAuth(request) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return {
      errorResponse: NextResponse.json(
        { success: false, message: 'Authentication required. Please log in.' },
        { status: 401 }
      ),
      user: null
    };
  }
  return { errorResponse: null, user };
}

export async function requireAdmin(request) {
  const user = await getAuthenticatedUser(request);
  if (!user || user.role !== 'admin') {
    return {
      errorResponse: NextResponse.json(
        { success: false, message: 'Access denied. Master Administrator privileges required.' },
        { status: 403 }
      ),
      user: null
    };
  }
  return { errorResponse: null, user };
}
