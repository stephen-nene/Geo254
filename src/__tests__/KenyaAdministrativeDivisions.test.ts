// Example test file: src/__tests__/KenyaAdministrativeDivisions.test.ts
import Geo254 from '../index';
import { County, AdministrativeLevel } from '../types';

const mockCountyData: County[] = [
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
        id: 'subcounty-002',
        name: 'Mvita',
        wards: [
          {
            id: 'ward-002',
            name: 'Mji wa Kale/Makadara'
          }
        ]
      }
    ]
  }
];

describe('KenyaAdministrativeDivisions', () => {
  let kad: KenyaAdministrativeDivisions;

  beforeEach(() => {
    kad = new KenyaAdministrativeDivisions(mockCountyData);
  });

  describe('County Operations', () => {
    test('should get all counties with pagination', () => {
      const result = kad.getCounties({ limit: 1 });
      
      expect(result.data).toHaveLength(1);
      expect(result.data[0].name).toBe('Nairobi');
      expect(result.pagination.totalCount).toBe(2);
      expect(result.pagination.hasMore).toBe(true);
      expect(result.pagination.nextCursor).toBeDefined();
    });

    test('should get county by ID', () => {
      const county = kad.getCountyById('county-001');
      expect(county?.name).toBe('Nairobi');
    });

    test('should get county by code', () => {
      const county = kad.getCountyByCode(47);
      expect(county?.name).toBe('Nairobi');
    });

    test('should get county by name', () => {
      const county = kad.getCountyByName('Mombasa');
      expect(county?.code).toBe(1);
    });
  });

  describe('Hierarchy Operations', () => {
    test('should get full hierarchy for village', () => {
      const hierarchy = kad.getFullHierarchy('village-001');
      
      expect(hierarchy).toBeDefined();
      expect(hierarchy!.county.name).toBe('Nairobi');
      expect(hierarchy!.subCounty?.name).toBe('Westlands');
      expect(hierarchy!.ward?.name).toBe('Kitisuru');
      expect(hierarchy!.location?.name).toBe('Kitisuru Location');
      expect(hierarchy!.subLocation?.name).toBe('Kitisuru Sub-location');
      expect(hierarchy!.village?.name).toBe('Kitisuru Village');
    });

    test('should validate hierarchy correctly', () => {
      const isValid = kad.validateHierarchy(
        'village-001',
        'county-001',
        'subcounty-001',
        'ward-001',
        'location-001',
        'sublocation-001'
      );
      expect(isValid).toBe(true);

      const isInvalid = kad.validateHierarchy(
        'village-001',
        'county-002' // Wrong county
      );
      expect(isInvalid).toBe(false);
    });
  });

  describe('Search Operations', () => {
    test('should search entities by name', () => {
      const results = kad.search('Nairobi');
      
      expect(results.data).toHaveLength(1);
      expect(results.data[0].entity.name).toBe('Nairobi');
      expect(results.data[0].type).toBe(AdministrativeLevel.COUNTY);
      expect(results.data[0].exactMatch).toBe(true);
      expect(results.data[0].score).toBe(1);
    });

    test('should perform fuzzy search', () => {
      const results = kad.search('Nairob'); // Partial match
      
      expect(results.data.length).toBeGreaterThan(0);
      expect(results.data[0].entity.name).toBe('Nairobi');
      expect(results.data[0].exactMatch).toBe(false);
      expect(results.data[0].score).toBeGreaterThan(0.8);
    });
  });

  describe('Statistical Operations', () => {
    test('should calculate population stats', () => {
      const stats = kad.getPopulationStats(AdministrativeLevel.COUNTY);
      
      expect(stats.total).toBe(5605406); // Sum of Nairobi + Mombasa
      expect(stats.average).toBe(2802703);
      expect(stats.min).toBe(1208333);
      expect(stats.max).toBe(4397073);
      expect(stats.distribution).toBeDefined();
    });

    test('should calculate area stats', () => {
      const stats = kad.getAreaStats(AdministrativeLevel.COUNTY);
      
      expect(stats.total).toBe(926); // Sum of areas
      expect(stats.average).toBe(463);
      expect(stats.min).toBe(230);
      expect(stats.max).toBe(696);
    });
  });

  describe('Error Handling', () => {
    test('should throw error for invalid county ID', () => {
      expect(() => {
        kad.getSubCounties('invalid-id');
      }).toThrow('County with ID invalid-id not found');
    });

    test('should throw error for invalid cursor', () => {
      expect(() => {
        kad.getCounties({ cursor: 'invalid-cursor' });
      }).toThrow('Invalid cursor format');
    });
  });

  describe('Data Operations', () => {
    test('should export data correctly', () => {
      const exportedData = kad.exportData();
      expect(exportedData).toEqual(mockCountyData);
    });

    test('should import new data and rebuild indexes', () => {
      const newData: County[] = [{
        id: 'county-003',
        name: 'Kisumu',
        code: 42,
        sub_counties: []
      }];

      kad.importData(newData);
      
      const counties = kad.getCounties();
      expect(counties.data).toHaveLength(1);
      expect(counties.data[0].name).toBe('Kisumu');
    });
  });
});

