# ---- build stage ----
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
COPY nx.json ./
COPY tsconfig.base.json ./

RUN npm install

COPY . .

RUN npx nx build ang-app --configuration=production

# ---- runtime stage ----
FROM nginx:alpine

COPY --from=build /app/dist/src/ang-app/browser /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]