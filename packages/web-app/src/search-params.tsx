import { useLocation } from 'react-router-dom';
import { useMemo,useEffect  } from 'react';

interface ReadOnlyURLSearchParams extends URLSearchParams {
  append: never;
  set: never;
  delete: never;
  sort: never;
}

function SearchParams() {
  const { search } = useLocation();

  const searchParams = useMemo(
    () => new URLSearchParams(search) as ReadOnlyURLSearchParams,
    [search]
  );

  return null;
}
