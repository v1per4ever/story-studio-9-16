import { StorySlide, PresetType } from '../types/story';

export const BUSINESS_STOCK_IMAGES = [
  'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1080&q=80', // Skyscraper modern
  'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1080&q=80', // Executive
  'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1080&q=80', // Boardroom
  'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1080&q=80', // Global Tech
  'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1080&q=80', // Analytics
  'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1080&q=80', // Team Collaboration
  'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1080&q=80', // Code / Laptop
];

export const BUSINESS_GRADIENTS = [
  'linear-gradient(135deg, #090d16 0%, #172554 100%)', // Deep Navy
  'linear-gradient(135deg, #09090b 0%, #27272a 100%)', // Neutral Charcoal
  'linear-gradient(135deg, #022c22 0%, #064e3b 50%, #022c22 100%)', // Emerald Dark
  'linear-gradient(135deg, #18181b 0%, #312e81 100%)', // Indigo Slate
  'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)', // Midnight Slate
];

export interface FontOption {
  id: string;
  name: string;
  family: string;
}

export const FONT_OPTIONS: FontOption[] = [
  { id: 'inter', name: 'Inter (Швейцарский гротеск)', family: "'Inter', sans-serif" },
  { id: 'space', name: 'Space Grotesk (Технологичный)', family: "'Space Grotesk', sans-serif" },
  { id: 'montserrat', name: 'Montserrat (Геометрический)', family: "'Montserrat', sans-serif" },
  { id: 'bebas', name: 'Bebas Neue (Плакатный)', family: "'Bebas Neue', cursive" },
  { id: 'playfair', name: 'Playfair Display (Антиква)', family: "'Playfair Display', serif" },
];

export interface PresetInfo {
  id: PresetType;
  title: string;
  description: string;
  defaultContent: {
    tag: string;
    title: string;
    subtitle: string;
    metricValue?: string;
    authorName?: string;
    price?: string;
    checklistItems?: string[];
  };
}

export const PRESET_DEFINITIONS: Record<PresetType, PresetInfo> = {
  editorial: {
    id: 'editorial',
    title: 'Деловой заголовок',
    description: 'Универсальный заголовок со структурированным тегом и подзаголовком',
    defaultContent: {
      tag: 'СТРАТЕГИЯ И РОСТ',
      title: 'Как масштабировать бизнес без потери маржинальности',
      subtitle: '3 ключевых рычага управления операционной эффективностью в 2026 году',
    },
  },
  quote: {
    id: 'quote',
    title: 'Цитата эксперта',
    description: 'Фокусная мысль руководителя с линией разделения и подписью',
    defaultContent: {
      tag: 'ИНСАЙТ ДНЯ',
      title: '«Побеждает не тот, у кого больше ресурсов, а тот, кто быстрее адаптирует бизнес-модель»',
      subtitle: '',
      authorName: 'Михаил Воронов • Основатель BiznesBox',
    },
  },
  metric: {
    id: 'metric',
    title: 'Кейс / Цифра + факт',
    description: 'Крупный показатель с результатами внедрения или исследования',
    defaultContent: {
      tag: 'РЕЗУЛЬТАТ КЕЙСА',
      metricValue: '+142%',
      title: 'Рост конверсии сквозной воронки',
      subtitle: 'Результат оцифровки регламентов и интеграции CRM-системы за 45 дней',
    },
  },
  highlight: {
    id: 'highlight',
    title: 'Фокус-тезис',
    description: 'Контрастный тезис с выделенным бейджем для привлечения внимания',
    defaultContent: {
      tag: 'ГЛАВНЫЙ ВЫВОД',
      title: 'Система всегда побеждает хаос',
      subtitle: 'Оцифруйте повторяющиеся операционные задачи, чтобы освободить ресурсы для стратегического роста.',
    },
  },
  glass: {
    id: 'glass',
    title: 'Премиум-стекло',
    description: 'Контентная карточка в матовом стеклянном контейнере',
    defaultContent: {
      tag: 'АНАЛИТИЧЕСКИЙ ДАЙДЖЕСТ',
      title: 'Тренды автоматизации и клиентского опыта',
      subtitle: 'Компании, внедрившие умных ассистентов, сократили средний цикл первой сделки на 35%.',
    },
  },
  announcement: {
    id: 'announcement',
    title: 'Анонс события',
    description: 'Дата, формат и тема вебинара, эфира или бизнес-встречи',
    defaultContent: {
      tag: 'ПРЯМОЙ ЭФИР • 19:00 МСК',
      title: 'Разбор архитектуры продаж для B2B-компаний',
      subtitle: 'Разберем 5 реальных кейсов аудита маркетинга. Доступ по предварительной регистрации.',
    },
  },
  checklist: {
    id: 'checklist',
    title: 'Чек-лист преимуществ',
    description: 'Список ключевых тезисов, этапов или характеристик',
    defaultContent: {
      tag: 'ПЛАН ДЕЙСТВИЙ',
      title: '4 шага к систематизации',
      subtitle: 'Базовый алгоритм для руководителя:',
      checklistItems: [
        'Инвентаризация текущих бизнес-процессов',
        'Внедрение прозрачных метрик эффективности',
        'Автоматизация рутинных коммуникаций',
        'Еженедельный трек-контроль ключевых KPI',
      ],
    },
  },
  product: {
    id: 'product',
    title: 'Карточка оффера',
    description: 'Презентация услуги или товара с фиксированной ценой и выгодой',
    defaultContent: {
      tag: 'СПЕЦИАЛЬНОЕ ПРЕДЛОЖЕНИЕ',
      title: 'Комплексный экспресс-аудит бизнес-процессов',
      subtitle: 'Анализ воронки, оценка конверсий и дорожная карта устранения узких мест за 3 рабочих дня.',
      price: 'от 45 000 ₽',
    },
  },
};

