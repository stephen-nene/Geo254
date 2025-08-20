# Kenya Administrative Divisions

A comprehensive TypeScript/JavaScript library for working with Kenya's administrative divisions data. Features include hierarchical navigation, advanced search, pagination, and statistical analysis.

## Features

- 🏛️ **Complete Administrative Hierarchy**: Counties → Sub-Counties → Wards → Locations → Sub-Locations → Villages
- 🔍 **Advanced Search**: Fuzzy search with relevance scoring across all administrative levels
- 📄 **Cursor-based Pagination**: Efficient pagination for large datasets
- 📊 **Statistical Analysis**: Population and area statistics with distribution analysis
- 🌳 **Hierarchy Operations**: Navigate up and down the administrative tree
- ✅ **Data Validation**: Ensure integrity of hierarchical relationships
- 🎯 **TypeScript Support**: Full type definitions for better development experience
- ⚡ **Performance Optimized**: Indexed data structures for fast lookups

## Installation

```bash
npm install kenya-administrative-divisions
```

## Quick Start

```typescript
import KenyaAdministrativeDivisions, { AdministrativeLevel } from 'kenya-administrative-divisions';

// Initialize with your data
const kad = new KenyaAdministrativeDivisions(kenyaData);

// Get all counties with pagination
const counties = kad.getCounties({ limit: 10 });
console.log(`Found ${counties.pagination.totalCount} counties`);

// Search for administrative units
const results = kad.search('Nairobi');
console.log(`Found ${results.data.length} results for 'Nairobi'`);

// Get full hierarchy for a village
const hierarchy = kad.getFullHierarchy('village-id');
if (hierarchy) {
  console.log(`County: ${hierarchy.county.name}`);
  console.log(`Ward: ${hierarchy.ward?.name}`);
  console.log(`Village: ${hierarchy.village?.name}`);
}
```

## API Reference

### Core Classes

#### `KenyaAdministrativeDivisions`

The main class for interacting with Kenya's administrative divisions.

```typescript
const kad = new KenyaAdministrativeDivisions(data?: County[]);
```

### County Operations

```typescript
// Get all counties with optional pagination
getCounties(params?: PaginationParams): PaginatedResponse<County>

// Get county by ID, code, or name
getCountyById(id: string): County | null
getCountyByCode(code: number): County | null
getCountyByName(name: string): County | null
```

### Sub-County Operations

```typescript
// Get sub-counties within a county
getSubCounties(countyId: string, params?: PaginationParams): PaginatedResponse<SubCounty>

// Get specific sub-county
getSubCountyById(id: string): SubCounty | null
```

### Ward Operations

```typescript
// Get wards within a sub-county
getWards(subCountyId: string, params?: PaginationParams): PaginatedResponse<Ward>

// Get specific ward
getWardById(id: string): Ward | null
```

### Location Operations

```typescript
// Get locations within a ward
getLocations(wardId: string, params?: PaginationParams): PaginatedResponse<Location>

// Get specific location
getLocationById(id: string): Location | null
```

### Sub-Location Operations

```typescript
// Get sub-locations within a location
getSubLocations(locationId: string, params?: PaginationParams): PaginatedResponse<SubLocation>

// Get specific sub-location
getSubLocationById(id: string): SubLocation | null
```

### Village Operations

```typescript
// Get villages within a parent (Ward or Sub-Location)
getVillages(
  parentId: string, 
  parentType: AdministrativeLevel, 
  params?: PaginationParams
): PaginatedResponse<Village>

// Get specific village
getVillageById(id: string): Village | null
```

### Hierarchy Operations

```typescript
// Get complete hierarchy for any entity
getFullHierarchy(villageId: string): FullHierarchyResult | null

// Get hierarchy tree structure
getHierarchyTree(entityId: string, type: AdministrativeLevel): HierarchyNode | null

// Get all ancestors of an entity
getAncestors(entityId: string, type: AdministrativeLevel): HierarchyNode[]

// Get all descendants of an entity
getDescendants(entityId: string, type: AdministrativeLevel, depth?: number): HierarchyNode[]
```

### Search Operations

```typescript
// Simple fuzzy search
search(
  query: string, 
  filters?: SearchFilters, 
  params?: PaginationParams
): PaginatedResponse<SearchResult>

// Advanced search with filters
advancedSearch(
  filters: SearchFilters, 
  params?: PaginationParams
): PaginatedResponse<SearchResult>
```

### Validation Operations

```typescript
// Validate hierarchical relationships
validateHierarchy(
  villageId: string, 
  countyId?: string, 
  subCountyId?: string, 
  wardId?: string, 
  locationId?: string, 
  subLocationId?: string
): boolean
```

### Statistical Operations

```typescript
// Get population statistics
getPopulationStats(level: AdministrativeLevel, id?: string): PopulationStats

// Get area statistics  
getAreaStats(level: AdministrativeLevel, id?: string): AreaStats
```

### Data Management

```typescript
// Import new data
importData(data: County[]): void

// Export current data
exportData(): County[]
```

## Types

### Core Types

