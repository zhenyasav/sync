import { FileDescriptor } from './sync';
import * as _ from "lodash";
import * as fs from 'fs-extra';
import * as path from "path";
import { readDirRecursive } from "./dir";
import { cache } from "./cache";
import { escapeRegExp } from "./regexp";
import * as Progress from "progress";
import { copy } from "./copy";

export interface CopyDescriptor {
  source: string;
  dest: string;
}

export interface Config extends CopyDescriptor {
  ignore: string[];
}

export interface FileDescriptor {
  name: string;
  directory: string;
  baseDirectory: string;
  relativeDirectory: string;
  path: string;
  size: number;
}



export async function getConfiguration(configPath: string): Promise<Config> {
  if (!fs.existsSync(configPath)) throw new Error("config file does not exist");
  const raw = await fs.readFile(configPath);
  const obj = JSON.parse(raw.toString()) as Config;
  let { source, dest, ...rest } = obj;
  return {
    source: path.resolve(process.cwd(), source),
    dest: path.resolve(process.cwd(), dest),
    ...rest
  }
}

export class Sync {
  public config: Config;
  constructor(config: Config) {
    this.config = config;
  }
  async getDirList(dir: string) {
    if (!fs.existsSync(dir)) throw new Error("directory does not exist");
    const { ignore } = this.config;
    return readDirRecursive(dir).then((files) => {
      return files.map(file => {
        return path.resolve(dir, file)
      }).filter(file => {
        return !_.some(ignore, (ignorePattern) => {
          const rx = new RegExp(escapeRegExp(ignorePattern));
          return rx.test(file);
        });
      });
    });
  }
  async getSourceFileList() {
    const { source } = this.config;
    return this.getDirList(source);
  }
  async getDestFileList() {
    const { dest } = this.config;
    return this.getDirList(dest);
  }
  getFileDescriptor(filePath: string, baseDirectory: string, fileStats: fs.Stats): FileDescriptor {
    const name = path.basename(filePath);
    const directory = path.dirname(filePath);
    return {
      name,
      directory,
      baseDirectory,
      relativeDirectory: directory.replace(baseDirectory + '/', ''),
      path: filePath,
      size: fileStats.size
    };
  }
  async getDescriptors(baseDirectory: string, files: string[]): Promise<FileDescriptor[]> {
    return Promise.all(files.map(file => {
      return fs.stat(file).then((stat: fs.Stats) => this.getFileDescriptor(file, baseDirectory, stat));
    }));
  }
  async getMissingFiles(): Promise<FileDescriptor[]> {
    const sourceList = await this.getSourceFileList();
    const destList = await this.getDestFileList();
    const sourceInfos = await this.getDescriptors(this.config.source, sourceList);
    const destInfos = await this.getDescriptors(this.config.dest, destList);
    const keyFn = (i: FileDescriptor) => `${i.name}${i.size}`;
    const destCache = cache(destInfos, keyFn);
    const sourceCache = cache(sourceInfos, keyFn);
    const missing = _.filter(Object.values(sourceCache), (sourceFd) => {
      const sourceKey = keyFn(sourceFd);
      return !(sourceKey in destCache);
    });
    return missing;
  }
  getCopyOperations(files: FileDescriptor[]): CopyDescriptor[] {
    const { dest } = this.config;
    return files.map((d) => {
      return {
        source: d.path,
        dest: path.resolve(dest, d.relativeDirectory, d.name)
      }
    });
  }
  prettyPrintMissingFile(file: FileDescriptor) {
    console.log(`missing ${file.name} from .../${file.relativeDirectory}`);
  }
  async runCopyOperations(operations: CopyDescriptor[]) {
    const prog = new Progress(":bar :current/:total (:percent) eta :etas", {
      total: operations.length
    });
    const queue = [...operations];
    while (!!queue && queue.length) {
      const top = queue.shift();
      await this.executeCopyOperation(top);
      prog.tick();
    }
  }
  async executeCopyOperation(operation: CopyDescriptor) {
    const { source, dest } = operation;
    const dirname = path.dirname(dest);
    if (!fs.existsSync(dirname)) fs.mkdirpSync(dirname);
    return await copy(source, dest);
  }
  printConfig() {
    const { source, dest } = this.config;
    console.log(`Analyzing files between:`);
    console.log(`source      : ${source}`);
    console.log(`destination : ${dest}`);
  }
  async run() {
    this.printConfig();
    const missing = await this.getMissingFiles();
    const ops = this.getCopyOperations(missing);
    console.log(`copying ${ops.length} files...\n`);
    await this.runCopyOperations(ops);
    console.log("\ndone.\n");
  }
  async dryRun() {
    this.printConfig();
    const missing = await this.getMissingFiles();
    console.log(' ');
    missing.forEach(this.prettyPrintMissingFile);
    console.log(' ');
    console.log(`found ${missing.length} files missing at destination.\n`);
  }
}