export const INITIAL_SLIDES: StorySlide[] = [
  {
    id: 'slide-1',
    preset: 'editorial',
    background: {
      type: 'image',
      value: BUSINESS_STOCK_IMAGES[0],
      dim: 52,
      zoom: 1,
      panX: 0,
      panY: 0,
      blur: 0,
    },
    typography: {
      fontFamily: "'Inter', sans-serif",
      textColor: '#ffffff',
      tagColor: '#38bdf8',
      align: 'center',
      fontSizeScale: 1.0,
      letterSpacing: 'normal',
      lineHeight: '1.25',
    },
    branding: {
      visible: true,
      text: 'biznesbox.ru',
      statusDot: true,
      position: 'bottom',
    },
    qrcode: {
      visible: false,
      url: 'https://biznesbox.ru',
      label: 'Перейти на сайт',
      size: 64,
    },
    content: {
      ...PRESET_DEFINITIONS.editorial.defaultContent,
    },
    showCounter: true,
  },
  {
    id: 'slide-2',
    preset: 'quote',
    background: {
      type: 'image',
      value: BUSINESS_STOCK_IMAGES[1],
      dim: 58,
      zoom: 1,
      panX: 0,
      panY: 0,
      blur: 0,
    },
    typography: {
      fontFamily: "'Inter', sans-serif",
      textColor: '#ffffff',
      tagColor: '#38bdf8',
      align: 'center',
      fontSizeScale: 1.0,
      letterSpacing: 'normal',
      lineHeight: '1.25',
    },
    branding: {
      visible: true,
      text: 'biznesbox.ru',
      statusDot: true,
      position: 'bottom',
    },
    qrcode: {
      visible: false,
      url: 'https://biznesbox.ru',
      label: 'Перейти на сайт',
      size: 64,
    },
    content: {
      ...PRESET_DEFINITIONS.quote.defaultContent,
    },
    showCounter: true,
  },
  {
    id: 'slide-3',
    preset: 'metric',
    background: {
      type: 'image',
      value: BUSINESS_STOCK_IMAGES[2],
      dim: 48,
      zoom: 1,
      panX: 0,
      panY: 0,
      blur: 0,
    },
    typography: {
      fontFamily: "'Inter', sans-serif",
      textColor: '#ffffff',
      tagColor: '#34d399',
      align: 'center',
      fontSizeScale: 1.0,
      letterSpacing: 'normal',
      lineHeight: '1.25',
    },
    branding: {
      visible: true,
      text: 'biznesbox.ru',
      statusDot: true,
      position: 'bottom',
    },
    qrcode: {
      visible: false,
      url: 'https://biznesbox.ru',
      label: 'Перейти на сайт',
      size: 64,
    },
    content: {
      ...PRESET_DEFINITIONS.metric.defaultContent,
    },
    showCounter: true,
  },
];
