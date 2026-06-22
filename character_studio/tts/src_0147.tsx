import Image from 'next/image';

import MoonSVG from '../public/moon.svg';
export function MoonIcon({ className }: { className: string }) {
  return (
    <Image
      alt="Moon"
      className={className}
      src={MoonSVG}
    />
  );
}
