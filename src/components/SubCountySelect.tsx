import React from 'react';
import { getSubCounties } from '../index';

interface Props {
  countyId?: string;
  value?: string;
  onChange?: (id: string) => void;
}

const SubCountySelect: React.FC<Props> = ({ countyId, value, onChange }) => {
  const subcounties = countyId ? getSubCounties(countyId) : [];
  return (
    <select
      value={value}
      onChange={e => onChange?.(e.target.value)}
      disabled={!countyId}
    >
      <option value="">Select Sub-County</option>
      {subcounties.map(sc => <option key={sc.id} value={sc.id}>{sc.name}</option>)}
    </select>
  );
};
export default SubCountySelect;
