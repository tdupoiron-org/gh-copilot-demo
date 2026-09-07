FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
EXPOSE 80

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["albums-api.csproj", "./"]
RUN dotnet restore "albums-api.csproj"
COPY . .
RUN dotnet publish "albums-api.csproj" \
    --configuration Release \
    --output /app/publish \
    --no-restore

FROM runtime AS final
WORKDIR /app
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "albums-api.dll"]
