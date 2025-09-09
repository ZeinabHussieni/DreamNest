import React from 'react';

export const MemoryRouter: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <div data-testid="router">{children}</div>
);
export const BrowserRouter = MemoryRouter;

export const Routes: React.FC<{ children?: React.ReactNode }> = ({ children }) => <>{children}</>;
export const Route: React.FC<{ element: React.ReactElement }> = ({ element }) => element;

export const Navigate: React.FC<{ to: string; replace?: boolean; state?: any }> = ({ to }) => (
  <div>Navigate:{to}</div>
);

export const Link: React.FC<{ to: string | number; children?: React.ReactNode } & Record<string, any>> = ({ to, children, ...rest }) => (
  <a href={String(to)} {...rest}>{children}</a>
);

export const Outlet: React.FC = () => null;

export function useLocation() { return { pathname: '/' }; }
export function useNavigate() { return () => {}; }
export function useParams() { return {}; }


test('react-router-dom shim loads', () => expect(true).toBe(true));


