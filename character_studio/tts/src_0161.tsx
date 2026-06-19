import React from 'react';

import { useSessionStore } from '@/stores/use-session-store';

const MAX_WORDS_PER_REQUEST = 4096;

export default function TextToSpeechTab() {
  const { text, updateSession } = useSessionStore((state) => {
    return {
      text: state.text,
      updateSession: state.updateSession,
    };
  });

  return (
    <div className="relative h-full w-full pb-8">
      <textarea
        className="h-full w-full resize-none p-4 focus-visible:outline-none"
        maxLength={MAX_WORDS_PER_REQUEST}
        placeholder=""
        value={text}
        onChange={(e) => updateSession({ text: e.target.value })}
      />
      <div className="absolute bottom-2 right-2 h-fit w-fit text-gray-400">
        {text?.length || 0} / {MAX_WORDS_PER_REQUEST}
      </div>
    </div>
  );
}
