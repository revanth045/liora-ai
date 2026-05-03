import * as React from 'react';
import type { MenuMeta, MenuFont, MenuSize } from '../demoDb';
void React;

export const MENU_FONTS: { value: MenuFont; label: string; sample: string; group: 'Serif' | 'Sans' | 'Display' | 'Mono' }[] = [
  { value: 'Fraunces',           label: 'Fraunces',           sample: 'Aa', group: 'Serif' },
  { value: 'Playfair Display',   label: 'Playfair Display',   sample: 'Aa', group: 'Display' },
  { value: 'Cormorant Garamond', label: 'Cormorant Garamond', sample: 'Aa', group: 'Serif' },
  { value: 'DM Serif Display',   label: 'DM Serif Display',   sample: 'Aa', group: 'Display' },
  { value: 'Italiana',           label: 'Italiana',           sample: 'Aa', group: 'Display' },
  { value: 'Bodoni Moda',        label: 'Bodoni Moda',        sample: 'Aa', group: 'Display' },
  { value: 'Lora',               label: 'Lora',               sample: 'Aa', group: 'Serif' },
  { value: 'Crimson Pro',        label: 'Crimson Pro',        sample: 'Aa', group: 'Serif' },
  { value: 'Plus Jakarta Sans',  label: 'Plus Jakarta Sans',  sample: 'Aa', group: 'Sans' },
  { value: 'Inter',              label: 'Inter',              sample: 'Aa', group: 'Sans' },
  { value: 'DM Sans',            label: 'DM Sans',            sample: 'Aa', group: 'Sans' },
  { value: 'Manrope',            label: 'Manrope',            sample: 'Aa', group: 'Sans' },
  { value: 'Space Grotesk',      label: 'Space Grotesk',      sample: 'Aa', group: 'Sans' },
  { value: 'JetBrains Mono',     label: 'JetBrains Mono',     sample: 'Aa', group: 'Mono' },
];

export const PRESET_PALETTES: { name: string; meta: Partial<MenuMeta> }[] = [
  { name: 'Forest Linen',   meta: { accentColor: '#14532d', backgroundColor: '#fbf7ef', textColor: '#1c1917', headingColor: '#14532d', priceColor: '#14532d', cardColor: '#ffffff', borderColor: '#e7e0cf', bgKind: 'linen' } },
  { name: 'Onyx & Gold',    meta: { accentColor: '#e7c384', backgroundColor: '#0f0c0a', textColor: '#f5e9d3', headingColor: '#f5e9d3', priceColor: '#e7c384', cardColor: '#1a1410', borderColor: '#3a2f23', bgKind: 'solid' } },
  { name: 'Champagne',      meta: { accentColor: '#a07c2c', backgroundColor: '#fdf6e8', textColor: '#3a2c14', headingColor: '#5c3f15', priceColor: '#a07c2c', cardColor: '#fffaee', borderColor: '#e6d6a3', bgKind: 'paper' } },
  { name: 'Crimson Vintage',meta: { accentColor: '#7f1d1d', backgroundColor: '#fdf3ec', textColor: '#3a1a1a', headingColor: '#7f1d1d', priceColor: '#7f1d1d', cardColor: '#fffaf6', borderColor: '#e7c8b6', bgKind: 'paper' } },
  { name: 'Midnight Velvet',meta: { accentColor: '#c084fc', backgroundColor: '#0c0a17', textColor: '#e9e3f5', headingColor: '#f3e8ff', priceColor: '#c084fc', cardColor: '#1a1428', borderColor: '#3a2e54', bgKind: 'solid' } },
  { name: 'Coastal Mist',   meta: { accentColor: '#0f766e', backgroundColor: '#f0fdfa', textColor: '#134e4a', headingColor: '#134e4a', priceColor: '#0f766e', cardColor: '#ffffff', borderColor: '#a7e0d6', bgKind: 'solid' } },
  { name: 'Saffron Dunes',  meta: { accentColor: '#c2410c', backgroundColor: '#fffaf0', textColor: '#3a2412', headingColor: '#7c2d12', priceColor: '#c2410c', cardColor: '#fff5e6', borderColor: '#fbd9b3', bgKind: 'paper' } },
  { name: 'Snow Marble',    meta: { accentColor: '#0c0a09', backgroundColor: '#fafaf9', textColor: '#1c1917', headingColor: '#0c0a09', priceColor: '#0c0a09', cardColor: '#ffffff', borderColor: '#e5e5e5', bgKind: 'solid' } },
];

const SIZE_BODY: Record<MenuSize, string> = { sm: '13px', md: '15px', lg: '17px', xl: '19px' };
const SIZE_TITLE: Record<MenuSize, string> = { sm: '28px', md: '36px', lg: '48px', xl: '64px' };
const RADIUS: Record<NonNullable<MenuMeta['cornerRadius']>, string> = { none: '0', sm: '8px', md: '14px', lg: '22px', pill: '32px' };
const SPACING: Record<NonNullable<MenuMeta['spacing']>, string> = { tight: '0.5rem', cozy: '0.875rem', roomy: '1.25rem', airy: '1.75rem' };
const TRACK: Record<NonNullable<MenuMeta['letterSpacing']>, string> = { tight: '-0.02em', normal: '0', wide: '0.04em', wider: '0.12em' };

