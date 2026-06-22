import { Button } from '@nextui-org/button';
import {
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
} from '@nextui-org/react';
import ky from 'ky';
import { Loader } from 'lucide-react';
import { SetStateAction, useCallback, useEffect, useState } from 'react';
import toast, { ErrorIcon } from 'react-hot-toast';
import { RiRecordCircleFill } from 'react-icons/ri';

import { ErrMessage } from './ErrMessage';
import { CustomModel } from './page/home-page';

import { API_KEY, FISH_AUDIO_CLONE_API, REGION } from '@/config/mode';
import useAudioRecorder from '@/hooks/use-audio-recorder';
import { useLanguageContext } from '@/providers/language-provider';
import { useSessionStore } from '@/stores/use-session-store';

async function getAudioDuration(blob: Blob): Promise<number> {
  return new Promise((resolve, reject) => {
    const audioContext = new AudioContext();
    const reader = new FileReader();

    reader.onload = function (event) {
      if (event.target?.result instanceof ArrayBuffer) {
        audioContext.decodeAudioData(
          event.target.result,
          (buffer) => {
            const duration = buffer.duration;

            resolve(duration);
          },
          (error) => {
            reject(error);
          }
        );
      }
    };

    reader.onerror = function () {
      reject(new Error('Failed to read the audio blob'));
    };

    reader.readAsArrayBuffer(blob);
  });
}

interface VoiceCloneModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenChange: (open: boolean) => void;
  customModels: CustomModel[];
  setCustomModels: (models: SetStateAction<CustomModel[]>) => void;
}

