"""
Convert CSV data to cities.json for the Urban Daylight Platform.
Based on precise column-by-column analysis of ATLASY_DANE_260412(Arkusz1).csv
Separator: ; | Encoding: cp1250
Row 5 = Elephant and Castle, Row 6 = Garnizon, Row 7 = Hudson Yards
"""
import pandas as pd
import json
import os
import re

CSV_FILE = 'ATLASY_DANE_260412(Arkusz1).csv'
OUTPUT = os.path.join('urban-daylight-platform', 'public', 'data', 'cities.json')

try:
    df = pd.read_csv(CSV_FILE, sep=';', header=None, encoding='cp1250')
except Exception:
    df = pd.read_csv(CSV_FILE, sep=';', header=None, encoding='latin-1')

print(f"CSV loaded: {df.shape[0]} rows x {df.shape[1]} cols")


def translate(text):
    """Translate known Polish strings to English."""
    if text is None:
        return None
    # Handle mangled cp1250 encoding where Polish chars become ?
    # "?rednia warto?? sDA wynosi X%" -> "The average sDA value is X%"
    text = re.sub(
        r'[?ŚśS][?r]ednia warto[?śs][?ćc] sDA wynosi\s*',
        'The average sDA value is ',
        text
    )
    # Also handle proper Unicode versions
    text = re.sub(
        r'(?:Średnia|średnia) wartość sDA wynosi\s*',
        'The average sDA value is ',
        text
    )
    # Patterns matching mangled encoding (? instead of Polish chars)
    polish_to_english = [
        # Hudson Yards building types
        ('kwarta? zwartej zabudowy na planie prostok?ta tworzony przez wie?owce, wewn?trz kwarta?u przestrze? publiczna',
         'Compact block development on a rectangular plan formed by skyscrapers, with public space inside the block'),
        ('kwartał zwartej zabudowy na planie prostokąta tworzony przez wieżowce, wewnątrz kwartału przestrzeń publiczna',
         'Compact block development on a rectangular plan formed by skyscrapers, with public space inside the block'),
        # Hudson Yards transport
        ('Hudson Yards zosta? zaprojektowany z my?l? o p?ynnej integracji z istniej?c? tkank? miejsk?',
         'Hudson Yards was designed to seamlessly integrate with the existing urban fabric'),
        ('Hudson Yards został zaprojektowany z myślą o płynnej integracji z istniejącą tkanką miejską',
         'Hudson Yards was designed to seamlessly integrate with the existing urban fabric'),
        ('bezpo?rednie po??czenie z High Line, popularnym parkiem linearowym',
         'direct connection to the High Line, a popular linear park'),
        ('bezpośrednie połączenie z High Line, popularnym parkiem linearowym',
         'direct connection to the High Line, a popular linear park'),
        ('nowa stacja metra 34th Street\u2013Hudson Yards, zapewniaj?ca ?atwy dost?p do innych cz??ci miasta',
         'new 34th Street\u2013Hudson Yards metro station, providing easy access to other parts of the city'),
        ('nowa stacja metra 34th Street–Hudson Yards, zapewniająca łatwy dostęp do innych części miasta',
         'new 34th Street–Hudson Yards metro station, providing easy access to other parts of the city'),
        # UDI conclusions
        ('Ni?sze warto?ci UDI w strefie przyokiennej wynikaj? z przekroczenia górnego progu u?ytecznego nat??enia o?wietlenia',
         'Lower UDI values in the window zone result from exceeding the upper threshold of useful lighting intensity'),
        ('Niższe wartości UDI w strefie przyokiennej wynikają z przekroczenia górnego progu użytecznego natężenia oświetlenia',
         'Lower UDI values in the window zone result from exceeding the upper threshold of useful lighting intensity'),
        ('Pomimo wysokiego poziomu do?wietlenia, warto?ci te klasyfikowane s? jako nadmierne (UDI-high) i nie s? uwzgl?dniane w wska?niku UDI-acceptable',
         'Despite high light levels, these values are classified as excessive (UDI-high) and are not included in the UDI-acceptable indicator'),
        ('Pomimo wysokiego poziomu doświetlenia, wartości te klasyfikowane są jako nadmierne (UDI-high) i nie są uwzględniane w wskaźniku UDI-acceptable',
         'Despite high light levels, these values are classified as excessive (UDI-high) and are not included in the UDI-acceptable indicator'),
        ('UDI nie mierzy \u201eile ?wiat?a\u201d, tylko czy ?wiat?o mie?ci si? w przedziale u?ytecznym',
         'UDI does not measure "how much light" but whether the light falls within the useful range'),
        ('UDI nie mierzy „ile światła", tylko czy światło mieści się w przedziale użytecznym',
         'UDI does not measure "how much light" but whether the light falls within the useful range'),
        ('Potencja? energii s?onecznej', 'Solar energy potential'),
        ('Potencjał energii słonecznej', 'Solar energy potential'),
    ]
    for pl, en in polish_to_english:
        if pl in text:
            text = text.replace(pl, en)
    return text


