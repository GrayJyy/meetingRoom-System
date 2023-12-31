import { readFileSync } from 'fs';
import * as yaml from 'js-yaml';
import { join } from 'path';

const FILE_PATH = 'env.yaml';
const config = () => {
  const _data = readFileSync(join(__dirname, FILE_PATH), 'utf8');
  return yaml.load(_data) as Record<string, any>;
};
export default config;
