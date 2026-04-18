import pandas as pd
import json
import re

def clean_value(val):
    """Clean and convert values, handling NaN, 'no data', and 'brak'"""
    if pd.isna(val):
        return None
    if isinstance(val, str):
        val_stripped = val.strip().lower()
        if val_stripped in ['no data', 'brak', '']:
            return None
    if isinstance(val, (int, float)):
        return val
    return str(val).strip()

def extract_image_name(text):
    """Extract image name from text like 'obrazek: ImageName' or return text as-is"""
    if not text or pd.isna(text):
        return None
    text = str(text).strip()
    # Skip if it's "no data" or "brak"
    if text.lower() in ['no data', 'brak']:
        return None
    if text.startswith('obrazek:') or text.startswith('obraz:'):
        # Extract the image name after the colon
        parts = text.split(':', 1)
        if len(parts) > 1:
            image_name = parts[1].strip()
            if image_name.lower() not in ['no data', 'brak', '']:
                return image_name
    return text if text.lower() not in ['no data', 'brak'] else None

def parse_percentage(val):
    """Convert percentage string to float (e.g., '39%' -> 0.39)"""
    if not val or pd.isna(val):
        return None
    if isinstance(val, str):
        val = val.strip()
        if val.lower() in ['no data', 'brak', '']:
            return None
        if '%' in val:
            try:
                return float(val.replace('%', '')) / 100
            except:
                return val
    return val

def parse_number(val):
    """Convert comma-separated numbers to float"""
    if not val or pd.isna(val):
        return None
    if isinstance(val, str):
        val = val.strip()
        if val.lower() in ['no data', 'brak', '']:
            return None
        # Replace comma with dot for European number format
        val = val.replace(',', '.')
        try:
            return float(val)
        except:
            return val
    return val

