#!/bin/bash

# ============================================
# Script de Setup: Evolution API no Oracle Cloud
# Executa via OCI CLI para criar VM gratuita
# ============================================

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "╔════════════════════════════════════════════════════════╗"
echo "║     Setup Evolution API - Oracle Cloud Free Tier       ║"
echo "╚════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# ============================================
# PARTE 1: Verificar/Instalar OCI CLI
# ============================================

echo -e "${YELLOW}[1/7] Verificando OCI CLI...${NC}"

if ! command -v oci &> /dev/null; then
    echo -e "${YELLOW}OCI CLI não encontrado. Instalando...${NC}"

    # Instalar OCI CLI
    bash -c "$(curl -L https://raw.githubusercontent.com/oracle/oci-cli/master/scripts/install/install.sh)" -- --accept-all-defaults

    # Adicionar ao PATH
    export PATH=$PATH:$HOME/bin
    echo 'export PATH=$PATH:$HOME/bin' >> ~/.bashrc

    echo -e "${GREEN}OCI CLI instalado com sucesso!${NC}"
else
    echo -e "${GREEN}OCI CLI já está instalado: $(oci --version)${NC}"
fi

# ============================================
# PARTE 2: Configurar OCI CLI (se necessário)
# ============================================

echo -e "${YELLOW}[2/7] Verificando configuração do OCI CLI...${NC}"

OCI_CONFIG_FILE="$HOME/.oci/config"

if [ ! -f "$OCI_CONFIG_FILE" ]; then
    echo -e "${YELLOW}Configuração não encontrada. Iniciando setup interativo...${NC}"
    echo ""
    echo -e "${BLUE}Você vai precisar das seguintes informações do Oracle Cloud:${NC}"
    echo "1. User OCID (Perfil > User Settings > OCID)"
    echo "2. Tenancy OCID (Administration > Tenancy Details > OCID)"
    echo "3. Region (ex: sa-saopaulo-1)"
    echo ""
    echo "Pressione ENTER para continuar..."
    read

    oci setup config

    echo ""
    echo -e "${YELLOW}IMPORTANTE: Você precisa fazer upload da chave pública para o Oracle Cloud${NC}"
    echo -e "Arquivo: ${BLUE}$HOME/.oci/oci_api_key_public.pem${NC}"
    echo ""
    echo "Passos:"
    echo "1. Acesse: https://cloud.oracle.com"
    echo "2. Vá em: Perfil (canto superior direito) > User Settings"
    echo "3. Em 'API Keys', clique em 'Add API Key'"
    echo "4. Selecione 'Paste Public Key'"
    echo "5. Cole o conteúdo do arquivo acima"
    echo ""
    echo "Conteúdo da chave pública:"
    echo -e "${GREEN}"
    cat "$HOME/.oci/oci_api_key_public.pem"
    echo -e "${NC}"
    echo ""
    echo "Após fazer upload, pressione ENTER para continuar..."
    read
fi

# Verificar se a configuração funciona
echo "Testando conexão com Oracle Cloud..."
if ! oci iam region list --output table 2>/dev/null; then
    echo -e "${RED}Erro: Não foi possível conectar ao Oracle Cloud.${NC}"
    echo "Verifique se fez upload da chave pública corretamente."
    exit 1
fi

echo -e "${GREEN}Conexão OK!${NC}"

# ============================================
# PARTE 3: Obter informações do tenancy
# ============================================

echo -e "${YELLOW}[3/7] Obtendo informações do tenancy...${NC}"

# Obter compartment ID (root)
TENANCY_ID=$(oci iam compartment list --all --compartment-id-in-subtree true --query "data[?\"compartment-id\"==null].id | [0]" --raw-output 2>/dev/null || echo "")

if [ -z "$TENANCY_ID" ]; then
    # Tentar obter do config
    TENANCY_ID=$(grep "^tenancy" ~/.oci/config | head -1 | cut -d'=' -f2 | tr -d ' ')
fi

