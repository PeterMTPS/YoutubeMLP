// Turns YouTube's own color tokens into a Pinkie Pie palette.
// Shared by content.js; kept separate so the color logic is easy to tweak.

const PonyPalette = (() => {
  const PINK_HUE = 326;
  const LAVENDER_HUE = 278;

  function parseColor(value) {
    const v = value.trim().toLowerCase();
    let m = v.match(/^#([0-9a-f]{3,8})$/);
    if (m) {
      let hex = m[1];
      if (hex.length <= 4) {
        hex = [...hex].map((c) => c + c).join("");
      }
      const n = (i) => parseInt(hex.slice(i, i + 2), 16);
      return { r: n(0), g: n(2), b: n(4), a: hex.length === 8 ? n(6) / 255 : 1 };
    }
    m = v.match(/^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:[\s,/]+([\d.]+%?))?\s*\)$/);
    if (m) {
      let a = m[4] === undefined ? 1 : parseFloat(m[4]);
      if (m[4]?.endsWith("%")) {
        a /= 100;
      }
      return { r: +m[1], g: +m[2], b: +m[3], a };
    }
    if (v === "white") return { r: 255, g: 255, b: 255, a: 1 };
    if (v === "black") return { r: 0, g: 0, b: 0, a: 1 };
    return null;
  }

  function toHsl({ r, g, b }) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const l = (max + min) / 2;
    const d = max - min;
    if (d === 0) {
      return { h: 0, s: 0, l };
    }
    const s = d / (1 - Math.abs(2 * l - 1));
    let h;
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    return { h: (h * 60 + 360) % 360, s, l };
  }

  function toCss({ h, s, l }, a) {
    const alpha = a < 1 ? ` / ${+a.toFixed(3)}` : "";
    return `hsl(${Math.round(h)} ${+(s * 100).toFixed(1)}% ${+(l * 100).toFixed(1)}%${alpha})`;
  }

  function pinkify(value) {
    const c = parseColor(value);
    if (!c) {
      return null;
    }
    const { h, s, l } = toHsl(c);

    // Greys, black and white: the bulk of the UI.
    if (s < 0.12) {
      if (c.a < 0.5) {
        // Hover/press overlays: tint them instead of plain black/white.
        return l < 0.5
          ? `rgb(120 24 82 / ${+(c.a * 0.9).toFixed(3)})`
          : `rgb(255 196 228 / ${+c.a.toFixed(3)})`;
      }
      if (l === 0 && c.a === 1) {
        return null;
      }
      // Darks get a small lift so they read as plum rather than black.
      const lightness = l < 0.5 ? Math.max(l, 0.085) : Math.min(l, 0.975);
      const sat = l < 0.5
        ? 0.24 + 0.22 * (1 - 2 * l)
        : 0.15 + 0.72 * (2 * l - 1) ** 2;
      return toCss({ h: PINK_HUE - 6 * (1 - l), s: sat, l: lightness }, c.a);
    }

    // Blues (links, buttons, "call to action") become lavender.
    if (h >= 190 && h <= 255 && s > 0.3) {
      return toCss({ h: LAVENDER_HUE, s: Math.min(s, 0.85), l }, c.a);
    }

    // Reds (badges, live, progress) become hot pink.
    if ((h < 14 || h > 344) && s > 0.45) {
      return toCss({ h: 332, s, l }, c.a);
    }

    return null;
  }

  // Selector rewrite: ":not(#ponytube-x)" adds ID-level specificity, so our
  // copy always wins over YouTube's original rule regardless of load order.
  function boostSelector(selector) {
    return selector
      .split(",")
      .map((part) => `${part.trim()}:not(#ponytube-x)`)
      .join(", ");
  }

  function isTokenRule(rule) {
    // Cheap checks first: YouTube's sheets have thousands of rules.
    if (rule.type !== 1 || rule.style.length < 8) {
      return false;
    }
    const first = rule.selectorText.charCodeAt(0);
    if (first !== 104 && first !== 58 && first !== 91) {
      // not "h"tml, ":"root or "["attr]
      return false;
    }
    if (rule.selectorText.includes("#ponytube-x")) {
      return false;
    }
    if (!/^(\s*(html|:root|\[[^\]]+\])[^,{]*,?)+$/.test(rule.selectorText)) {
      return false;
    }
    let colorVars = 0;
    for (const prop of rule.style) {
      if (prop.startsWith("--") && parseColor(rule.style.getPropertyValue(prop))) {
        colorVars += 1;
        if (colorVars >= 8) {
          return true;
        }
      }
    }
    return false;
  }

  function buildCss(rules) {
    const out = [];
    for (const rule of rules) {
      const decls = [];
      for (const prop of rule.style) {
        if (!prop.startsWith("--")) {
          continue;
        }
        const next = pinkify(rule.style.getPropertyValue(prop));
        if (next) {
          decls.push(`${prop}:${next}`);
        }
      }
      if (decls.length) {
        out.push(`${boostSelector(rule.selectorText)}{${decls.join(";")}}`);
      }
    }
    return out.join("\n");
  }

  // Finds YouTube's token rules. Returns { css, sources } or null.
  function generate() {
    const found = [];
    const sources = [];
    const sheets = [...document.styleSheets, ...(document.adoptedStyleSheets || [])];
    for (const sheet of sheets) {
      if (sheet.ownerNode?.id === "ponytube-palette") {
        continue;
      }
      let rules;
      try {
        rules = sheet.cssRules;
      } catch {
        continue;
      }
      let hit = false;
      for (const rule of rules) {
        if (isTokenRule(rule)) {
          found.push(rule);
          hit = true;
        }
      }
      if (hit) {
        sources.push(sheet.href || "inline");
      }
    }
    return found.length ? { css: buildCss(found), sources } : null;
  }

  return { generate, pinkify };
})();
