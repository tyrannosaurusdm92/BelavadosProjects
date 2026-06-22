import { formatDate } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { AiOutlineOpenAI } from 'react-icons/ai';
import { FaDownload, FaPause, FaPlay, FaRedo, FaRegCopy } from 'react-icons/fa';
import { IoShareOutline } from 'react-icons/io5';
import { RiDeleteBin6Line } from 'react-icons/ri';
import { VscAzure } from 'react-icons/vsc';

import { FishAudioIcon } from './FishAudioIcon';
import { MoonIcon } from './MoonIcon';
import { CustomModel } from './page/home-page';

import { useSpeakers } from '@/hooks/use-speakers';
import { SessionState, useSessionStore } from '@/stores/use-session-store';
import { useSessionsStore } from '@/stores/use-sessions-store';
import { useSessionStateDB } from '@/utils/session-db';

interface HistoryItemProps {
  session: SessionState;
  customModels: CustomModel[];
  onRestore: (session: SessionState) => void;
  onRemove: (id: string) => void;
  t: (key: string) => string;
}

const HistoryItem: React.FC<HistoryItemProps> = ({
  session,
  customModels,
  onRestore,
  onRemove,
  t,
}) => {
  useSessionStateDB();

  const audioRef = useRef<HTMLAudioElement>(null);
  const [audioSrc, setAudioSrc] = useState('');
  const { updateSessionById } = useSessionsStore((state) => ({
    updateSessionById: state.updateSessionById,
  }));
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    if (session.audio) {
      setAudioSrc(URL.createObjectURL(session.audio));
    }
  }, [session.audio]);

  useEffect(() => {
    const audio = audioRef.current;

    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  useEffect(() => {
    updateSessionById(session.id, { currentTime });
  }, [currentTime, session.id, updateSessionById]);

  const handlePlay = () => {
    const audio = audioRef.current;

    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
    updateSessionById(session.id, { isPlaying: !isPlaying });
  };

  const handleReset = () => {
    const audio = audioRef.current;

    if (!audio) return;

    audio.currentTime = 0;
    setCurrentTime(0);
    if (isPlaying) {
      audio.play();
    }
  };

  const { genBy } = useSessionStore((state) => ({
    text: state.text,
    platform: state.platform,
    speaker: state.speaker,
    language: state.language,
    speed: state.speed,
    audioSrc: state.audioSrc,
    speechToText: state.speechToText,
    speechCloneText: state.speechCloneText,
    updateSession: state.updateSession,
    genBy: state.genBy,
  }));

  const handleDownload = () => {
    if (session.audio) {
      const url = URL.createObjectURL(session.audio);
      const a = document.createElement('a');

      let finalText =
        genBy === 'text'
          ? session.text
          : genBy === 'speech-clone'
            ? session.speechCloneText
            : session.speechToText;

      a.href = url;
      a.download = `${finalText.slice(0, 10) || t('audio')}.mp3`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handleCopy = () => {
    let finalText =
      genBy === 'text'
        ? session.text
        : genBy === 'speech-clone'
          ? session.speechCloneText
          : session.speechToText;

    navigator.clipboard.writeText(finalText).then(() => {
      toast.success(t('success.textCopied'));
    });
  };
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);

    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const {
    azureSupportedLanguages,
    azureTTSSpeakers,
    openAISpeakers,
    moonSpeakers,
    fishAudioSpeakers,
  } = useSpeakers();

  const language = useMemo(() => {
    const label = azureSupportedLanguages?.find(
      (language) => language.value === session.language
    )?.label;

    return label;
  }, [azureSupportedLanguages, session.language]);

  return (
    <div className="flex flex-col items-start justify-between gap-4 pt-4">
      <div className="grid w-full grid-cols-2 gap-6 md:grid-cols-4">
        <div className="flex items-center justify-start gap-2">
          {session.platform === 'Azure' ? (
            <VscAzure className="size-5" />
          ) : session.platform === 'OpenAI' ? (
            <AiOutlineOpenAI className="size-5" />
          ) : session.platform === 'FishAudio' ? (
            <FishAudioIcon className="size-5" />
          ) : (
            <MoonIcon className="size-5" />
          )}
          <span>
            {session.platform === 'Moon' ? t('doubao') : session.platform}
          </span>
        </div>
        <div>
          <span className="font-bold">{t('aria.speaker')}：</span>
          {azureTTSSpeakers?.find(
            (speaker) => speaker.value === session.speaker
          )?.label ||
            openAISpeakers?.find((speaker) => speaker.value === session.speaker)
              ?.label ||
            moonSpeakers?.find((speaker) => speaker.value === session.speaker)
              ?.label ||
            fishAudioSpeakers?.find(
              (speaker) => speaker.value === session.speaker
            )?.label ||
            customModels?.find((model) => model._id === session.speaker)?.title}
        </div>
        <div>
          <span className="font-bold">{t('aria.speed')}：</span>
          {session.speed.toFixed(2) + 'x'}
        </div>
        {language !== undefined ? (
          <div>
            <span className="font-bold">{t('aria.language')}：</span>
            {language}
          </div>
        ) : (
          ''
        )}
      </div>
      <div className="flex w-full items-start justify-between gap-8 text-gray-500">
        <div className="line-clamp-2 flex-1">
          {session.genBy === 'text'
            ? session.text
            : session.genBy === 'speech-clone'
              ? session.speechCloneText
              : session.speechToText}
        </div>
        <div className="flex flex-col items-end justify-start gap-2">
          <div>
            {formatTime(currentTime)} / {formatTime(session.duration)}
          </div>
          <audio
            ref={audioRef}
            className="hidden"
            src={audioSrc}
          >
            <track kind="captions" />
          </audio>
          <div className="flex gap-2">
            <button
              className="flex size-8 items-center justify-center rounded-full border bg-white hover:bg-gray-100"
              onClick={handlePlay}
            >
              {isPlaying ? (
                <FaPause className="size-3" />
              ) : (
                <FaPlay className="size-3" />
              )}
            </button>
            <button
              className="flex size-8 items-center justify-center rounded-full border bg-white hover:bg-gray-100"
              onClick={handleReset}
            >
              <FaRedo className="size-3" />
            </button>
          </div>
        </div>
      </div>
      <div className="flex w-full items-center justify-between">
        <div className="text-gray-500">
          {formatDate(session.createdAt, 'MM-dd HH:mm:ss', {
            locale: zhCN,
          })}
        </div>
        <div className="flex items-center justify-center gap-2">
          <button
            className="flex size-8 items-center justify-center rounded-lg border bg-white hover:bg-gray-100"
            onClick={() => onRemove(session.id)}
          >
            <RiDeleteBin6Line className="size-4" />
          </button>
          <button
            className="flex size-8 items-center justify-center rounded-lg border bg-white hover:bg-gray-100"
            onClick={handleDownload}
          >
            <FaDownload className="size-4" />
          </button>
          <button
            className="flex size-8 items-center justify-center rounded-lg border bg-white hover:bg-gray-100"
            onClick={handleCopy}
          >
            <FaRegCopy className="size-4" />
          </button>
          <button
            className="flex size-8 items-center justify-center rounded-lg border bg-white hover:bg-gray-100"
            onClick={() => onRestore(session)}
          >
            <IoShareOutline className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default HistoryItem;
