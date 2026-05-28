/**
 * Build Roadmap Script
 * Scans /content directory, validates frontmatter with Zod, emits roadmap.json
 * FAILS HARD if frontmatter does not match schema
 */

import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { z } from 'zod';

// Zod schemas for strict validation
const LessonFrontmatterSchema = z.object({
  id: z.string().min(1, "ID es requerido"),
  title: z.string().min(1, "Título es requerido"),
  description: z.string().min(1, "Descripción es requerida"),
  type: z.enum(['lesson', 'challenge', 'boss']),
  order: z.number().int().positive(),
  estimatedTime: z.number().int().positive().optional(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  prerequisites: z.array(z.string()).optional(),
  objectives: z.array(z.string()).min(1, "Al menos un objetivo es requerido"),
  flag: z.string().regex(/^[A-Z0-9_-]{8,32}$/, "Flag inválida (debe ser 8-32 chars alfanuméricos, guiones o guiones bajos)"),
  flagHash: z.string().length(64, "flagHash debe ser SHA-256 (64 caracteres hex)"),
  hints: z.array(z.object({
    content: z.string().min(1),
    penalty: z.number().int().positive()
  })).optional(),
  maxPoints: z.number().int().positive().optional(),
  category: z.enum(['network', 'crypto', 'forensics', 'web', 'reverse']).optional()
});

type LessonFrontmatter = z.infer<typeof LessonFrontmatterSchema>;

interface RoadmapNode {
  id: string;
  title: string;
  description: string;
  type: 'lesson' | 'challenge' | 'boss';
  status: 'locked' | 'available' | 'completed';
  path: string;
  metadata: {
    estimatedTime?: number;
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
    prerequisites?: string[];
    objectives?: string[];
    flagHash: string;
    hints?: Array<{ content: string; penalty: number }>;
    maxPoints?: number;
    category?: 'network' | 'crypto' | 'forensics' | 'web' | 'reverse';
  };
  children?: RoadmapNode[];
}

function extractFrontmatter(content: string): { frontmatter: string; body: string } {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) {
    throw new Error("No se encontró frontmatter válido (debe comenzar con --- y terminar con ---)");
  }
  return { frontmatter: match[1], body: match[2] };
}

