
import { trace, SpanStatusCode } from '@opentelemetry/api';
import { spawn } from 'child_process';


export
    function spawnProcess(commandName: string, args: string[]): Promise<void> {
    // return trace.getTracer('meminator').startActiveSpan(commandName, {
    //     attributes: {
    //         "app.command.name": commandName,
    //         "app.command.args": args.join(' ')
    //     }
    // }, (span) => { #INSTRUMENTATION: wrap important unit of work in a span
    return new Promise<void>((resolve, reject) => {
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
            // span.end();
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
                // span.end();
                reject(new Error(`Process exited with non-zero code: ${code}`));
            } else {
                // span.end();
                resolve();
            }
        });
    });
    // });
}