def get(row, col):
    """Return cleaned string value or None."""
    if col is None or col >= len(row):
        return None
    val = row.iloc[col]
    if pd.isna(val):
        return None
    s = str(val).strip()
    if s.lower() in ('', 'no data', 'brak', 'nan'):
        return None
    return translate(s)


def get_raw(row, col):
    """Return raw numeric value or None (no translation)."""
    if col is None or col >= len(row):
        return None
    val = row.iloc[col]
    if pd.isna(val):
        return None
    s = str(val).strip()
    if s.lower() in ('', 'no data', 'brak', 'nan', '-'):
        return None
    try:
        s_clean = s.replace(',', '.').replace('%', '').strip()
        return float(s_clean)
    except (ValueError, TypeError):
        return None


def clean_image(val):
    """Strip 'obrazek:' prefix from image references."""
    if val is None:
        return None
    if val.lower().startswith('obrazek:'):
        return val.split(':', 1)[1].strip()
    return val


def get_distribution(row, start_col, count):
    """Extract a distribution array of numeric values from consecutive columns."""
    values = []
    for i in range(count):
        val = get_raw(row, start_col + i)
        values.append(val)
    if any(v is not None for v in values):
        return values
    return None


SUN_HOURS_LABELS = ["0-1", "1-2", "2-3", "3-4", "4-5", "5-6", "6-7", "7-8", "8-9", "9+"]
DAYLIGHT_POT_LABELS = ["0-5", "5-10", "10-15", "15-19", "19-23", "23-27", "27-32", "32-37", "37+"]


def make_distribution_obj(values, labels, unit):
    """Create a distribution object with bins array."""
    if values is None:
        return None
    bins = []
    for i, label in enumerate(labels):
        v = values[i] if i < len(values) else None
        bins.append({"label": label, "value": v})
    return {"bins": bins, "unit": unit}