export type MenuTheme = ReturnType<typeof getMenuTheme>;

export function getMenuTheme(meta: MenuMeta | undefined | null) {
  const m = meta || {};
  const accent       = m.accentColor       || '#14532d';
  const bg           = m.backgroundColor   || '#fbf7ef';
  const text         = m.textColor         || '#1c1917';
  const heading      = m.headingColor      || text;
  const price        = m.priceColor        || accent;
  const card         = m.cardColor         || '#ffffff';
  const border       = m.borderColor       || '#e7e0cf';
  const titleFont    = m.titleFont         || 'Fraunces';
  const bodyFont     = m.bodyFont          || 'Plus Jakarta Sans';
  const priceFont    = m.priceFont         || titleFont;
  const baseSize     = m.baseSize          || 'md';
  const titleSize    = m.titleSize         || 'lg';
  const radius       = m.cornerRadius      || 'lg';
  const spacing      = m.spacing           || 'cozy';
  const tracking     = m.letterSpacing     || 'normal';
  const layout       = m.layout            || 'classic';
  const cardStyle    = m.cardStyle         || (layout === 'grid' || layout === 'magazine' ? 'card' : 'row');
  const imageShape   = m.imageShape        || (cardStyle === 'card' ? 'circle' : 'none');
  const divider      = m.divider           || 'line';
  const bgKind       = m.bgKind            || 'solid';

  let pageBackground = bg;
  if (bgKind === 'gradient') {
    pageBackground = `linear-gradient(135deg, ${m.bgGradientFrom || bg}, ${m.bgGradientTo || accent})`;
  } else if (bgKind === 'image' && m.bgImageUrl) {
    pageBackground = `linear-gradient(${bg}cc, ${bg}cc), url(${m.bgImageUrl}) center/cover`;
  } else if (bgKind === 'paper') {
    pageBackground = `${bg} repeating-linear-gradient(0deg, transparent 0 24px, rgba(0,0,0,0.012) 24px 25px)`;
  } else if (bgKind === 'linen') {
    pageBackground = `${bg} repeating-linear-gradient(45deg, rgba(0,0,0,0.02) 0 1px, transparent 1px 6px), repeating-linear-gradient(-45deg, rgba(0,0,0,0.02) 0 1px, transparent 1px 6px)`;
  } else if (bgKind === 'noise') {
    pageBackground = `${bg} radial-gradient(rgba(0,0,0,.04) 1px, transparent 1px) 0 0/4px 4px`;
  }

  return {
    raw: m,
    colors: { accent, bg, text, heading, price, card, border },
    fonts: { title: titleFont, body: bodyFont, price: priceFont },
    sizes: { body: SIZE_BODY[baseSize], title: SIZE_TITLE[titleSize] },
    layout, cardStyle, imageShape, divider, headerStyle: m.headerStyle || 'hero',
    headerAlign: m.headerAlign || 'left',
    show: {
      descriptions: m.showDescriptions !== false,
      tags:         m.showTags !== false,
      prices:       m.showPrices !== false,
      dietary:      m.showDietaryIcons !== false,
    },
    css: {
      page: {
        background: pageBackground,
        color: text,
        fontFamily: `"${bodyFont}", system-ui, sans-serif`,
        letterSpacing: TRACK[tracking],
      } as React.CSSProperties,
      title: {
        fontFamily: `"${titleFont}", Georgia, serif`,
        color: heading,
        fontSize: SIZE_TITLE[titleSize],
        letterSpacing: TRACK[tracking],
      } as React.CSSProperties,
      sectionLabel: {
        fontFamily: `"${titleFont}", Georgia, serif`,
        color: heading,
      } as React.CSSProperties,
      itemName: {
        fontFamily: `"${titleFont}", Georgia, serif`,
        color: heading,
      } as React.CSSProperties,
      description: {
        fontFamily: `"${bodyFont}", system-ui, sans-serif`,
        color: text,
        opacity: 0.85,
      } as React.CSSProperties,
      price: {
        fontFamily: `"${priceFont}", Georgia, serif`,
        color: price,
        fontWeight: 700,
      } as React.CSSProperties,
      card: {
        background: card,
        borderColor: border,
        borderRadius: RADIUS[radius],
      } as React.CSSProperties,
      gap: SPACING[spacing],
      radius: RADIUS[radius],
    },
  };
}

export function dividerGlyph(theme: MenuTheme): string {
  switch (theme.divider) {
    case 'dots':   return '· · ·';
    case 'ornate': return '❦';
    case 'double': return '═';
    case 'none':   return '';
    default:       return '—';
  }
}
