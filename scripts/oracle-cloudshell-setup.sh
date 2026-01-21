#!/bin/bash
# Script para Oracle Cloud Shell - Criar VM Free Tier para Evolution API
# Cole este script no Cloud Shell do Oracle

set -e

echo "╔════════════════════════════════════════════════════════════╗"
echo "║  Criando VM Free Tier para Evolution API                   ║"
echo "╚════════════════════════════════════════════════════════════╝"

# Obter compartment ID (root)
COMPARTMENT_ID=$(oci iam compartment list --all --compartment-id-in-subtree true --query "data[?\"compartment-id\"==null].id | [0]" --raw-output 2>/dev/null || echo "")

if [ -z "$COMPARTMENT_ID" ]; then
    COMPARTMENT_ID=$(oci iam compartment list --query "data[0].\"compartment-id\"" --raw-output)
fi

echo "Compartment ID: $COMPARTMENT_ID"

# Obter Availability Domain
AD=$(oci iam availability-domain list --compartment-id $COMPARTMENT_ID --query "data[0].name" --raw-output)
echo "Availability Domain: $AD"

# Verificar se já existe VCN
VCN_ID=$(oci network vcn list --compartment-id $COMPARTMENT_ID --display-name "evolution-vcn" --query "data[0].id" --raw-output 2>/dev/null || echo "")

if [ -z "$VCN_ID" ] || [ "$VCN_ID" == "null" ]; then
    echo "[1/6] Criando VCN..."
    VCN_ID=$(oci network vcn create \
        --compartment-id $COMPARTMENT_ID \
        --display-name "evolution-vcn" \
        --cidr-blocks '["10.0.0.0/16"]' \
        --dns-label "evolutionvcn" \
        --query "data.id" --raw-output)
    echo "VCN criada: $VCN_ID"
else
    echo "[1/6] VCN já existe: $VCN_ID"
fi

# Criar Internet Gateway
IGW_ID=$(oci network internet-gateway list --compartment-id $COMPARTMENT_ID --vcn-id $VCN_ID --display-name "evolution-igw" --query "data[0].id" --raw-output 2>/dev/null || echo "")

if [ -z "$IGW_ID" ] || [ "$IGW_ID" == "null" ]; then
    echo "[2/6] Criando Internet Gateway..."
    IGW_ID=$(oci network internet-gateway create \
        --compartment-id $COMPARTMENT_ID \
        --vcn-id $VCN_ID \
        --display-name "evolution-igw" \
        --is-enabled true \
        --query "data.id" --raw-output)
    echo "Internet Gateway criado: $IGW_ID"
else
    echo "[2/6] Internet Gateway já existe: $IGW_ID"
fi

# Obter Route Table padrão e adicionar rota
RT_ID=$(oci network route-table list --compartment-id $COMPARTMENT_ID --vcn-id $VCN_ID --query "data[0].id" --raw-output)
echo "[3/6] Configurando Route Table: $RT_ID"

oci network route-table update \
    --rt-id $RT_ID \
    --route-rules "[{\"destination\":\"0.0.0.0/0\",\"destinationType\":\"CIDR_BLOCK\",\"networkEntityId\":\"$IGW_ID\"}]" \
    --force 2>/dev/null || echo "Route table já configurada"

# Obter ou criar Security List com portas abertas
SL_ID=$(oci network security-list list --compartment-id $COMPARTMENT_ID --vcn-id $VCN_ID --query "data[0].id" --raw-output)
echo "[4/6] Configurando Security List: $SL_ID"

oci network security-list update \
    --security-list-id $SL_ID \
    --ingress-security-rules '[
        {"protocol":"6","source":"0.0.0.0/0","tcpOptions":{"destinationPortRange":{"min":22,"max":22}}},
        {"protocol":"6","source":"0.0.0.0/0","tcpOptions":{"destinationPortRange":{"min":80,"max":80}}},
        {"protocol":"6","source":"0.0.0.0/0","tcpOptions":{"destinationPortRange":{"min":443,"max":443}}},
        {"protocol":"6","source":"0.0.0.0/0","tcpOptions":{"destinationPortRange":{"min":8080,"max":8080}}},
        {"protocol":"1","source":"0.0.0.0/0","icmpOptions":{"type":3,"code":4}},
        {"protocol":"1","source":"10.0.0.0/16","icmpOptions":{"type":3}}
    ]' \
    --egress-security-rules '[{"protocol":"all","destination":"0.0.0.0/0"}]' \
    --force 2>/dev/null || echo "Security list já configurada"

# Criar Subnet
SUBNET_ID=$(oci network subnet list --compartment-id $COMPARTMENT_ID --vcn-id $VCN_ID --display-name "evolution-subnet" --query "data[0].id" --raw-output 2>/dev/null || echo "")

