import json
import os
import time
from opentelemetry.sdk.trace import SpanProcessor

class DiskUsageMonitor:
    def __init__(self, directory='/tmp'):
        self._how_many_times_have_we_checked = 0
        self._last_check_time = time.time()
        self._value = self._really_get_free_space(directory)
        self._directory = directory

    def get_free_space(self):
        if time.time() - self._last_check_time > 1: # Don't check more often than once per second
            self._value = self._really_get_free_space(self._directory)
            self._last_check_time = time.time()
        return self._value
    
    def _really_get_free_space(self, directory):
        self._how_many_times_have_we_checked += 1
        statvfs = os.statvfs(directory)
        # Get the block size and number of free blocks
        block_size = statvfs.f_frsize # this is supposedly the 'fragment size' but it seems
        free_blocks = statvfs.f_bavail
        # Calculate the free space
        free_space = block_size * free_blocks
        return free_space
    
    def get_free_space_and_stats(self):
        return { "value": self._value, "as_of": self._last_check_time, "check_count": self._how_many_times_have_we_checked }

class CustomSpanProcessor(SpanProcessor):
    def __init__(self):
        self._disk_usage_monitor = DiskUsageMonitor("/tmp")

    def on_start(self,
        span,
        parent_context = None ):
        span.set_attribute("app.custom_span_processor.tmp_free_space", self._disk_usage_monitor.get_free_space())
        span.set_attribute("app.custom_span_processor.tmp_free_space_stats", json.dumps(self._disk_usage_monitor.get_free_space_and_stats()))

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
