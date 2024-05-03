
import { trace, SpanStatusCode } from '@opentelemetry/api';
import { spawn } from 'child_process';


type ProcessOutput = {
    code: number;
    stderr: string;
    stdout: string;
}

/**
 * Run a command in the shell, and listen to its stdout and stderr.
 * 
 * @param commandName name of the command to run in the shell
 * @param args args to pass to it
 * @returns a promise that resolves when the process exits with code 0
 */
export function spawnProcess(commandName: string, args: string[]): Promise<ProcessOutput> {
    // const span = trace.getTracer('meminator').startSpan("> " + commandName);
    // span.setAttributes({
    //     "app.command.name": commandName,
    //     "app.command.args": args.join(' ')
    // }); // INSTRUMENTATION: we definitely want a span for this
    return new Promise<ProcessOutput>((resolve, reject) => {
        const process = spawn(commandName, args);
        let stderrOutput = '';
        process.stderr.on('data', (data) => {
            stderrOutput += data;
        });

        let stdout = '';
        process.stdout.on('data', (data) => {
            stdout += data;
        });

        process.on('error', (error) => {
            // span.recordException(error);
            // span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
            reject(error);
        });

        process.on('close', (code) => {
            // span.setAttributes({
            //     'app.command.exitCode': code || 0,
            //     'app.command.stderr': stderrOutput,
            //     'app.command.stdout': stdout
            // });
            if (code !== 0) {
               // span.setStatus({ code: SpanStatusCode.ERROR, message: "Process exited with " + code });
            } else {
                resolve({ code, stdout, stderr: stderrOutput });
            }
        });
    }) // .finally(() => { span.end(); }); // INSTRUMENTATION: you don't get the span until you end it!
}