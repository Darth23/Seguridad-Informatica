/**
 * Validate Roadmap Script
 * Validates the generated roadmap.json against schema
 * Checks for missing fields, invalid references, and structural integrity
 */

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { z } from 'zod';

// Schema for validated roadmap node
const RoadmapNodeSchema: z.ZodType<RoadmapNode> = z.lazy(() =>
  z.object({
    id: z.string().min(1),
    title: z.string().min(1),
    description: z.string().min(1),
    type: z.enum(['lesson', 'challenge', 'boss']),
    status: z.enum(['locked', 'available', 'completed']),
    path: z.string(),
    metadata: z.object({
      estimatedTime: z.number().int().positive().optional(),
      difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
      prerequisites: z.array(z.string()).optional(),
      objectives: z.array(z.string()).optional(),
      flagHash: z.string().length(64).optional(),
      obfuscatedFlag: z.string().optional(),
      salt: z.string().optional(),
      hints: z.array(z.object({
        content: z.string().min(1),
        penalty: z.number().int().positive()
      })).optional(),
      maxPoints: z.number().int().positive().optional(),
      category: z.enum(['network', 'crypto', 'forensics', 'web', 'reverse']).optional()
    }),
    children: z.array(z.lazy(() => RoadmapNodeSchema)).optional()
  })
);

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
    flagHash?: string;
    obfuscatedFlag?: string;
    salt?: string;
    hints?: Array<{ content: string; penalty: number }>;
    maxPoints?: number;
    category?: 'network' | 'crypto' | 'forensics' | 'web' | 'reverse';
  };
  children?: RoadmapNode[];
}

interface RoadmapData {
  version: string;
  generatedAt: string;
  totalLessons: number;
  roadmap: RoadmapNode[];
}

const RoadmapDataSchema = z.object({
  version: z.string(),
  generatedAt: z.string(),
  totalLessons: z.number().int().nonnegative(),
  roadmap: z.array(RoadmapNodeSchema)
});

/**
 * Validate that all prerequisite IDs exist in the roadmap
 */
function validatePrerequisites(nodes: RoadmapNode[], allIds: Set<string>): string[] {
  const errors: string[] = [];

  function checkNode(node: RoadmapNode) {
    if (node.metadata.prerequisites) {
      for (const prereq of node.metadata.prerequisites) {
        if (!allIds.has(prereq)) {
          errors.push(`[${node.id}] Prerequisite '${prereq}' does not exist in roadmap`);
        }
      }
    }

    if (node.children) {
      node.children.forEach(checkNode);
    }
  }

  nodes.forEach(checkNode);
  return errors;
}

/**
 * Validate ID uniqueness
 */
function validateUniqueIds(nodes: RoadmapNode[]): string[] {
  const ids = new Map<string, string>();
  const errors: string[] = [];

  function checkNode(node: RoadmapNode, path: string) {
    if (ids.has(node.id)) {
      errors.push(
        `Duplicate ID '${node.id}' found at '${path}' (also at '${ids.get(node.id)}')`
      );
    } else {
      ids.set(node.id, path);
    }

    if (node.children) {
      node.children.forEach(child => checkNode(child, `${path}/${child.id}`));
    }
  }

  nodes.forEach(node => checkNode(node, node.id));
  return errors;
}

/**
 * Validate challenge-specific fields
 */
function validateChallenges(nodes: RoadmapNode[]): string[] {
  const errors: string[] = [];

  function checkNode(node: RoadmapNode) {
    if (node.type === 'challenge' || node.type === 'boss') {
      // Challenges should have flagHash or obfuscatedFlag
      if (!node.metadata.flagHash && !node.metadata.obfuscatedFlag) {
        errors.push(`[${node.id}] Challenge/Boss must have flagHash or obfuscatedFlag`);
      }

      // If obfuscatedFlag exists, salt must also exist
      if (node.metadata.obfuscatedFlag && !node.metadata.salt) {
        errors.push(`[${node.id}] obfuscatedFlag requires salt`);
      }

      // maxPoints should be defined for challenges
      if (!node.metadata.maxPoints) {
        errors.push(`[${node.id}] Challenge/Boss should have maxPoints defined`);
      }
    }

    if (node.children) {
      node.children.forEach(checkNode);
    }
  }

  nodes.forEach(checkNode);
  return errors;
}