def convert_csv_to_json():
    # Load CSV file (data rows start from row 6)
    csv_file = 'ATLASY_DANE_260412(Arkusz1).csv'
    # Try different encodings
    try:
        df = pd.read_csv(csv_file, sep=';', header=None, encoding='utf-8')
    except UnicodeDecodeError:
        try:
            df = pd.read_csv(csv_file, sep=';', header=None, encoding='cp1250')
        except UnicodeDecodeError:
            df = pd.read_csv(csv_file, sep=';', header=None, encoding='latin-1')
    
    cities = []
    
    # City data is in rows 6, 7, 8 (0-indexed: 5, 6, 7)
    city_rows = {
        'Elephant and Castle': 5,
        'Garnizon': 6,
        'Hudson Yards': 7
    }
    
    coordinates = {
        'Elephant and Castle': {'lat': 51.4938, 'lng': -0.0992, 'zoom': 15},
        'Garnizon': {'lat': 54.3894, 'lng': 18.5932, 'zoom': 15},
        'Hudson Yards': {'lat': 40.7536, 'lng': -74.0010, 'zoom': 15}
    }
    
    for city_name, row_idx in city_rows.items():
        row = df.iloc[row_idx]
        
        # CSV has 2 empty columns at the start (;;), so add 2 to all indices
        # Extract model 3D image name
        model_3d_image = clean_value(row[8])
        
        city_data = {
            'id': city_name.lower().replace(' ', '_').replace('&', 'and'),
            'name': city_name,
            'location': {
                'country': clean_value(row[4]),
                'coordinates': coordinates[city_name],
                'imageUrl': clean_value(row[3])
            },
            'timeline': {
                'years': clean_value(row[5]),
                'description': clean_value(row[6])
            },
            'overview': {
                'schwarzplanImage': clean_value(row[7]),
                'model3dImage': model_3d_image,
                'far': parse_number(row[9])
            },
            'urbanIndicators': {
                'buildingIntensity': parse_percentage(row[10]),
                'greenSpacePercentage': clean_value(row[11]),
                'buildingTypes': clean_value(row[12]),
                'transport': clean_value(row[13])
            },
            'shadingAnalysis': {
                'marchSeptember': clean_value(row[14]),
                'june': clean_value(row[15]),
                'december': clean_value(row[16])
            },
            'quarters': []
        }
        
        # Quarter-specific data based on city
        if city_name == 'Elephant and Castle':
            # Single quarter with comprehensive daylight analysis
            # Overall site sun hours and daylight potential
            sun_hours_img = clean_value(row[17])
            daylight_potential_img = clean_value(row[38])
            solar_energy_img = clean_value(row[48])
            
            # Quarter 1 data starts at column 54
            quarter_plan = clean_value(row[54])
            quarter_form3d = clean_value(row[55])
            quarter_far = parse_number(row[56])
            
            # Quarter indicators
            quarter_building_intensity = parse_percentage(row[57])
            quarter_green_space = parse_percentage(row[58])
            quarter_building_coverage = parse_number(row[59])
            quarter_tree_count = clean_value(row[60])
            quarter_height_ratio = clean_value(row[61])
            quarter_street_width = clean_value(row[62])
            quarter_function = clean_value(row[63])
            
            # Quarter sun hours and daylight potential
            quarter_sun_hours = clean_value(row[64])
            quarter_daylight_potential = clean_value(row[85])
            
            # Daylight Factor (DF) - around col 96
            df_image = clean_value(row[96])
            df_avg = clean_value(row[97])
            df_desc = clean_value(row[98])
            
            # sDA - Spatial Daylight Autonomy - around col 102
            sda_image = extract_image_name(clean_value(row[102]))
            sda_autonomy = clean_value(row[103])
            # Find interpretation (scan forward a bit)
            sda_interpretation = None
            for i in range(104, 108):
                val = clean_value(row[i])
                if val and len(str(val)) > 50:  # Likely description text
                    sda_interpretation = val
                    break
            
            # UDI - Useful Daylight Illuminance - around col 107
            udi_image = extract_image_name(clean_value(row[107]))
            udi_avg = clean_value(row[108])
            # Find interpretation
            udi_interpretation = None
            for i in range(109, 115):
                val = clean_value(row[i])
                if val and len(str(val)) > 50:  # Likely description text
                    udi_interpretation = val
                    break
            
            quarter = {
                'id': 1,
                'name': 'Quarter 1',
                'plan': quarter_plan,
                'form3d': quarter_form3d,
                'far': quarter_far,
                'indicators': {
                    'buildingIntensity': quarter_building_intensity,
                    'greenSpaceRatio': quarter_green_space,
                    'buildingCoverage': quarter_building_coverage,
                    'avgFloors': None,  # Not in data
                    'treeCount': quarter_tree_count,
                    'heightToWidthRatio': quarter_height_ratio,
                    'streetWidth': quarter_street_width
                },
                'function': quarter_function,
                'sunHours': quarter_sun_hours,
                'daylightPotential': quarter_daylight_potential,
                'solarEnergy': solar_energy_img,
                'daylightFactor': {
                    'simulation1': {
                        'image': df_image,
                        'avgValue': parse_percentage(df_avg) if df_avg else None,
                        'description': df_desc
                    },
                    'simulation2': {
                        'image': None,
                        'avgValue': None,
                        'description': None
                    }
                },
                'spatialDaylightAutonomy': {
                    'simulation1': {
                        'image': sda_image,
                        'autonomy': sda_autonomy
                    },
                    'simulation2': {
                        'image': None,
                        'autonomy': None
                    },
                    'interpretation': sda_interpretation
                },
                'usefulDaylightIlluminance': {
                    'simulation1': {
                        'image': udi_image,
                        'avgValue': udi_avg
                    },
                    'simulation2': {
                        'image': None,
                        'avgValue': None
                    },
                    'interpretation': udi_interpretation,
                    'conclusions': None
                }
            }
            city_data['quarters'].append(quarter)
            
        elif city_name == 'Garnizon':
            # Three quarters with basic indicators
            # Overall site images
            sun_hours_img = clean_value(row[17])
            daylight_potential_img = clean_value(row[38])
            solar_energy_img = clean_value(row[48])
            
            # Quarter 1 starts at column 54
            quarter1 = {
                'id': 1,
                'name': 'Quarter 1',
                'plan': clean_value(row[54]),
                'form3d': clean_value(row[55]),
                'far': parse_number(row[56]),
                'indicators': {
                    'buildingIntensity': parse_percentage(row[57]),
                    'greenSpaceRatio': parse_percentage(row[58]),
                    'buildingCoverage': parse_number(row[59]),
                    'avgFloors': clean_value(row[60]),
                    'treeCount': clean_value(row[61]),
                    'heightToWidthRatio': clean_value(row[62]),
                    'streetWidth': clean_value(row[63])
                },
                'function': clean_value(row[64]) if clean_value(row[64]) and 'Garnizon' not in str(row[64]) else None,
                'sunHours': clean_value(row[64]),
                'daylightPotential': clean_value(row[85]),
                'daylightPotential2': clean_value(row[86])
            }
            city_data['quarters'].append(quarter1)
            
            # Quarter 2 starts at column 112
            quarter2 = {
                'id': 2,
                'name': 'Quarter 2',
                'plan': clean_value(row[112]),
                'form3d': clean_value(row[113]),
                'far': parse_number(row[114]),
                'indicators': {
                    'buildingIntensity': parse_percentage(row[115]),
                    'greenSpaceRatio': parse_percentage(row[116]),
                    'buildingCoverage': parse_number(row[117]),
                    'avgFloors': clean_value(row[118]),
                    'treeCount': clean_value(row[119]),
                    'heightToWidthRatio': clean_value(row[120]),
                    'streetWidth': clean_value(row[121])
                },
                'function': clean_value(row[122]) if clean_value(row[122]) and 'Garnizon' not in str(row[122]) else None,
                'sunHours': clean_value(row[122]),
                'daylightPotential': clean_value(row[143]),
                'daylightPotential2': clean_value(row[144])
            }
            city_data['quarters'].append(quarter2)
            
            # Quarter 3 starts at column 169
            quarter3 = {
                'id': 3,
                'name': 'Quarter 3',
                'plan': clean_value(row[169]),
                'form3d': clean_value(row[170]),
                'far': parse_number(row[171]),
                'indicators': {
                    'buildingIntensity': parse_percentage(row[172]),
                    'greenSpaceRatio': parse_percentage(row[173]),
                    'buildingCoverage': parse_number(row[174]),
                    'avgFloors': clean_value(row[175]),
                    'treeCount': clean_value(row[176]),
                    'heightToWidthRatio': clean_value(row[177]),
                    'streetWidth': clean_value(row[178])
                },
                'function': clean_value(row[179]) if clean_value(row[179]) and 'Garnizon' not in str(row[179]) else None,
                'sunHours': clean_value(row[179]),
                'daylightPotential': clean_value(row[200]),
                'daylightPotential2': clean_value(row[201])
            }
            city_data['quarters'].append(quarter3)
            
        elif city_name == 'Hudson Yards':
            # Single quarter with worst/best case scenarios
            quarter = {
                'id': 1,
                'name': 'Quarter 1',
                'plan': clean_value(row[54]),
                'far': parse_number(row[56]),
                'indicators': {
                    'buildingIntensity': parse_percentage(row[57]),
                    'greenSpaceRatio': parse_percentage(row[58]),
                    'buildingCoverage': parse_number(row[59]),
                    'avgFloors': clean_value(row[60])
                },
                'shadingAnalysis': {
                    'marchSeptember': clean_value(row[14]),
                    'june': clean_value(row[15]),
                    'december': clean_value(row[16])
                },
                'daylightFactor': {
                    'worst': {
                        'image': clean_value(row[96]),
                        'description': clean_value(row[97])
                    },
                    'best': {
                        'image': clean_value(row[99]),
                        'description': clean_value(row[100])
                    }
                },
                'spatialDaylightAutonomy': {
                    'worst': {
                        'image': clean_value(row[102]),
                        'description': clean_value(row[103])
                    },
                    'best': {
                        'image': clean_value(row[104]),
                        'description': clean_value(row[105])
                    },
                    'interpretation': clean_value(row[106])
                },
                'usefulDaylightIlluminance': {
                    'worst': {
                        'image': clean_value(row[107]),
                        'description': clean_value(row[108])
                    },
                    'best': {
                        'image': clean_value(row[109]),
                        'description': clean_value(row[110])
                    },
                    'interpretation': clean_value(row[111])
                }
            }
            city_data['quarters'].append(quarter)
        
        cities.append(city_data)
    
    # Create the final JSON structure
    output = {'cities': cities}
    
    # Write to file
    output_file = 'urban-daylight-platform/public/data/cities.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(output, f, indent=2, ensure_ascii=False)
    
    print(f"✅ Successfully converted CSV to JSON!")
    print(f"📄 Output: {output_file}")
    print(f"🏙️  Processed {len(cities)} cities:")
    for city in cities:
        print(f"   - {city['name']}: {len(city['quarters'])} quarter(s)")

if __name__ == '__main__':
    convert_csv_to_json()
