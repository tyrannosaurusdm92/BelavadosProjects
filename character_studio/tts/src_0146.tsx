import Image from 'next/image';

import FishSVG from '../public/fish.svg';
export function FishAudioIcon({ className }: { className: string }) {
  return (
    <Image
      alt="FishAudio"
      className={className}
      src={FishSVG}
    />
  );
}
