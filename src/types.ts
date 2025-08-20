// types.ts
export type ID = string;
export type PaginationCursor = string;

// Base entity types
export interface Village {
  id: ID;
  name: string;
  population?: number;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface SubLocation {
  id: ID;
  name: string;
  villages?: Village[];
}

export interface Location {
  id: ID;
  name: string;
  sub_locations?: SubLocation[];
}

export interface Ward {
  id: ID;
  name: string;
  locations?: Location[];
  villages?: Village[];
}

export interface SubCounty {
  id: ID;
  name: string;
  wards: Ward[];
}

export interface County {
  id: ID;
  name: string;
  capital?: string;
  code?: number;
  area?: number;
  population?: number;
  sub_counties: SubCounty[];
}

// Pagination types
export interface PaginationParams {
  limit?: number;
  cursor?: PaginationCursor;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    nextCursor: PaginationCursor | null;
    hasMore: boolean;
    totalCount: number;
  };
}

// Search and filter types
export enum AdministrativeLevel {
  VILLAGE = 'village',
  SUB_LOCATION = 'sub_location',
  LOCATION = 'location',
  WARD = 'ward',
  SUB_COUNTY = 'sub_county',
  COUNTY = 'county'
}

export interface SearchFilters {
  name?: string;
  type?: AdministrativeLevel;
  countyId?: ID;
  subCountyId?: ID;
  wardId?: ID;
  locationId?: ID;
  populationMin?: number;
  populationMax?: number;
}

export interface HierarchyNode {
  id: ID;
  name: string;
  type: AdministrativeLevel;
  parent?: HierarchyNode;
  children?: HierarchyNode[];
}

export interface SearchResult {
  entity: County | SubCounty | Ward | Location | SubLocation | Village;
  type: AdministrativeLevel;
  hierarchy: HierarchyNode[];
  exactMatch: boolean;
  score: number;
}

export interface FullHierarchyResult {
  county: County;
  subCounty?: SubCounty;
  ward?: Ward;
  location?: Location;
  subLocation?: SubLocation;
  village?: Village;
}

// Statistical interfaces
export interface PopulationStats {
  total: number;
  average: number;
  min: number;
  max: number;
  distribution: Record<string, number>;
}

export interface AreaStats {
  total: number;
  average: number;
  min: number;
  max: number;
}

// Custom errors
export class KenyaAdminError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'Geo254Error';
  }
}

