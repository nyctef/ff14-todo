FROM node:25-slim

COPY dist/ /app/

EXPOSE 3000

WORKDIR /app
CMD ["node", "index.js"]
