import { useSessionStorageState } from 'ahooks';
import ISO6391 from 'iso-639-1';
import ky from 'ky';
import { useEffect, useMemo } from 'react';
import toast, { ErrorIcon } from 'react-hot-toast';

import { ErrMessage } from '@/components/ErrMessage';
import {
  API_KEY,
  AZURE_SPEAKER_LIST_API,
  FISH_AUDIO_SPEAKER_LIST_API,
  REGION,
} from '@/config/mode';
import { useLanguageContext } from '@/providers/language-provider';
import { useSessionStore } from '@/stores/use-session-store';
import { useUserStore } from '@/stores/use-user-store';

export interface AzureTTSSpeaker {
  Name: string;
  DisplayName: string;
  LocalName: string;
  ShortName: string;
  Gender: string;
  Locale: string;
  LocaleName: string;
  SampleRateHertz: string;
  VoiceType: string;
  Status: string;
  WordsPerMinute: string;
}

interface Author {
  _id: string;
  nickname: string;
  avatar: string;
}

interface Sample {
  title: string;
  text: string;
  task_id: string;
  audio: string;
}

export interface FishAudioSpeaker {
  _id: string;
  type: 'svc' | 'tts';
  title: string;
  description: string;
  cover_image: string;
  train_mode: 'fast' | 'full';
  state: 'created' | 'training' | 'trained' | 'failed';
  tags: string[];
  samples: Sample[];
  created_at: string;
  updated_at: string;
  languages: string[];
  visibility: 'public' | 'private' | 'unlist';
  lock_visibility: boolean;
  like_count: number;
  mark_count: number;
  shared_count: number;
  task_count: number;
  liked: boolean;
  marked: boolean;
  author: Author;
}

