import { motion } from 'framer-motion';

import { useLanguageContext } from '@/providers/language-provider';

export default function TabSelector({
  selectedTab,
  setSelectedTab,
}: {
  selectedTab: string;
  setSelectedTab: (tab: string) => void;
}) {
  const { t } = useLanguageContext();

  const tabs = [
    { key: 'text-to-speech', label: t('tabs.textToSpeech') },
    { key: 'speech-to-speech', label: t('tabs.speechToSpeech') },
    { key: 'speech-clone', label: t('tabs.speechClone') },
  ];

  return (
    <div className="flex items-center justify-center gap-8">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          className={`relative px-4 py-2 ${
            selectedTab === tab.key ? 'text-primary-500' : ''
          }`}
          onClick={() => setSelectedTab(tab.key)}
        >
          {tab.label}
          {selectedTab === tab.key && (
            <motion.div
              animate={{ opacity: 1 }}
              className="absolute bottom-0 left-0 right-0 mx-auto h-0.5 w-[80%] bg-primary-500"
              exit={{ opacity: 0 }}
              initial={false}
              layoutId="underline"
            />
          )}
        </button>
      ))}
    </div>
  );
}
