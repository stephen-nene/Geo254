import counties from './data/counties.json';
import subcounties from './data/subcounties.json';
import wards from './data/wards.json';
import villages from './data/villages.json';

export interface County { id: string; name: string; code?: number; }
export interface SubCounty { id: string; name: string; countyId: string; }
export interface Ward { id: string; name: string; subCountyId: string; }
export interface Village { id: string; name: string; wardId: string; }

export function getCounties(): County[] {
  return counties;
}

export function getSubCounties(countyId: string): SubCounty[] {
  return subcounties.filter(sc => sc.countyId === countyId);
}

export function getWards(subCountyId: string): Ward[] {
  return wards.filter(w => w.subCountyId === subCountyId);
}

export function getVillages(wardId: string): Village[] {
  return villages.filter(v => v.wardId === wardId);
}

export function getCountyById(id: string) {
  return counties.find(c => c.id === id);
}

export function getSubCountyById(id: string) {
  return subcounties.find(sc => sc.id === id);
}

export function getWardById(id: string) {
  return wards.find(w => w.id === id);
}

export function getVillageById(id: string) {
  return villages.find(v => v.id === id);
}

export default {
  getCounties,
  getSubCounties,
  getWards,
  getVillages,
  getCountyById,
  getSubCountyById,
  getWardById,
  getVillageById,
};
