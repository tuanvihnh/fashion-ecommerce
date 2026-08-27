#!/bin/bash
# ============================================
# PostgreSQL Daily Backup Script
# Chạy hàng ngày qua cron: 0 2 * * * /path/to/backup.sh
# ============================================

BACKUP_DIR="./backups"
DB_CONTAINER="fashion_db"
DB_NAME="fashion_ecommerce"
DB_USER="postgres"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=7

mkdir -p "$BACKUP_DIR"

echo "🔄 Starting backup: $DATE"

# Tạo backup
docker exec "$DB_CONTAINER" pg_dump -U "$DB_USER" "$DB_NAME" | gzip > "$BACKUP_DIR/backup_${DATE}.sql.gz"

if [ $? -eq 0 ]; then
    echo "✅ Backup successful: backup_${DATE}.sql.gz"
    
    # Xóa backup cũ hơn RETENTION_DAYS ngày
    find "$BACKUP_DIR" -name "backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete
    echo "🗑️ Old backups cleaned (older than ${RETENTION_DAYS} days)"
else
    echo "❌ Backup FAILED!"
    exit 1
fi
