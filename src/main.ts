import * as path from "path";
import { getConfiguration, Sync } from "./sync";

const configPath = path.resolve(process.cwd(), "config.json");

const [ node, script, firstArg ] = process.argv;

async function run(actuallyDoCopy: boolean = false) {
  const config = await getConfiguration(configPath);
  const sync = new Sync(config);
  await actuallyDoCopy ? sync.run() : sync.dryRun();
}

run(firstArg == '--copy');