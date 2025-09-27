# StellarRent - Media Assets Inventory

## 📁 Project Media Assets Overview

This document provides a comprehensive inventory of all media files available in the StellarRent project, organized by category and purpose.

---

## 🎨 Branding & Logo Assets

### Primary Branding (`/assets/`)
| File | Type | Dimensions | Purpose | Usage |
|------|------|------------|---------|-------|
| `stellarrentlogo.png` | PNG | Variable | Main project logo | Homepage, documentation, marketing |
| `stellarlogo.svg` | SVG | Vector | Stellar blockchain logo | Partner recognition, technical docs |
| `onlydustlogo.svg` | SVG | Vector | OnlyDust community logo | Community recognition, contributor docs |
| `flow-stellar-rent.png` | PNG | Variable | Architecture diagram | Technical documentation, README |

### Web Application Assets (`/apps/web/public/`)

#### UI Icons (`/icons/`)
| File | Type | Format | Purpose |
|------|------|--------|---------|
| `agenda.webp` | Icon | WebP | Calendar/scheduling features |
| `calendar.webp` | Icon | WebP | Date selection, booking calendar |
| `heart.webp` | Icon | WebP | Favorites, wishlist functionality |
| `homepage-arrow.webp` | Icon | WebP | Navigation arrows, call-to-action |
| `location.webp` | Icon | WebP | Location services, map features |
| `lock.webp` | Icon | WebP | Security, authentication features |
| `menu.webp` | Icon | WebP | Mobile navigation menu |
| `message.webp` | Icon | WebP | Messaging, communication features |
| `search.webp` | Icon | WebP | Search functionality |
| `send.webp` | Icon | WebP | Send actions, form submissions |
| `settings.webp` | Icon | WebP | User settings, preferences |

#### Property Images (`/images/`)
| File | Type | Format | Purpose |
|------|------|--------|---------|
| `house.webp` | Property | WebP | Default property placeholder |
| `house1.webp` | Property | WebP | Sample property image 1 |
| `house2.webp` | Property | WebP | Sample property image 2 |
| `house3.webp` | Property | WebP | Sample property image 3 |
| `house4.webp` | Property | WebP | Sample property image 4 |
| `house5.webp` | Property | WebP | Sample property image 5 |

#### UI Elements
| File | Type | Format | Purpose |
|------|------|--------|---------|
| `logo.png` | Logo | PNG | Application logo |
| `map-pointer.png` | Icon | PNG | Map location markers |
| `file.svg` | Icon | SVG | File upload, document features |
| `globe.svg` | Icon | SVG | Global features, international |
| `next.svg` | Logo | SVG | Next.js framework logo |
| `vercel.svg` | Logo | SVG | Vercel deployment platform |
| `window.svg` | Icon | SVG | Window management, UI elements |

---

## 📊 Media Usage Guidelines

### Branding Assets
- **Primary Logo**: Use `stellarrentlogo.png` for main project branding
- **Partner Logos**: Use SVG versions for scalability in documentation
- **Architecture Diagram**: Use `flow-stellar-rent.png` for technical explanations

### Web Assets
- **Icons**: All icons are optimized WebP format for web performance
- **Property Images**: Use for placeholder content and UI demonstrations
- **UI Elements**: SVG format for crisp rendering at any size

### File Format Recommendations
- **Web Use**: Prefer WebP for images, SVG for icons and logos
- **Documentation**: PNG for screenshots, SVG for diagrams
- **Print**: Use high-resolution PNG versions when available

---

## 🎯 Media Asset Optimization

### Current Optimization Status
- ✅ **WebP Format**: All web icons and images use WebP for optimal performance
- ✅ **SVG Icons**: Vector graphics for scalable UI elements
- ✅ **Compressed Assets**: Images optimized for web delivery
- 🔄 **Responsive Images**: Consider adding multiple sizes for different screen densities

### Performance Impact
- **WebP Icons**: ~70% smaller than equivalent PNG files
- **SVG Elements**: Infinitely scalable without quality loss
- **Optimized Loading**: Assets load efficiently across all devices

---

## 📱 Responsive Design Assets

### Mobile-First Approach
All media assets are designed with mobile-first principles:
- **Touch-Friendly Icons**: Minimum 44px touch targets
- **High-DPI Support**: Crisp rendering on retina displays
- **Fast Loading**: Optimized file sizes for mobile networks

### Breakpoint Considerations
- **Mobile**: < 768px - Optimized for small screens
- **Tablet**: 768px - 1024px - Balanced for medium screens
- **Desktop**: > 1024px - Full resolution for large displays

---

## 🔧 Technical Implementation

### Asset Loading Strategy
```typescript
// Example: Optimized image loading
import Image from 'next/image'

// WebP with fallback
<Image
  src="/icons/search.webp"
  alt="Search"
  width={24}
  height={24}
  priority={false}
/>
```

### CDN Considerations
- **Static Assets**: Served from `/public/` directory
- **Dynamic Assets**: User-uploaded property images via Supabase Storage
- **Caching**: Implement proper cache headers for static assets

---

## 📈 Media Asset Roadmap

### Planned Enhancements
1. **High-DPI Assets**: Add @2x and @3x versions for retina displays
2. **Dark Mode Assets**: Create dark theme variations of UI elements
3. **Animation Assets**: Add Lottie animations for enhanced UX
4. **Accessibility**: Ensure all assets meet WCAG 2.1 AA standards

### Content Strategy
1. **Property Photography**: Guidelines for host-uploaded images
2. **Brand Consistency**: Style guide for community contributions
3. **Localization**: Multi-language asset considerations

---

## 🎨 Asset Creation Guidelines

### For Contributors
When adding new media assets:

1. **Format Standards**:
   - Icons: SVG preferred, WebP for complex graphics
   - Images: WebP for photos, PNG for graphics with transparency
   - Logos: SVG for scalability

2. **Naming Conventions**:
   - Use kebab-case: `property-card-icon.webp`
   - Include size indicators: `logo-32px.svg`
   - Version control: `hero-image-v2.webp`

3. **Optimization**:
   - Compress images before committing
   - Use appropriate dimensions for intended use
   - Test on multiple devices and screen densities

---

## 📞 Asset Management

### File Organization
- **Branding**: `/assets/` - Project-wide branding elements
- **Web UI**: `/apps/web/public/` - Frontend-specific assets
- **Documentation**: Embedded in markdown files
- **User Content**: Supabase Storage for dynamic content

### Version Control
- All assets tracked in Git repository
- Use Git LFS for large binary files
- Maintain asset change history for rollback capability

---

*This inventory provides a complete overview of all media assets in the StellarRent project, ensuring proper organization and optimal usage across the platform.*