if [ -z "$TENANCY_ID" ]; then
    echo -e "${RED}Erro: Não foi possível obter o Tenancy ID.${NC}"
    echo "Por favor, informe manualmente:"
    read -p "Tenancy OCID: " TENANCY_ID
fi

echo "Tenancy ID: $TENANCY_ID"

# Obter região
REGION=$(grep "^region" ~/.oci/config | head -1 | cut -d'=' -f2 | tr -d ' ')
echo "Região: $REGION"

# Usar tenancy como compartment (root)
COMPARTMENT_ID="$TENANCY_ID"

# ============================================
# PARTE 4: Buscar recursos disponíveis
# ============================================

echo -e "${YELLOW}[4/7] Buscando recursos disponíveis...${NC}"

# Listar Availability Domains
echo "Buscando Availability Domains..."
AD_NAME=$(oci iam availability-domain list --compartment-id "$COMPARTMENT_ID" --query "data[0].name" --raw-output)
echo "Availability Domain: $AD_NAME"

# Buscar imagem Ubuntu 22.04 ARM
echo "Buscando imagem Ubuntu 22.04 (ARM)..."
IMAGE_ID=$(oci compute image list \
    --compartment-id "$COMPARTMENT_ID" \
    --operating-system "Canonical Ubuntu" \
    --operating-system-version "22.04" \
    --shape "VM.Standard.A1.Flex" \
    --sort-by TIMECREATED \
    --sort-order DESC \
    --query "data[0].id" \
    --raw-output 2>/dev/null)

if [ -z "$IMAGE_ID" ] || [ "$IMAGE_ID" == "null" ]; then
    echo -e "${YELLOW}Imagem ARM não encontrada, buscando alternativa...${NC}"
    IMAGE_ID=$(oci compute image list \
        --compartment-id "$COMPARTMENT_ID" \
        --operating-system "Canonical Ubuntu" \
        --operating-system-version "22.04" \
        --sort-by TIMECREATED \
        --sort-order DESC \
        --query "data[0].id" \
        --raw-output)
fi

echo "Image ID: $IMAGE_ID"

# ============================================
# PARTE 5: Criar VCN e Subnet
# ============================================

echo -e "${YELLOW}[5/7] Criando rede (VCN)...${NC}"

# Verificar se já existe VCN
EXISTING_VCN=$(oci network vcn list --compartment-id "$COMPARTMENT_ID" --display-name "evolution-vcn" --query "data[0].id" --raw-output 2>/dev/null || echo "")

if [ -n "$EXISTING_VCN" ] && [ "$EXISTING_VCN" != "null" ]; then
    echo "VCN já existe: $EXISTING_VCN"
    VCN_ID="$EXISTING_VCN"
else
    echo "Criando nova VCN..."
    VCN_ID=$(oci network vcn create \
        --compartment-id "$COMPARTMENT_ID" \
        --cidr-block "10.0.0.0/16" \
        --display-name "evolution-vcn" \
        --dns-label "evolutionvcn" \
        --query "data.id" \
        --raw-output)
    echo "VCN criada: $VCN_ID"
fi

# Criar Internet Gateway
echo "Configurando Internet Gateway..."
EXISTING_IGW=$(oci network internet-gateway list --compartment-id "$COMPARTMENT_ID" --vcn-id "$VCN_ID" --query "data[0].id" --raw-output 2>/dev/null || echo "")

if [ -n "$EXISTING_IGW" ] && [ "$EXISTING_IGW" != "null" ]; then
    IGW_ID="$EXISTING_IGW"
else
    IGW_ID=$(oci network internet-gateway create \
        --compartment-id "$COMPARTMENT_ID" \
        --vcn-id "$VCN_ID" \
        --is-enabled true \
        --display-name "evolution-igw" \
        --query "data.id" \
        --raw-output)
fi
echo "Internet Gateway: $IGW_ID"

# Configurar Route Table
echo "Configurando Route Table..."
RT_ID=$(oci network route-table list --compartment-id "$COMPARTMENT_ID" --vcn-id "$VCN_ID" --query "data[0].id" --raw-output)

