import { redirect } from '@/i18n/navigation';
import { isDocSectionId } from '@/lib/docs-sections';
import { DocsClient } from '../DocsClient';

type PageProps = {
  params: Promise<{ section: string; locale: string }>;
};

export default async function DocsSectionPage({ params }: PageProps) {
  const { section, locale } = await params;

  if (!isDocSectionId(section) || section === 'overview') {
    redirect({ href: '/docs', locale });
  }

  return <DocsClient sectionId={section} />;
}