export function useSpeakers() {
  const apiKey = API_KEY;
  const { t, language: uiLanguage } = useLanguageContext();
  const { language } = useSessionStore((state) => {
    return {
      language: state.language,
    };
  });
  const [lang] = useUserStore((state) => [state.language]);
  const region = REGION;

  const platforms = [
    { key: 'OpenAI', label: 'OpenAI', value: 'OpenAI' },
    { key: 'Azure', label: 'Azure', value: 'Azure' },
    { key: 'Moon', label: t('doubao'), value: 'Moon' },
    { key: 'FishAudio', label: 'FishAudio', value: 'FishAudio' },
    { key: 'Minimax', label: 'Minimax', value: 'Minimax' },
  ];

  const [fishAudioSpeakers, setFishAudioSpeakers] = useSessionStorageState<
    {
      key: string;
      label: string;
      value: string;
      originData: FishAudioSpeaker;
    }[]
  >('fishAudioSpeakers', { defaultValue: [] });

  const [azureTTSSpeakers, setAzureTTSSpeakers] = useSessionStorageState<
    { key: string; label: string; value: string; originData: AzureTTSSpeaker }[]
  >('azureTTSSpeakers', { defaultValue: [] });

  useEffect(() => {
    if (apiKey && azureTTSSpeakers?.length === 0) {
      const fetchAzureTTSSpeakers = async () => {
        try {
          const data = await ky
            .get(AZURE_SPEAKER_LIST_API, {
              headers: { Authorization: `Bearer ${apiKey}` },
            })
            .json<AzureTTSSpeaker[]>();

          setAzureTTSSpeakers(
            data.map((speaker) => ({
              key: speaker.ShortName,
              label: `${speaker.LocalName} (${t(speaker.Gender.toLowerCase())})`,
              value: speaker.ShortName,
              originData: speaker,
            }))
          );
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
                  { id: 'fetch-speakers-error' }
                );

                return;
              }
            } catch (jsonError) {
              console.error('Failed to parse error response:', jsonError);
            }
          }

          toast.error(t('error.fetchSpeakersFailed'), {
            id: 'fetch-speakers-error',
          });
        }
      };

      fetchAzureTTSSpeakers();
    }
  }, [apiKey, t, lang, region]);

  useEffect(() => {
    if (apiKey && fishAudioSpeakers?.length === 0) {
      const fetchFishAudioSpeakers = async () => {
        try {
          const data = await ky
            .get(FISH_AUDIO_SPEAKER_LIST_API, {
              searchParams: {
                page_number: 1,
                page_size: 100,
              },
              headers: { Authorization: `Bearer ${apiKey}` },
            })
            .json<{
              total: number;
              items: FishAudioSpeaker[];
            }>();

          setFishAudioSpeakers(
            data.items.map((speaker) => ({
              key: speaker._id,
              label: speaker.title,
              value: speaker._id,
              originData: speaker,
            }))
          );
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
                  { id: 'fetch-speakers-error' }
                );

                return;
              }
            } catch (jsonError) {
              console.error('Failed to parse error response:', jsonError);
            }
          }

          toast.error(t('error.fetchSpeakersFailed'), {
            id: 'fetch-speakers-error',
          });
        }
      };

      fetchFishAudioSpeakers();
    }
  }, [apiKey, t, lang, region]);

  const azureSupportedLanguages = useMemo(() => {
    return [
      ...Array.from(
        new Set(
          azureTTSSpeakers?.map(
            (speaker) => speaker.originData.Locale.split('-')[0]
          )
        )
      ),
    ]
      .filter((lang) => ISO6391.validate(lang))
      .map((lang) => ({
        key: lang,
        label: ISO6391.getNativeName(lang),
        value: lang,
      }))
      .sort((a, b) => {
        // Put Chinese language at the beginning
        if (a.key === 'zh') return -1;
        if (b.key === 'zh') return 1;

        return a.label.localeCompare(b.label);
      });
  }, [azureTTSSpeakers]);

  const filteredAzureTTSSpeakers = useMemo(
    () =>
      azureTTSSpeakers?.filter((speaker) =>
        speaker.originData.Locale.startsWith(language || '')
      ) || [],
    [azureSupportedLanguages, language]
  );

  const openAISpeakers = useMemo(
    () => [
      { key: 'alloy', label: 'Alloy', value: 'alloy' },
      { key: 'echo', label: 'Echo', value: 'echo' },
      { key: 'fable', label: 'Fable', value: 'fable' },
      { key: 'onyx', label: 'Onyx', value: 'onyx' },
      { key: 'nova', label: 'Nova', value: 'nova' },
      { key: 'shimmer', label: 'Shimmer', value: 'shimmer' },
    ],
    []
  );

  const minMaxSpeakers = useMemo(
    () => [
      {
        key: 'male-qn-qingse',
        label: t('minmax.male-qn-qingse'),
        value: 'male-qn-qingse',
      },
      {
        key: 'male-qn-jingying',
        label: t('minmax.male-qn-jingying'),
        value: 'male-qn-jingying',
      },
      {
        key: 'male-qn-badao',
        label: t('minmax.male-qn-badao'),
        value: 'male-qn-badao',
      },
      {
        key: 'male-qn-daxuesheng',
        label: t('minmax.male-qn-daxuesheng'),
        value: 'male-qn-daxuesheng',
      },
      {
        key: 'female-shaonv',
        label: t('minmax.female-shaonv'),
        value: 'female-shaonv',
      },
      {
        key: 'female-yujie',
        label: t('minmax.female-yujie'),
        value: 'female-yujie',
      },
      {
        key: 'female-chengshu',
        label: t('minmax.female-chengshu'),
        value: 'female-chengshu',
      },
      {
        key: 'female-tianmei',
        label: t('minmax.female-tianmei'),
        value: 'female-tianmei',
      },
      {
        key: 'presenter_male',
        label: t('minmax.presenter_male'),
        value: 'presenter_male',
      },
      {
        key: 'presenter_female',
        label: t('minmax.presenter_female'),
        value: 'presenter_female',
      },
      {
        key: 'audiobook_male_1',
        label: t('minmax.audiobook_male_1'),
        value: 'audiobook_male_1',
      },
      {
        key: 'audiobook_male_2',
        label: t('minmax.audiobook_male_2'),
        value: 'audiobook_male_2',
      },
      {
        key: 'audiobook_female_1',
        label: t('minmax.audiobook_female_1'),
        value: 'audiobook_female_1',
      },
      {
        key: 'audiobook_female_2',
        label: t('minmax.audiobook_female_2'),
        value: 'audiobook_female_2',
      },
      {
        key: 'male-qn-qingse-jingpin',
        label: t('minmax.male-qn-qingse-jingpin'),
        value: 'male-qn-qingse-jingpin',
      },
      {
        key: 'male-qn-jingying-jingpin',
        label: t('minmax.male-qn-jingying-jingpin'),
        value: 'male-qn-jingying-jingpin',
      },
      {
        key: 'male-qn-badao-jingpin',
        label: t('minmax.male-qn-badao-jingpin'),
        value: 'male-qn-badao-jingpin',
      },
      {
        key: 'male-qn-daxuesheng-jingpin',
        label: t('minmax.male-qn-daxuesheng-jingpin'),
        value: 'male-qn-daxuesheng-jingpin',
      },
      {
        key: 'female-shaonv-jingpin',
        label: t('minmax.female-shaonv-jingpin'),
        value: 'female-shaonv-jingpin',
      },
      {
        key: 'female-yujie-jingpin',
        label: t('minmax.female-yujie-jingpin'),
        value: 'female-yujie-jingpin',
      },
      {
        key: 'female-chengshu-jingpin',
        label: t('minmax.female-chengshu-jingpin'),
        value: 'female-chengshu-jingpin',
      },
      {
        key: 'female-tianmei-jingpin',
        label: t('minmax.female-tianmei-jingpin'),
        value: 'female-tianmei-jingpin',
      },
      { key: 'clever_boy', label: t('minmax.clever_boy'), value: 'clever_boy' },
      { key: 'cute_boy', label: t('minmax.cute_boy'), value: 'cute_boy' },
      {
        key: 'lovely_girl',
        label: t('minmax.lovely_girl'),
        value: 'lovely_girl',
      },
      {
        key: 'cartoon_pig',
        label: t('minmax.cartoon_pig'),
        value: 'cartoon_pig',
      },
    ],
    [t]
  );

  const moonSpeakers = useMemo(
    () => [
      {
        key: 'zh_female_shuangkuaisisi_moon_bigtts',
        label: '爽快思思/Skye',
        value: 'zh_female_shuangkuaisisi_moon_bigtts',
      },
      {
        key: 'zh_male_wennuanahu_moon_bigtts',
        label: '温暖阿虎/Alvin',
        value: 'zh_male_wennuanahu_moon_bigtts',
      },
      {
        key: 'zh_male_shaonianzixin_moon_bigtts',
        label: '少年梓辛/Brayan',
        value: 'zh_male_shaonianzixin_moon_bigtts',
      },
      {
        key: 'multi_male_jingqiangkanye_moon_bigtts',
        label: 'かずね（和音）/Javier or Álvaro',
        value: 'multi_male_jingqiangkanye_moon_bigtts',
      },
      {
        key: 'multi_female_shuangkuaisisi_moon_bigtts',
        label: 'はるこ（晴子）/Esmeralda',
        value: 'multi_female_shuangkuaisisi_moon_bigtts',
      },
      {
        key: 'multi_female_gaolengyujie_moon_bigtts',
        label: 'あけみ（朱美）',
        value: 'multi_female_gaolengyujie_moon_bigtts',
      },
      {
        key: 'multi_male_wanqudashu_moon_bigtts',
        label: 'ひろし（広志）/Roberto',
        value: 'multi_male_wanqudashu_moon_bigtts',
      },
      {
        key: 'zh_female_linjianvhai_moon_bigtts',
        label: '邻家女孩',
        value: 'zh_female_linjianvhai_moon_bigtts',
      },
      {
        key: 'zh_male_yuanboxiaoshu_moon_bigtts',
        label: '渊博小叔',
        value: 'zh_male_yuanboxiaoshu_moon_bigtts',
      },
      {
        key: 'zh_male_yangguangqingnian_moon_bigtts',
        label: '阳光青年',
        value: 'zh_male_yangguangqingnian_moon_bigtts',
      },
      {
        key: 'zh_male_jingqiangkanye_moon_bigtts',
        label: '京腔侃爷/Harmony',
        value: 'zh_male_jingqiangkanye_moon_bigtts',
      },
      {
        key: 'zh_female_wanwanxiaohe_moon_bigtts',
        label: '湾湾小何',
        value: 'zh_female_wanwanxiaohe_moon_bigtts',
      },
      {
        key: 'zh_female_wanqudashu_moon_bigtts',
        label: '湾区大叔',
        value: 'zh_female_wanqudashu_moon_bigtts',
      },
      {
        key: 'zh_female_daimengchuanmei_moon_bigtts',
        label: '呆萌川妹',
        value: 'zh_female_daimengchuanmei_moon_bigtts',
      },
      {
        key: 'zh_male_guozhoudege_moon_bigtts',
        label: '广州德哥',
        value: 'zh_male_guozhoudege_moon_bigtts',
      },
      {
        key: 'zh_male_beijingxiaoye_moon_bigtts',
        label: '北京小爷',
        value: 'zh_male_beijingxiaoye_moon_bigtts',
      },
      {
        key: 'zh_male_haoyuxiaoge_moon_bigtts',
        label: '浩宇小哥',
        value: 'zh_male_haoyuxiaoge_moon_bigtts',
      },
      {
        key: 'zh_male_guangxiyuanzhou_moon_bigtts',
        label: '广西远舟',
        value: 'zh_male_guangxiyuanzhou_moon_bigtts',
      },
      {
        key: 'zh_female_meituojieer_moon_bigtts',
        label: '妹坨洁儿',
        value: 'zh_female_meituojieer_moon_bigtts',
      },
      {
        key: 'zh_male_yuzhouzixuan_moon_bigtts',
        label: '豫州子轩',
        value: 'zh_male_yuzhouzixuan_moon_bigtts',
      },
      {
        key: 'zh_female_gaolengyujie_moon_bigtts',
        label: '高冷御姐',
        value: 'zh_female_gaolengyujie_moon_bigtts',
      },
      {
        key: 'zh_male_aojiaobazong_moon_bigtts',
        label: '傲娇霸总',
        value: 'zh_male_aojiaobazong_moon_bigtts',
      },
      {
        key: 'zh_female_meilinvyou_moon_bigtts',
        label: '魅力女友',
        value: 'zh_female_meilinvyou_moon_bigtts',
      },
      {
        key: 'zh_male_shenyeboke_moon_bigtts',
        label: '深夜播客',
        value: 'zh_male_shenyeboke_moon_bigtts',
      },
      {
        key: 'zh_female_sajiaonvyou_moon_bigtts',
        label: '柔美女友',
        value: 'zh_female_sajiaonvyou_moon_bigtts',
      },
      {
        key: 'zh_female_yuanqinvyou_moon_bigtts',
        label: '撒娇学妹',
        value: 'zh_female_yuanqinvyou_moon_bigtts',
      },
    ],
    []
  );

  return {
    platforms,
    azureTTSSpeakers,
    azureSupportedLanguages,
    filteredAzureTTSSpeakers,
    fishAudioSpeakers,
    openAISpeakers,
    moonSpeakers,
    minMaxSpeakers,
  } as const;
}
