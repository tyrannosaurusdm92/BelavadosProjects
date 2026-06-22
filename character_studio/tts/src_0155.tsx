'use client';

import { useDisclosure } from '@nextui-org/react';
import { useTitle } from 'ahooks';
import ky from 'ky';
import { useCallback, useEffect, useState } from 'react';
import toast, { ErrorIcon } from 'react-hot-toast';

import SpeechCloneTab from '../text-clone-tab';
import VoiceCloneModal from '../voice-clone-modal';

import AudioPlayer from '@/components/audio-player';
import ControlButtons from '@/components/control-buttons';
import { ErrMessage } from '@/components/ErrMessage';
import Footer from '@/components/footer';
import Header from '@/components/header';
import HistoryModal from '@/components/history-modal';
import LanguageSwitch from '@/components/language-switcher';
import SettingsPanel from '@/components/settings-panel';
import SpeechToSpeechTab from '@/components/speech-to-speech-tab';
import TabSelector from '@/components/tab-selector';
import TextToSpeechTab from '@/components/text-to-speech-tab';
import {
  API_KEY,
  AZURE_SPEAKER_TTS_API,
  FISH_AUDIO_SPEAKER_TTS_API,
  MINIMAX_SPEAKER_DOWNLOAD_API,
  MINIMAX_SPEAKER_STATUS_API,
  MINIMAX_SPEAKER_TTS_API,
  MOON_SPEAKER_TTS_API,
  OPENAI_SPEAKER_TTS_API,
  REGION,
} from '@/config/mode';
import { useIndexedDBState } from '@/hooks/use-indexeddb-state';
import { useSpeakers } from '@/hooks/use-speakers';
import { useLanguageContext } from '@/providers/language-provider';
import { useSessionStore } from '@/stores/use-session-store';
import { getAudioDuration } from '@/utils/audio-tools';
import { showBrand } from '@/utils/brand';
import { useSessionStateDB } from '@/utils/session-db';

export interface CustomModel {
  _id: string;
  cover_image: string;
  created_at: string;
  description: string;
  languages: string[];
  like_count: number;
  liked: boolean;
  lock_visibility: boolean;
  mark_count: number;
  marked: boolean;
  samples: any[];
  shared_count: number;
  state: string;
  tags: string[];
  task_count: number;
  title: string;
  train_mode: string;
  type: string;
  updated_at: string;
  visibility: string;
}

