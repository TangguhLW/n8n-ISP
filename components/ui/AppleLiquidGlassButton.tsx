'use client';
import type { ComponentPropsWithRef, CSSProperties } from 'react';

export type GlassMaterial = 'milky' | 'smoky' | 'clear' | 'elevated';
type Props = ComponentPropsWithRef<'button'> & {
  material?: GlassMaterial;
  loading?: boolean;
  arrow?: boolean;
  width?: CSSProperties['width'];
};

export function AppleLiquidGlassButton({
  children = 'Get started', material = 'milky', loading = false,
  arrow = true, width = 166, className = '', style, disabled, type = 'button', ...props
}: Props) {
  return <button {...props} type={type} disabled={disabled || loading}
    aria-busy={loading || undefined} data-material={material}
    className={`liquid-button glass-surface ${className}`} style={{ width, ...style }}>
    <span className="glass-reflection" aria-hidden="true" />
    <span className="liquid-label">{children}</span>
    {arrow && <span className="liquid-arrow" aria-hidden="true">
      {loading ? <svg viewBox="0 0 24 24"><path d="M8 4h8M8 20h8M9 4v4l3 4-3 4v4m6-16v4l-3 4 3 4v4" /></svg>
        : <svg viewBox="0 0 24 24"><path d="M5 12h14m-6-6 6 6-6 6" /></svg>}
    </span>}
  </button>;
}