function parseYamlLike(frontmatter: string): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  const lines = frontmatter.split('\n');
  
  let currentKey: string | null = null;
  let currentArray: string[] = [];
  let currentObject: Record<string, unknown> = {};
  let inArray = false;
  let inObjectArray = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    // Check for key: value
    const keyValueMatch = trimmed.match(/^(\w+):\s*(.*)$/);
    if (keyValueMatch) {
      // Save previous array/object if any
      if (inArray && currentKey) {
        result[currentKey] = currentArray;
        currentArray = [];
        inArray = false;
      }
      if (inObjectArray && currentKey) {
        if (!result[currentKey]) {
          result[currentKey] = [];
        }
        (result[currentKey] as Array<Record<string, unknown>>).push(currentObject);
        currentObject = {};
        inObjectArray = false;
      }

      const [, key, value] = keyValueMatch;
      currentKey = key;

      if (value === '') {
        // Could be start of array or object
        continue;
      }

      // Parse value
      if (value.startsWith('[') && value.endsWith(']')) {
        // Inline array
        const items = value.slice(1, -1).split(',').map(s => s.trim().replace(/^["']|["']$/g, ''));
        result[key] = items;
        currentKey = null;
      } else if (/^\d+$/.test(value)) {
        result[key] = parseInt(value, 10);
        currentKey = null;
      } else if (/^\d+\.\d+$/.test(value)) {
        result[key] = parseFloat(value);
        currentKey = null;
      } else if (value === 'true' || value === 'false') {
        result[key] = value === 'true';
        currentKey = null;
      } else {
        result[key] = value.replace(/^["']|["']$/g, '');
        currentKey = null;
      }
      continue;
    }

    // Check for array item (- item)
    if (trimmed.startsWith('- ')) {
      const itemContent = trimmed.slice(2).trim();
      
      // Check if it's an object in array (- key: value)
      const objMatch = itemContent.match(/^(\w+):\s*(.+)$/);
      if (objMatch) {
        if (!inObjectArray) {
          inObjectArray = true;
          currentObject = {};
        }
        const [, objKey, objValue] = objMatch;
        currentObject[objKey] = objValue.replace(/^["']|["']$/g, '');
      } else if (inObjectArray) {
        // Continuation of object (nested key)
        const nestedMatch = itemContent.match(/^(\w+):\s*(.+)$/);
        if (nestedMatch) {
          const [, nestedKey, nestedValue] = nestedMatch;
          currentObject[nestedKey] = nestedValue.replace(/^["']|["']$/g, '');
        }
      } else {
        inArray = true;
        currentArray.push(itemContent.replace(/^["']|["']$/g, ''));
      }
      continue;
    }

    // Handle continuation of object properties (indented key: value)
    if (inObjectArray && currentKey) {
      const nestedMatch = trimmed.match(/^(\w+):\s*(.+)$/);
      if (nestedMatch) {
        const [, nestedKey, nestedValue] = nestedMatch;
        currentObject[nestedKey] = nestedValue.replace(/^["']|["']$/g, '');
      }
    }
  }

  // Save last array/object
  if (inArray && currentKey) {
    result[currentKey] = currentArray;
  }
  if (inObjectArray && currentKey) {
    if (!result[currentKey]) {
      result[currentKey] = [];
    }
    (result[currentKey] as Array<Record<string, unknown>>).push(currentObject);
  }

  return result;
}

async function scanDirectory(dir: string, basePath: string = ''): Promise<RoadmapNode[]> {
  const nodes: RoadmapNode[] = [];
  
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    
    // Sort: directories first, then files
    entries.sort((a, b) => {
      if (a.isDirectory() && !b.isDirectory()) return -1;
      if (!a.isDirectory() && b.isDirectory()) return 1;
      return a.name.localeCompare(b.name);
    });

    for (const entry of entries) {
      if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;

      const fullPath = join(dir, entry.name);
      const relativePath = basePath ? join(basePath, entry.name) : entry.name;

      if (entry.isDirectory()) {
        // Recursively scan subdirectories
        const children = await scanDirectory(fullPath, relativePath);
        if (children.length > 0) {
          // Create a parent node for the directory
          const parentNode: RoadmapNode = {
            id: entry.name,
            title: entry.name.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
            description: `Módulo ${entry.name}`,
            type: 'lesson',
            status: 'available',
            path: relativePath,
            metadata: {},
            children
          };
          nodes.push(parentNode);
        }
      } else if (entry.name.endsWith('.mdx')) {
        // Process MDX file
        const content = await readFile(fullPath, 'utf-8');
        
        try {
          const { frontmatter } = extractFrontmatter(content);
          const parsed = parseYamlLike(frontmatter);
          
          // Validate with Zod - THIS IS WHERE IT FAILS HARD
          const validated = LessonFrontmatterSchema.parse(parsed);
          
          const node: RoadmapNode = {
            id: validated.id,
            title: validated.title,
            description: validated.description,
            type: validated.type,
            status: 'available',
            path: relativePath,
            metadata: {
              estimatedTime: validated.estimatedTime,
              difficulty: validated.difficulty,
              prerequisites: validated.prerequisites,
              objectives: validated.objectives,
              flagHash: validated.flagHash,
              hints: validated.hints,
              maxPoints: validated.maxPoints,
              category: validated.category
            }
          };
          
          nodes.push(node);
          console.log(`✓ Validated: ${relativePath}`);
        } catch (error) {
          if (error instanceof z.ZodError) {
            const errors = error.errors.map(e => 
              `  - ${e.path.join('.')}: ${e.message}`
            ).join('\n');
            console.error(`\n❌ VALIDATION ERROR in ${relativePath}:`);
            console.error(errors);
            process.exit(1); // FAIL HARD
          }
          throw error;
        }
      }
    }
  } catch (error) {
    console.error(`Error scanning directory ${dir}:`, error);
    throw error;
  }

  return nodes;
}

async function main() {
  const contentDir = join(process.cwd(), 'content');
  const outputPath = join(process.cwd(), 'apps', 'web', 'public', 'roadmap.json');

  console.log('🔍 Scanning content directory...');
  
  try {
    const roadmap = await scanDirectory(contentDir);
    
    const output = JSON.stringify({
      version: '1.0.0',
      generatedAt: new Date().toISOString(),
      totalLessons: roadmap.reduce((acc, node) => acc + countLessons(node), 0),
      roadmap
    }, null, 2);

    await writeFile(outputPath, output, 'utf-8');
    console.log(`\n✅ Roadmap generated successfully: ${outputPath}`);
    console.log(`📊 Total lessons: ${JSON.parse(output).totalLessons}`);
  } catch (error) {
    console.error('\n💥 Build failed:', error);
    process.exit(1);
  }
}

function countLessons(node: RoadmapNode): number {
  let count = node.children ? 0 : 1;
  if (node.children) {
    count += node.children.reduce((acc, child) => acc + countLessons(child), 0);
  }
  return count;
}

main();