```typescript
// Administrative levels enum
enum AdministrativeLevel {
  VILLAGE = 'village',
  SUB_LOCATION = 'sub_location', 
  LOCATION = 'location',
  WARD = 'ward',
  SUB_COUNTY = 'sub_county',
  COUNTY = 'county'
}

// Base entity interfaces
interface County {
  id: string;
  name: string;
  capital?: string;
  code?: number;
  area?: number;
  population?: number;
  sub_counties: SubCounty[];
}

interface Village {
  id: string;
  name: string;
  population?: number;
  coordinates?: {
    lat: number;
    lng: number;
  };
}
```

### Pagination Types

```typescript
interface PaginationParams {
  limit?: number;        // Default: 20
  cursor?: string;       // Base64 encoded cursor
}

interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    nextCursor: string | null;
    hasMore: boolean;
    totalCount: number;
  };
}
```

### Search Types

```typescript
interface SearchFilters {
  name?: string;
  type?: AdministrativeLevel;
  countyId?: string;
  subCountyId?: string;
  wardId?: string;
  locationId?: string;
  populationMin?: number;
  populationMax?: number;
}

interface SearchResult {
  entity: County | SubCounty | Ward | Location | SubLocation | Village;
  type: AdministrativeLevel;
  hierarchy: HierarchyNode[];
  exactMatch: boolean;
  score: number;         // 0.0 - 1.0 relevance score
}
```

## Examples

### Basic Usage

```typescript
import KenyaAdministrativeDivisions from 'kenya-administrative-divisions';

const kad = new KenyaAdministrativeDivisions();

// Load your Kenya data
kad.importData(yourKenyaData);

// Get Nairobi county
const nairobi = kad.getCountyByName('Nairobi');
if (nairobi) {
  console.log(`Nairobi has ${nairobi.sub_counties.length} sub-counties`);
}
```

### Pagination

```typescript
// Get first page of counties
const firstPage = kad.getCounties({ limit: 10 });

// Get next page using cursor
if (firstPage.pagination.hasMore) {
  const nextPage = kad.getCounties({ 
    limit: 10, 
    cursor: firstPage.pagination.nextCursor 
  });
}
```

### Advanced Search

```typescript
// Search for wards in Nairobi with "Karen" in the name
const results = kad.advancedSearch({
  name: 'Karen',
  type: AdministrativeLevel.WARD,
  countyId: nairobi.id
});

results.data.forEach(result => {
  console.log(`${result.entity.name} - Score: ${result.score}`);
});
```

### Hierarchy Navigation

```typescript
// Start from a village and trace upward
const village = kad.getVillageById('some-village-id');
if (village) {
  const hierarchy = kad.getFullHierarchy(village.id);
  
  console.log('Full Hierarchy:');
  console.log(`County: ${hierarchy.county.name}`);
  console.log(`Sub-County: ${hierarchy.subCounty?.name}`);
  console.log(`Ward: ${hierarchy.ward?.name}`);
  console.log(`Location: ${hierarchy.location?.name}`);
  console.log(`Sub-Location: ${hierarchy.subLocation?.name}`);
  console.log(`Village: ${hierarchy.village?.name}`);
}
```

### Statistical Analysis

```typescript
// Get population statistics for all counties
const stats = kad.getPopulationStats(AdministrativeLevel.COUNTY);

console.log(`Total Population: ${stats.total.toLocaleString()}`);
console.log(`Average County Population: ${Math.round(stats.average).toLocaleString()}`);
console.log(`Population Range: ${stats.min.toLocaleString()} - ${stats.max.toLocaleString()}`);

// Population distribution
Object.entries(stats.distribution).forEach(([range, count]) => {
  console.log(`${range}: ${count} counties`);
});
```

## Error Handling

The library throws `KenyaAdminError` for various error conditions:

```typescript
import { KenyaAdminError } from 'kenya-administrative-divisions';

try {
  const subCounties = kad.getSubCounties('invalid-county-id');
} catch (error) {
  if (error instanceof KenyaAdminError) {
    console.log(`Error: ${error.message}`);
    console.log(`Code: ${error.code}`);
  }
}
```

### Error Codes

- `COUNTY_NOT_FOUND` - County with specified ID not found
- `SUB_COUNTY_NOT_FOUND` - Sub-county with specified ID not found  
- `WARD_NOT_FOUND` - Ward with specified ID not found
- `LOCATION_NOT_FOUND` - Location with specified ID not found
- `INVALID_CURSOR` - Invalid pagination cursor format
- `INVALID_PARENT_TYPE` - Invalid parent type for operation

## Performance Considerations

The library uses several optimization strategies:

1. **Indexed Data Structures**: All entities are indexed by ID for O(1) lookups
2. **Lazy Loading**: Child entities are loaded on-demand
3. **Cursor-based Pagination**: Efficient pagination without offset calculations
4. **Fuzzy Search Optimization**: Configurable similarity thresholds to limit results

For large datasets (100k+ entities), consider:
- Using smaller pagination limits (10-50 items)
- Implementing result caching for frequent searches
- Pre-filtering data before initialization

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Add tests for your changes
5. Run the test suite (`npm test`)
6. Commit your changes (`git commit -m 'Add amazing feature'`)
7. Push to the branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm test -- --coverage
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Data Sources

This library is designed to work with Kenya's official administrative divisions data. You'll need to provide your own data in the expected format.

## Changelog

### v1.0.0
- Initial release
- Complete administrative hierarchy support
- Advanced search and pagination
- Statistical analysis features
- Full TypeScript support
