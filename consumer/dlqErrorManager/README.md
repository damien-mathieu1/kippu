# DLQ Error Manager

Service de gestion centralisée des Dead Letter Queues (DLQ) pour Kippu.

## 📋 Description

Le **DLQ Error Manager** est un consumer Kafka qui surveille toutes les Dead Letter Queues du système et enregistre les messages en erreur dans une base de données PostgreSQL pour analyse et traitement ultérieur.

## 🎯 Fonctionnalités

- ✅ Écoute toutes les DLQ configurées (`mail-msg-dlq`, `whatsapp-msg-dlq`, `formatted-ticket-dlq`)
- ✅ Enregistre les messages en erreur dans PostgreSQL avec toutes les métadonnées
- ✅ Suivi du statut de traitement (`pending`, `processing`, `resolved`, `ignored`)
- ✅ Compteur de retry automatique
- ✅ Conservation du message original brut (JSON)
- ✅ Indexation pour recherche rapide par topic, statut et date

## 🗄️ Modèle de données

### Table `dlq_errors`

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | SERIAL | Identifiant unique auto-incrémenté |
| `error_id` | VARCHAR(255) | ID unique basé sur topic-partition-offset |
| `source_topic` | VARCHAR(255) | Topic source du message original |
| `partition` | INTEGER | Partition du message original |
| `offset` | VARCHAR(255) | Offset du message original |
| `raw_message` | JSONB | Message original complet en JSON |
| `error_message` | TEXT | Message d'erreur |
| `error_stack` | TEXT | Stack trace de l'erreur (optionnel) |
| `status` | VARCHAR(50) | Statut: `pending`, `processing`, `resolved`, `ignored` |
| `retry_count` | INTEGER | Nombre de tentatives de traitement |
| `error_timestamp` | TIMESTAMP | Date/heure de l'erreur originale |
| `created_at` | TIMESTAMP | Date de création dans la DB |
| `updated_at` | TIMESTAMP | Date de dernière mise à jour |
| `resolved_at` | TIMESTAMP | Date de résolution (si applicable) |
| `metadata` | JSONB | Métadonnées supplémentaires |

## 🚀 Installation

### 1. Installer les dépendances

```bash
pnpm install
```

### 2. Configuration de l'environnement

Créer un fichier `.env` à partir de l'exemple :

```bash
cp .env.example .env
```

Puis ajuster les valeurs si nécessaire. Variables disponibles :

```bash
# Kafka
KAFKA_BROKERS=localhost:9092

# PostgreSQL
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=messages
POSTGRES_USER=app
POSTGRES_PASSWORD=app

# Migration automatique (true par défaut, false pour production)
AUTO_MIGRATE=true
```

**Note** : Les valeurs par défaut fonctionnent avec le `docker-compose.yml` à la racine du projet.

### 3. Initialiser la base de données

#### 🎯 Option A : Migration manuelle (recommandé pour production)

```bash
cd consumer/dlqErrorManager
pnpm migrate
```

