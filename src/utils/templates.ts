import { BuilderComponent } from '../../types/builder';

export interface Template {
  id: string;
  name: string;
  description?: string;
  components: BuilderComponent[];
  createdAt: string;
  updatedAt: string;
}

const TEMPLATES_KEY = 'discord_builder_templates';

export function getTemplates(): Template[] {
  try {
    const stored = localStorage.getItem(TEMPLATES_KEY);
    if (!stored) return [];
    const templates = JSON.parse(stored);
    console.log('Loaded templates:', templates.length);
    return templates;
  } catch (err) {
    console.error('Failed to load templates:', err);
    return [];
  }
}

export function saveTemplate(template: Omit<Template, 'id' | 'createdAt' | 'updatedAt'>): Template {
  console.log('Saving template:', template.name);
  const newTemplate: Template = {
    ...template,
    id: `template_${Date.now()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const templates = getTemplates();
  templates.push(newTemplate);
  localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates));
  console.log('Template saved:', newTemplate.id);
  return newTemplate;
}

export function updateTemplate(id: string, updates: Partial<Template>): void {
  console.log('Updating template:', id);
  const templates = getTemplates();
  const index = templates.findIndex(t => t.id === id);
  if (index === -1) {
    console.error('Template not found:', id);
    throw new Error('Template not found');
  }
  templates[index] = {
    ...templates[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates));
  console.log('Template updated');
}

export function deleteTemplate(id: string): void {
  console.log('Deleting template:', id);
  const templates = getTemplates();
  const filtered = templates.filter(t => t.id !== id);
  localStorage.setItem(TEMPLATES_KEY, JSON.stringify(filtered));
  console.log('Template deleted');
}

export function duplicateComponents(components: BuilderComponent[]): BuilderComponent[] {
  console.log('Duplicating components');
  const duplicate = (comp: BuilderComponent): BuilderComponent => {
    return {
      ...comp,
      id: `${comp.type}_${Date.now()}_${Math.random()}`,
      children: comp.children?.map(duplicate),
    };
  };
  const result = components.map(duplicate);
  console.log('Components duplicated');
  return result;
}
