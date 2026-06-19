import React, { useEffect, useMemo, useRef } from 'react';
import {
  Slider,
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@nextui-org/react';
import { FaPlay, FaPause, FaVolumeMute, FaVolumeUp } from 'react-icons/fa';
import toast from 'react-hot-toast';

import { useLanguageContext } from '@/providers/language-provider';
import { useAudio } from '@/hooks/use-audio';
import { useSessionStore } from '@/stores/use-session-store';

export default function AudioPlayer() {
  const { t } = useLanguageContext();

  const {
    volume,
    audioSrc,
    duration,

    updateSession,
  } = useSessionStore((state) => {
    return {
      volume: state.volume,
      audioSrc: state.audioSrc,
      duration: state.duration,

      updateSession: state.updateSession,
    };
  });

  const audioRef = useRef<HTMLAudioElement>(null);
  const { isPaused, currentTime, play, pause } = useAudio(audioRef);

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);

    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const isMuted = useMemo(() => volume === 0, [volume]);
  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      updateSession({ duration: audioRef.current.duration });
    }
  };

  const handleAudioPlay = () => {
    if (!audioSrc) {
      toast.error(t('error.noAudio'));

      return;
    }
    isPaused ? play() : pause();
  };

  const handleAudioCurrentTimeChange = (time: number) => {
    if (!audioSrc) return;
    if (audioRef.current) audioRef.current.currentTime = time;
  };

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  return (
    <>
      <audio
        ref={audioRef}
        className="hidden"
        preload="metadata"
        src={audioSrc}
        onLoadedMetadata={handleLoadedMetadata}
      >
        <track kind="captions" />
      </audio>
      <div className="flex h-14 w-full items-center justify-center gap-2 rounded-full bg-gray-200 px-4 text-gray-500">
        <button
          className="flex size-8 items-center justify-center rounded-full border bg-white hover:bg-gray-100"
          onClick={handleAudioPlay}
        >
          {isPaused ? (
            <FaPlay className="size-3" />
          ) : (
            <FaPause className="size-3" />
          )}
        </button>
        <div className="flex gap-1 text-sm">
          <span>{formatTime(currentTime)}</span>/
          <span>{formatTime(duration || 0)}</span>
        </div>
        <div className="flex-1">
          <Slider
            aria-label={t('aria.audio')}
            isDisabled={!audioSrc}
            maxValue={duration}
            minValue={0}
            size="sm"
            step={0.1}
            value={currentTime}
            onChange={(n) => handleAudioCurrentTimeChange(n as number)}
          />
        </div>
        <div>
          <Popover
            placement="top"
            radius="sm"
          >
            <PopoverTrigger>
              <div className="cursor-pointer">
                {isMuted ? <FaVolumeMute /> : <FaVolumeUp />}
              </div>
            </PopoverTrigger>
            <PopoverContent className="h-32 py-2">
              <Slider
                aria-label={t('aria.volume')}
                maxValue={1}
                minValue={0}
                orientation="vertical"
                size="sm"
                step={0.01}
                value={volume}
                onChange={(n) => {
                  updateSession({ volume: n as number });
                }}
              />
              {volume?.toFixed(2)}
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </>
  );
}
