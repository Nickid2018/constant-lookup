import { useParams } from 'react-router';

function DetailPage({}: { domain: string }) {
  return <></>;
}

export const Component = () => {
  const params = useParams();
  return <DetailPage domain={params.domain as string} />;
};
