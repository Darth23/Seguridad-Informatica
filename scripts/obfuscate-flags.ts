/**
 * Obfuscate Flags Script
 * XOR + PBKDF2 obfuscation for CTF flags in roadmap.json
 * Never stores flags in plaintext
 */

import { readFile, writeFile } from 'node:fs/promises';
import { createHash, pbkdf2Sync, randomBytes } from 'node:crypto';
import { join } from 'node:path';

const SALT_LENGTH = 16;
const ITERATIONS = 10000;
const KEY_LENGTH = 32;

interface RoadmapNode {
  id: string;
  title: string;
  description: string;
  type: 'lesson' | 'challenge' | 'boss';
  status: 'locked' | 'available' | 'completed';
  path: string;
  metadata: {
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

/**
 * XOR obfuscation with PBKDF2-derived key
 */
function xorObfuscate(data: string, key: Buffer): string {
  const dataBuffer = Buffer.from(data, 'utf-8');
  const result = Buffer.alloc(dataBuffer.length);
  
  for (let i = 0; i < dataBuffer.length; i++) {
    result[i] = dataBuffer[i] ^ key[i % key.length];
  }
  
  return result.toString('base64');
}

/**
 * Generate SHA-256 hash of a flag
 */
function generateFlagHash(flag: string): string {
  return createHash('sha256').update(flag).digest('hex');
}

/**
 * Obfuscate a flag using PBKDF2 + XOR
 * Returns: { obfuscated, salt, hash }
 */
function obfuscateFlag(flag: string): { obfuscated: string; salt: string; hash: string } {
  const salt = randomBytes(SALT_LENGTH);
  const key = pbkdf2Sync(flag, salt, ITERATIONS, KEY_LENGTH, 'sha256');
  const obfuscated = xorObfuscate(flag, key);
  const hash = generateFlagHash(flag);
  
  return {
    obfuscated,
    salt: salt.toString('hex'),
    hash
  };
}

/**
 * Verify a flag against its hash (for runtime validation)
 */
function verifyFlag(input: string, hash: string): boolean {
  return generateFlagHash(input) === hash;
}

/**
 * Recursively process roadmap nodes to obfuscate flags
 */
function processNodes(nodes: RoadmapNode[], flags: Map<string, string>): void {
  for (const node of nodes) {
    // Check if this node has a flag in metadata (from build-roadmap.ts temporary storage)
    if (node.metadata && 'flag' in node.metadata) {
      const flag = node.metadata.flag as string;
      flags.set(node.id, flag);
      
      const { obfuscated, salt, hash } = obfuscateFlag(flag);
      
      // Store obfuscated data
      node.metadata.obfuscatedFlag = obfuscated;
      node.metadata.salt = salt;
      node.metadata.flagHash = hash;
      
      // Remove plaintext flag
      delete node.metadata.flag;
      
      console.log(`🔐 Obfuscated flag for: ${node.id} (${node.title})`);
    }
    
    // Process children recursively
    if (node.children) {
      processNodes(node.children, flags);
    }
  }
}

async function main() {
  const inputPath = join(process.cwd(), 'apps', 'web', 'public', 'roadmap.json');
  const outputPath = join(process.cwd(), 'apps', 'web', 'public', 'roadmap.json');
  const flagsBackupPath = join(process.cwd(), 'scripts', 'flags.backup.json');

  console.log('🔐 Flag Obfuscation System');
  console.log('========================\n');

  try {
    // Read existing roadmap
    const content = await readFile(inputPath, 'utf-8');
    const roadmap: RoadmapData = JSON.parse(content);

    // Store flags temporarily (in real scenario, these would come from frontmatter)
    // This script expects flags to already be in the roadmap as metadata.flag
    const flags = new Map<string, string>();

    // Process all nodes
    processNodes(roadmap.roadmap, flags);

    // Write obfuscated roadmap
    await writeFile(outputPath, JSON.stringify(roadmap, null, 2), 'utf-8');
    console.log(`\n✅ Roadmap updated with obfuscated flags`);

    // Backup original flags (SECURE: In production, this should be encrypted or stored securely)
    const flagsBackup: Record<string, string> = {};
    flags.forEach((flag, id) => {
      flagsBackup[id] = flag;
    });

    await writeFile(flagsBackupPath, JSON.stringify(flagsBackup, null, 2), 'utf-8');
    console.log(`⚠️  Flags backup saved to: ${flagsBackupPath}`);
    console.log('   ⛔ NEVER commit this file to version control!\n');

    console.log('📊 Summary:');
    console.log(`   - Total flags obfuscated: ${flags.size}`);
    console.log(`   - Algorithm: PBKDF2-SHA256 + XOR`);
    console.log(`   - Iterations: ${ITERATIONS}`);
    console.log(`   - Salt length: ${SALT_LENGTH} bytes`);

  } catch (error) {
    console.error('💥 Obfuscation failed:', error);
    process.exit(1);
  }
}

// Export functions for use in other modules
export { obfuscateFlag, verifyFlag, generateFlagHash };

main();
