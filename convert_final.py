"""
Convert CSV data to cities.json for the Urban Daylight Platform.
Based on precise column-by-column analysis of ATLASY_DANE_260412(Arkusz1).csv
Separator: ; | Encoding: cp1250
Row 5 = Elephant and Castle, Row 6 = Garnizon, Row 7 = Hudson Yards
"""
import pandas as pd
import json
import os

CSV_FILE = 'ATLASY_DANE_260412(Arkusz1).csv'
OUTPUT = os.path.join('urban-daylight-platform', 'public', 'data', 'cities.json')

try:
    df = pd.read_csv(CSV_FILE, sep=';', header=None, encoding='cp1250')
except Exception:
    df = pd.read_csv(CSV_FILE, sep=';', header=None, encoding='latin-1')

print(f"CSV loaded: {df.shape[0]} rows x {df.shape[1]} cols")


def get(row, col):
    """Return cleaned string value or None."""
    if col >= len(row):
        return None
    val = row.iloc[col]
    if pd.isna(val):
        return None
    s = str(val).strip()
    if s.lower() in ('', 'no data', 'brak', 'nan'):
        return None
    return s


def clean_image(val):
    """Strip 'obrazek:' prefix from image references."""
    if val is None:
        return None
    if val.lower().startswith('obrazek:'):
        return val.split(':', 1)[1].strip()
    return val


def make_quarter(row, q_num, plan_col, form3d_col, far_col, gar_col, coverage_col,
                 floors_col, trees_col, hw_col, streets_col, func_col,
                 sun_hours_col, daylight_pot_col, solar_energy_col,
                 df_start, sda_start, sda_interp_col, udi_start, udi_concl_col,
                 dp2_name=None):
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

    # Check if quarter has any data at all
    has_any = any(v is not None for v in [
        plan, form3d, far, gar, coverage, floors, trees, hw, streets, func,
        sun_hours, dp, se
    ])

    # Also check daylight analysis
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
        'siteAnalysis': {
            'sunHoursImage': get(r, 17),
            'daylightPotentialImage': get(r, 38),
            'solarEnergyImage': get(r, 48),
        },
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
    )
    if q1:
        city['quarters'].append(q1)

    # -------- Quarter 2 (cols 112-168, NO solar energy column) --------
    q2 = make_quarter(
        r, 2,
        plan_col=112, form3d_col=113,
        far_col=114, gar_col=115, coverage_col=116, floors_col=117,
        trees_col=118, hw_col=119, streets_col=120, func_col=121,
        sun_hours_col=122, daylight_pot_col=143, solar_energy_col=None,
        df_start=153, sda_start=159, sda_interp_col=163,
        udi_start=164, udi_concl_col=168,
    )
    if q2:
        city['quarters'].append(q2)

    # -------- Quarter 3 (cols 169-225+, NO solar energy column) --------
    q3 = make_quarter(
        r, 3,
        plan_col=169, form3d_col=170,
        far_col=171, gar_col=172, coverage_col=173, floors_col=174,
        trees_col=175, hw_col=176, streets_col=177, func_col=178,
        sun_hours_col=179, daylight_pot_col=200, solar_energy_col=None,
        df_start=210, sda_start=216, sda_interp_col=220,
        udi_start=221, udi_concl_col=225,
    )
    if q3:
        city['quarters'].append(q3)

    cities.append(city)
    print(f"  {cfg['name']}: {len(city['quarters'])} quarters")

# -------- Add daylightPotential2 for Garnizon quarters (files exist) --------
for city in cities:
    if city['id'] == 'garnizon':
        for q in city['quarters']:
            q['daylightPotential2'] = f"Garnizon_Daylight_potential_2_kwartal_{q['id']}"

# -------- Write output --------
os.makedirs(os.path.dirname(OUTPUT), exist_ok=True)
with open(OUTPUT, 'w', encoding='utf-8') as f:
    json.dump(cities, f, indent=2, ensure_ascii=False)

print(f"\nWritten to {OUTPUT}")
print(f"Total cities: {len(cities)}")

# -------- Verification --------
print("\n=== VERIFICATION ===")
for city in cities:
    print(f"\n{city['name']}:")
    print(f"  Location image: {city['location']['imageUrl']}")
    print(f"  Country: {city['location']['country']}")
    print(f"  Years: {city['timeline']['years']}")
    print(f"  FAR: {city['overview']['far']}")
    print(f"  GAR: {city['urbanIndicators']['greenSpacePercentage']}")
    print(f"  Schwarzplan: {city['overview']['schwarzplanImage']}")
    print(f"  Model 3D: {city['overview']['model3dImage']}")
    bi = city['urbanIndicators']['buildingTypes']
    print(f"  Building types: {bi[:60] + '...' if bi and len(bi) > 60 else bi}")
    tr = city['urbanIndicators']['transport']
    print(f"  Transport: {tr[:60] + '...' if tr and len(tr) > 60 else tr}")
    print(f"  Shading March/Sep: {city['shadingAnalysis']['marchSeptember']}")
    print(f"  Shading June: {city['shadingAnalysis']['june']}")
    print(f"  Shading December: {city['shadingAnalysis']['december']}")
    print(f"  Quarters: {len(city['quarters'])}")
    for q in city['quarters']:
        print(f"    Q{q['id']}:")
        print(f"      Plan: {q['plan']}")
        print(f"      3D: {q['form3d']}")
        print(f"      FAR: {q['indicators']['buildingIntensity']}")
        print(f"      GAR: {q['indicators']['greenSpaceRatio']}")
        print(f"      Coverage: {q['indicators']['buildingCoverage']}")
        print(f"      Floors: {q['indicators']['avgFloors']}")
        print(f"      Trees: {q['indicators']['treeCount']}")
        print(f"      H/W: {q['indicators']['heightToWidthRatio']}")
        print(f"      Streets: {q['indicators']['streetWidth']}")
        func = q.get('function')
        print(f"      Function: {func[:60] + '...' if func and len(func) > 60 else func}")
        print(f"      Sun hours img: {q['sunHours']}")
        print(f"      Daylight pot: {q['daylightPotential']}")
        print(f"      Daylight pot 2: {q.get('daylightPotential2')}")
        print(f"      Solar energy: {q.get('solarEnergy')}")
        if 'daylightFactor' in q:
            df_data = q['daylightFactor']
            print(f"      DF sim1 img: {df_data['simulation1']['image']}")
            print(f"      DF sim1 avg: {df_data['simulation1']['avgValue']}")
            print(f"      DF sim2 img: {df_data['simulation2']['image']}")
            print(f"      DF sim2 avg: {df_data['simulation2']['avgValue']}")
        if 'spatialDaylightAutonomy' in q:
            sda = q['spatialDaylightAutonomy']
            print(f"      sDA sim1 img: {sda['simulation1']['image']}")
            print(f"      sDA sim1 auto: {sda['simulation1']['autonomy']}")
            print(f"      sDA sim2 img: {sda['simulation2']['image']}")
            print(f"      sDA interp: {sda['interpretation'][:60] + '...' if sda['interpretation'] and len(sda['interpretation']) > 60 else sda['interpretation']}")
        if 'usefulDaylightIlluminance' in q:
            udi = q['usefulDaylightIlluminance']
            print(f"      UDI sim1 img: {udi['simulation1']['image']}")
            print(f"      UDI sim1 val: {udi['simulation1']['avgValue']}")
            print(f"      UDI sim2 img: {udi['simulation2']['image']}")
            print(f"      UDI concl: {udi['conclusions'][:60] + '...' if udi['conclusions'] and len(udi['conclusions']) > 60 else udi['conclusions']}")
