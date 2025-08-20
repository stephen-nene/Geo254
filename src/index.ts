import { SearchUtils } from './utils';
import { AdministrativeLevel, KenyaAdminError } from './types';
import type {
    ID,
    County,
    SubCounty,
    Ward,
    Location,
    SubLocation,
    Village,
    PaginationParams,
    PaginatedResponse,
    SearchFilters,
    HierarchyNode,
    SearchResult,
    FullHierarchyResult,
} from './types';





export class Geo254 {
  private counties: County[] = [];
  private indexes: {
    counties: Map<ID, County>;
    subCounties: Map<ID, { entity: SubCounty; countyId: ID }>;
    wards: Map<ID, { entity: Ward; countyId: ID; subCountyId: ID }>;
    locations: Map<ID, { entity: Location; countyId: ID; subCountyId: ID; wardId: ID }>;
    subLocations: Map<ID, { entity: SubLocation; countyId: ID; subCountyId: ID; wardId: ID; locationId: ID }>;
    villages: Map<ID, { entity: Village; hierarchy: string[] }>;
  };

  constructor(data?: County[]) {
    this.indexes = {
      counties: new Map(),
      subCounties: new Map(),
      wards: new Map(),
      locations: new Map(),
      subLocations: new Map(),
      villages: new Map()
    };
    
    if (data) {
      this.importData(data);
    }
  }

  // Data operations
  importData(data: County[]): void {
    this.counties = [...data];
    this.buildIndexes();
  }

  exportData(): County[] {
    return [...this.counties];
  }

  private buildIndexes(): void {
    // Clear existing indexes
    Object.values(this.indexes).forEach(index => index.clear());

    this.counties.forEach(county => {
      this.indexes.counties.set(county.id, county);

      county.sub_counties.forEach(subCounty => {
        this.indexes.subCounties.set(subCounty.id, {
          entity: subCounty,
          countyId: county.id
        });

        subCounty.wards.forEach(ward => {
          this.indexes.wards.set(ward.id, {
            entity: ward,
            countyId: county.id,
            subCountyId: subCounty.id
          });

          // Handle locations
          ward.locations?.forEach(location => {
            this.indexes.locations.set(location.id, {
              entity: location,
              countyId: county.id,
              subCountyId: subCounty.id,
              wardId: ward.id
            });

            location.sub_locations?.forEach(subLocation => {
              this.indexes.subLocations.set(subLocation.id, {
                entity: subLocation,
                countyId: county.id,
                subCountyId: subCounty.id,
                wardId: ward.id,
                locationId: location.id
              });

              subLocation.villages?.forEach(village => {
                this.indexes.villages.set(village.id, {
                  entity: village,
                  hierarchy: [county.id, subCounty.id, ward.id, location.id, subLocation.id]
                });
              });
            });
          });

          // Handle direct ward villages
          ward.villages?.forEach(village => {
            this.indexes.villages.set(village.id, {
              entity: village,
              hierarchy: [county.id, subCounty.id, ward.id]
            });
          });
        });
      });
    });
  }

  private paginate<T>(
    items: T[], 
    params: PaginationParams = {}
  ): PaginatedResponse<T> {
    const limit = params.limit || 20;
    let startIndex = 0;

    if (params.cursor) {
      try {
        const decoded = SearchUtils.decodeBase64(params.cursor);
        startIndex = decoded.offset || 0;
      } catch {
        throw new KenyaAdminError('Invalid cursor', 'INVALID_CURSOR');
      }
    }

    const endIndex = startIndex + limit;
    const paginatedItems = items.slice(startIndex, endIndex);
    const hasMore = endIndex < items.length;
    
    let nextCursor: string | null = null;
    if (hasMore) {
      nextCursor = SearchUtils.encodeBase64({ offset: endIndex });
    }

    return {
      data: paginatedItems,
      pagination: {
        nextCursor,
        hasMore,
        totalCount: items.length
      }
    };
  }

  // County operations
  getCounties(params?: PaginationParams): PaginatedResponse<County> {
    return this.paginate(this.counties, params);
  }

  getCountyById(id: ID): County | null {
    return this.indexes.counties.get(id) || null;
  }

  getCountyByCode(code: number): County | null {
    return this.counties.find(county => county.code === code) || null;
  }

  getCountyByName(name: string): County | null {
    return this.counties.find(county => 
      county.name.toLowerCase() === name.toLowerCase()
    ) || null;
  }

  // Sub-county operations
  getSubCounties(countyId: ID, params?: PaginationParams): PaginatedResponse<SubCounty> {
    const county = this.getCountyById(countyId);
    if (!county) {
      throw new KenyaAdminError(`County with ID ${countyId} not found`, 'COUNTY_NOT_FOUND');
    }
    return this.paginate(county.sub_counties, params);
  }