/**
 * Validate path format
 */
function validatePaths(nodes: RoadmapNode[]): string[] {
  const errors: string[] = [];

  function checkNode(node: RoadmapNode) {
    if (!node.path.endsWith('.mdx') && node.type !== 'lesson') {
      // Directory nodes can have non-mdx paths
    } else if (node.path && !node.path.match(/^[a-zA-Z0-9/_-]+$/)) {
      errors.push(`[${node.id}] Invalid path format: ${node.path}`);
    }

    if (node.children) {
      node.children.forEach(checkNode);
    }
  }

  nodes.forEach(checkNode);
  return errors;
}

/**
 * Collect all lesson IDs
 */
function collectIds(nodes: RoadmapNode[]): Set<string> {
  const ids = new Set<string>();

  function collect(node: RoadmapNode) {
    ids.add(node.id);
    if (node.children) {
      node.children.forEach(collect);
    }
  }

  nodes.forEach(collect);
  return ids;
}

async function main() {
  const roadmapPath = join(process.cwd(), 'apps', 'web', 'public', 'roadmap.json');

  console.log('🔍 Validating roadmap.json...');
  console.log('============================\n');

  let hasErrors = false;
  const allErrors: string[] = [];

  try {
    // Read and parse roadmap
    const content = await readFile(roadmapPath, 'utf-8');
    let roadmap: RoadmapData;

    try {
      roadmap = JSON.parse(content);
    } catch (parseError) {
      console.error('❌ Invalid JSON:', parseError);
      process.exit(1);
    }

    // Validate against Zod schema
    try {
      RoadmapDataSchema.parse(roadmap);
      console.log('✅ Schema validation passed');
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error('❌ Schema validation failed:');
        error.errors.forEach(e => {
          console.error(`   - ${e.path.join('.')}: ${e.message}`);
          allErrors.push(`${e.path.join('.')}: ${e.message}`);
        });
        hasErrors = true;
      }
    }

    if (!hasErrors) {
      // Collect all IDs for prerequisite validation
      const allIds = collectIds(roadmap.roadmap);
      console.log(`📊 Found ${allIds.size} unique lesson IDs`);

      // Validate unique IDs
      const duplicateErrors = validateUniqueIds(roadmap.roadmap);
      if (duplicateErrors.length > 0) {
        console.error('\n❌ Duplicate ID errors:');
        duplicateErrors.forEach(e => {
          console.error(`   ${e}`);
          allErrors.push(e);
        });
        hasErrors = true;
      } else {
        console.log('✅ All IDs are unique');
      }

      // Validate prerequisites
      const prereqErrors = validatePrerequisites(roadmap.roadmap, allIds);
      if (prereqErrors.length > 0) {
        console.error('\n❌ Prerequisite errors:');
        prereqErrors.forEach(e => {
          console.error(`   ${e}`);
          allErrors.push(e);
        });
        hasErrors = true;
      } else {
        console.log('✅ All prerequisites reference valid lessons');
      }

      // Validate challenges
      const challengeErrors = validateChallenges(roadmap.roadmap);
      if (challengeErrors.length > 0) {
        console.error('\n❌ Challenge validation errors:');
        challengeErrors.forEach(e => {
          console.error(`   ${e}`);
          allErrors.push(e);
        });
        hasErrors = true;
      } else {
        console.log('✅ All challenges are properly configured');
      }

      // Validate paths
      const pathErrors = validatePaths(roadmap.roadmap);
      if (pathErrors.length > 0) {
        console.error('\n❌ Path validation errors:');
        pathErrors.forEach(e => {
          console.error(`   ${e}`);
          allErrors.push(e);
        });
        hasErrors = true;
      } else {
        console.log('✅ All paths are valid');
      }
    }

    console.log('\n============================');
    if (hasErrors) {
      console.error(`💥 Validation FAILED with ${allErrors.length} error(s)`);
      process.exit(1);
    } else {
      console.log('✅ All validations passed!');
      console.log(`📈 Roadmap stats:`);
      console.log(`   - Version: ${roadmap.version}`);
      console.log(`   - Generated: ${roadmap.generatedAt}`);
      console.log(`   - Total lessons: ${roadmap.totalLessons}`);
    }

  } catch (error) {
    console.error('💥 Validation failed:', error);
    process.exit(1);
  }
}

main();
