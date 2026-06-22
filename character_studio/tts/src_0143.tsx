import { Metadata, ResolvingMetadata } from 'next';
import { cookies, headers } from 'next/headers';

import HomePage from '@/components/page/home-page';
import { detectLocale, locales } from '@/utils/detectLocale';

type Props = {
  params: { locale: string };
  searchParams: { [key: string]: string | string[] | undefined };
};

export async function generateMetadata(
  { params, searchParams }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const headers_ = headers();
  const hostname = headers_.get('host');

  const cookies_ = cookies();

  const preferredLanguage = cookies_.get('preferredLanguage')?.value;

  const previousImages = (await parent).openGraph?.images || [];

  const info = {
    zh: {
      title: 'AI语音生成器',
      description: '将文本内容转换成自然流畅的语音',
      image: 'images/pose_zh.jpg',
    },
    en: {
      title: 'AI Voice Generator',
      description: 'Transform text into smooth, natural-sounding voice',
      image: 'images/pose_en.jpg',
    },
    ja: {
      title: 'AIボイスジェネレーター',
      description: 'テキストを滑らかで自然な音声に変換する  ',
      image: 'images/pose_ja.jpg',
    },
  };

  let locale = detectLocale(
    (searchParams && (searchParams.lang as string)) ||
      preferredLanguage ||
      params.locale ||
      'en'
  ) as keyof typeof info;

  if (!(locale in info)) {
    locale = 'en';
  }
  const baseUrl = (hostname as string).includes('localhost')
    ? 'http://localhost:3000'
    : `https://${hostname}`;

  return {
    title: info[locale as keyof typeof info].title,
    description: info[locale as keyof typeof info].description,
    alternates: {
      canonical: `${baseUrl}/?lang=${locale}`,
      languages: locales
        .filter((item) => item !== locale)
        .map((item) => ({
          [item]: `${baseUrl}/?lang=${item}`,
        }))
        .reduce((acc, curr) => Object.assign(acc, curr), {}),
    },
    openGraph: {
      url: `${baseUrl}/?lang=${locale}`,
      images: [
        `${baseUrl}/${info[locale as keyof typeof info].image}`,
        ...previousImages,
      ],
    },
    twitter: {
      site: (hostname as string).includes('localhost')
        ? `http://localhost:3000/?lang=${locale}`
        : `https://${hostname}/?lang=${locale}`,
      images: [
        `${baseUrl}/${info[locale as keyof typeof info].image}`,
        ...previousImages,
      ],
    },
  };
}

export default function Home() {
  return <HomePage />;
}