def make_quarter(row, q_num, plan_col, form3d_col, far_col, gar_col, coverage_col,
                 floors_col, trees_col, hw_col, streets_col, func_col,
                 sun_hours_col, daylight_pot_col, solar_energy_col,
                 df_start, sda_start, sda_interp_col, udi_start, udi_concl_col,
                 dp2_name=None,
                 sun_ground_start=None, sun_facade_start=None,
                 daylight_dist_start=None,
                 solar_specs_start=None):
    """Build a Quarter dict from explicit column numbers."""
    plan = get(row, plan_col)
    form3d = get(row, form3d_col)
    far = get(row, far_col)
    gar = get(row, gar_col)
    coverage = get(row, coverage_col)
    floors = get(row, floors_col)
    trees = get(row, trees_col)
    hw = get(row, hw_col)
    streets = get(row, streets_col)
    func = get(row, func_col)
    sun_hours = get(row, sun_hours_col) if sun_hours_col else None
    dp = get(row, daylight_pot_col) if daylight_pot_col else None
    se = get(row, solar_energy_col) if solar_energy_col else None

    has_any = any(v is not None for v in [
        plan, form3d, far, gar, coverage, floors, trees, hw, streets, func,
        sun_hours, dp, se
    ])

    df_img = clean_image(get(row, df_start)) if df_start else None
    sda_img = clean_image(get(row, sda_start)) if sda_start else None
    udi_img = clean_image(get(row, udi_start)) if udi_start else None

    if not has_any and df_img is None and sda_img is None and udi_img is None:
        return None

    quarter = {
        'id': q_num,
        'name': f'Quarter {q_num}',
        'plan': plan,
        'form3d': form3d,
        'far': far,
        'indicators': {
            'buildingIntensity': far,
            'greenSpaceRatio': gar,
            'buildingCoverage': coverage,
            'avgFloors': floors,
            'treeCount': trees,
            'heightToWidthRatio': hw,
            'streetWidth': streets,
        },
        'function': func,
        'sunHours': sun_hours,
        'daylightPotential': dp,
        'daylightPotential2': dp2_name,
        'solarEnergy': se,
    }

    # Distribution data
    if sun_ground_start is not None:
        ground = get_distribution(row, sun_ground_start, 10)
        facade = get_distribution(row, sun_facade_start, 10) if sun_facade_start else None
        if ground or facade:
            quarter['sunHoursDistribution'] = {}
            if ground:
                quarter['sunHoursDistribution']['ground'] = make_distribution_obj(ground, SUN_HOURS_LABELS, "hours")
            if facade:
                quarter['sunHoursDistribution']['facades'] = make_distribution_obj(facade, SUN_HOURS_LABELS, "hours")

    if daylight_dist_start is not None:
        daylight_dist = get_distribution(row, daylight_dist_start, 9)
        if daylight_dist:
            quarter['daylightPotentialDistribution'] = make_distribution_obj(daylight_dist, DAYLIGHT_POT_LABELS, "%")

    # Solar energy specs
    if solar_specs_start is not None:
        area = get_raw(row, solar_specs_start)
        total_energy = get_raw(row, solar_specs_start + 1)
        avg_energy = get_raw(row, solar_specs_start + 2)
        panel_area = get_raw(row, solar_specs_start + 3)
        annual_prod = get_raw(row, solar_specs_start + 4)
        if any(v is not None for v in [area, total_energy, avg_energy, panel_area, annual_prod]):
            quarter['solarEnergySpecs'] = {
                'area': area,
                'totalSolarEnergy': total_energy,
                'avgSolarEnergy': avg_energy,
                'panelArea': panel_area,
                'annualElectricity': annual_prod,
            }

    # Daylight Factor (DF)
    if df_start is not None:
        df_s1_img = clean_image(get(row, df_start))
        df_s1_avg = get(row, df_start + 1)
        df_s1_desc = get(row, df_start + 2)
        df_s2_img = clean_image(get(row, df_start + 3))
        df_s2_avg = get(row, df_start + 4)
        df_s2_desc = get(row, df_start + 5)
        if any(v is not None for v in [df_s1_img, df_s2_img]):
            quarter['daylightFactor'] = {
                'simulation1': {
                    'image': df_s1_img,
                    'avgValue': df_s1_avg,
                    'description': df_s1_desc,
                },
                'simulation2': {
                    'image': df_s2_img,
                    'avgValue': df_s2_avg,
                    'description': df_s2_desc,
                },
            }

    # Spatial Daylight Autonomy (sDA)
    if sda_start is not None:
        sda_s1_img = clean_image(get(row, sda_start))
        sda_s1_auto = get(row, sda_start + 1)
        sda_s2_img = clean_image(get(row, sda_start + 2))
        sda_s2_auto = get(row, sda_start + 3)
        sda_interp = get(row, sda_interp_col) if sda_interp_col else None
        if any(v is not None for v in [sda_s1_img, sda_s2_img]):
            quarter['spatialDaylightAutonomy'] = {
                'simulation1': {
                    'image': sda_s1_img,
                    'autonomy': sda_s1_auto,
                },
                'simulation2': {
                    'image': sda_s2_img,
                    'autonomy': sda_s2_auto,
                },
                'interpretation': sda_interp,
            }

    # Useful Daylight Illuminance (UDI)
    if udi_start is not None:
        udi_s1_img = clean_image(get(row, udi_start))
        udi_s1_res = get(row, udi_start + 1)
        udi_s2_img = clean_image(get(row, udi_start + 2))
        udi_s2_res = get(row, udi_start + 3)
        udi_concl = get(row, udi_concl_col) if udi_concl_col else None
        if any(v is not None for v in [udi_s1_img, udi_s2_img]):
            quarter['usefulDaylightIlluminance'] = {
                'simulation1': {
                    'image': udi_s1_img,
                    'avgValue': udi_s1_res,
                },
                'simulation2': {
                    'image': udi_s2_img,
                    'avgValue': udi_s2_res,
                },
                'interpretation': None,
                'conclusions': udi_concl,
            }

    return quarter


