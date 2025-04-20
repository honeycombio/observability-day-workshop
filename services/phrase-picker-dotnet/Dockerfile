FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build-env
WORKDIR /app

# Copy everything
COPY . ./
# Restore as distinct layers
RUN dotnet restore
# Build and publish a release
RUN dotnet publish -c Release -o out

# Build runtime image
FROM mcr.microsoft.com/dotnet/aspnet:8.0

# Install SQLite
RUN apt-get update && apt-get install -y sqlite3 && rm -rf /var/lib/apt/lists/*

ENV ASPNETCORE_URLS=http://+:10117
WORKDIR /app

# Create shared-data directory
RUN mkdir -p /app/shared-data

COPY --from=build-env /app/out .
ENTRYPOINT ["dotnet", "phrase-picker-dotnet.dll"]