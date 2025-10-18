
import  Geo254 from '../index.js';

// import {  KenyaAdminError } from './types';
import { AdministrativeLevel, type County, type FullHierarchyResult, type HierarchyNode, type ID, type SearchFilters, type SearchResult } from '../utils/types.js';


// Sample data loading
const sampleData: County[] = [
  // Your actual Kenya data here
];

async function demonstrateUsage() {
  // Initialize with data
  const kad = new Geo254(sampleData);

  console.log('=== County Operations ===');

  // Get all counties with pagination
  const counties = kad.getCounties({ limit: 5 });
  console.log(`Found ${counties.pagination.totalCount} counties`);
  counties.data.forEach(county => {
    console.log(`- ${county.name} (Code: ${county.code})`);
  });

  // Get specific county
  const nairobi = kad.getCountyByName('Nairobi');
  if (nairobi) {
    console.log(`\nNairobi County has ${nairobi.sub_counties.length} sub-counties`);
  }

  console.log('\n=== Hierarchical Navigation ===');

  // Navigate down the hierarchy
  if (nairobi) {
    const subCounties = kad.getSubCounties(nairobi.id, { limit: 3 });
    console.log(`Sub-counties in Nairobi:`);

    for (const subCounty of subCounties.data) {
      console.log(`- ${subCounty.name}`);

      const wards = kad.getWards(subCounty.id, { limit: 2 });
      for (const ward of wards.data) {
        console.log(`  - ${ward.name} (Ward)`);

        const locations = kad.getLocations(ward.id, { limit: 1 });
        for (const location of locations.data) {
          console.log(`    - ${location.name} (Location)`);
        }
      }
    }
  }

  console.log('\n=== Search Operations ===');

  // Simple search
  const searchResults = kad.search('Westlands', undefined, { limit: 5 });
  console.log(`\nSearch results for 'Westlands':`);
  searchResults.data.forEach(result => {
    console.log(`- ${result.entity.name} (${result.type}) - Score: ${result.score.toFixed(2)}`);
  });

  // Advanced search with filters
  const filters: SearchFilters = {
    type: AdministrativeLevel.WARD,
    countyId: nairobi?.id,
    name: 'Karen'
  };

  const advancedResults = kad.advancedSearch(filters);
  console.log(`\nAdvanced search results:`);
  advancedResults.data.forEach(result => {
    console.log(`- ${result.entity.name} (${result.type})`);
  });

  console.log('\n=== Hierarchy Analysis ===');

  // Find a village and trace its hierarchy
  const allResults = kad.search('', undefined, { limit: 100 });
  const village = allResults.data.find(r => r.type === AdministrativeLevel.VILLAGE);

  if (village) {
    const hierarchy = kad.getFullHierarchy(village.entity.id);
    if (hierarchy) {
      console.log(`\nFull hierarchy for ${village.entity.name}:`);
      console.log(`County: ${hierarchy.county.name}`);
      if (hierarchy.subCounty) console.log(`Sub-County: ${hierarchy.subCounty.name}`);
      if (hierarchy.ward) console.log(`Ward: ${hierarchy.ward.name}`);
      if (hierarchy.location) console.log(`Location: ${hierarchy.location.name}`);
      if (hierarchy.subLocation) console.log(`Sub-Location: ${hierarchy.subLocation.name}`);
      console.log(`Village: ${hierarchy.village?.name}`);
    }

    // Get ancestors
    const ancestors = kad.getAncestors(village.entity.id, AdministrativeLevel.VILLAGE);
    console.log(`\nAncestors of ${village.entity.name}:`);
    ancestors.forEach(ancestor => {
      console.log(`- ${ancestor.name} (${ancestor.type})`);
    });
  }

  console.log('\n=== Statistical Analysis ===');

  // Population statistics
  const popStats = kad.getPopulationStats(AdministrativeLevel.COUNTY);
  console.log('\nCounty Population Statistics:');
  console.log(`Total Population: ${popStats.total.toLocaleString()}`);
  console.log(`Average Population: ${Math.round(popStats.average).toLocaleString()}`);
  console.log(`Min Population: ${popStats.min.toLocaleString()}`);
  console.log(`Max Population: ${popStats.max.toLocaleString()}`);

  console.log('\nPopulation Distribution:');
  Object.entries(popStats.distribution).forEach(([range, count]) => {
    console.log(`${range}: ${count} counties`);
  });

  // Area statistics
  const areaStats = kad.getAreaStats(AdministrativeLevel.COUNTY);
  console.log('\nCounty Area Statistics:');
  console.log(`Total Area: ${areaStats.total} km²`);
  console.log(`Average Area: ${Math.round(areaStats.average)} km²`);
  console.log(`Smallest County: ${areaStats.min} km²`);
  console.log(`Largest County: ${areaStats.max} km²`);

  console.log('\n=== Validation ===');

  // Validate hierarchy relationships
  if (village) {
    const isValid = kad.validateHierarchy(village.entity.id);
    console.log(`Hierarchy validation for ${village.entity.name}: ${isValid ? 'Valid' : 'Invalid'}`);
  }

  console.log('\n=== Data Management ===');

  // Export current data
  const exportedData = kad.exportData();
  console.log(`Exported ${exportedData.length} counties`);

  // You could save this to a file or send to an API
  // await fs.writeFile('kenya-data-backup.json', JSON.stringify(exportedData, null, 2));
}

// Run the demonstration
// demonstrateUsage().catch(console.error);

export { demonstrateUsage };
