import json
import os
import time
from opentelemetry.sdk.trace import SpanProcessor

# Utility class to monitor disk usage in a directory (e.g., /tmp)
class DiskUsageMonitor:
    def __init__(self, directory='/tmp'):
        # Tracks how many times the disk usage has been checked
        self._how_many_times_have_we_checked = 0
        # Records when the last disk usage check was performed
        self._last_check_time = time.time()
        # Gets initial free space value
        self._value = self._really_get_free_space(directory)
        # Stores the directory path to monitor
        self._directory = directory

    def get_free_space(self):
        # Avoid checking too often — once per second is enough
        if time.time() - self._last_check_time > 1:
            self._value = self._really_get_free_space(self._directory)
            self._last_check_time = time.time()
        return self._value
    
    def _really_get_free_space(self, directory):
        # Increments the counter for how many checks have been made
        self._how_many_times_have_we_checked += 1
        statvfs = os.statvfs(directory)
        # Retrieves filesystem block size and available blocks
        # Get the block size and number of free blocks
        block_size = statvfs.f_frsize
        free_blocks = statvfs.f_bavail
        # Calculates total free space in bytes
        free_space = block_size * free_blocks
        return free_space
    
    def get_free_space_and_stats(self):
        # Returns a dictionary with current free space value, timestamp, and check count
        return { "value": self._value, "as_of": self._last_check_time, "check_count": self._how_many_times_have_we_checked }

# Custom span processor that attaches disk space information to each span
class CustomSpanProcessor(SpanProcessor):
    def __init__(self):
        # Initializes the disk usage monitor to track /tmp space
        self._disk_usage_monitor = DiskUsageMonitor("/tmp")

    def on_start(self, span, parent_context=None):
        # Called when a span is started
        # Adds an attribute to the span showing the free disk space in /tmp
        span.set_attribute("app.custom_span_processor.tmp_free_space", self._disk_usage_monitor.get_free_space())
        # Adds an attribute with a JSON string of additional disk usage stats
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