# ============================
# Build cities
# ============================
cities = []

COORDS = {
    'elephant-and-castle': {'lat': 51.4937, 'lng': -0.0996, 'zoom': 15},
    'garnizon': {'lat': 54.3813, 'lng': 18.5955, 'zoom': 15},
    'hudson-yards': {'lat': 40.7536, 'lng': -74.0019, 'zoom': 15},
}

CITY_ROWS = [
    {'row': 5, 'id': 'elephant-and-castle', 'name': 'Elephant and Castle'},
    {'row': 6, 'id': 'garnizon', 'name': 'Garnizon'},
    {'row': 7, 'id': 'hudson-yards', 'name': 'Hudson Yards'},
]

for cfg in CITY_ROWS:
    r = df.iloc[cfg['row']]
    cid = cfg['id']

    # Site-level distribution data
    site_sun_ground = get_distribution(r, 18, 10)
    site_sun_facades = get_distribution(r, 28, 10)
    site_daylight_dist = get_distribution(r, 39, 9)

    site_solar_area = get_raw(r, 49)
    site_solar_total = get_raw(r, 50)
    site_solar_avg = get_raw(r, 51)
    site_solar_panel = get_raw(r, 52)
    site_solar_annual = get_raw(r, 53)

    site_analysis = {
        'sunHoursImage': get(r, 17),
        'daylightPotentialImage': get(r, 38),
        'solarEnergyImage': get(r, 48),
    }

    if site_sun_ground or site_sun_facades:
        site_analysis['sunHoursDistribution'] = {}
        if site_sun_ground:
            site_analysis['sunHoursDistribution']['ground'] = make_distribution_obj(site_sun_ground, SUN_HOURS_LABELS, "hours")
        if site_sun_facades:
            site_analysis['sunHoursDistribution']['facades'] = make_distribution_obj(site_sun_facades, SUN_HOURS_LABELS, "hours")

    if site_daylight_dist:
        site_analysis['daylightPotentialDistribution'] = make_distribution_obj(site_daylight_dist, DAYLIGHT_POT_LABELS, "%")

    if any(v is not None for v in [site_solar_area, site_solar_total, site_solar_avg, site_solar_panel, site_solar_annual]):
        site_analysis['solarEnergySpecs'] = {
            'area': site_solar_area,
            'totalSolarEnergy': site_solar_total,
            'avgSolarEnergy': site_solar_avg,
            'panelArea': site_solar_panel,
            'annualElectricity': site_solar_annual,
        }

    city = {
        'id': cid,
        'name': cfg['name'],
        'location': {
            'country': get(r, 4),
            'coordinates': COORDS[cid],
            'imageUrl': get(r, 3),
        },
        'timeline': {
            'years': get(r, 5),
            'description': get(r, 6),
        },
        'overview': {
            'schwarzplanImage': get(r, 7),
            'model3dImage': get(r, 8),
            'far': get(r, 9),
        },
        'urbanIndicators': {
            'buildingIntensity': get(r, 9),
            'greenSpacePercentage': get(r, 10),
            'buildingTypes': get(r, 11),
            'transport': get(r, 12),
        },
        'shadingAnalysis': {
            'marchSeptember': get(r, 14),
            'june': get(r, 15),
            'december': get(r, 16),
        },
        'siteAnalysis': site_analysis,
        'quarters': [],
    }

    # -------- Quarter 1 (cols 54-111) --------
    q1 = make_quarter(
        r, 1,
        plan_col=54, form3d_col=55,
        far_col=56, gar_col=57, coverage_col=58, floors_col=59,
        trees_col=60, hw_col=61, streets_col=62, func_col=63,
        sun_hours_col=64, daylight_pot_col=85, solar_energy_col=95,
        df_start=96, sda_start=102, sda_interp_col=106,
        udi_start=107, udi_concl_col=111,
        sun_ground_start=65, sun_facade_start=75,
        daylight_dist_start=86,
    )
    if q1:
        city['quarters'].append(q1)

    # -------- Quarter 2 (cols 112-168) --------
    q2 = make_quarter(
        r, 2,
        plan_col=112, form3d_col=113,
        far_col=114, gar_col=115, coverage_col=116, floors_col=117,
        trees_col=118, hw_col=119, streets_col=120, func_col=121,
        sun_hours_col=122, daylight_pot_col=143, solar_energy_col=None,
        df_start=153, sda_start=159, sda_interp_col=163,
        udi_start=164, udi_concl_col=168,
        sun_ground_start=123, sun_facade_start=133,
        daylight_dist_start=144,
    )
    if q2:
        city['quarters'].append(q2)

    # -------- Quarter 3 (cols 169-225+) --------
    q3 = make_quarter(
        r, 3,
        plan_col=169, form3d_col=170,
        far_col=171, gar_col=172, coverage_col=173, floors_col=174,
        trees_col=175, hw_col=176, streets_col=177, func_col=178,
        sun_hours_col=179, daylight_pot_col=200, solar_energy_col=None,
        df_start=210, sda_start=216, sda_interp_col=220,
        udi_start=221, udi_concl_col=225,
        sun_ground_start=180, sun_facade_start=190,
        daylight_dist_start=201,
    )
    if q3:
        city['quarters'].append(q3)

    cities.append(city)
    print(f"  {cfg['name']}: {len(city['quarters'])} quarters")

