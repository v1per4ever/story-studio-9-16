import { z } from 'zod';

export const PresetTypeSchema = z.enum([
  'editorial',
  'quote',
  'metric',
  'highlight',
  'glass',
  'announcement',
  'checklist',
  'product',
  'team_management',
  'team_legal',
]);

export type PresetType = z.infer<typeof PresetTypeSchema>;

export const BackgroundConfigSchema = z.object({
  type: z.enum(['image', 'gradient', 'solid']),
  value: z.string().min(1),
  dim: z.number().min(0).max(95),
  zoom: z.number().min(1).max(2.5),
  panX: z.number().min(-50).max(50),
  panY: z.number().min(-50).max(50),
  blur: z.number().min(0).max(20),
});

export type BackgroundConfig = z.infer<typeof BackgroundConfigSchema>;

export const TypographyConfigSchema = z.object({
  fontFamily: z.string().min(1),
  textColor: z.string().min(4),
  tagColor: z.string().min(4),
  align: z.enum(['left', 'center', 'right']),
  fontSizeScale: z.number().min(0.7).max(1.6),
  letterSpacing: z.string(),
  lineHeight: z.string(),
});

export type TypographyConfig = z.infer<typeof TypographyConfigSchema>;

export const BrandingConfigSchema = z.object({
  visible: z.boolean(),
  text: z.string(),
  statusDot: z.boolean(),
  position: z.enum(['top', 'bottom']),
});

export type BrandingConfig = z.infer<typeof BrandingConfigSchema>;

export const QrCodeConfigSchema = z.object({
  visible: z.boolean(),
  url: z.string(),
  label: z.string(),
  size: z.number().min(40).max(140),
});

export type QrCodeConfig = z.infer<typeof QrCodeConfigSchema>;

export const TeamMemberSchema = z.object({
  name: z.string(),
  role: z.string(),
  experience: z.string().optional(),
  achievement: z.string().optional(),
  achievementIcon: z.enum(['capital', 'award', 'metric', 'shield']).optional(),
  image: z.string(),
  verified: z.boolean().default(true),
});

export type TeamMember = z.infer<typeof TeamMemberSchema>;

export const SlideContentSchema = z.object({
  tag: z.string(),
  title: z.string(),
  subtitle: z.string(),
  metricValue: z.string().optional(),
  authorName: z.string().optional(),
  price: z.string().optional(),
  checklistItems: z.array(z.string()).optional(),
  customHtml: z.string().optional(),
  teamMembers: z.array(TeamMemberSchema).optional(),
});

export type SlideContent = z.infer<typeof SlideContentSchema>;

export const StorySlideSchema = z.object({
  id: z.string().min(1),
  preset: PresetTypeSchema,
  background: BackgroundConfigSchema,
  typography: TypographyConfigSchema,
  branding: BrandingConfigSchema,
  qrcode: QrCodeConfigSchema,
  content: SlideContentSchema,
  showCounter: z.boolean(),
});

export type StorySlide = z.infer<typeof StorySlideSchema>;

export interface HistoryState {
  past: StorySlide[][];
  present: StorySlide[];
  future: StorySlide[][];
}

export type ViewportMode = 'fit' | 'fill' | 'original';

export type ActiveTab = 'content' | 'typography' | 'background' | 'modules';
