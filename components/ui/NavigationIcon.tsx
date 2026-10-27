const paths: Record<string, string> = {
  command: 'M4 5h16v14H4z M8 9l3 3-3 3 M13 15h4',
  whatsapp: 'M3 3h6v6H3z M15 3h6v6h-6z M3 15h6v6H3z M15 15h3v3h3v3h-6z M21 12v3 M12 3v6 M3 12h6 M12 12v9',
  overview: 'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',
  live: 'M2 12h4l3-7 5 14 3-7h5',
  agents: 'M7 8h10a3 3 0 0 1 3 3v7H4v-7a3 3 0 0 1 3-3z M12 3v5 M8 12v2 M16 12v2 M8 21h8',
  workflows: 'M4 3h6v6H4z M14 15h6v6h-6z M7 9v9h7 M10 6h7v9',
  executions: 'M9 5v14l11-7z M4 5v14',
  legal: 'M12 3v18 M6 21h12 M4 7h16 M6 7l-4 7h8z M18 7l-4 7h8z',
  studio: 'M4 3h12l4 4v14H4z M16 3v5h4 M8 12h8 M8 16h5',
  tiktok: 'M14 3v13a4 4 0 1 1-4-4 M14 3c0 4 3 5 6 5',
  instagram: 'M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4z M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0 M17 7h.01',
  queue: 'M8 5h13 M8 12h13 M8 19h13 M3 5h.01 M3 12h.01 M3 19h.01',
  logs: 'M4 4h16v16H4z M7 8l3 3-3 3 M12 16h5',
  diagnostics: 'M3 12h3l3-8 6 16 3-8h3',
  backups: 'M4 9h16v12H4z M3 3h18v6H3z M9 13h6',
  notifications: 'M6 9a6 6 0 0 1 12 0v7l2 2H4l2-2z M10 21h4',
  settings: 'M4 7h16 M4 17h16 M8 4v6 M16 14v6',
  documentation: 'M3 4h7l2 2 2-2h7v16h-7l-2 2-2-2H3z M12 6v16',
};
export function NavigationIcon({ name }: { name: string }) {
  return <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name] || paths.overview} /></svg>;
}
