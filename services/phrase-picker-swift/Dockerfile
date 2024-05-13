# ================================
# Build image
# ================================
FROM swift:5.10-jammy

# Set up a build area
WORKDIR /app

# First just resolve dependencies.
# This creates a cached layer that can be reused
# as long as your Package.swift/Package.resolved
# files do not change.
COPY ./Package.* ./
RUN swift package resolve --skip-update --force-resolved-versions

# Copy entire repo into container
COPY . .

RUN swift build 

# Provide configuration needed by the built-in crash reporter and some sensible default behaviors.
ENV SWIFT_BACKTRACE=enable=yes,sanitize=yes,threads=all,images=all,interactive=no,swift-backtrace=./swift-backtrace-static

EXPOSE 10114

# Start the Vapor service when the image is run, default to listening on 8080 in production environment
ENTRYPOINT ["swift"]
CMD ["run", "App", "--hostname", "0.0.0.0", "--port", "10114"]
