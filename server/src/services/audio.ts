import { execFile } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { AudioFeatures } from '../types';

const execFileAsync = promisify(execFile);
const SCRIPT_PATH = path.join(__dirname, 'audio_analyze.py');

export async function extractFeatures(filepath: string): Promise<AudioFeatures> {
  const { stdout } = await execFileAsync('python3', [SCRIPT_PATH, filepath], {
    timeout: 120000,
  });

  const result = JSON.parse(stdout.trim());

  // Check for errors or mock data
  if (result.error) {
    throw new Error(`Audio analysis failed: ${result.error}`);
  }

  return result as AudioFeatures;
}
