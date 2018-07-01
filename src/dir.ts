import * as recursive from 'recursive-readdir';

export async function readDirRecursive(path: string): Promise<string[]> {
  return new Promise<string[]>((resolve, reject) => {
    recursive(path, (err, files) => {
      if (err) return reject(err);
      resolve(files as string[]);
    });
  });
}