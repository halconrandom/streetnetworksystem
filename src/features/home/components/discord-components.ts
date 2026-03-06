// Discord Components V2 Types
// https://discord.com/developers/docs/components/reference

export interface TextDisplayComponent {
  type: 10; // TEXT_DISPLAY
  content: string;
}

export interface SeparatorComponent {
  type: 12; // SEPARATOR
  divider?: boolean;
  spacing?: 0 | 1; // 0 = small, 1 = large
}

export interface ContainerComponent {
  type: 17; // CONTAINER
  accent_color?: number; // 0-16777215 (RGB to decimal)
  spoiler?: boolean;
  components: (TextDisplayComponent | SeparatorComponent)[];
}

export type DiscordComponent = TextDisplayComponent | SeparatorComponent | ContainerComponent;

export interface DiscordMessage {
  flags: number; // 32768 = IS_COMPONENTS_V2
  components: ContainerComponent[];
}

// Helper functions
export function createTextDisplay(content: string): TextDisplayComponent {
  return { type: 10, content };
}

export function createSeparator(divider: boolean = true, spacing: 0 | 1 = 0): SeparatorComponent {
  return { type: 12, divider, spacing };
}

export function createContainer(
  components: (TextDisplayComponent | SeparatorComponent)[],
  accentColor?: number
): ContainerComponent {
  const container: ContainerComponent = {
    type: 17,
    components
  };
  if (accentColor !== undefined) {
    container.accent_color = accentColor;
  }
  return container;
}

// Color helper: Convert hex to decimal for Discord
export function hexToDecimal(hex: string): number {
  return parseInt(hex.replace('#', ''), 16);
}

// Color presets for updates
export const UPDATE_COLORS = {
  feat: hexToDecimal('#00ff88'),    // Green - terminal-accent
  fix: hexToDecimal('#ff4444'),     // Red
  refactor: hexToDecimal('#4488ff'), // Blue
  security: hexToDecimal('#ffaa00'), // Orange
  default: hexToDecimal('#ffffff')   // White
} as const;

// Parse markdown-like text to Discord markdown
export function parseToDiscordMarkdown(text: string): string {
  return text
    // Bold: **text** stays the same
    // Italic: *text* stays the same
    // Headers become bold
    .replace(/^### (.+)$/gm, '**$1**')
    .replace(/^## (.+)$/gm, '**$1**')
    .replace(/^# (.+)$/gm, '**$1**')
    // Bullet points stay the same
    // Code blocks
    .replace(/`([^`]+)`/g, '`$1`');
}

// Build a Discord message from update data
export function buildDiscordMessage(
  type: 'feat' | 'fix' | 'refactor' | 'security',
  title: string,
  description: string,
  date: string
): DiscordMessage {
  const color = UPDATE_COLORS[type] || UPDATE_COLORS.default;
  
  // Parse description into sections
  const lines = description.split('\n').filter(line => line.trim());
  
  // Build components
  const components: (TextDisplayComponent | SeparatorComponent)[] = [];
  
  // Header with emoji and title
  const emoji = type === 'feat' ? '✨' : type === 'fix' ? '🔧' : type === 'security' ? '🔒' : '⚡';
  components.push(createTextDisplay(`## ${emoji} ${title}\n📅 ${date}`));
  components.push(createSeparator(true, 1));
  
  // Content
  const contentLines: string[] = [];
  for (const line of lines) {
    contentLines.push(line);
  }
  
  if (contentLines.length > 0) {
    components.push(createTextDisplay(contentLines.join('\n')));
  }
  
  return {
    flags: 32768, // IS_COMPONENTS_V2
    components: [createContainer(components, color)]
  };
}

// Export types
export type { DiscordMessage as DiscordMessageType };