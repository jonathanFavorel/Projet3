-- Script d'initialisation de la base de données PostgreSQL
-- Ce script sera exécuté au premier démarrage du conteneur PostgreSQL

-- Créer l'extension pour les UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Créer l'extension pour les fonctions de génération d'UUID
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Message de confirmation
SELECT 'Base de données initialisée avec succès!' as message; 