Cette commande :
- ✅ Crée la table `dlq_errors` si elle n'existe pas
- ✅ Crée tous les index
- ✅ Crée le trigger pour `updated_at`
- ✅ Affiche un résumé (nombre d'erreurs existantes)
- ✅ Peut être exécutée plusieurs fois sans risque (idempotente)

#### 🔄 Option B : Migration automatique (dev/test)

Le schéma est automatiquement créé au démarrage du service si `AUTO_MIGRATE` n'est pas défini à `false`.

**Pour désactiver l'auto-migration (production)** :
```bash
AUTO_MIGRATE=false pnpm dev
```

## 🏃 Utilisation

### Démarrer le service

```bash
pnpm dev
```

### Vérifier les erreurs enregistrées

Depuis PostgreSQL :

```sql
-- Voir toutes les erreurs en attente
SELECT * FROM dlq_errors WHERE status = 'pending' ORDER BY created_at DESC;

-- Compter les erreurs par topic
SELECT source_topic, COUNT(*) 
FROM dlq_errors 
GROUP BY source_topic;

-- Erreurs récentes (dernières 24h)
SELECT * FROM dlq_errors 
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;
```

### Mettre à jour le statut d'une erreur

```sql
-- Marquer comme résolu
UPDATE dlq_errors 
SET status = 'resolved', resolved_at = CURRENT_TIMESTAMP 
WHERE error_id = 'mail-msg-0-123';

-- Ignorer une erreur
UPDATE dlq_errors 
SET status = 'ignored' 
WHERE error_id = 'mail-msg-0-123';
```

## 📊 Flux de données

```
┌─────────────────┐
│  mail-msg-dlq   │───┐
└─────────────────┘   │
                      │
┌─────────────────┐   │    ┌──────────────────┐    ┌────────────┐
│whatsapp-msg-dlq │───┼───▶│ DLQ Error Manager│───▶│ PostgreSQL │
└─────────────────┘   │    └──────────────────┘    └────────────┘
                      │
┌─────────────────┐   │
│formatted-ticket │───┘
│      -dlq       │
└─────────────────┘
```

## 🔧 API de la base de données

### `initDatabase()`
Initialise le schéma de la base de données.

### `insertDLQError(error: Omit<DLQError, 'id' | 'createdAt' | 'updatedAt'>): Promise<number>`
Insère une nouvelle erreur DLQ. Si l'`error_id` existe déjà, incrémente le `retry_count`.

### `getDLQErrors(filters?: {...}): Promise<DLQError[]>`
Récupère les erreurs avec filtres optionnels :
- `status`: Filtrer par statut
- `sourceTopic`: Filtrer par topic source
- `limit`: Nombre max de résultats
- `offset`: Pagination

### `updateDLQErrorStatus(errorId: string, status: string): Promise<void>`
Met à jour le statut d'une erreur.

## 🔍 Surveillance

### Logs importants

- `✓ Base de données initialisée` - DB prête
- `✓ DLQ Error Manager connecté` - Kafka connecté
- `✓ Abonné à {topic}` - Abonnement DLQ réussi
- `✓ Erreur DLQ enregistrée [ID: {id}] depuis {topic}` - Erreur enregistrée
- `✗ Erreur lors du traitement du message DLQ` - Échec de traitement

## 📈 Maintenance

### Nettoyage des anciennes erreurs résolues

```sql
-- Supprimer les erreurs résolues de plus de 30 jours
DELETE FROM dlq_errors 
WHERE status = 'resolved' 
AND resolved_at < NOW() - INTERVAL '30 days';
```

### Statistiques

```sql
-- Taux d'erreur par topic
SELECT 
  source_topic,
  COUNT(*) as total_errors,
  SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved,
  SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending
FROM dlq_errors
GROUP BY source_topic;
```

## 🔄 Migrations

### Vérifier l'état de la base

```bash
# Vérifier si la table existe
psql -h localhost -U app -d messages -c "\dt dlq_errors"

# Vérifier les index
psql -h localhost -U app -d messages -c "\di dlq_errors*"

# Voir la structure
psql -h localhost -U app -d messages -c "\d dlq_errors"
```

### Re-exécuter une migration

La migration est **idempotente** grâce aux clauses :
- `CREATE TABLE IF NOT EXISTS`
- `CREATE INDEX IF NOT EXISTS`
- `DROP TRIGGER IF EXISTS`

Vous pouvez l'exécuter plusieurs fois sans problème :
```bash
pnpm migrate
```

### Rollback (si nécessaire)

Pour supprimer complètement le schéma :
```sql
DROP TABLE IF EXISTS dlq_errors CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
```

## 🐛 Debugging

En cas de problème, vérifier :

1. **Kafka** : Les topics DLQ existent-ils ?
   ```bash
   docker exec kafka /opt/kafka/bin/kafka-topics.sh --bootstrap-server localhost:29092 --list
   ```

2. **PostgreSQL** : La base de données est-elle accessible ?
   ```bash
   psql -h localhost -U app -d messages -c "SELECT COUNT(*) FROM dlq_errors;"
   ```

3. **Consumer Groups** : Le consumer est-il actif ?
   ```bash
   docker exec kafka /opt/kafka/bin/kafka-consumer-groups.sh --bootstrap-server localhost:29092 --describe --group dlq-error-manager-group
   ```

4. **Migration** : La table est-elle créée ?
   ```bash
   pnpm migrate
   # ou vérifier manuellement
   psql -h localhost -U app -d messages -c "\d dlq_errors"
   ```
