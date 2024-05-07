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
RUN apt update && apt install -y libfontconfig1
ENV ASPNETCORE_URLS=http://+:10114
WORKDIR /app
COPY --from=build-env /app/out .
ENTRYPOINT ["dotnet", "meminator-dotnet.dll"]