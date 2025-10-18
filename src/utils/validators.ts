// src/utils/validators.ts
import type { County, Village, AdministrativeLevel } from './types.js';

export class DataValidators {
  /**
   * Validate the complete data structure
   */
  static validateDataStructure(counties: County[]): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!Array.isArray(counties)) {
      errors.push('Data must be an array of counties');
      return { isValid: false, errors, warnings };
    }

    const countyIds = new Set<string>();
    const allIds = new Set<string>();

    counties.forEach((county, countyIndex) => {
      // Validate county
      const countyValidation = this.validateCounty(county, countyIndex);
      errors.push(...countyValidation.errors);
      warnings.push(...countyValidation.warnings);

      // Check for duplicate county IDs
      if (countyIds.has(county.id)) {
        errors.push(`Duplicate county ID: ${county.id}`);
      } else {
        countyIds.add(county.id);
        allIds.add(county.id);
      }

      // Validate sub-structure
      county.sub_counties?.forEach((subCounty, scIndex) => {
        if (allIds.has(subCounty.id)) {
          errors.push(`Duplicate ID across entities: ${subCounty.id}`);
        } else {
          allIds.add(subCounty.id);
        }

        subCounty.wards?.forEach((ward, wardIndex) => {
          if (allIds.has(ward.id)) {
            errors.push(`Duplicate ID across entities: ${ward.id}`);
          } else {
            allIds.add(ward.id);
          }

          // Validate ward structure
          const wardValidation = this.validateWard(ward, `${county.name} > ${subCounty.name}`);
          errors.push(...wardValidation.errors);
          warnings.push(...wardValidation.warnings);
        });
      });
    });

    return {
      isValid: errors.length === 0,
      errors: errors.filter(Boolean),
      warnings: warnings.filter(Boolean)
    };
  }

  private static validateCounty(county: any, index: number): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!county.id) {
      errors.push(`County at index ${index}: Missing required 'id' field`);
    }

    if (!county.name || typeof county.name !== 'string') {
      errors.push(`County at index ${index}: Missing or invalid 'name' field`);
    }

    if (county.code !== undefined && (typeof county.code !== 'number' || county.code < 1 || county.code > 47)) {
      warnings.push(`County ${county.name}: Invalid county code ${county.code} (should be 1-47)`);
    }

    if (county.population !== undefined && (typeof county.population !== 'number' || county.population < 0)) {
      warnings.push(`County ${county.name}: Invalid population value`);
    }

    if (county.area !== undefined && (typeof county.area !== 'number' || county.area < 0)) {
      warnings.push(`County ${county.name}: Invalid area value`);
    }

    if (!Array.isArray(county.sub_counties)) {
      errors.push(`County ${county.name}: 'sub_counties' must be an array`);
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  private static validateWard(ward: any, context: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!ward.id || !ward.name) {
      errors.push(`Ward in ${context}: Missing required id or name`);
    }

    // Check for logical conflicts
    if (ward.locations && ward.villages) {
      if (ward.locations.length > 0 && ward.villages.length > 0) {
        warnings.push(`Ward ${ward.name} in ${context}: Has both locations and direct villages - this may indicate data structure inconsistency`);
      }
    }

    // Validate villages if present
    ward.villages?.forEach((village: any, vIndex: number) => {
      const villageValidation = this.validateVillage(village, `${context} > ${ward.name}`);
      errors.push(...villageValidation.errors);
      warnings.push(...villageValidation.warnings);
    });

    return { isValid: errors.length === 0, errors, warnings };
  }

  private static validateVillage(village: any, context: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!village.id || !village.name) {
      errors.push(`Village in ${context}: Missing required id or name`);
    }

    if (village.coordinates) {
      if (typeof village.coordinates.lat !== 'number' ||
          typeof village.coordinates.lng !== 'number') {
        errors.push(`Village ${village.name} in ${context}: Invalid coordinates format`);
      } else {
        // Kenya coordinate bounds check
        if (village.coordinates.lat < -5 || village.coordinates.lat > 5 ||
            village.coordinates.lng < 33 || village.coordinates.lng > 42) {
          warnings.push(`Village ${village.name} in ${context}: Coordinates appear to be outside Kenya bounds`);
        }
      }
    }

    if (village.population !== undefined) {
      if (typeof village.population !== 'number' || village.population < 0) {
        warnings.push(`Village ${village.name} in ${context}: Invalid population value`);
      }
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  /**
   * Validate hierarchy consistency
   */
  static validateHierarchyConsistency(counties: County[]): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check for orphaned entities
    const allCountyIds = new Set(counties.map(c => c.id));
    const allSubCountyIds = new Set();
    const allWardIds = new Set();
    const allLocationIds = new Set();
    const allSubLocationIds = new Set();

    counties.forEach(county => {
      county.sub_counties.forEach(subCounty => {
        allSubCountyIds.add(subCounty.id);

        subCounty.wards.forEach(ward => {
          allWardIds.add(ward.id);

          ward.locations?.forEach(location => {
            allLocationIds.add(location.id);

            location.sub_locations?.forEach(subLocation => {
              allSubLocationIds.add(subLocation.id);
            });
          });
        });
      });
    });

    // Additional consistency checks could go here
    // For example, checking if all referenced parent IDs exist

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}
