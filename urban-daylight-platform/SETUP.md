# Urban Daylight Platform - Quick Setup Guide

## 🎯 What This Is

An educational web platform for architecture students to explore and compare urban daylight and energy performance across different cities.

## 📋 Quick Start (First Time Setup)

### 1. Prerequisites Check
- ✅ Node.js 18+ installed
- ✅ Modern web browser (Chrome, Firefox, Edge)

### 2. One-Time Setup

```powershell
# Navigate to project
cd urban-daylight-platform

# Install dependencies (already done if you see node_modules/)
npm install

# Verify images are in place
# Should see: public/ELEPHANT_AND_CASTLE, public/GARNIZON, public/HUDSON_YARDS
```

### 3. Start Development Server

```powershell
npm run dev
```

Then open: http://localhost:3000

## 🎓 How to Use the Platform

### Homepage
- View intro and IEA context
- See all cities in the sidebar
- Click cities on the interactive map
- Select a city to view details

### City Detail Page
- Explore urban indicators
- View seasonal shading analysis
- Study detailed quarterly data
- Access daylight metrics (DF, sDA, UDI)
- Click "Compare with..." to compare cities

### Comparison Mode
- View two cities side-by-side
- Toggle "Show Insights" for educational explanations
- Compare all metrics simultaneously
- Understand why one city performs better

## 🔧 Development Commands

```powershell
# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

## 📁 Project Structure Overview

```
urban-daylight-platform/
├── public/
│   ├── data/cities.json         # City data
│   └── [CITY_FOLDERS]/          # Images
├── src/
│   ├── components/              # UI components
│   ├── pages/                   # Route pages
│   ├── hooks/                   # Data fetching
│   ├── utils/                   # Helpers & insights
│   └── types/                   # TypeScript types
└── [config files]
```

## 🎨 Key Features

✨ **Interactive Map** - Leaflet-based world map with city markers  
📊 **Data Visualizations** - Metrics, charts, analysis images  
⚖️ **Side-by-Side Comparison** - Compare two cities directly  
💡 **Educational Insights** - Auto-generated explanations  
📱 **Responsive Design** - Works on all screen sizes  
🎯 **Scalable** - Easy to add more cities

## 🆕 Adding New Cities

### Quick Method:
1. Add city data to `public/data/cities.json`
2. Create folder `public/CITY_NAME/` with images
3. Refresh the app - city appears automatically!

### Full Method:
1. Update Excel file with new city data
2. Run: `python ../convert_to_json.py` (from parent directory)
3. Copy city images to `public/CITY_NAME/`
4. Restart dev server

## 🐛 Troubleshooting

**White screen / no cities?**
- Check browser console (F12)
- Verify `public/data/cities.json` exists
- Check network tab for failed image loads

**Images not loading?**
- Verify folder names match exactly (case-sensitive)
- Check image paths in cities.json
- Ensure images are in `public/` directory

**Map not appearing?**
- Check browser console for Leaflet errors
- Verify internet connection (loads map tiles)

**Can't install dependencies?**
- Delete `node_modules/` and `package-lock.json`
- Run `npm install` again
- Check Node.js version: `node --version` (need 18+)

## 📚 Educational Context

This platform teaches students about:
- Daylight Factor (DF) analysis
- Spatial Daylight Autonomy (sDA)
- Useful Daylight Illuminance (UDI)
- Urban morphology & density
- Sustainable urban design principles

Inspired by the IEA's mission to promote data-driven decision-making in energy and urban development.

## 🚀 Performance Tips

- Images are loaded on-demand
- Data is cached in browser
- Use production build for better performance
- Consider hosting on Vercel/Netlify for free

## 📞 Need Help?

1. Check browser console for errors
2. Review README.md for detailed docs
3. Verify all files are in correct locations
4. Ensure latest Node.js LTS version

---

**Happy exploring! 🏙️✨**