oci network route-table update \
    --rt-id "$RT_ID" \
    --route-rules "[{\"destination\": \"0.0.0.0/0\", \"destinationType\": \"CIDR_BLOCK\", \"networkEntityId\": \"$IGW_ID\"}]" \
    --force 2>/dev/null || true

# Criar/Obter Security List
echo "Configurando Security List..."
SL_ID=$(oci network security-list list --compartment-id "$COMPARTMENT_ID" --vcn-id "$VCN_ID" --query "data[0].id" --raw-output)

# Atualizar Security List com regras necessárias
oci network security-list update \
    --security-list-id "$SL_ID" \
    --ingress-security-rules '[
        {"protocol": "6", "source": "0.0.0.0/0", "tcpOptions": {"destinationPortRange": {"min": 22, "max": 22}}},
        {"protocol": "6", "source": "0.0.0.0/0", "tcpOptions": {"destinationPortRange": {"min": 80, "max": 80}}},
        {"protocol": "6", "source": "0.0.0.0/0", "tcpOptions": {"destinationPortRange": {"min": 443, "max": 443}}},
        {"protocol": "6", "source": "0.0.0.0/0", "tcpOptions": {"destinationPortRange": {"min": 8080, "max": 8080}}},
        {"protocol": "1", "source": "0.0.0.0/0", "icmpOptions": {"type": 3, "code": 4}},
        {"protocol": "1", "source": "10.0.0.0/16", "icmpOptions": {"type": 3}}
    ]' \
    --egress-security-rules '[
        {"protocol": "all", "destination": "0.0.0.0/0", "destinationType": "CIDR_BLOCK"}
    ]' \
    --force 2>/dev/null || true

echo "Security List configurada: $SL_ID"

# Criar Subnet
echo "Criando Subnet..."
EXISTING_SUBNET=$(oci network subnet list --compartment-id "$COMPARTMENT_ID" --vcn-id "$VCN_ID" --display-name "evolution-subnet" --query "data[0].id" --raw-output 2>/dev/null || echo "")

if [ -n "$EXISTING_SUBNET" ] && [ "$EXISTING_SUBNET" != "null" ]; then
    SUBNET_ID="$EXISTING_SUBNET"
else
    SUBNET_ID=$(oci network subnet create \
        --compartment-id "$COMPARTMENT_ID" \
        --vcn-id "$VCN_ID" \
        --cidr-block "10.0.1.0/24" \
        --display-name "evolution-subnet" \
        --dns-label "evolutionsub" \
        --availability-domain "$AD_NAME" \
        --query "data.id" \
        --raw-output)
fi
echo "Subnet: $SUBNET_ID"

# ============================================
# PARTE 6: Criar chave SSH e VM
# ============================================

echo -e "${YELLOW}[6/7] Criando VM...${NC}"

# Gerar chave SSH se não existir
SSH_KEY_FILE="$HOME/.ssh/evolution-api-key"
if [ ! -f "$SSH_KEY_FILE" ]; then
    echo "Gerando chave SSH..."
    ssh-keygen -t rsa -b 4096 -f "$SSH_KEY_FILE" -N "" -q
    echo -e "${GREEN}Chave SSH gerada: $SSH_KEY_FILE${NC}"
fi

SSH_PUBLIC_KEY=$(cat "${SSH_KEY_FILE}.pub")

# Verificar se VM já existe
EXISTING_VM=$(oci compute instance list \
    --compartment-id "$COMPARTMENT_ID" \
    --display-name "evolution-api" \
    --lifecycle-state RUNNING \
    --query "data[0].id" \
    --raw-output 2>/dev/null || echo "")

if [ -n "$EXISTING_VM" ] && [ "$EXISTING_VM" != "null" ]; then
    echo -e "${YELLOW}VM já existe!${NC}"
    INSTANCE_ID="$EXISTING_VM"