# -------- Add daylightPotential2 for Garnizon quarters --------
for city in cities:
    if city['id'] == 'garnizon':
        for q in city['quarters']:
            q['daylightPotential2'] = f"Garnizon_Daylight_potential_2_kwartal_{q['id']}"

# -------- Write output --------
os.makedirs(os.path.dirname(OUTPUT), exist_ok=True)
output_data = {"cities": cities}
with open(OUTPUT, 'w', encoding='utf-8') as f:
    json.dump(output_data, f, indent=2, ensure_ascii=False)

print(f"\nWritten to {OUTPUT}")
print(f"Total cities: {len(cities)}")

# -------- Verification --------
print("\n=== VERIFICATION ===")
for city in cities:
    print(f"\n{city['name']}:")
    bi = city['urbanIndicators']['buildingTypes']
    print(f"  Building types: {bi[:80]}..." if bi and len(bi) > 80 else f"  Building types: {bi}")
    tr = city['urbanIndicators']['transport']
    print(f"  Transport: {tr[:80]}..." if tr and len(tr) > 80 else f"  Transport: {tr}")
    sa = city['siteAnalysis']
    if 'sunHoursDistribution' in sa:
        g = sa['sunHoursDistribution'].get('ground', {})
        if g:
            vals = [b['value'] for b in g.get('bins', [])]
            print(f"  Site sun hours ground: {vals}")
    if 'solarEnergySpecs' in sa:
        print(f"  Site solar specs: {sa['solarEnergySpecs']}")
    for q in city['quarters']:
        print(f"  Q{q['id']}:")
        if 'sunHoursDistribution' in q:
            g = q['sunHoursDistribution'].get('ground', {}).get('bins', [])
            print(f"    Sun ground: {[b['value'] for b in g]}")
            f_data = q['sunHoursDistribution'].get('facades', {}).get('bins', [])
            print(f"    Sun facades: {[b['value'] for b in f_data]}")
        if 'daylightPotentialDistribution' in q:
            d = q['daylightPotentialDistribution'].get('bins', [])
            print(f"    Daylight dist: {[b['value'] for b in d]}")
        if 'solarEnergySpecs' in q:
            print(f"    Solar specs: {q['solarEnergySpecs']}")
