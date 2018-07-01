import * as child_process from "child_process";

export async function copy(source: string, dest: string): Promise<any> {
  return new Promise((resolve, reject) => {
    child_process.execFile('/bin/cp', ['-p', '-n', source, dest], (err, stdout, stderr) => {
      if (!!err) return reject(err);
      resolve();
    });
  });
};