else
    echo "Criando instância VM.Standard.A1.Flex (ARM Free Tier)..."
    echo -e "${YELLOW}NOTA: Se houver erro de 'Out of host capacity', tente novamente mais tarde.${NC}"
    echo "      As instâncias gratuitas ARM são muito disputadas."
    echo ""

    INSTANCE_ID=$(oci compute instance launch \
        --compartment-id "$COMPARTMENT_ID" \
        --availability-domain "$AD_NAME" \
        --shape "VM.Standard.A1.Flex" \
        --shape-config '{"ocpus": 2, "memoryInGBs": 4}' \
        --subnet-id "$SUBNET_ID" \
        --image-id "$IMAGE_ID" \
        --display-name "evolution-api" \
        --assign-public-ip true \
        --ssh-authorized-keys-file "${SSH_KEY_FILE}.pub" \
        --query "data.id" \
        --raw-output 2>&1)

    if [[ "$INSTANCE_ID" == *"Out of host capacity"* ]] || [[ "$INSTANCE_ID" == *"error"* ]]; then
        echo -e "${RED}Erro: Sem capacidade disponível para instâncias ARM.${NC}"
        echo ""
        echo "Opções:"
        echo "1. Tente novamente em alguns minutos/horas"
        echo "2. Tente outra região (ex: sa-vinhedo-1)"
        echo "3. Use uma shape diferente (não gratuita)"
        echo ""
        echo "Dica: Existe um script que tenta criar automaticamente:"
        echo "https://github.com/hitrov/oci-arm-host-capacity"
        exit 1
    fi

    echo "Instância criada: $INSTANCE_ID"
    echo "Aguardando inicialização..."

    # Aguardar VM ficar pronta
    oci compute instance get --instance-id "$INSTANCE_ID" --wait-for-state RUNNING --wait-interval-seconds 10
fi

# Obter IP público
echo "Obtendo IP público..."
sleep 5

PUBLIC_IP=$(oci compute instance list-vnics \
    --instance-id "$INSTANCE_ID" \
    --query "data[0].\"public-ip\"" \
    --raw-output)

echo -e "${GREEN}IP Público: $PUBLIC_IP${NC}"

# ============================================
# PARTE 7: Configurar servidor via SSH
# ============================================

echo -e "${YELLOW}[7/7] Configurando servidor via SSH...${NC}"

# Aguardar SSH ficar disponível
echo "Aguardando SSH ficar disponível..."
for i in {1..30}; do
    if ssh -o StrictHostKeyChecking=no -o ConnectTimeout=5 -i "$SSH_KEY_FILE" ubuntu@"$PUBLIC_IP" "echo ok" 2>/dev/null; then
        break
    fi
    echo "  Tentativa $i/30..."
    sleep 10
done

# Script de configuração remota
echo "Executando configuração no servidor..."

ssh -o StrictHostKeyChecking=no -i "$SSH_KEY_FILE" ubuntu@"$PUBLIC_IP" << 'REMOTE_SCRIPT'
#!/bin/bash
set -e

echo "=== Atualizando sistema ==="
sudo apt update && sudo apt upgrade -y

echo "=== Liberando portas no iptables ==="
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 8080 -j ACCEPT
sudo netfilter-persistent save || true

echo "=== Instalando Docker ==="
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker ubuntu

echo "=== Instalando Docker Compose ==="
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

echo "=== Criando diretório Evolution API ==="
mkdir -p ~/evolution-api
cd ~/evolution-api

