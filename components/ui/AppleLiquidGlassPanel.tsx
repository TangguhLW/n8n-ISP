import type { CSSProperties, HTMLAttributes } from 'react';
import type { GlassMaterial } from './AppleLiquidGlassButton';

type Props = HTMLAttributes<HTMLElement> & {
  as?: 'section' | 'div' | 'aside';
  material?: GlassMaterial;
  radius?: number;
};

export function AppleLiquidGlassPanel({
  as: Element = 'section', material = 'smoky', radius = 26, className = '', children, style, ...props
}: Props) {
  return <Element {...props} data-material={material} className={`liquid-panel glass-surface ${className}`}
    style={{ '--glass-radius': `${radius}px`, ...style } as CSSProperties}>
    <span className="glass-reflection" aria-hidden="true" />
    <div className="glass-content">{children}</div>
  </Element>;
}
