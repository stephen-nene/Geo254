import React from 'react';
import { getCounties } from '../index';

interface Props {
  value?: string;
  onChange?: (id: string) => void;
}

const CountySelect: React.FC<Props> = ({ value, onChange }) => {
  const counties = getCounties();
  return (
    <select value={value} onChange={e => onChange?.(e.target.value)}>
      <option value="">Select County</option>
      {counties.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
    </select>
  );
};
export default CountySelect;
