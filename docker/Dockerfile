# Utiliser l'image Node.js officielle
FROM node:18-alpine

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer les dépendances
RUN npm ci --only=production

# Copier le reste du code source
COPY . .

# Générer le client Prisma
RUN npx prisma generate

# Exposer le port
EXPOSE 3000

# Commande par défaut
CMD ["npm", "start"] 