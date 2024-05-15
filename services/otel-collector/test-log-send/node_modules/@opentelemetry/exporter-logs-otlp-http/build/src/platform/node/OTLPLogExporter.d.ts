import type { ReadableLogRecord, LogRecordExporter } from '@opentelemetry/sdk-logs';
import type { OTLPExporterNodeConfigBase } from '@opentelemetry/otlp-exporter-base';
import type { IExportLogsServiceRequest } from '@opentelemetry/otlp-transformer';
import { OTLPExporterNodeBase } from '@opentelemetry/otlp-exporter-base';
/**
 * Collector Logs Exporter for Node
 */
export declare class OTLPLogExporter extends OTLPExporterNodeBase<ReadableLogRecord, IExportLogsServiceRequest> implements LogRecordExporter {
    constructor(config?: OTLPExporterNodeConfigBase);
    convert(logRecords: ReadableLogRecord[]): IExportLogsServiceRequest;
    getDefaultUrl(config: OTLPExporterNodeConfigBase): string;
}
//# sourceMappingURL=OTLPLogExporter.d.ts.map