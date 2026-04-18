import pandas as pd
import json
import re

def clean_value(val):
    """Clean and convert values, handling NaN"""
    if pd.isna(val):
        return None
    if isinstance(val, (int, float)):
        return val
    return str(val).strip()

def extract_image_name(text):
    """Extract image name from text like 'obrazek: ImageName' or return text as-is"""
    if not text or pd.isna(text):
        return None
    text = str(text).strip()
    if text.startswith('obrazek:') or text.startswith('obraz:'):
        # Extract the image name after the colon
        parts = text.split(':', 1)
        if len(parts) > 1:
            return parts[1].strip()
    return text

def convert_excel_to_json():
    # Load Excel file
    excel_file = 'ATLASY_DANE_260207.xlsx'
    df = pd.read_excel(excel_file, sheet_name='Arkusz1', header=None)
    
    cities = []
    
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
        
        # Extract model 3D image name from "obraz: ImageName" format
        model_3d_text = clean_value(row[7])
        model_3d_image = extract_image_name(model_3d_text)
        
        city_data = {
            'id': city_name.lower().replace(' ', '_').replace('&', 'and'),
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
                'schwarzplanImage': clean_value(row[6]),
                'model3dImage': model_3d_image,
                'far': clean_value(row[8])  # Floor Area Ratio
            },
            'urbanIndicators': {
                'buildingIntensity': clean_value(row[9]),
                'greenSpacePercentage': clean_value(row[10]),
                'buildingTypes': clean_value(row[11]),
                'transport': clean_value(row[12]),
            },
            'shadingAnalysis': {
                'marchSeptember': clean_value(row[13]),
                'june': clean_value(row[14]),
                'december': clean_value(row[15])
            },
            'quarters': []
        }
        
        # Quarter-specific data
        if city_name == 'Elephant and Castle':
            # Single quarter with full data
            function_text = clean_value(row[26])
            sun_hours_image = extract_image_name(function_text)
            
            sda_image_1 = extract_image_name(clean_value(row[36]))
            udi_image_1 = extract_image_name(clean_value(row[41]))
            
            quarter = {
                'id': 1,
                'name': 'Quarter 1',
                'plan': clean_value(row[16]),  # rzut (plan view)
                'form3d': clean_value(row[17]),  # 3D form
                'far': clean_value(row[18]),  # Quarter FAR
                'indicators': {
                    'buildingIntensity': clean_value(row[19]),
                    'greenSpaceRatio': clean_value(row[20]),
                    'buildingCoverage': clean_value(row[21]),
                    'avgFloors': clean_value(row[22]),
                    'treeCount': clean_value(row[23]),
                    'heightToWidthRatio': clean_value(row[24]),
                    'streetWidth': clean_value(row[25])
                },
                'function': clean_value(row[25]),  # Function description
                'sunHours': sun_hours_image,
                'daylightPotential': clean_value(row[27]),
                'daylightPotential2': clean_value(row[28]),
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
                        'image': sda_image_1,
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
                        'image': udi_image_1,
                        'avgValue': clean_value(row[42])
                    },
                    'simulation2': {
                        'image': clean_value(row[43]),
                        'avgValue': clean_value(row[44])
                    },
                    'interpretation': clean_value(row[45]),
                    'conclusions': clean_value(row[46])
                }
            }
            city_data['quarters'].append(quarter)
            
        elif city_name == 'Garnizon':
            # Three quarters
            for q_idx in range(3):
                # Quarters start at different column offsets
                q_col_offsets = [0, 31, 62]  # Approximate column offsets for 3 quarters
                col_offset = 16 + q_col_offsets[q_idx]
                
                function_text = clean_value(row[26 + q_col_offsets[q_idx]])
                sun_hours_image = extract_image_name(function_text)
                
                quarter = {
                    'id': q_idx + 1,
                    'name': f'Quarter {q_idx + 1}',
                    'plan': clean_value(row[16 + q_col_offsets[q_idx]]),
                    'form3d': clean_value(row[17 + q_col_offsets[q_idx]]),
                    'far': clean_value(row[18 + q_col_offsets[q_idx]]),
                    'indicators': {
                        'buildingIntensity': clean_value(row[19 + q_col_offsets[q_idx]]),
                        'greenSpaceRatio': clean_value(row[20 + q_col_offsets[q_idx]]),
                        'buildingCoverage': clean_value(row[21 + q_col_offsets[q_idx]]),
                        'avgFloors': clean_value(row[22 + q_col_offsets[q_idx]]),
                        'treeCount': clean_value(row[23 + q_col_offsets[q_idx]]),
                        'heightToWidthRatio': clean_value(row[24 + q_col_offsets[q_idx]]),
                        'streetWidth': clean_value(row[25 + q_col_offsets[q_idx]])
                    },
                    'sunHours': sun_hours_image,
                    'daylightPotential': clean_value(row[27 + q_col_offsets[q_idx]]),
                    'daylightPotential2': clean_value(row[28 + q_col_offsets[q_idx]]),
                }
                city_data['quarters'].append(quarter)
                
        elif city_name == 'Hudson Yards':
            # Single quarter
            quarter = {
                'id': 1,
                'name': 'Quarter 1',
                'plan': clean_value(row[16]),
                'far': clean_value(row[18]),
                'indicators': {
                    'buildingIntensity': clean_value(row[19]),
                    'greenSpaceRatio': clean_value(row[20]),
                    'buildingCoverage': clean_value(row[21]),
                    'avgFloors': clean_value(row[22]),
                },
                'shadingAnalysis': {
                    'marchSeptember': clean_value(row[13]),
                    'june': clean_value(row[14]),
                    'december': clean_value(row[15])
                },
                'daylightFactor': {
                    'best': {
                        'image': clean_value(row[27]),
                        'description': clean_value(row[28])
                    },
                    'worst': {
                        'image': clean_value(row[29]),
                        'description': clean_value(row[30])
                    }
                },
                'spatialDaylightAutonomy': {
                    'best': {
                        'image': clean_value(row[31]),
                        'description': clean_value(row[32])
                    },
                    'worst': {
                        'image': clean_value(row[33]),
                        'description': clean_value(row[34])
                    }
                },
                'usefulDaylightIlluminance': {
                    'best': {
                        'image': clean_value(row[35]),
                        'description': clean_value(row[36])
                    },
                    'worst': {
                        'image': clean_value(row[37]),
                        'description': clean_value(row[38])
                    }
                }
            }
            city_data['quarters'].append(quarter)
        
        cities.append(city_data)
    
    # Create output structure
    output = {'cities': cities}
    
    # Write to JSON file
    output_file = 'urban-daylight-platform/public/data/cities.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(output, f, indent=2, ensure_ascii=False)
    
    print(f'Successfully converted data to {output_file}')
    print(f'Generated {len(cities)} cities')
    for city in cities:
        print(f"  - {city['name']}: {len(city['quarters'])} quarters")

if __name__ == '__main__':
    convert_excel_to_json()
