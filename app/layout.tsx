import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Card Zone TCG — Registration',
  description: 'Pendaftaran turnamen Card Zone TCG'
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="id"><body>{children}</body></html>;
}
