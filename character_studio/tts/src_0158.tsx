import { Spinner } from '@nextui-org/react';
import ky from 'ky';
import { useCallback } from 'react';
import toast, { ErrorIcon } from 'react-hot-toast';
import { AiOutlineUpload } from 'react-icons/ai';
import { FaMicrophone, FaStop } from 'react-icons/fa';

import { ErrMessage } from './ErrMessage';

import { API_KEY, OPENAI_AUDIO_TO_TEXT_API, REGION } from '@/config/mode';
import useAudioRecorder from '@/hooks/use-audio-recorder';
import { useLanguageContext } from '@/providers/language-provider';
import { useSessionStore } from '@/stores/use-session-store';

const MAX_WORDS_PER_REQUEST = 4096;

export default function SpeechToSpeechTab() {
  const apiKey = API_KEY;
  const { t, language: uiLanguage } = useLanguageContext();
  const region = REGION;
  const { isRecording, start, stopWithData, recordingDuration } =
    useAudioRecorder(44100);
  const { isEditing, speechToText, isFileToSpeech, updateSession } =
    useSessionStore((state) => {
      return {
        isEditing: state.isEditing,
        speechToText: state.speechToText,
        isFileToSpeech: state.isFileToSpeech,
        updateSession: state.updateSession,
      };
    });

  const handleFileToSpeech = useCallback(async () => {
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

      updateSession({
        isFileToSpeech: true,
      });

      try {
        const formData = new FormData();

        formData.append('file', file);
        formData.append('model', 'whisper-1');

        const { text } = await ky
          .post(OPENAI_AUDIO_TO_TEXT_API, {
            headers: { Authorization: `Bearer ${apiKey}` },
            body: formData,
            timeout: false,
          })
          .json<{ text: string }>();

        updateSession({ speechToText: text, isEditing: true });

        console.log('sadas');
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
                { id: 'speech-to-speech-error' }
              );
              updateSession({ isFileToSpeech: false });

              return;
            }
          } catch (jsonError) {
            console.error('Failed to parse error response:', jsonError);
          }
        }
        toast.error(t('error.recognitionFailed'));
      }

      updateSession({ isFileToSpeech: false });
    };
  }, [apiKey, t]);

  const handleToggleRecording = useCallback(async () => {
    if (isRecording) {
      try {
        const data = await stopWithData();

        if (!data) {
          toast.error(t('error.noRecordingData'));

          return;
        }
        toast.success(t('success.recordingEnded'));

        updateSession({ isFileToSpeech: true });
        const formData = new FormData();

        formData.append('file', data, 'recording.wav');
        formData.append('model', 'whisper-1');

        const { text } = await ky
          .post(OPENAI_AUDIO_TO_TEXT_API, {
            headers: { Authorization: `Bearer ${apiKey}` },
            body: formData,
            timeout: false,
          })
          .json<{ text: string }>();

        updateSession({ isEditing: true, speechToText: text });
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
                { id: 'speech-to-speech-error' }
              );
              updateSession({ isFileToSpeech: false });

              return;
            }
          } catch (jsonError) {
            console.error('Failed to parse error response:', jsonError);
          }
        }
        toast.error(t('error.recordingEndedFailed'));
      } finally {
        updateSession({ isFileToSpeech: false });
      }
    } else {
      await start();
    }
  }, [isRecording, apiKey, t]);

  const handleReUpload = () => {
    updateSession({ isEditing: false, speechToText: '' });
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);

    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  if (isEditing) {
    return (
      <div className="relative h-full w-full resize-y overflow-hidden bg-white pb-8">
        <textarea
          className="h-full w-full resize-none p-4 focus-visible:outline-none"
          maxLength={MAX_WORDS_PER_REQUEST}
          placeholder=""
          value={speechToText}
          onChange={(e) => updateSession({ speechToText: e.target.value })}
        />
        <div className="absolute bottom-2 right-2 h-fit w-fit text-gray-400">
          {speechToText?.length || 0} / {MAX_WORDS_PER_REQUEST}
        </div>
        <div className="absolute bottom-2 left-2 h-fit w-fit text-gray-400">
          <button
            className="text-primary-500 underline hover:text-primary-400 active:text-primary-200"
            onClick={handleReUpload}
          >
            {t('buttons.reUpload')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full items-center justify-center gap-8">
      <button
        className="flex size-24 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg bg-primary-500 text-white hover:bg-primary-400 disabled:bg-primary-300 sm:size-40"
        disabled={isFileToSpeech}
        onClick={handleFileToSpeech}
      >
        <div>
          {isFileToSpeech ? (
            <Spinner
              color="white"
              size="sm"
            />
          ) : (
            <AiOutlineUpload className="size-8" />
          )}
        </div>
        <div className="text-sm">
          {isFileToSpeech
            ? t('buttons.uploading')
            : t('buttons.uploadRecording')}
        </div>
      </button>
      <div className="text-gray-400">{t('or')}</div>
      <button
        className="flex size-24 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg bg-primary-500 text-white hover:bg-primary-400 disabled:bg-primary-300 sm:size-40"
        disabled={isFileToSpeech}
        onClick={handleToggleRecording}
      >
        <div>
          {isRecording ? (
            <FaStop className="size-8" />
          ) : (
            <FaMicrophone className="size-8" />
          )}
        </div>
        <div className="text-sm">
          {isRecording
            ? t('buttons.stopRecording')
            : t('buttons.startRecording')}
        </div>
        <div className="text-sm">
          {recordingDuration > 0 && formatTime(recordingDuration / 1000)}
        </div>
      </button>
    </div>
  );
}
