import { assert } from 'chai';
import { getConfiguration, Sync } from "../main";
import * as path from "path";

const testConfig = path.resolve(__dirname, "../../test.json");

describe('sync', () => {
  it('get config', async () => {
    const config = await getConfiguration(testConfig);
    assert.isDefined(config);
    assert.isObject(config);
    const { source, dest } = config;
    assert.isString(source);
    assert.isString(dest);
  });

  it('list source', async () => {
    const config = await getConfiguration(testConfig);
    const sync = new Sync(config);
    assert.isDefined(sync);
    const listing = await sync.getSourceFileList();
    assert.isArray(listing);
  });

  it('list dest', async () => {
    const config = await getConfiguration(testConfig);
    const sync = new Sync(config);
    const listing = await sync.getDestFileList();
    assert.isArray(listing);
  });
  
  it('diff', async () => {
    const config = await getConfiguration(testConfig);
    const sync = new Sync(config);
    const missing = await sync.getMissingFiles();
    const operations = sync.getCopyOperations(missing);
    assert.isArray(operations);
  });

  it('runs', async () => {
    const config = await getConfiguration(testConfig);
    const sync = new Sync(config);
    return await sync.run();
  });
})