  getSubCountyById(id: ID): SubCounty | null {
    const indexed = this.indexes.subCounties.get(id);
    return indexed?.entity || null;
  }

  // Ward operations
  getWards(subCountyId: ID, params?: PaginationParams): PaginatedResponse<Ward> {
    const indexed = this.indexes.subCounties.get(subCountyId);
    if (!indexed) {
      throw new KenyaAdminError(`Sub-county with ID ${subCountyId} not found`, 'SUB_COUNTY_NOT_FOUND');
    }
    return this.paginate(indexed.entity.wards, params);
  }

  getWardById(id: ID): Ward | null {
    const indexed = this.indexes.wards.get(id);
    return indexed?.entity || null;
  }

  // Location operations
  getLocations(wardId: ID, params?: PaginationParams): PaginatedResponse<Location> {
    const indexed = this.indexes.wards.get(wardId);
    if (!indexed) {
      throw new KenyaAdminError(`Ward with ID ${wardId} not found`, 'WARD_NOT_FOUND');
    }
    return this.paginate(indexed.entity.locations || [], params);
  }

  getLocationById(id: ID): Location | null {
    const indexed = this.indexes.locations.get(id);
    return indexed?.entity || null;
  }

  // Sub-location operations
  getSubLocations(locationId: ID, params?: PaginationParams): PaginatedResponse<SubLocation> {
    const indexed = this.indexes.locations.get(locationId);
    if (!indexed) {
      throw new KenyaAdminError(`Location with ID ${locationId} not found`, 'LOCATION_NOT_FOUND');
    }
    return this.paginate(indexed.entity.sub_locations || [], params);
  }

  getSubLocationById(id: ID): SubLocation | null {
    const indexed = this.indexes.subLocations.get(id);
    return indexed?.entity || null;
  }

  // Village operations
  getVillages(
    parentId: ID, 
    parentType: AdministrativeLevel, 
    params?: PaginationParams
  ): PaginatedResponse<Village> {
    let villages: Village[] = [];

    switch (parentType) {
      case AdministrativeLevel.WARD:
        const ward = this.getWardById(parentId);
        villages = ward?.villages || [];
        break;
      case AdministrativeLevel.SUB_LOCATION:
        const subLocation = this.getSubLocationById(parentId);
        villages = subLocation?.villages || [];
        break;
      default:
        throw new KenyaAdminError(`Parent type ${parentType} cannot contain villages`, 'INVALID_PARENT_TYPE');
    }

    return this.paginate(villages, params);
  }

  getVillageById(id: ID): Village | null {
    const indexed = this.indexes.villages.get(id);
    return indexed?.entity || null;
  }

  // Hierarchy operations
  getFullHierarchy(villageId: ID): FullHierarchyResult | null {
    const villageData = this.indexes.villages.get(villageId);
    if (!villageData) return null;

    const [countyId, subCountyId, wardId, locationId, subLocationId] = villageData.hierarchy;
    
    const result: FullHierarchyResult = {
      county: this.getCountyById(countyId)!,
      village: villageData.entity
    };

    if (subCountyId) result.subCounty = this.getSubCountyById(subCountyId)!;
    if (wardId) result.ward = this.getWardById(wardId)!;
    if (locationId) result.location = this.getLocationById(locationId)!;
    if (subLocationId) result.subLocation = this.getSubLocationById(subLocationId)!;

    return result;
  }

  getHierarchyTree(entityId: ID, type: AdministrativeLevel): HierarchyNode | null {
    // Implementation would build a full tree structure
    // This is a simplified version
    switch (type) {
      case AdministrativeLevel.COUNTY:
        const county = this.getCountyById(entityId);
        if (!county) return null;
        return {
          id: county.id,
          name: county.name,
          type: AdministrativeLevel.COUNTY,
          children: county.sub_counties.map(sc => ({
            id: sc.id,
            name: sc.name,
            type: AdministrativeLevel.SUB_COUNTY
          }))
        };
      // Add other cases...
      default:
        return null;
    }
  }

  getAncestors(entityId: ID, type: AdministrativeLevel): HierarchyNode[] {
    const ancestors: HierarchyNode[] = [];
    
    if (type === AdministrativeLevel.VILLAGE) {
      const hierarchy = this.getFullHierarchy(entityId);
      if (hierarchy) {
        if (hierarchy.county) {
          ancestors.push({
            id: hierarchy.county.id,
            name: hierarchy.county.name,
            type: AdministrativeLevel.COUNTY
          });
        }
        if (hierarchy.subCounty) {
          ancestors.push({
            id: hierarchy.subCounty.id,
            name: hierarchy.subCounty.name,
            type: AdministrativeLevel.SUB_COUNTY
          });
        }
        // Add other levels...
      }
    }
    
    return ancestors;
  }

