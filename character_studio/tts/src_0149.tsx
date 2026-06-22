import { Button } from '@nextui-org/react';
import { useMemo } from 'react';

import { CustomModel } from './page/home-page';

import { useIndexedDBState } from '@/hooks/use-indexeddb-state';
import { useLanguageContext } from '@/providers/language-provider';
import { useSessionStore } from '@/stores/use-session-store';

interface ControlButtonsProps {
  handleOpenHistoryModal: () => void;
  handleDownload: () => void;
  handleTextToSpeech: () => void;
  customModels: CustomModel[];
}

export default function ControlButtons({
  handleOpenHistoryModal,
  handleDownload,
  handleTextToSpeech,
  customModels,
}: ControlButtonsProps) {
  const { t } = useLanguageContext();
  const {
    audioSrc,
    text,
    speechToText,
    isTextToSpeechGenerating,
    speechCloneText,
    speaker,
  } = useSessionStore((state) => {
    return {
      audioSrc: state.audioSrc,
      text: state.text,
      speechToText: state.speechToText,
      isTextToSpeechGenerating: state.isTextToSpeechGenerating,
      speechCloneText: state.speechCloneText,
      speaker: state.speaker,
    };
  });

  const { state: selectedTab } = useIndexedDBState<string>('selectedTab', {
    defaultValue: 'text-to-speech',
  });

  const canGenerateWhenCloneTab = useMemo(() => {
    const customModel = customModels.find((model) => model._id === speaker);

    return !!customModel;
  }, [speaker, speechCloneText, customModels]);

  return (
    <div className="flex items-center justify-between">
      <div>
        <Button
          className="border"
          size="sm"
          variant="bordered"
          onClick={handleOpenHistoryModal}
        >
          {t('buttons.history')}
        </Button>
      </div>
      <div className="flex items-center justify-center gap-4">
        <Button
          className="border border-primary-500 text-primary-500"
          isDisabled={!audioSrc}
          size="sm"
          variant="bordered"
          onClick={handleDownload}
        >
          {t('buttons.download')}
        </Button>
        <Button
          className="bg-primary-500 text-white"
          isDisabled={
            (!text && selectedTab === 'text-to-speech') ||
            (!speechToText && selectedTab === 'speech-to-speech') ||
            (selectedTab === 'speech-clone' &&
              (!speechCloneText || !canGenerateWhenCloneTab))
          }
          isLoading={isTextToSpeechGenerating}
          size="sm"
          variant="solid"
          onClick={handleTextToSpeech}
        >
          {t('buttons.generate')}
        </Button>
      </div>
    </div>
  );
}
