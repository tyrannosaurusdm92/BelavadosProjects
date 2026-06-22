import { useSessionStore } from '@/stores/use-session-store';

const MAX_WORDS_PER_REQUEST = 4096;

export default function SpeechCloneTab() {
  const { speechCloneText, updateSession } = useSessionStore((state) => {
    return {
      speechCloneText: state.speechCloneText,
      updateSession: state.updateSession,
    };
  });

  return (
    <div className="relative h-full w-full pb-8">
      <textarea
        className="h-full w-full resize-none p-4 focus-visible:outline-none"
        maxLength={MAX_WORDS_PER_REQUEST}
        placeholder=""
        value={speechCloneText}
        onChange={(e) => updateSession({ speechCloneText: e.target.value })}
      />
      <div className="absolute bottom-2 right-2 h-fit w-fit text-gray-400">
        {speechCloneText?.length || 0} / {MAX_WORDS_PER_REQUEST}
      </div>
    </div>
  );
}
