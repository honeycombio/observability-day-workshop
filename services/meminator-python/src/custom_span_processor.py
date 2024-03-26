from opentelemetry.sdk.trace import SpanProcessor
from opentelemetry.sdk.trace.export import SpanExportResult

import os

def get_free_space(directory):
    stat = os.statvfs(directory)
    # Calculate free space (in bytes)
    free_space = stat.f_bavail * stat.f_frsize
    return free_space

tmp_free_space = get_free_space('/tmp')
print(f"Free space in /tmp: {tmp_free_space} bytes")


class CustomSpanProcessor(SpanProcessor):
    def on_start(   self,
        span,
        parent_context = None,
  ):
        span.set_attribute("app.custom_span_processor.tmp_free_space", get_free_space('/tmp'))

    def on_end(self, span):
        """
        Called when a span is ended.
        """
        # You can implement custom logic here
        pass

    def shutdown(self):
        """
        Called when the tracer is shutting down.
        """
        # You can implement any cleanup logic here
        pass

    def force_flush(self, timeout=None):
        """
        Forces a flush of any buffered spans.
        """
        # You can implement custom logic for flushing spans here
        pass

    def export(self, spans):
        """
        Export spans to the configured exporter.
        """
        # You can implement custom logic for exporting spans here
        pass
