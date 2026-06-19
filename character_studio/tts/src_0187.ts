import Dexie, { Table } from 'dexie';

interface SessionState {
  id?: string;
  platform: string;
  speaker: string;
  language: string;
  speed: number;
  currentTime: number;
  duration: number;
  volume: number;
  text: string;
  isEditing: boolean;
  speechToText: string;
  speechCloneText: string;
  audio: Blob | null;
  audioSrc: string;
  createdAt: number;
  updatedAt: number;
  isPlaying: boolean;
  isTextToSpeechGenerating: boolean;
  isFileToSpeech: boolean;
  genBy: string;
}

class SessionStateDatabase extends Dexie {
  sessions!: Table<SessionState, string>;

  constructor() {
    super('SessionStateDB');
    this.version(1).stores({
      sessions: '++id, platform, speaker, language, createdAt, updatedAt, text',
    });
  }
}

const db = new SessionStateDatabase();

export const useSessionStateDB = () => {
  const create = async (
    session: Omit<SessionState, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    // Create a new object with only cloneable properties
    const cloneableSession = Object.keys(session).reduce((acc, key) => {
      const value = session[key as keyof typeof session];

      if (
        typeof value !== 'function' &&
        !(
          value &&
          typeof value === 'object' &&
          'nodeType' in value &&
          (value as any).nodeType === 1
        ) &&
        !(
          value &&
          typeof value === 'object' &&
          'window' in value &&
          (value as Window).window === value
        )
      ) {
        acc[key as keyof typeof session] = value as any;
      }

      return acc;
    }, {} as Partial<SessionState>);

    const newSession: SessionState = {
      ...cloneableSession,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      id: undefined,
    } as SessionState;

    const id = await db.sessions.add(newSession);

    return { ...newSession, id };
  };

  const read = async (id: string) => {
    return await db.sessions.get(id);
  };

  const update = async (id: string, updates: Partial<SessionState>) => {
    const updatedSession = {
      ...updates,
      updatedAt: Date.now(),
    };

    await db.sessions.update(id, updatedSession);

    return await read(id);
  };

  const remove = async (id: string) => {
    await db.sessions.delete(id);
  };

  const query = async (dslQuery: Partial<SessionState>) => {
    return await db.sessions.where(dslQuery).toArray();
  };

  const queryPaginated = async (
    dslQuery: Partial<
      Pick<SessionState, 'platform' | 'speaker' | 'language' | 'text'>
    >,
    page: number,
    pageSize: number
  ) => {
    let query = db.sessions.orderBy('createdAt'); // Default sorting by createdAt

    // Perform where query only on indexed fields
    if (dslQuery.platform)
      query = query.and((item) => item.platform === dslQuery.platform);
    if (dslQuery.speaker)
      query = query.and((item) => item.speaker === dslQuery.speaker);
    if (dslQuery.language)
      query = query.and((item) => item.language === dslQuery.language);
    if (dslQuery.text)
      query = query.and((item) =>
        item.text.toLowerCase().includes(dslQuery.text!.toLowerCase())
      );

    // Calculate the total count
    const totalCount = await query.count();

    const offset = (page - 1) * pageSize;
    const results = await query
      .reverse()
      .offset(offset)
      .limit(pageSize)
      .toArray();

    return {
      results,
      totalPages: Math.ceil(totalCount / pageSize),
      currentPage: page,
    };
  };

  return { create, read, update, remove, query, queryPaginated };
};

export type { SessionState };
