FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npx nx build react-app

FROM nginx:alpine

COPY --from=build /app/dist/src/react-app /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]