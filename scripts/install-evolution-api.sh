#!/bin/bash
# Script para instalar Evolution API na VM Oracle
# Execute via SSH na VM: bash install-evolution-api.sh

set -e

echo "╔════════════════════════════════════════════════════════════╗"
echo "║         Instalando Evolution API                          ║"
echo "╚════════════════════════════════════════════════════════════╝"

# Atualizar sistema
echo "[1/5] Atualizando sistema..."
sudo apt update && sudo apt upgrade -y

# Instalar Docker
echo "[2/5] Instalando Docker..."
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER

# Instalar Docker Compose
echo "[3/5] Instalando Docker Compose..."
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Criar diretório e docker-compose.yml
echo "[4/5] Configurando Evolution API..."
mkdir -p ~/evolution-api
cat > ~/evolution-api/docker-compose.yml << 'EOF'
version: '3.8'

services:
  evolution-api:
    image: atendai/evolution-api:latest
    container_name: evolution-api
    restart: always
    ports:
      - "8080:8080"
    environment:
      - SERVER_URL=http://localhost:8080
      - AUTHENTICATION_TYPE=apikey
      - AUTHENTICATION_API_KEY=SUA_CHAVE_API_AQUI_TROQUE
      - AUTHENTICATION_EXPOSE_IN_FETCH_INSTANCES=true
      - DEL_INSTANCE=false
      - QRCODE_LIMIT=10
      - DATABASE_ENABLED=false
      - DATABASE_CONNECTION_URI=
      - DATABASE_CONNECTION_DB_PREFIX_NAME=evolution
      - LOG_LEVEL=ERROR
      - LOG_COLOR=true
      - LOG_BAILEYS=error
    volumes:
      - evolution_instances:/evolution/instances
      - evolution_store:/evolution/store

volumes:
  evolution_instances:
  evolution_store:
EOF

# Gerar API Key aleatória
API_KEY=$(openssl rand -hex 16)
sed -i "s/SUA_CHAVE_API_AQUI_TROQUE/$API_KEY/" ~/evolution-api/docker-compose.yml

# Iniciar Evolution API
echo "[5/5] Iniciando Evolution API..."
cd ~/evolution-api
sudo docker-compose up -d

# Aguardar inicialização
echo "Aguardando API inicializar..."
sleep 15

# Verificar status
sudo docker-compose ps

# Obter IP público
PUBLIC_IP=$(curl -s ifconfig.me)

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║           EVOLUTION API INSTALADA COM SUCESSO!             ║"
echo "╠════════════════════════════════════════════════════════════╣"
echo "║  URL da API: http://$PUBLIC_IP:8080"
echo "║  API Key: $API_KEY"
echo "╠════════════════════════════════════════════════════════════╣"
echo "║  GUARDE ESSA API KEY! Você vai precisar dela.              ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "Para criar uma instância WhatsApp, execute:"
echo ""
echo "curl -X POST http://$PUBLIC_IP:8080/instance/create \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -H 'apikey: $API_KEY' \\"
echo "  -d '{\"instanceName\": \"sge-whatsapp\", \"qrcode\": true}'"
echo ""
echo "Depois, para obter o QR Code:"
echo ""
echo "curl http://$PUBLIC_IP:8080/instance/qrcode/sge-whatsapp \\"
echo "  -H 'apikey: $API_KEY'"
echo ""

# Salvar informações
cat > ~/evolution-api/info.txt << INFOEOF
Evolution API Info
==================
URL: http://$PUBLIC_IP:8080
API Key: $API_KEY
Instance Name: sge-whatsapp

Criar instância:
curl -X POST http://$PUBLIC_IP:8080/instance/create -H 'Content-Type: application/json' -H 'apikey: $API_KEY' -d '{"instanceName": "sge-whatsapp", "qrcode": true}'

Obter QR Code:
curl http://$PUBLIC_IP:8080/instance/qrcode/sge-whatsapp -H 'apikey: $API_KEY'
INFOEOF

echo "Informações salvas em ~/evolution-api/info.txt"
