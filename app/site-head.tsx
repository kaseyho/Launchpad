import { PUBLIC_SITE_URL } from './site-metadata';

export function SiteHead() {
  return <link rel="canonical" href={`${PUBLIC_SITE_URL}/`} />;
}
