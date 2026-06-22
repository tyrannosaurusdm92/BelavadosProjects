import { Button, Select, SelectItem, Slider } from '@nextui-org/react';
import { useEffect } from 'react';

import { CustomModel } from './page/home-page';

import { useIndexedDBState } from '@/hooks/use-indexeddb-state';
import { useSpeakers } from '@/hooks/use-speakers';
import { useLanguageContext } from '@/providers/language-provider';
import { useSessionStore } from '@/stores/use-session-store';

export default function SettingsPanel({
  currentTab,
  onOpenVoiceCloneModal,
  customModels,
}: {
  currentTab: string;
  onOpenVoiceCloneModal: () => void;
  customModels: CustomModel[];
}) {
  const { t } = useLanguageContext();
  const { platform, speaker, speed, language, updateSession } = useSessionStore(
    (state) => ({
      platform: state.platform,
      speaker: state.speaker,
      speed: state.speed,
      language: state.language,
      updateSession: state.updateSession,
    })
  );

  const { state: selectedTab, updateState: setSelectedTab } =
    useIndexedDBState<string>('selectedTab', {
      defaultValue: 'text-to-speech',
    });

  const {
    platforms,
    azureSupportedLanguages,
    filteredAzureTTSSpeakers,
    openAISpeakers,
    moonSpeakers,
    fishAudioSpeakers,
    minMaxSpeakers,
  } = useSpeakers();

  useEffect(() => {
    // Reset language and speaker when platform changes
    if (platform === 'Azure') {
      updateSession({
        language: azureSupportedLanguages[0]?.value || '',
        speaker: '',
      });
    } else if (platform === 'OpenAI') {
      updateSession({
        language: '',
        speaker: openAISpeakers[0]?.value || '',
      });
    } else if (platform === 'Moon') {
      updateSession({
        language: '',
        speaker: moonSpeakers[0]?.value || '',
      });
    } else if (platform === 'FishAudio' && selectedTab !== 'speech-clone') {
      updateSession({
        language: '',
        speaker: fishAudioSpeakers?.[0]?.value || '',
      });
    } else if (platform === 'FishAudio' && selectedTab === 'speech-clone') {
      updateSession({
        language: '',
        speaker: customModels?.[0]?._id || '',
      });
    } else if (platform === 'Minimax') {
      updateSession({
        language: '',
        speaker: minMaxSpeakers?.[0]?.value || '',
      });
    }
  }, [
    platform,
    azureSupportedLanguages,
    openAISpeakers,
    moonSpeakers,
    updateSession,
    selectedTab,
    customModels,
    minMaxSpeakers,
  ]);

  useEffect(() => {
    // Reset speaker when language changes (for Azure)
    if (platform === 'Azure') {
      updateSession({
        speaker: filteredAzureTTSSpeakers[0]?.value || '',
      });
    }
  }, [platform, language, filteredAzureTTSSpeakers, updateSession]);

  const { isTextToSpeechGenerating } = useSessionStore((state) => {
    return {
      isTextToSpeechGenerating: state.isTextToSpeechGenerating,
    };
  });

  const isSpeechCloneTab = currentTab === 'speech-clone';

  return (
    <>
      {!isSpeechCloneTab && (
        <>
          <div className="flex flex-col items-center justify-center gap-4 md:flex-row">
            <Select
              disallowEmptySelection
              aria-label={t('aria.selectPlatform')}
              className="w-full md:w-32"
              classNames={{
                trigger: 'bg-white border',
                listboxWrapper: 'scrollbar-default',
              }}
              isDisabled={isTextToSpeechGenerating}
              placeholder={t('placeholders.selectPlatform')}
              radius="sm"
              selectedKeys={[platform]}
              size="sm"
              variant="bordered"
              onSelectionChange={(selected) => {
                updateSession({
                  platform: Array.from(selected as Set<string>)[0],
                });
              }}
            >
              {platforms.map((platform) => (
                <SelectItem
                  key={platform.key}
                  value={platform.value}
                >
                  {platform.label}
                </SelectItem>
              ))}
            </Select>
            {platform === 'Azure' && (
              <Select
                disallowEmptySelection
                aria-label={t('aria.selectLanguage')}
                className="w-full md:w-32"
                classNames={{
                  trigger: 'bg-white border',
                  listboxWrapper: 'scrollbar-default',
                }}
                isDisabled={isTextToSpeechGenerating}
                placeholder={t('placeholders.selectLanguage')}
                radius="sm"
                selectedKeys={[language]}
                size="sm"
                variant="bordered"
                onSelectionChange={(selected) => {
                  updateSession({
                    language: Array.from(selected as Set<string>)[0],
                  });
                }}
              >
                {azureSupportedLanguages.map((lang) => (
                  <SelectItem
                    key={lang.key}
                    value={lang.value}
                  >
                    {lang.label}
                  </SelectItem>
                ))}
              </Select>
            )}
            <Select
              disallowEmptySelection
              aria-label={t('aria.selectSpeaker')}
              className="flex-1"
              classNames={{
                trigger: 'bg-white border',
                listboxWrapper: 'scrollbar-default',
              }}
              isDisabled={isTextToSpeechGenerating}
              placeholder={t('placeholders.selectSpeaker')}
              radius="sm"
              selectedKeys={[speaker]}
              size="sm"
              variant="bordered"
              onSelectionChange={(selected) => {
                updateSession({
                  speaker: Array.from(selected as Set<string>)[0],
                });
              }}
            >
              {platform === 'OpenAI'
                ? openAISpeakers.map((spk) => (
                    <SelectItem
                      key={spk.key}
                      value={spk.value}
                    >
                      {spk.label}
                    </SelectItem>
                  ))
                : platform === 'Azure'
                  ? filteredAzureTTSSpeakers.map((spk) => (
                      <SelectItem
                        key={spk.key}
                        value={spk.value}
                      >
                        {`${spk.originData.LocalName} (${t(spk.originData.Gender.toLowerCase())})`}
                      </SelectItem>
                    ))
                  : platform === 'Moon'
                    ? moonSpeakers.map((spk) => (
                        <SelectItem
                          key={spk.key}
                          value={spk.value}
                        >
                          {spk.label}
                        </SelectItem>
                      ))
                    : platform === 'Minimax'
                      ? minMaxSpeakers?.map((spk) => (
                          <SelectItem
                            key={spk.key}
                            value={spk.value}
                          >
                            {spk.label}
                          </SelectItem>
                        ))
                      : fishAudioSpeakers?.map((spk) => (
                          <SelectItem
                            key={spk.key}
                            value={spk.value}
                          >
                            {spk.label}
                          </SelectItem>
                        )) || []}
            </Select>
          </div>
          {platform !== 'FishAudio' && (
            <div className="flex w-full items-center justify-center gap-2 pb-4 pt-8 md:gap-8">
              <div className="relative flex-1">
                <Slider
                  aria-label={t('aria.speed')}
                  classNames={{
                    base: 'mb-0 md:mb-4',
                    mark: 'hidden md:block',
                  }}
                  defaultValue={1}
                  isDisabled={isTextToSpeechGenerating}
                  marks={[
                    { value: 0.25, label: '0.25x' },
                    { value: 0.5, label: '0.5x' },
                    { value: 1, label: '1x' },
                    { value: 1.5, label: '1.5x' },
                    { value: 2, label: '2x' },
                  ]}
                  maxValue={2}
                  minValue={0.25}
                  showSteps={true}
                  size="sm"
                  step={0.25}
                  value={speed}
                  onChange={(n) => {
                    updateSession({ speed: n as number });
                  }}
                />
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 -translate-y-1/2 transform rounded-full border bg-white px-2 text-sm text-gray-500">
                  {speed?.toFixed(2)}x
                </div>
              </div>
            </div>
          )}
        </>
      )}
      {isSpeechCloneTab && (
        <div className="flex w-full items-center justify-center gap-2 md:gap-4">
          <Select
            disallowEmptySelection
            aria-label={t('aria.selectSpeaker')}
            className="flex-1"
            classNames={{
              trigger: 'bg-white border',
              listboxWrapper: 'scrollbar-default',
            }}
            isDisabled={isTextToSpeechGenerating}
            placeholder={t('placeholders.selectSpeaker')}
            radius="sm"
            selectedKeys={[speaker]}
            size="sm"
            variant="bordered"
            onSelectionChange={(selected) => {
              updateSession({
                platform: 'FishAudio',
                speaker: Array.from(selected as Set<string>)[0],
              });
            }}
          >
            {customModels?.map((model) => (
              <SelectItem
                key={model._id}
                value={model._id}
              >
                {model.title}
              </SelectItem>
            )) || []}
          </Select>
          <Button
            aria-label={t('aria.makeCloneModel')}
            className=""
            color="primary"
            isDisabled={isTextToSpeechGenerating}
            radius="sm"
            size="sm"
            variant="solid"
            onClick={onOpenVoiceCloneModal}
          >
            {t('aria.makeCloneModel')}
          </Button>
        </div>
      )}
    </>
  );
}
