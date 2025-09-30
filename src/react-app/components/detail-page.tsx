import './detail-page.css';

import { useParams } from 'react-router';
import { useEffect, useState } from 'react';

interface ConstantEntry {
  name: string;
  tags: string;
  value: string;
  description: string;
}

function DetailPage({ domain }: { domain: string }) {
  const [list, setList] = useState<ConstantEntry[]>([]);
  const [search, setSearch] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    setLoading(true);
    (async () => {
      const res = await fetch(`/api/domain/${domain}?value=${search}`);
      const data = await res.json();
      setList(data);
      setLoading(false);
    })().catch(console.error);
  }, [domain, search]);

  return (
    <div className="main-container">
      <h2 className="header">Constant Lookup for {domain}</h2>
      <input
        disabled={loading}
        className="input"
        onChange={e => setSearch(e.target.value)}
        value={search}
      />
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
