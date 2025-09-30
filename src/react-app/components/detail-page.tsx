import { useParams } from 'react-router';
import { useEffect, useState } from 'react';

interface ConstantEntry {
  name: string;
  value: string;
  description: string;
}

function DetailPage({ domain }: { domain: string }) {
  const [list, setList] = useState<ConstantEntry[]>([]);
  const [search, setSearch] = useState<string>('');

  useEffect(() => {
    fetch(`/api/${domain}?value=${search}`)
      .then(res => res.json())
      .then(data => setList(data));
  }, [domain, search]);

  return (
    <div className="main-container">
      <h2>Constant Lookup for {domain}</h2>
      <input onChange={e => setSearch(e.target.value)} value={search} />
      <table className="display-table">
        <thead>
          <tr>
            <th className="name-header">Name</th>
            <th className="value-header">Value</th>
            <th className="desc-header">Description</th>
          </tr>
        </thead>
        <tbody>
          {list.map(item => (
            <tr>
              <td className="name-field">{item.name}</td>
              <td className="value-field">{item.value}</td>
              <td className="desc-field">{item.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export const Component = () => {
  const params = useParams();
  return <DetailPage domain={params.domain as string} />;
};
