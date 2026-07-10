import { createContext } from 'react';

/**
 * AdminContext — the plain React context object.
 *
 * Kept in its own file so that AdminContext.jsx contains ONLY the
 * AdminProvider component export, satisfying Vite Fast Refresh's
 * requirement that a file exports either components or non-component
 * values, but never both.
 */
export const AdminContext = createContext();