echo "=== Criando docker-compose.yml ==="
cat > docker-compose.yml << 'COMPOSE'
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
      - AUTHENTICATION_API_KEY=SgeEvolutionApi2024SecureKey
      - AUTHENTICATION_EXPOSE_IN_FETCH_INSTANCES=true
      - DATABASE_ENABLED=true
      - DATABASE_PROVIDER=mongodb
      - DATABASE_CONNECTION_URI=mongodb://mongodb:27017/evolution
      - DATABASE_CONNECTION_DB_PREFIX_NAME=evolution
      - DATABASE_SAVE_DATA_INSTANCE=true
      - DATABASE_SAVE_DATA_NEW_MESSAGE=true
      - DATABASE_SAVE_MESSAGE_UPDATE=true
      - DATABASE_SAVE_DATA_CONTACTS=true
      - DATABASE_SAVE_DATA_CHATS=true
      - QRCODE_LIMIT=30
      - QRCODE_COLOR=#000000
      - LOG_LEVEL=ERROR
      - DEL_INSTANCE=false
      - CONFIG_SESSION_PHONE_CLIENT=SGE Diario Digital
      - CONFIG_SESSION_PHONE_NAME=Chrome
    volumes:
      - evolution_instances:/evolution/instances
    depends_on:
      - mongodb
    networks:
      - evolution-network

  mongodb:
    image: mongo:latest
    container_name: evolution-mongodb
    restart: always
    volumes:
      - mongodb_data:/data/db
    networks:
      - evolution-network

volumes:
  evolution_instances:
  mongodb_data:

networks:
  evolution-network:
    driver: bridge
COMPOSE

echo "=== Iniciando containers ==="
sudo docker-compose up -d

echo "=== Aguardando Evolution API iniciar ==="
sleep 15

echo "=== Testando Evolution API ==="
curl -s http://localhost:8080 || echo "API ainda iniciando..."

echo "=== Configuração concluída! ==="
REMOTE_SCRIPT

# ============================================
# RESULTADO FINAL
# ============================================

echo ""
echo -e "${GREEN}"
echo "╔════════════════════════════════════════════════════════╗"
echo "║              SETUP CONCLUÍDO COM SUCESSO!              ║"
echo "╚════════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo ""
echo -e "${BLUE}Informações da VM:${NC}"
echo "  IP Público: $PUBLIC_IP"
echo "  SSH: ssh -i $SSH_KEY_FILE ubuntu@$PUBLIC_IP"
echo ""
echo -e "${BLUE}Evolution API:${NC}"
echo "  URL: http://$PUBLIC_IP:8080"
echo "  API Key: SgeEvolutionApi2024SecureKey"
echo "  Instância: sge-diario (criar com comando abaixo)"
echo ""
echo -e "${BLUE}Próximos passos:${NC}"
echo ""
echo "1. Criar instância WhatsApp:"
echo -e "${YELLOW}curl -X POST 'http://$PUBLIC_IP:8080/instance/create' \\
  -H 'Content-Type: application/json' \\
  -H 'apikey: SgeEvolutionApi2024SecureKey' \\
  -d '{\"instanceName\": \"sge-diario\", \"qrcode\": true}'${NC}"
echo ""
echo "2. Obter QR Code:"
echo -e "${YELLOW}curl 'http://$PUBLIC_IP:8080/instance/connect/sge-diario' \\
  -H 'apikey: SgeEvolutionApi2024SecureKey'${NC}"
echo ""
echo "3. Configurar .env.local no projeto SGE:"
echo -e "${YELLOW}EVOLUTION_API_URL=http://$PUBLIC_IP:8080
EVOLUTION_API_KEY=SgeEvolutionApi2024SecureKey
EVOLUTION_INSTANCE=sge-diario${NC}"
echo ""
echo -e "${BLUE}Para configurar domínio e SSL posteriormente:${NC}"
echo "  Veja: docs/SETUP_EVOLUTION_API.md (Parte 4)"
echo ""

# Salvar informações em arquivo
cat > ~/evolution-api-info.txt << INFO
Evolution API - Informações de Acesso
=====================================
IP Público: $PUBLIC_IP
SSH: ssh -i $SSH_KEY_FILE ubuntu@$PUBLIC_IP
URL: http://$PUBLIC_IP:8080
API Key: SgeEvolutionApi2024SecureKey
Instance Name: sge-diario

Criado em: $(date)
INFO

echo -e "${GREEN}Informações salvas em: ~/evolution-api-info.txt${NC}"
