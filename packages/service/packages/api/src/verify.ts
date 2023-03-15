import {
  exec,
  ExecException,
} from 'child_process';

type VerifyResult = {
  address: string;
  challenge: string;
  statement: string;
  proof: string
};

export async function verify ({address, challenge, statement, proof}: VerifyResult) {
  return new Promise<boolean> (resolve => {
    const args: string[] = [
      '--node ' + (process.env.CCD_NODE ?? 'http://146.190.94.164:20001'),
      `--statement '${statement}'`,
      `--challenge ${challenge}`,
      `--proof '${proof}'`,
      `--address ${address}`,
    ];
    const cmd = process.cwd() + ['/verify', ...args].join(' ');
    console.log("Running : " + cmd);
    exec(cmd, (error: ExecException | null, stdout: string, stderr: string) => {
      if (error) {
        console.error(`exec error: ${error}`);
        resolve(false);
        return;
      }
      const result = stdout.indexOf('Result: OK') >= 0;
      if ( !result ) {
        console.log(`verify cmd: stdout: ${stdout}`);
        console.error(`verify cmd: stderr: ${stderr}`);
      }
      resolve(result);
    });
  });
}