export default function HomePage() {
  const { t, language: uiLanguage } = useLanguageContext();
  const apiKey = API_KEY;
  const region = REGION;
  const {
    text,
    platform,
    speaker,
    language,
    speed,
    audioSrc,
    speechToText,
    speechCloneText,
    updateSession,
  } = useSessionStore((state) => ({
    text: state.text,
    platform: state.platform,
    speaker: state.speaker,
    language: state.language,
    speed: state.speed,
    audioSrc: state.audioSrc,
    speechToText: state.speechToText,
    speechCloneText: state.speechCloneText,
    updateSession: state.updateSession,
  }));

  const { create } = useSessionStateDB();

  const { azureTTSSpeakers } = useSpeakers();

  useTitle(t('home.title'));

  const { state: selectedTab, updateState: setSelectedTab } =
    useIndexedDBState<string>('selectedTab', {
      defaultValue: 'text-to-speech',
    });

  const pollTaskStatus = async (
    taskId: number,
    retries = 100,
    delay = 2000
  ): Promise<string> => {
    for (let i = 0; i < retries; i++) {
      try {
        const statusResp = await ky
          .get(MINIMAX_SPEAKER_STATUS_API, {
            headers: { Authorization: `Bearer ${apiKey}` },
            searchParams: {
              task_id: taskId,
            },
          })
          .json<{
            status: string;
            file_id: number;
          }>();

        if (statusResp.status === 'Success') {
          return 'Success';
        } else if (
          statusResp.status === 'Failed' ||
          statusResp.status === 'Expired'
        ) {
          return statusResp.status;
        }
      } catch (error) {
        console.error('failed to poll task status:', error);
      }

      // wait for a while and retry
      await new Promise((res) => setTimeout(res, delay));
    }

    return 'Timeout';
  };

  // text to speech
  const handleTextToSpeech = useCallback(async () => {
    let finalText =
      selectedTab === 'text-to-speech'
        ? text
        : selectedTab === 'speech-clone'
          ? speechCloneText
          : speechToText;

    finalText = finalText
      ?.replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    if (!finalText) {
      toast.error(t('error.noText'));

      return;
    }
    if (!platform && selectedTab !== 'speech-clone') {
      toast.error(t('error.noPlatform'));

      return;
    }
    if (!speaker) {
      toast.error(t('error.noSpeaker'));

      return;
    }

    updateSession({ isTextToSpeechGenerating: true });

    try {
      let data: Blob;

      if (platform === 'OpenAI') {
        const resp = await ky.post(OPENAI_SPEAKER_TTS_API, {
          headers: { Authorization: `Bearer ${apiKey}` },
          json: {
            model: 'tts-1',
            input: finalText,
            voice: speaker,
            speed: speed,
          },
          timeout: false,
        });

        data = await resp.blob();
      } else if (platform === 'Azure') {
        const newSpeaker = azureTTSSpeakers?.find((s) => s.key === speaker);

        if (!newSpeaker) throw new Error('Speaker not found');

        const resp = await ky.post(AZURE_SPEAKER_TTS_API, {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/ssml+xml',
            'X-Microsoft-OutputFormat': 'audio-16khz-32kbitrate-mono-mp3',
          },
          body: `
              <speak version='1.0' xml:lang='${newSpeaker.originData.Locale}'>
                <voice xml:lang='${newSpeaker.originData.Locale}' xml:gender='${newSpeaker.originData.Gender}' name='${newSpeaker.originData.ShortName}'>
                  <prosody rate='${speed}'>
                    ${finalText}
                  </prosody>
                </voice>
              </speak>
            `,
          timeout: false,
        });

        data = await resp.blob();
      } else if (platform === 'Moon') {
        const resp = (await ky
          .post(MOON_SPEAKER_TTS_API, {
            headers: { Authorization: `Bearer ${apiKey}` },
            json: {
              audio: {
                voice_type: speaker,
                encoding: 'wav',
                speed_ratio: speed,
              },
              request: {
                reqid: new Date().getTime().toString(),
                text: finalText,
                operation: 'query',
              },
            },
            timeout: false,
          })
          .json()) as any;

        const base64Data = resp.data;

        const binaryString = atob(base64Data);

        const bytes = new Uint8Array(binaryString.length);

        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        data = new Blob([bytes], { type: 'audio/wav' });
      } else if (platform === 'FishAudio' || selectedTab === 'speech-clone') {
        const resp = await ky
          .post(FISH_AUDIO_SPEAKER_TTS_API, {
            headers: { Authorization: `Bearer ${apiKey}` },
            json: {
              text: finalText,
              reference_id: speaker,
              chunk_length: 200,
              normalize: true,
              format: 'mp3',
              mp3_bitrate: 64,
            },
            timeout: false,
          })
          .json<{ url: string }>();

        data = await (await fetch(resp.url)).blob();
      } else if (platform === 'Minimax') {
        const resp = await ky
          .post(MINIMAX_SPEAKER_TTS_API, {
            headers: { Authorization: `Bearer ${apiKey}` },
            json: {
              model: 'speech-01-turbo',
              text: finalText,
              voice_setting: {
                voice_id: speaker,
                speed: speed,
                vol: 1,
                pitch: 1,
              },
              audio_setting: {
                audio_sample_rate: 32000,
                bitrate: 128000,
                format: 'mp3',
                channel: 2,
              },
            },
            timeout: false,
          })
          .json<{
            task_id: number;
            task_token: string;
            file_id: number;
            base_resp: {
              status_code: number;
              status_msg: string;
            };
          }>();

        const status = await pollTaskStatus(resp.task_id);

        if (status === 'Failed') {
          toast.error(t('error.taskFailed'));

          return;
        } else if (status === 'Expired') {
          toast.error(t('error.taskExpired'));

          return;
        } else if (status === 'Timeout') {
          toast.error(t('error.taskTimeout'));

          return;
        }

        const downloadResp = await ky
          .get(MINIMAX_SPEAKER_DOWNLOAD_API, {
            headers: { Authorization: `Bearer ${apiKey}` },
            searchParams: {
              file_id: resp.file_id,
            },
          })
          .json<{ file: { download_url: string } }>();

        data = await (await fetch(downloadResp.file.download_url)).blob();
      } else {
        throw new Error('Invalid platform');
      }

      if (data.size > 0) {
        const audioSrc = URL.createObjectURL(data);

        const duration = await getAudioDuration(audioSrc);

        updateSession({ audioSrc });
        updateSession({
          audio: data,
          updatedAt: Date.now(),
          duration: duration,
        });
        updateSession({ isTextToSpeechGenerating: false });

        await create(useSessionStore.getState());

        toast.success(t('success.generation'));
      } else {
        toast.error(t('error.unsupportedLanguage'));
      }
    } catch (e) {
      updateSession({ isTextToSpeechGenerating: false });

      console.error('text to speech: ', e);
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

            return;
          }
        } catch (jsonError) {
          console.error('Failed to parse error response:', jsonError);
        }
      }

      toast.error(t('error.generationFailed'));
    }
  }, [
    selectedTab,
    apiKey,
    azureTTSSpeakers,
    updateSession,
    t,
    platform,
    speaker,
    language,
    speed,
    text,
    speechToText,
    speechCloneText,
  ]);

  const handleDownload = useCallback(() => {
    if (!audioSrc) {
      toast.error(t('error.noAudio'));

      return;
    }

    let finalText =
      selectedTab === 'text-to-speech'
        ? text
        : selectedTab === 'speech-clone'
          ? speechCloneText
          : speechToText;

    const a = document.createElement('a');

    a.href = audioSrc;
    a.download = `${finalText?.slice(0, 10) || t('audio')}.mp3`;
    a.click();
  }, [audioSrc, text, t, speechCloneText, speechToText, selectedTab]);

  const { isOpen, onOpenChange, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isVoiceCloneModalOpen,
    onOpenChange: onVoiceCloneModalOpenChange,
    onOpen: onVoiceCloneModalOpen,
    onClose: onVoiceCloneModalClose,
  } = useDisclosure();

  const handleOpenHistoryModal = () => {
    onOpen();
  };

  useEffect(() => {
    updateSession({
      genBy:
        selectedTab === 'text-to-speech'
          ? 'text'
          : selectedTab === 'speech-clone'
            ? 'speech-clone'
            : 'speech-to-speech',
    });
  }, [selectedTab]);

  const [customModels, setCustomModels] = useState<CustomModel[]>([]);

  useEffect(() => {
    const customModelsLocal = localStorage.getItem('customModels');

    if (customModelsLocal) {
      setCustomModels(JSON.parse(customModelsLocal));
    }
  }, []);

  useEffect(() => {
    if (customModels.length > 0) {
      localStorage.setItem('customModels', JSON.stringify(customModels));
    }
  }, [customModels]);

  const renderTabContent = useCallback(() => {
    if (selectedTab === 'text-to-speech') {
      return <TextToSpeechTab />;
    } else if (selectedTab === 'speech-to-speech') {
      return <SpeechToSpeechTab />;
    } else if (selectedTab === 'speech-clone') {
      return <SpeechCloneTab />;
    }
  }, [selectedTab, customModels]);

  return (
    <section className="flex h-fit min-h-screen flex-col items-center justify-between gap-4 py-8 md:py-10">
      <LanguageSwitch className="fixed right-10 top-2" />
      <Header />
      <div className="container flex h-full w-full min-w-[375] max-w-[780px] flex-1 flex-col gap-4 px-8">
        <TabSelector
          selectedTab={selectedTab || 'text-to-speech'}
          setSelectedTab={setSelectedTab}
        />
        <div className="h-[300px] min-h-[300px] w-full resize-y overflow-hidden rounded-lg border bg-white focus-within:border-gray-700 hover:border-gray-400 focus-within:hover:border-primary-700">
          {renderTabContent()}
        </div>
        <SettingsPanel
          currentTab={selectedTab || ''}
          customModels={customModels}
          onOpenVoiceCloneModal={onVoiceCloneModalOpen}
        />
        <AudioPlayer />
        <ControlButtons
          customModels={customModels}
          handleDownload={handleDownload}
          handleOpenHistoryModal={handleOpenHistoryModal}
          handleTextToSpeech={handleTextToSpeech}
        />
      </div>
      {showBrand && <Footer />}
      <VoiceCloneModal
        customModels={customModels}
        isOpen={isVoiceCloneModalOpen}
        setCustomModels={setCustomModels}
        onClose={onVoiceCloneModalClose}
        onOpenChange={onVoiceCloneModalOpenChange}
      />
      <HistoryModal
        customModels={customModels}
        isOpen={isOpen}
        onClose={onClose}
        onOpenChange={onOpenChange}
      />
    </section>
  );
}
