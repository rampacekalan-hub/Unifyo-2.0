#!/usr/bin/env bash
# fix-db-ip.sh — aktualizuje pg_hba.conf na Hetzner VPS s novou IP

set -e

SERVER="root@204.168.212.58"
PG_HBA="/etc/postgresql/16/main/pg_hba.conf"

NEW_IP=$(curl -s https://api.ipify.org)

if [ -z "$NEW_IP" ]; then
  echo "❌ Nepodarilo sa zistiť IP adresu"
  exit 1
fi

echo "🌐 Tvoja aktuálna IP: $NEW_IP"
echo "🔧 Aktualizujem pg_hba.conf na $SERVER ..."

ssh -o StrictHostKeyChecking=no "$SERVER" bash <<EOF
  # Odstráň staré unifyo-managed záznamy
  sed -i '/# unifyo-managed/d' "$PG_HBA"
  # Pridaj novú IP
  echo "host all all ${NEW_IP}/32 md5 # unifyo-managed" >> "$PG_HBA"
  # Reload PostgreSQL
  systemctl reload postgresql
  echo "✅ pg_hba.conf aktualizovaný: ${NEW_IP}/32"
EOF

echo "✅ Hotovo — prístup povolený pre IP $NEW_IP"