if [ -z "$SUBNET_ID" ] || [ "$SUBNET_ID" == "null" ]; then
    echo "[5/6] Criando Subnet..."
    SUBNET_ID=$(oci network subnet create \
        --compartment-id $COMPARTMENT_ID \
        --vcn-id $VCN_ID \
        --display-name "evolution-subnet" \
        --cidr-block "10.0.1.0/24" \
        --dns-label "evolutionsub" \
        --query "data.id" --raw-output)
    echo "Subnet criada: $SUBNET_ID"
else
    echo "[5/6] Subnet já existe: $SUBNET_ID"
fi

# Buscar imagem Ubuntu 22.04 ARM (Aarch64) - FREE TIER
echo "[6/6] Buscando imagem Ubuntu ARM (Free Tier)..."
IMAGE_ID=$(oci compute image list \
    --compartment-id $COMPARTMENT_ID \
    --operating-system "Canonical Ubuntu" \
    --operating-system-version "22.04" \
    --shape "VM.Standard.A1.Flex" \
    --query "data[0].id" --raw-output)

if [ -z "$IMAGE_ID" ] || [ "$IMAGE_ID" == "null" ]; then
    # Tentar buscar em todas as imagens da plataforma
    IMAGE_ID=$(oci compute image list \
        --compartment-id $COMPARTMENT_ID \
        --operating-system "Canonical Ubuntu" \
        --query "data[?contains(\"display-name\", 'aarch64') && contains(\"display-name\", '22.04')].id | [0]" --raw-output)
fi

echo "Imagem: $IMAGE_ID"

# Gerar chave SSH
if [ ! -f ~/.ssh/evolution_key ]; then
    echo "Gerando chave SSH..."
    ssh-keygen -t rsa -b 2048 -f ~/.ssh/evolution_key -N "" -q
fi
SSH_KEY=$(cat ~/.ssh/evolution_key.pub)

# Verificar se VM já existe
INSTANCE_ID=$(oci compute instance list --compartment-id $COMPARTMENT_ID --display-name "evolution-api" --lifecycle-state RUNNING --query "data[0].id" --raw-output 2>/dev/null || echo "")

if [ -z "$INSTANCE_ID" ] || [ "$INSTANCE_ID" == "null" ]; then
    echo ""
    echo "Criando VM Free Tier (VM.Standard.A1.Flex - 2 OCPU, 4GB RAM)..."
    echo "IMPORTANTE: Esta é a configuração FREE TIER - sem custos!"
    echo ""

    INSTANCE_ID=$(oci compute instance launch \
        --compartment-id $COMPARTMENT_ID \
        --availability-domain "$AD" \
        --display-name "evolution-api" \
        --shape "VM.Standard.A1.Flex" \
        --shape-config '{"ocpus":2,"memoryInGBs":4}' \
        --subnet-id $SUBNET_ID \
        --image-id $IMAGE_ID \
        --assign-public-ip true \
        --ssh-authorized-keys-file ~/.ssh/evolution_key.pub \
        --query "data.id" --raw-output)

    echo "VM criada! ID: $INSTANCE_ID"
    echo "Aguardando VM iniciar..."

    oci compute instance get --instance-id $INSTANCE_ID --wait-for-state RUNNING --wait-interval-seconds 10
else
    echo "VM já existe: $INSTANCE_ID"
fi

# Obter IP público
sleep 10
PUBLIC_IP=$(oci compute instance list-vnics --instance-id $INSTANCE_ID --query "data[0].\"public-ip\"" --raw-output)

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                    VM CRIADA COM SUCESSO!                  ║"
echo "╠════════════════════════════════════════════════════════════╣"
echo "║  IP Público: $PUBLIC_IP"
echo "║  Usuário: ubuntu"
echo "║  Shape: VM.Standard.A1.Flex (FREE TIER)"
echo "║  OCPUs: 2 | RAM: 4GB"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "Para conectar:"
echo "  ssh -i ~/.ssh/evolution_key ubuntu@$PUBLIC_IP"
echo ""
echo "Aguarde 2-3 minutos para a VM inicializar completamente."
echo ""

# Salvar informações
echo "PUBLIC_IP=$PUBLIC_IP" > ~/evolution-vm-info.txt
echo "SSH: ssh -i ~/.ssh/evolution_key ubuntu@$PUBLIC_IP" >> ~/evolution-vm-info.txt

echo "Informações salvas em ~/evolution-vm-info.txt"
echo ""
echo "Próximo passo: Após conectar via SSH, execute o script de instalação do Evolution API"