  getDescendants(entityId: ID, type: AdministrativeLevel, depth?: number): HierarchyNode[] {
    const descendants: HierarchyNode[] = [];
    // Implementation would traverse down the hierarchy
    return descendants;
  }

  // Search operations
  search(
    query: string, 
    filters?: SearchFilters, 
    params?: PaginationParams
  ): PaginatedResponse<SearchResult> {
    const results: SearchResult[] = [];
    const normalizedQuery = query.toLowerCase().trim();

    // Search counties
    this.counties.forEach(county => {
      const score = SearchUtils.calculateSimilarity(county.name, query);
      if (score > 0.3) {
        results.push({
          entity: county,
          type: AdministrativeLevel.COUNTY,
          hierarchy: [],
          exactMatch: score === 1,
          score
        });
      }
    });

    // Search other levels...
    // (Similar implementation for sub-counties, wards, etc.)

    // Apply filters
    let filteredResults = results;
    if (filters) {
      filteredResults = results.filter(result => {
        if (filters.type && result.type !== filters.type) return false;
        if (filters.countyId) {
          // Check if result is within specified county
        }
        // Apply other filters...
        return true;
      });
    }

    // Sort by score
    filteredResults.sort((a, b) => b.score - a.score);

    return this.paginate(filteredResults, params);
  }

  advancedSearch(
    filters: SearchFilters, 
    params?: PaginationParams
  ): PaginatedResponse<SearchResult> {
    return this.search(filters.name || '', filters, params);
  }

  // Validation operations
  validateHierarchy(
    villageId: ID, 
    countyId?: ID, 
    subCountyId?: ID, 
    wardId?: ID, 
    locationId?: ID, 
    subLocationId?: ID
  ): boolean {
    const hierarchy = this.getFullHierarchy(villageId);
    if (!hierarchy) return false;

    return (
      (!countyId || hierarchy.county.id === countyId) &&
      (!subCountyId || hierarchy.subCounty?.id === subCountyId) &&
      (!wardId || hierarchy.ward?.id === wardId) &&
      (!locationId || hierarchy.location?.id === locationId) &&
      (!subLocationId || hierarchy.subLocation?.id === subLocationId)
    );
  }

  // Statistical operations
  getPopulationStats(level: AdministrativeLevel, id?: ID): PopulationStats {
    let populations: number[] = [];

    switch (level) {
      case AdministrativeLevel.COUNTY:
        populations = this.counties
          .filter(c => !id || c.id === id)
          .map(c => c.population || 0)
          .filter(p => p > 0);
        break;
      case AdministrativeLevel.VILLAGE:
        const villages = Array.from(this.indexes.villages.values())
          .map(v => v.entity.population || 0)
          .filter(p => p > 0);
        populations = villages;
        break;
      // Add other levels...
    }

    if (populations.length === 0) {
      return {
        total: 0,
        average: 0,
        min: 0,
        max: 0,
        distribution: {}
      };
    }

    const total = populations.reduce((sum, pop) => sum + pop, 0);
    const average = total / populations.length;
    const min = Math.min(...populations);
    const max = Math.max(...populations);

    // Create distribution buckets
    const bucketSize = Math.ceil(max / 10);
    const distribution: Record<string, number> = {};
    
    populations.forEach(pop => {
      const bucket = Math.floor(pop / bucketSize) * bucketSize;
      const key = `${bucket}-${bucket + bucketSize}`;
      distribution[key] = (distribution[key] || 0) + 1;
    });

    return {
      total,
      average,
      min,
      max,
      distribution
    };
  }

  getAreaStats(level: AdministrativeLevel, id?: ID): AreaStats {
    let areas: number[] = [];

    switch (level) {
      case AdministrativeLevel.COUNTY:
        areas = this.counties
          .filter(c => !id || c.id === id)
          .map(c => c.area || 0)
          .filter(a => a > 0);
        break;
      // Add other levels...
    }

    if (areas.length === 0) {
      return { total: 0, average: 0, min: 0, max: 0 };
    }

    const total = areas.reduce((sum, area) => sum + area, 0);
    const average = total / areas.length;
    const min = Math.min(...areas);
    const max = Math.max(...areas);

    return { total, average, min, max };
  }
}

// Export everything
export default Geo254;