
export enum ComponentType {
  // Raíz
  CONTAINER = 'Container',

  // Layout & Content
  SECTION = 'Section', // Restored
  TEXT_DISPLAY = 'TextDisplay',
  ACTION_ROW = 'ActionRow',
  FILE = 'File',
  MEDIA_GALLERY = 'MediaGallery',
  SEPARATOR = 'Separator',

  // Interactive / Accessories
  BUTTON = 'Button',
  STRING_SELECT = 'StringSelect',
  USER_SELECT = 'UserSelect',
  ROLE_SELECT = 'RoleSelect',
  MENTIONABLE_SELECT = 'MentionableSelect',
  CHANNEL_SELECT = 'ChannelSelect',
  
  // Visual Accessories
  THUMBNAIL = 'Thumbnail' 
}

export enum ButtonStyle {
  Primary = 1,
  Secondary = 2,
  Success = 3,
  Danger = 4,
  Link = 5,
  Premium = 6
}

export interface BuilderComponent {
  id: string;
  type: ComponentType;
  data: any;
  children?: BuilderComponent[];
  isExpanded?: boolean;
}

// --- Data Interfaces ---

export interface ContainerData {
  accentColor: string;
}

export interface TextDisplayData {
  content: string;
}

export interface ButtonData {
  style: ButtonStyle;
  label: string;
  url?: string;
  customId?: string;
  skuId?: string;
  disabled?: boolean;
  emoji?: string;
}

export interface SelectOption {
  label: string;
  value: string;
  description?: string;
  emoji?: string;
  default?: boolean;
}

export interface SelectMenuData {
  customId: string;
  placeholder: string;
  minValues: number;
  maxValues: number;
  disabled?: boolean;
  options?: SelectOption[];
  channelTypes?: number[];
}

export interface MediaItem {
  url: string;
}

export interface MediaGalleryData {
  items: MediaItem[];
}

// --- Storage ---

export interface SavedTemplate {
  id: string;
  name: string;
  category: string;
  tags: string[];
  components: BuilderComponent[];
  createdAt: string;
  updatedAt: string;
}

export interface SavedWebhook {
  id: string;
  name: string;
  url: string;
  guildName?: string;
  description?: string;
  isValid: boolean;
  lastValidated: string;
  createdAt: string;
  useBotMode?: boolean;
  botToken?: string;
  channelId?: string;
}

export const MessageFlags = {
  IsComponentsV2: 1 << 15 // 32768
};
