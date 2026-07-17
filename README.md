# Goxune · Okindegia · Gozotegia · Kafetegia

Sitio web oficial de **Goxune**, panadería, pastelería y cafetería en Bera (Navarra).

Web estática multilingüe (ES / EN / EU) optimizada para SEO local, rendimiento y
accesibilidad. Lista para **GitHub Pages**: el contenido vive en la raíz del repo.

## Estructura

```
/                  → index.html (redirección automática por idioma del navegador)
/es/  /en/  /eu/   → cada idioma en su propia carpeta (páginas independientes)
/assets/
  ├── css/         → tokens, fuentes, estilos y componentes
  ├── js/          → app.js (loader, GSAP, nav, i18n), lang-redirect.js, vendor/GSAP
  ├── fonts/       → Fraunces + Hanken Grotesk (self-hosted, woff2)
  ├── icons/       → logo, favicon (svg/ico/png), apple-touch
  ├── images/      → fotos reales del local + stock libre (WebP), og-image
  └── video/       → hero 60 fps (Ken-Burns de fotos reales)
robots.txt · sitemap.xml · site.webmanifest · 404.html · .nojekyll
```

## Idiomas

- Detección automática por idioma del navegador en `/index.html`.
- **El euskara nunca se selecciona por defecto** (solo de forma manual).
- Idioma elegido manualmente se recuerda (localStorage) en visitas futuras.
- `hreflang` + `x-default` en cada página; sitemap con alternativas por idioma.

## Características

- Diseño artesano cálido (terracota / crema / madera), tipografía premium.
- Animaciones GSAP + ScrollTrigger, microinteracciones, botones magnéticos,
  parallax reactivo al ratón, page-loader solo en la primera visita de la sesión.
- SVGs animados (vapor, espiga, croissant) en lugar de emojis.
- 6 imágenes por página, grids simétricos (sin filas huérfanas), 100 % responsive.
- SEO completo: meta, Open Graph, Twitter Cards, JSON-LD (negocio local + breadcrumb),
  geo-tags, canonical, sitemap, robots.
- Accesibilidad: contraste AA/AAA, foco visible, navegación por teclado, `prefers-reduced-motion`.
- Páginas legales (España): aviso legal, privacidad (RGPD/LOPDGDD) y cookies.
- 404 personalizada con redirección inteligente por idioma.

## Despliegue en GitHub Pages

1. Sube **el contenido de esta carpeta** a la raíz de un repositorio.
2. Settings → Pages → Deploy from branch → `main` / `root`.
3. (Opcional) Dominio propio: añade un archivo `CNAME` con `goxunekafetegia.com` y configura el DNS.

> Si se usa un dominio propio en la raíz, las rutas absolutas (`/es/`, `/assets/`)
> funcionan directamente. Para un subpath (`usuario.github.io/repo/`), sirve el sitio
> bajo dominio propio o ajusta las rutas absolutas de `404.html`.

## Regenerar el sitio

Las páginas se generan con un pequeño generador en Python (carpeta `../build`):

```bash
cd ../build && python generate.py
```

---

Diseñado y desarrollado por [unaxaller.com](https://unaxaller.com).