export default function VoiceCloneModal({
  isOpen,
  onClose,
  onOpenChange,
  customModels,
  setCustomModels,
}: VoiceCloneModalProps) {
  const apiKey = API_KEY;
  const { t, language: uiLanguage } = useLanguageContext();
  const region = REGION;
  const { updateSession } = useSessionStore((state) => ({
    updateSession: state.updateSession,
  }));

  const [title, setTitle] = useState('');

  const { isRecording, start, stopWithData, recordingDuration } =
    useAudioRecorder(44100);

  const [audioData, setAudioData] = useState<Blob>();
  const handleToggleRecording = useCallback(async () => {
    if (isRecording) {
      try {
        const data = await stopWithData();

        if (!data) {
          toast.error(t('error.noRecordingData'));

          return;
        }

        try {
          const duration = await getAudioDuration(data);

          if (duration < 10) {
            toast.error(t('error.tooShort'));

            return;
          }
          if (duration > 90) {
            toast.error(t('error.tooLong'));

            return;
          }
        } catch (durationError) {
          console.error('Error calculating audio duration:', durationError);
          toast.error(t('error.durationCalculationFailed'));

          return;
        }
        toast.success(t('success.recordingEnded'));

        setAudioData(data);
        setFileInfo({
          name: 'recording.wav',
          size: data.size,
          type: data.type,
        });
      } catch (e) {
        console.error(e);
        if (!(e as any).response?.ok) {
          try {
            const json = await (e as any).response.json();

            if (typeof json.error?.err_code !== 'undefined') {
              toast(
                (t) => (
                  <div className="flex items-center gap-2">
                    <div>
                      <ErrorIcon />
                    </div>
                    <div>
                      {ErrMessage(
                        json.error?.err_code,
                        (uiLanguage as '') || 'zh',
                        parseInt(region || '0')
                      )}
                    </div>
                  </div>
                ),
                { id: 'voice-clone-error' }
              );

              return;
            }
          } catch (jsonError) {
            console.error('Failed to parse error response:', jsonError);
          }
        }
        toast.error(t('error.recordingEndedFailed'));
      }
    } else {
      await start();
    }
  }, [isRecording, apiKey, t]);

  useEffect(() => {
    if (recordingDuration >= 90000) {
      handleToggleRecording();
    }
  }, [recordingDuration, handleToggleRecording]);

  const [fileInfo, setFileInfo] = useState<{
    name: string;
    size: number;
    type: string;
  }>();

  const handleUploadFile = useCallback(async () => {
    const input = document.createElement('input');

    input.type = 'file';
    input.accept = 'audio/*';
    input.click();

    input.onchange = async () => {
      const file = input.files?.[0];

      if (!file) {
        toast.error(t('error.noFile'));

        return;
      }

      try {
        const duration = await getAudioDuration(file);

        if (duration < 10) {
          toast.error(t('error.tooShort'));

          return;
        }

        if (duration > 90) {
          toast.error(t('error.tooLong'));

          return;
        }
      } catch (durationError) {
        console.error('Error calculating audio duration:', durationError);
        toast.error(t('error.durationCalculationFailed'));

        return;
      }

      setFileInfo({
        name: file.name,
        size: file.size,
        type: file.type,
      });

      setAudioData(file);
      toast.success(t('success.fileSelected'));
    };
  }, []);

  const [isMakingClone, setIsMakingClone] = useState(false);

  const handleMakeClone = useCallback(async () => {
    setIsMakingClone(true);
    if (!audioData) {
      toast.error(t('error.noAudioData'));

      setIsMakingClone(false);

      return;
    }

    if (!title) {
      toast.error(t('error.noModelName'));

      setIsMakingClone(false);

      return;
    }

    const formData = new FormData();

    formData.append('voices', audioData, 'recording.wav');
    formData.append('visibility', 'unlist');
    formData.append('type', 'tts');
    formData.append('title', title);
    formData.append('train_mode', 'fast');

    try {
      const resp = await ky
        .post(FISH_AUDIO_CLONE_API, {
          headers: { Authorization: `Bearer ${apiKey}` },
          body: formData,
          timeout: false,
        })
        .json<CustomModel>();

      setCustomModels((prev) => [...(prev || []), resp]);

      setTitle('');
      setAudioData(undefined);
      setFileInfo(undefined);

      setIsMakingClone(false);

      toast.success(t('success.makeClone'));

      onClose();

      updateSession({
        speaker: resp._id,
      });
      console.log(resp);
    } catch (e) {
      console.error('make clone: ', e);
      if (!(e as any).response?.ok) {
        try {
          const json = await (e as any).response.json();

          if (typeof json.error?.err_code !== 'undefined') {
            toast(
              (t) => (
                <div className="flex items-center gap-2">
                  <div>
                    <ErrorIcon />
                  </div>
                  <div>
                    {ErrMessage(
                      json.error?.err_code,
                      (uiLanguage as '') || 'zh',
                      parseInt(region || '0')
                    )}
                  </div>
                </div>
              ),
              { id: 'text-to-speech-error' }
            );

            setIsMakingClone(false);

            return;
          }
        } catch (jsonError) {
          setIsMakingClone(false);
          console.error('Failed to parse error response:', jsonError);
        }
      }
      setIsMakingClone(false);
    }
  }, [audioData, title, apiKey, t]);

  function formatFileSize(size: number): string {
    if (size >= 1024 * 1024) {
      return (size / (1024 * 1024)).toFixed(2) + ' MB';
    } else {
      return (size / 1024).toFixed(2) + ' KB';
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      scrollBehavior="inside"
      size="5xl"
      onOpenChange={onOpenChange}
    >
      <ModalContent>
        {() => (
          <>
            <ModalHeader className="flex items-center justify-between gap-1">
              <h2>{t('home.header.voiceClone.title')}</h2>
            </ModalHeader>
            <ModalBody className="p-6 pt-4">
              <div className="flex flex-col items-start justify-center gap-2">
                <label htmlFor="voiceCloneInput">
                  {t('home.header.voiceClone.newModelName')}
                </label>
                <Input
                  id="voiceCloneInput"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              {/* file info */}
              {fileInfo && (
                <div className="flex items-center justify-center gap-2 text-sm">
                  <span>{t('home.header.voiceClone.hasAudio')}</span>
                  <span>{fileInfo.name}</span>
                  <span>{formatFileSize(fileInfo.size)}</span>
                </div>
              )}
              <div className="flex items-center justify-center gap-2">
                <span>{t('home.header.voiceClone.uploadOrRecord')}</span>
                <div className="flex flex-col items-center justify-center gap-2 sm:flex-row">
                  <Button
                    className="shrink-0"
                    isDisabled={isRecording || isMakingClone}
                    onClick={handleUploadFile}
                  >
                    {t('home.header.voiceClone.selectFile')}
                  </Button>
                  <span>{t('home.header.voiceClone.or')}</span>
                  <Button
                    className="shrink-0"
                    color="primary"
                    isDisabled={isMakingClone}
                    variant="solid"
                    onClick={handleToggleRecording}
                  >
                    {isRecording ? (
                      <Loader className="h-4 w-4 animate-spin" />
                    ) : (
                      <RiRecordCircleFill className="h-4 w-4" />
                    )}
                    {isRecording
                      ? t('home.header.voiceClone.stopRecord') +
                        ' ' +
                        (recordingDuration / 1000).toFixed(1) +
                        's'
                      : t('home.header.voiceClone.startRecord')}
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                {t('home.header.voiceClone.referenceText')}:
                <span className="font-bold">
                  {t('home.header.voiceClone.referenceTextReal')}
                </span>
              </div>
              <div className="mb-20 flex items-center justify-end sm:mb-0">
                <Button
                  color="primary"
                  isDisabled={isMakingClone || !audioData || !title}
                  isLoading={isMakingClone}
                  variant="solid"
                  onClick={handleMakeClone}
                >
                  {t('home.header.voiceClone.makeClone')}
                </Button>
              </div>
            </ModalBody>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
