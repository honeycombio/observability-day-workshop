import type { ReadableLogRecord, LogRecordExporter } from '@opentelemetry/sdk-logs';
import type { OTLPExporterConfigBase } from '@opentelemetry/otlp-exporter-base';
import type { IExportLogsServiceRequest } from '@opentelemetry/otlp-transformer';
import { OTLPExporterBrowserBase } from '@opentelemetry/otlp-exporter-base';
/**
 * Collector Logs Exporter for Web
 */
export declare class OTLPLogExporter extends OTLPExporterBrowserBase<ReadableLogRecord, IExportLogsServiceRequest> implements LogRecordExporter {
    constructor(config?: OTLPExporterConfigBase);
    convert(logRecords: ReadableLogRecord[]): IExportLogsServiceRequest;
    getDefaultUrl(config: OTLPExporterConfigBase): string;
}
//# sourceMappingURL=OTLPLogExporter.d.ts.map