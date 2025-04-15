FROM mcr.microsoft.com/dotnet/sdk:6.0 AS build
WORKDIR /src

# Copy csproj and restore dependencies
COPY services/user-service-dotnet/*.csproj ./
RUN dotnet restore

# Copy the rest of the code
COPY services/user-service-dotnet/. ./

# Build the application
RUN dotnet publish -c Release -o /app

# Build runtime image
FROM mcr.microsoft.com/dotnet/aspnet:6.0
WORKDIR /app

# Install SQLite
RUN apt-get update && apt-get install -y sqlite3 && rm -rf /var/lib/apt/lists/*

# Copy the published app
COPY --from=build /app ./

# Create shared-data directory
RUN mkdir -p /app/shared-data

# Note: The database file (users.db) is expected to be in the shared-data directory
# It is managed in git and should not be modified by the container

ENV PORT=10119
EXPOSE 10119

ENTRYPOINT ["dotnet", "user-service-dotnet.dll"]
