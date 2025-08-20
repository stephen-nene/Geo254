// src/utils/data-loader.ts
import { County } from '../types.js';
import * as fs from 'fs';
import * as path from 'path';

export class DataLoader {
  /**
   * Load Kenya administrative data from a JSON file
   */
  static async loadFromFile(filePath: string): Promise<County[]> {
    try {
      const absolutePath = path.resolve(filePath);
      const fileContent = await fs.promises.readFile(absolutePath, 'utf-8');
      const data = JSON.parse(fileContent);
      
      if (!Array.isArray(data)) {
        throw new Error('Data must be an array of counties');
      }
      
      return this.validateAndNormalize(data);
    } catch (error) {
      throw new Error(`Failed to load data from ${filePath}: ${error.message}`);
    }
  }

  /**
   * Load Kenya administrative data from a URL
   */
  static async loadFromUrl(url: string): Promise<County[]> {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!Array.isArray(data)) {
        throw new Error('Data must be an array of counties');
      }
      
      return this.validateAndNormalize(data);
    } catch (error) {
      throw new Error(`Failed to load data from ${url}: ${error.message}`);
    }
  }

  /**
   * Validate and normalize the loaded data structure
   */
  private static validateAndNormalize(data: any[]): County[] {
    return data.map((county, index) => {
      if (!county.id || !county.name) {
        throw new Error(`County at index ${index} is missing required id or name`);
      }

      // Normalize and validate sub-counties
      if (!Array.isArray(county.sub_counties)) {
        county.sub_counties = [];
      }

      county.sub_counties = county.sub_counties.map((subCounty: any, scIndex: number) => {
        if (!subCounty.id || !subCounty.name) {
          throw new Error(`Sub-county at index ${scIndex} in county ${county.name} is missing required id or name`);
        }

        // Ensure wards array exists
        if (!Array.isArray(subCounty.wards)) {
          subCounty.wards = [];
        }

        subCounty.wards = subCounty.wards.map((ward: any) => {
          if (!ward.id || !ward.name) {
            throw new Error(`Ward in sub-county ${subCounty.name} is missing required id or name`);
          }

          // Normalize locations and villages
          if (ward.locations && !Array.isArray(ward.locations)) {
            ward.locations = [];
          }
          if (ward.villages && !Array.isArray(ward.villages)) {
            ward.villages = [];
          }

          return ward;
        });

        return subCounty;
      });

      return county as County;
    });
  }

  /**
   * Generate sample data for testing/development
   */
  static generateSampleData(): County[] {
    return [
      {
        id: 'county-001',
        name: 'Nairobi',
        capital: 'Nairobi',
        code: 47,
        area: 696,
        population: 4397073,
        sub_counties: [
          {
            id: 'subcounty-001',
            name: 'Westlands',
            wards: [
              {
                id: 'ward-001',
                name: 'Kitisuru',
                locations: [
                  {
                    id: 'location-001',
                    name: 'Kitisuru Location',
                    sub_locations: [
                      {
                        id: 'sublocation-001',
                        name: 'Kitisuru Sub-location',
                        villages: [
                          {
                            id: 'village-001',
                            name: 'Kitisuru Village',
                            population: 5000,
                            coordinates: { lat: -1.2500, lng: 36.8167 }
                          },
                          {
                            id: 'village-002',
                            name: 'Spring Valley Village',
                            population: 3500,
                            coordinates: { lat: -1.2450, lng: 36.8200 }
                          }
                        ]
                      }
                    ]
                  }
                ]
              },
              {
                id: 'ward-002',
                name: 'Karen',
                villages: [
                  {
                    id: 'village-003',
                    name: 'Karen Village',
                    population: 8000,
                    coordinates: { lat: -1.3200, lng: 36.6800 }
                  }
                ]
              }
            ]
          },
          {
            id: 'subcounty-002',
            name: 'Starehe',
            wards: [
              {
                id: 'ward-003',
                name: 'Nairobi Central',
                locations: [
                  {
                    id: 'location-002',
                    name: 'Central Business District',
                    sub_locations: [
                      {
                        id: 'sublocation-002',
                        name: 'CBD Core',
                        villages: [
                          {
                            id: 'village-004',
                            name: 'City Square',
                            population: 1200,
                            coordinates: { lat: -1.2865, lng: 36.8175 }
                          }
                        ]
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        id: 'county-002',
        name: 'Mombasa',
        capital: 'Mombasa',
        code: 1,
        area: 230,
        population: 1208333,
        sub_counties: [
          {
            id: 'subcounty-003',
            name: 'Mvita',
            wards: [
              {
                id: 'ward-004',
                name: 'Mji wa Kale/Makadara',
                locations: [
                  {
                    id: 'location-003',
                    name: 'Old Town',
                    sub_locations: [
                      {
                        id: 'sublocation-003',
                        name: 'Stone Town',
                        villages: [
                          {
                            id: 'village-005',
                            name: 'Fort Jesus Area',
                            population: 2800,
                            coordinates: { lat: -4.0619, lng: 39.6774 }
                          }
                        ]
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      }
    ];
  }
}

