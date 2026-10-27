import type { Metadata } from 'next';
import './globals.css';
export const metadata:Metadata={title:'ATH AI Command Center',description:'Pusat operasi AI lokal untuk riset, produksi konten, dan review.'};
export default function RootLayout({children}:{children:React.ReactNode}) {return <html lang="id"><body>{children}</body></html>;}
