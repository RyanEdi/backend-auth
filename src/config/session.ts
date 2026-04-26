import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import pool from './database';

const sessionSecret = process.env.SESSION_SECRET;

if (!sessionSecret) {
  console.error('SESSION_SECRET nao definido no ambiente.');
  process.exit(1);
}

const PgSessionStore = connectPgSimple(session);

export const createSessionMiddleware = () =>
  session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    store: new PgSessionStore({
      pool,
      tableName: 'user_sessions',
      createTableIfMissing: true,
    }),
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'strict',
      maxAge: 3 * 60 * 60 * 1000,
    },
  });
