import pandas as pd
import json
import os

def clean_value(val):
    """Clean and convert values, handling NaN"""
    if pd.isna(val):
        return None
    if isinstance(val, (int, float)):
        return val
    return str(val).strip()

def convert_excel_to_json():
    # Load Excel file
    excel_file = 'ATLASY_DANE_260207.xlsx'
    df = pd.read_excel(excel_file, sheet_name='Arkusz1', header=None)
    
    # Define cities data structure
    cities = []
    
    # Row 8: Elephant and Castle
    # Row 9: Garnizon
    # Row 10: Hudson Yards
    
    city_rows = {
        'Elephant and Castle': 8,
        'Garnizon': 9,
        'Hudson Yards': 10
    }
    
    coordinates = {
        'Elephant and Castle': {'lat': 51.4938, 'lng': -0.0992, 'zoom': 15},
        'Garnizon': {'lat': 54.3894, 'lng': 18.5932, 'zoom': 15},
        'Hudson Yards': {'lat': 40.7536, 'lng': -74.0010, 'zoom': 15}
    }
    
    for city_name, row_idx in city_rows.items():
        row = df.iloc[row_idx]
        
        city_data = {
            'id': city_name.lower().replace(' ', '_'),
            'name': city_name,
            'location': {
                'country': clean_value(row[3]),
                'coordinates': coordinates[city_name],
                'imageUrl': clean_value(row[2])
            },
            'timeline': {
                'years': clean_value(row[4]),
                'description': clean_value(row[5])
            },
            'overview': {
                'description': clean_value(row[6]),
                'schwarzplanImage': clean_value(row[7]),
                'model3dImage': clean_value(row[8])
            },
            'urbanIndicators': {
                'buildingIntensity': clean_value(row[9]),
                'greenSpacePercentage': clean_value(row[10]),
                'buildingTypes': clean_value(row[11]),
                'transport': clean_value(row[12]),
                'infrastructure': clean_value(row[13])
            },
            'shadingAnalysis': {
                'marchSeptember': clean_value(row[14]),
                'june': clean_value(row[15]),
                'december': clean_value(row[16])
            },
            'quarters': []
        }
        
        # Quarter-specific data (columns vary by city)
        # Elephant & Castle has 1 quarter detailed
        # Garnizon has 3 quarters
        # Hudson Yards has general data
        
        if city_name == 'Elephant and Castle':
            quarter = {
                'id': 1,
                'name': 'Quarter 1',
                'plan': clean_value(row[17]),
                'form3d': clean_value(row[18]),
                'indicators': {
                    'buildingIntensity': clean_value(row[19]),
                    'greenSpaceRatio': clean_value(row[20]),
                    'buildingCoverage': clean_value(row[21]),
                    'avgFloors': clean_value(row[22]),
                    'treeCount': clean_value(row[23]),
                    'heightToWidthRatio': clean_value(row[24]),
                    'streetWidth': clean_value(row[25])
                },
                'function': clean_value(row[26]),
                'sunHours': clean_value(row[27]),
                'daylightPotential': [clean_value(row[28]), clean_value(row[29])],
                'solarEnergy': clean_value(row[30]),
                'daylightFactor': {
                    'simulation1': {
                        'image': clean_value(row[31]),
                        'avgValue': clean_value(row[32]),
                        'description': clean_value(row[33])
                    },
                    'simulation2': {
                        'image': clean_value(row[34]),
                        'avgValue': clean_value(row[35]),
                        'description': clean_value(row[36])
                    }
                },
                'spatialDaylightAutonomy': {
                    'simulation1': {
                        'image': clean_value(row[37]),
                        'autonomy': clean_value(row[38])
                    },
                    'simulation2': {
                        'image': clean_value(row[39]),
                        'autonomy': clean_value(row[40])
                    },
                    'interpretation': clean_value(row[41])
                },
                'usefulDaylightIlluminance': {
                    'simulation1': {
                        'image': clean_value(row[42]),
                        'avgValue': clean_value(row[43])
                    },
                    'simulation2': {
                        'image': clean_value(row[44]),
                        'avgValue': clean_value(row[45])
                    },
                    'interpretation': clean_value(row[46]),
                    'conclusions': clean_value(row[47])
                }
            }
            city_data['quarters'].append(quarter)
            
        elif city_name == 'Garnizon':
            # Garnizon has 3 quarters
            quarters_data = [
                {'start_col': 17, 'name': 'Quarter 1'},
                {'start_col': 48, 'name': 'Quarter 2'},
                {'start_col': 69, 'name': 'Quarter 3'}
            ]
            
            for i, q_info in enumerate(quarters_data):
                col = q_info['start_col']
                quarter = {
                    'id': i + 1,
                    'name': q_info['name'],
                    'plan': clean_value(row[col]),
                    'form3d': clean_value(row[col + 1]),
                    'indicators': {
                        'buildingIntensity': clean_value(row[col + 2]),
                        'greenSpaceRatio': clean_value(row[col + 3]),
                        'buildingCoverage': clean_value(row[col + 4]),
                        'avgFloors': clean_value(row[col + 5]),
                        'treeCount': clean_value(row[col + 6]),
                        'heightToWidthRatio': clean_value(row[col + 7]),
                        'streetWidth': clean_value(row[col + 8])
                    },
                    'function': clean_value(row[col + 9]) if col + 9 < len(row) else None,
                    'sunHours': clean_value(row[col + 10]) if col + 10 < len(row) else None,
                    'daylightPotential': [
                        clean_value(row[col + 11]) if col + 11 < len(row) else None,
                        clean_value(row[col + 12]) if col + 12 < len(row) else None
                    ],
                    'solarEnergy': clean_value(row[col + 13]) if col + 13 < len(row) else None
                }
                city_data['quarters'].append(quarter)
                
        elif city_name == 'Hudson Yards':
            # Hudson Yards has building-level data
            quarter = {
                'id': 1,
                'name': 'Main Development',
                'plan': clean_value(row[17]),
                'form3d': None,
                'indicators': {
                    'buildingIntensity': clean_value(row[18]),
                    'greenSpaceRatio': clean_value(row[19]),
                    'buildingCoverage': clean_value(row[20]),
                    'avgFloors': clean_value(row[21]),
                    'treeCount': clean_value(row[22]),
                    'heightToWidthRatio': clean_value(row[23]),
                    'streetWidth': clean_value(row[24])
                },
                'function': clean_value(row[25]),
                'sunHours': clean_value(row[26]),
                'daylightPotential': [clean_value(row[27]), clean_value(row[28])],
                'solarEnergy': clean_value(row[29]),
                'daylightFactor': {
                    'simulation1': {
                        'image': clean_value(row[30]),
                        'avgValue': clean_value(row[31]),
                        'description': clean_value(row[32])
                    },
                    'simulation2': {
                        'image': clean_value(row[33]),
                        'avgValue': clean_value(row[34]),
                        'description': clean_value(row[35])
                    }
                },
                'spatialDaylightAutonomy': {
                    'simulation1': {
                        'image': clean_value(row[36]),
                        'autonomy': clean_value(row[37])
                    },
                    'simulation2': {
                        'image': clean_value(row[38]),
                        'autonomy': clean_value(row[39])
                    },
                    'interpretation': clean_value(row[40])
                },
                'usefulDaylightIlluminance': {
                    'simulation1': {
                        'image': clean_value(row[41]),
                        'avgValue': clean_value(row[42])
                    },
                    'simulation2': {
                        'image': clean_value(row[43]),
                        'avgValue': clean_value(row[44])
                    },
                    'interpretation': clean_value(row[45])
                }
            }
            city_data['quarters'].append(quarter)
        
        cities.append(city_data)
    
    # Create output directory if it doesn't exist
    output_dir = 'urban-daylight-platform/public/data'
    os.makedirs(output_dir, exist_ok=True)
    
    # Save to JSON
    output_file = os.path.join(output_dir, 'cities.json')
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump({'cities': cities}, f, indent=2, ensure_ascii=False)
    
    print(f"✓ Successfully converted data to {output_file}")
    print(f"✓ Total cities: {len(cities)}")
    for city in cities:
        print(f"  - {city['name']}: {len(city['quarters'])} quarter(s)")

if __name__ == '__main__':
    convert_excel_to_json()
