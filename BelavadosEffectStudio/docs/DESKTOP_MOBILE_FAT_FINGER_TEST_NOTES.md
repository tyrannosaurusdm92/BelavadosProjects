# Desktop + Mobile Fat-Finger Safety Test Notes

## Mobile behavior

- Mobile-first `index.html` remains responsive and portrait-preferred.
- `mobile.html` explicitly starts in mobile-preferred mode.
- Tools remain hidden behind dropdown/panel opening on mobile.
- Safe Scroll is ON by default.
- Touch Drawing must be armed before touch painting/fill/erase/pick actions.
- Pinch/wheel/fit/reset zoom behavior is preserved.

## Desktop behavior

- `desktop.html` explicitly hides the mobile dock and shows the desktop panel layout.
- The same `js/app.js` renderer powers desktop, mobile, and normal index entry.

## Regression-sensitive areas

- Brush stroke render functions are animation-frame based; heavy `moteCount`, huge canvas sizes, and many lightning layers can become expensive on older phones.
- For phone use, keep image sizes under roughly 2500px on the long side when creating many live lightning layers.
- Exported HTML is standalone but large project JSON can make a large single file.
