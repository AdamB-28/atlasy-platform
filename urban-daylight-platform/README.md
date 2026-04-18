# Urban Daylight & Energy Platform

> An educational web platform for studying daylight, lighting, and energy performance in urban environments.

## 🎯 Project Overview

This platform is designed for architecture, urbanism, lighting design, and energy engineering students to explore how cities interact with daylight and energy. It provides data-driven analysis and comparison tools for real-world case studies, inspired by the International Energy Agency's (IEA) mission for sustainable urban development.

## ✨ Key Features

- 📍 **Interactive Map** - Explore cities on an interactive world map
- 🏙️ **City Detail Pages** - In-depth analysis of each urban development
- ⚖️ **Comparison Mode** - Side-by-side comparison of two cities
- 💡 **Insights Layer** - Educational explanations of performance differences
- 📊 **Data Visualization** - Metrics, charts, and analysis images
- 🎨 **Modern Design** - Clean, architectural, minimal aesthetic
- 📱 **Responsive** - Works on desktop, tablet, and mobile devices

## 🛠️ Technology Stack

- **Frontend Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router v6
- **Maps**: Leaflet + React Leaflet
- **Icons**: Lucide React
- **Data Format**: JSON (converted from Excel)

## 📁 Project Structure

```
urban-daylight-platform/
├── public/
│   ├── data/
│   │   └── cities.json              # City data (generated)
│   ├── ELEPHANT_AND_CASTLE/         # Images for Elephant & Castle
│   ├── GARNIZON/                    # Images for Garnizon
│   └── HUDSON_YARDS/                # Images for Hudson Yards
├── src/
│   ├── components/                  # Reusable UI components
│   │   ├── CityCard.tsx
│   │   ├── InteractiveMap.tsx
│   │   ├── Layout.tsx
│   │   ├── LoadingStates.tsx
│   │   └── QuarterDetail.tsx
│   ├── hooks/                       # Custom React hooks
│   │   └── useCitiesData.ts
│   ├── pages/                       # Route pages
│   │   ├── HomePage.tsx
│   │   ├── CityPage.tsx
│   │   └── ComparePage.tsx
│   ├── types/                       # TypeScript type definitions
│   │   └── index.ts
│   ├── utils/                       # Utility functions
│   │   ├── helpers.ts
│   │   └── insights.ts
│   ├── App.tsx                      # App routing
│   ├── main.tsx                     # App entry point
│   └── index.css                    # Global styles
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Python 3.8+ (for data conversion)

### Installation & Setup

1. **Navigate to the project directory:**
   ```bash
   cd urban-daylight-platform
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Copy city images to public directory:**
   ```bash
   # Windows PowerShell
   Copy-Item -Path "../ELEPHANT_AND_CASTLE" -Destination "public/" -Recurse
   Copy-Item -Path "../GARNIZON" -Destination "public/" -Recurse
   Copy-Item -Path "../HUDSON_YARDS" -Destination "public/" -Recurse
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

5. **Open your browser:**
   Navigate to `http://localhost:3000`

### Building for Production

```bash
npm run build
npm run preview
```

## 📊 Data Management

### Converting Excel to JSON

The platform uses a Python script to convert Excel data to JSON format:

```bash
# From the root Atlasy directory
python convert_to_json.py
```

This generates `public/data/cities.json` with structured data for all cities.

### Data Structure

Each city includes:
- **Location** - Coordinates, country, location images
- **Timeline** - Development years and description
- **Overview** - General description, schwarzplan, 3D model
- **Urban Indicators** - Density, green space, building types
- **Shading Analysis** - Seasonal shading patterns
- **Quarters** - Detailed analysis per urban block/quarter
  - Urban indicators (intensity, coverage, floors, trees)
  - Daylight Factor (DF)
  - Spatial Daylight Autonomy (sDA)
  - Useful Daylight Illuminance (UDI)

## 🎓 Educational Features

### Metrics Explained

- **Daylight Factor (DF)** - Ratio of interior to exterior illuminance under overcast sky
- **Spatial Daylight Autonomy (sDA)** - Percentage of floor area receiving adequate daylight
- **Useful Daylight Illuminance (UDI)** - Time when daylight levels are in useful range (100-3000 lux)
- **Building Intensity** - Density of development
- **Green Space Ratio** - Percentage of biologically active area

### Comparison & Insights

The comparison mode generates educational insights that explain:
- Why one city performs better in specific metrics
- How urban form influences daylight access
- Trade-offs between density and environmental quality
- Design strategies for improving daylight performance

## 🔮 Future Scalability

The platform is designed to easily accommodate:
- ✅ More cities (simply add data and images)
- ✅ Additional metrics (extend data schema)
- ✅ Multiple quarters per city (already supported)
- ✅ Different seasons/times (shading analysis structure)
- ✅ Advanced visualizations (Recharts integration ready)

### Adding a New City

1. Add city data to Excel file (or directly to `cities.json`)
2. Create folder in `public/` with city images
3. Run data conversion script
4. City automatically appears in the platform

## 📝 License & Attribution

This educational platform is inspired by the International Energy Agency's mission to promote sustainable urban development through data-driven analysis and transparency.

**For educational use in architecture and urban studies programs.**

## 🤝 Contributing

To expand this platform:
1. Add new cities and data
2. Enhance insights logic in `src/utils/insights.ts`
3. Create new visualization components
4. Extend comparison features
5. Add educational content and explanations

## 📧 Support

This platform is designed for educational use. For questions about:
- **Data interpretation** - Refer to IEA resources and urban daylight literature
- **Technical issues** - Check browser console and network tab
- **Adding content** - Follow the data structure in `src/types/index.ts`

---

**Built with care for the next generation of architects and urban planners** 🏗️✨
