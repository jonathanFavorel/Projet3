# Utiliser l'image Node.js officielle avec Alpine
FROM node:18-alpine

# Installer les dépendances système nécessaires pour Prisma
RUN apk add --no-cache openssl

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer toutes les dépendances (pas seulement production pour Prisma)
RUN npm ci

# Copier le reste du code source
COPY . .

# Générer le client Prisma
RUN npx prisma generate

# Exposer le port
EXPOSE 3000

# Commande par défaut
CMD ["npm", "run", "dev"] 