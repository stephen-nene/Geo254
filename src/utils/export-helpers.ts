// src/utils/export-helpers.ts
import type { County, AdministrativeLevel } from '../types.js';

export class ExportHelpers {
  /**
   * Export data to CSV format
   */
  static toCsv(counties: County[], level: AdministrativeLevel = AdministrativeLevel.COUNTY): string {
    const rows: string[] = [];
    
    switch (level) {
      case AdministrativeLevel.COUNTY:
        rows.push('ID,Name,Capital,Code,Area,Population');
        counties.forEach(county => {
          rows.push([
            county.id,
            `"${county.name}"`,
            `"${county.capital || ''}"`,
            county.code || '',
            county.area || '',
            county.population || ''
          ].join(','));
        });
        break;
      
      case AdministrativeLevel.VILLAGE:
        rows.push('ID,Name,Population,Latitude,Longitude,County,SubCounty,Ward,Location,SubLocation');
        counties.forEach(county => {
          this.traverseForVillages(county, (village, hierarchy) => {
            rows.push([
              village.id,
              `"${village.name}"`,
              village.population || '',
              village.coordinates?.lat || '',
              village.coordinates?.lng || '',
              `"${hierarchy.county}"`,
              `"${hierarchy.subCounty || ''}"`,
              `"${hierarchy.ward || ''}"`,
              `"${hierarchy.location || ''}"`,
              `"${hierarchy.subLocation || ''}"`
            ].join(','));
          });
        });
        break;
    }
    
    return rows.join('\n');
  }

  /**
   * Export data to GeoJSON format (for villages with coordinates)
   */
  static toGeoJson(counties: County[]): any {
    const features: any[] = [];
    
    counties.forEach(county => {
      this.traverseForVillages(county, (village, hierarchy) => {
        if (village.coordinates) {
          features.push({
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [village.coordinates.lng, village.coordinates.lat]
            },
            properties: {
              id: village.id,
              name: village.name,
              population: village.population,
              county: hierarchy.county,
              subCounty: hierarchy.subCounty,
              ward: hierarchy.ward,
              location: hierarchy.location,
              subLocation: hierarchy.subLocation
            }
          });
        }
      });
    });

    return {
      type: 'FeatureCollection',
      features
    };
  }

  /**
   * Create a flat hierarchy list for easy analysis
   */
  static toFlatHierarchy(counties: County[]): any[] {
    const flat: any[] = [];
    
    counties.forEach(county => {
      // Add county
      flat.push({
        id: county.id,
        name: county.name,
        type: AdministrativeLevel.COUNTY,
        level: 1,
        parentId: null,
        parentName: null,
        population: county.population,
        area: county.area
      });

      county.sub_counties.forEach(subCounty => {
        // Add sub-county
        flat.push({
          id: subCounty.id,
          name: subCounty.name,
          type: AdministrativeLevel.SUB_COUNTY,
          level: 2,
          parentId: county.id,
          parentName: county.name
        });

        subCounty.wards.forEach(ward => {
          // Add ward
          flat.push({
            id: ward.id,
            name: ward.name,
            type: AdministrativeLevel.WARD,
            level: 3,
            parentId: subCounty.id,
            parentName: subCounty.name
          });

          // Add locations
          ward.locations?.forEach(location => {
            flat.push({
              id: location.id,
              name: location.name,
              type: AdministrativeLevel.LOCATION,
              level: 4,
              parentId: ward.id,
              parentName: ward.name
            });

            // Add sub-locations
            location.sub_locations?.forEach(subLocation => {
              flat.push({
                id: subLocation.id,
                name: subLocation.name,
                type: AdministrativeLevel.SUB_LOCATION,
                level: 5,
                parentId: location.id,
                parentName: location.name
              });

              // Add villages in sub-location
              subLocation.villages?.forEach(village => {
                flat.push({
                  id: village.id,
                  name: village.name,
                  type: AdministrativeLevel.VILLAGE,
                  level: 6,
                  parentId: subLocation.id,
                  parentName: subLocation.name,
                  population: village.population,
                  coordinates: village.coordinates
                });
              });
            });
          });

          // Add villages directly in ward
          ward.villages?.forEach(village => {
            flat.push({
              id: village.id,
              name: village.name,
              type: AdministrativeLevel.VILLAGE,
              level: 6,
              parentId: ward.id,
              parentName: ward.name,
              population: village.population,
              coordinates: village.coordinates
            });
          });
        });
      });
    });

    return flat;
  }

  private static traverseForVillages(
    county: County,
    callback: (village: any, hierarchy: any) => void
  ): void {
    county.sub_counties.forEach(subCounty => {
      subCounty.wards.forEach(ward => {
        // Villages in locations/sub-locations
        ward.locations?.forEach(location => {
          location.sub_locations?.forEach(subLocation => {
            subLocation.villages?.forEach(village => {
              callback(village, {
                county: county.name,
                subCounty: subCounty.name,
                ward: ward.name,
                location: location.name,
                subLocation: subLocation.name
              });
            });
          });
        });

        // Villages directly in ward
        ward.villages?.forEach(village => {
          callback(village, {
            county: county.name,
            subCounty: subCounty.name,
            ward: ward.name,
            location: null,
            subLocation: null
          });
        });
      });
    });
  }
}




export { ExportHelpers };