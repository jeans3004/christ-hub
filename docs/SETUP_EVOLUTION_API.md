# Guia de Setup: Evolution API no Oracle Cloud

## Pré-requisitos

- Conta no Oracle Cloud (https://cloud.oracle.com)
- Domínio configurado (ex: wpp.christmaster.com.br)
- Acesso ao painel DNS do domínio
- Celular com WhatsApp para escanear QR Code

---

## Parte 1: Criar VM no Oracle Cloud

### 1.1 Acessar o Console

1. Acesse https://cloud.oracle.com
2. Faça login com suas credenciais
3. No menu hamburguer (☰), vá em **Compute > Instances**

### 1.2 Criar Instância

1. Clique em **Create Instance**
2. Configure:

```
Nome: evolution-api
Compartment: (seu compartment padrão)

Image: Ubuntu 22.04 (Canonical)
Shape: VM.Standard.A1.Flex (ARM - Free Tier)
  - OCPUs: 2
  - Memory: 4 GB

Networking:
  - Create new VCN (ou use existente)
  - Create new public subnet
  - Assign public IPv4 address: Yes

Add SSH keys:
  - Generate key pair (baixe a chave privada!)
  - Ou cole sua chave pública existente
```

3. Clique em **Create**
4. Aguarde o status mudar para **Running**
5. Anote o **Public IP Address**

### 1.3 Configurar Security List (Firewall)

1. Na página da instância, clique no **Subnet** link
2. Clique na **Security List** associada
3. Clique em **Add Ingress Rules**
4. Adicione as regras:

```
# SSH (já deve existir)
Source CIDR: 0.0.0.0/0
Destination Port: 22
Protocol: TCP

# Evolution API
Source CIDR: 0.0.0.0/0
Destination Port: 8080
Protocol: TCP

# HTTPS (para Nginx)
Source CIDR: 0.0.0.0/0
Destination Port: 443
Protocol: TCP

# HTTP (para Certbot)
Source CIDR: 0.0.0.0/0
Destination Port: 80
Protocol: TCP
```

---

## Parte 2: Configurar o Servidor

### 2.1 Conectar via SSH

```bash
# Linux/Mac
ssh -i /caminho/para/sua-chave.key ubuntu@SEU_IP_PUBLICO

# Windows (PowerShell)
ssh -i C:\caminho\para\sua-chave.key ubuntu@SEU_IP_PUBLICO
```

### 2.2 Configurar Firewall do Ubuntu

```bash
# Liberar portas no iptables (Oracle usa isso além da Security List)
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 8080 -j ACCEPT

# Salvar regras
sudo netfilter-persistent save
```

### 2.3 Instalar Docker

```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Docker
curl -fsSL https://get.docker.com | sudo sh

# Adicionar usuário ao grupo docker
sudo usermod -aG docker $USER

# Reiniciar para aplicar
exit
# Reconecte via SSH
```

### 2.4 Instalar Docker Compose

```bash
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verificar
docker-compose --version
```

---

## Parte 3: Instalar Evolution API

### 3.1 Criar Diretórios

```bash
mkdir -p ~/evolution-api
cd ~/evolution-api
```

### 3.2 Criar docker-compose.yml

```bash
nano docker-compose.yml
```

Cole o conteúdo abaixo (substitua `SUA_API_KEY_SEGURA` por uma senha forte):

```yaml
version: '3.8'

services:
  evolution-api:
    image: atendai/evolution-api:latest
    container_name: evolution-api
    restart: always
    ports:
      - "8080:8080"
    environment:
      # URL pública (ajuste para seu domínio)
      - SERVER_URL=https://wpp.seudominio.com.br

      # Autenticação - MUDE ESTA CHAVE!
      - AUTHENTICATION_API_KEY=SUA_API_KEY_SEGURA_AQUI_123
      - AUTHENTICATION_EXPOSE_IN_FETCH_INSTANCES=true

      # Banco de dados
      - DATABASE_ENABLED=true
      - DATABASE_PROVIDER=mongodb
      - DATABASE_CONNECTION_URI=mongodb://mongodb:27017/evolution
      - DATABASE_CONNECTION_DB_PREFIX_NAME=evolution
      - DATABASE_SAVE_DATA_INSTANCE=true
      - DATABASE_SAVE_DATA_NEW_MESSAGE=true
      - DATABASE_SAVE_MESSAGE_UPDATE=true
      - DATABASE_SAVE_DATA_CONTACTS=true
      - DATABASE_SAVE_DATA_CHATS=true

      # QR Code
      - QRCODE_LIMIT=30
      - QRCODE_COLOR=#000000

      # Logs
      - LOG_LEVEL=ERROR

      # Configurações
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
    environment:
      - MONGO_INITDB_DATABASE=evolution
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
```

Salve com `Ctrl+O`, `Enter`, `Ctrl+X`.

### 3.3 Iniciar Containers

```bash
docker-compose up -d

# Verificar se estão rodando
docker-compose ps

# Ver logs (opcional)
docker-compose logs -f evolution-api
```

### 3.4 Testar Acesso

```bash
# No servidor
curl http://localhost:8080

# Do seu computador (substitua pelo IP)
curl http://SEU_IP_PUBLICO:8080
```

---

## Parte 4: Configurar Domínio e SSL

### 4.1 Configurar DNS

No painel do seu provedor de domínio, crie um registro:

```
Tipo: A
Nome: wpp (ou o subdomínio desejado)
Valor: SEU_IP_PUBLICO
TTL: 300 (ou mínimo)
```

Aguarde propagação (5-30 minutos). Teste com:
```bash
ping wpp.seudominio.com.br
```

### 4.2 Instalar Nginx

```bash
sudo apt install nginx -y
sudo systemctl enable nginx
```

### 4.3 Configurar Nginx como Proxy Reverso

```bash
sudo nano /etc/nginx/sites-available/evolution
```

Cole (substitua `wpp.seudominio.com.br`):

```nginx
server {
    listen 80;
    server_name wpp.seudominio.com.br;

    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }
}
```

Ativar o site:
```bash
sudo ln -s /etc/nginx/sites-available/evolution /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 4.4 Instalar SSL com Certbot

```bash
sudo apt install certbot python3-certbot-nginx -y

# Gerar certificado (substitua pelo seu domínio e email)
sudo certbot --nginx -d wpp.seudominio.com.br --email seu@email.com --agree-tos --non-interactive

# Testar renovação automática
sudo certbot renew --dry-run
```

### 4.5 Testar HTTPS

```bash
curl https://wpp.seudominio.com.br
```

Deve retornar informações da Evolution API.

---

## Parte 5: Criar Instância e Conectar WhatsApp

### 5.1 Criar Instância

```bash
# Substitua pela sua API Key e domínio
curl -X POST 'https://wpp.seudominio.com.br/instance/create' \
  -H 'Content-Type: application/json' \
  -H 'apikey: SUA_API_KEY_SEGURA_AQUI_123' \
  -d '{
    "instanceName": "sge-diario",
    "qrcode": true,
    "integration": "WHATSAPP-BAILEYS"
  }'
```

### 5.2 Obter QR Code

```bash
curl -X GET 'https://wpp.seudominio.com.br/instance/connect/sge-diario' \
  -H 'apikey: SUA_API_KEY_SEGURA_AQUI_123'
```

A resposta terá um campo `qrcode.base64`. Você pode:

**Opção A - Via Terminal:**
```bash
# Instalar qrencode
sudo apt install qrencode -y

# Gerar QR no terminal (substitua o base64)
echo "BASE64_DO_QRCODE" | base64 -d | qrencode -t ANSIUTF8
```

**Opção B - Via Browser:**
1. Acesse https://wpp.seudominio.com.br/manager
2. Use a API Key para autenticar
3. Veja o QR Code na interface

**Opção C - Via SGE (já implementado):**
1. Acesse `/diario/mensagens` no sistema
2. Clique em "Conectar WhatsApp"
3. Escaneie o QR Code

### 5.3 Escanear QR Code

1. Abra o WhatsApp no celular
2. Vá em **Configurações > Dispositivos Conectados**
3. Toque em **Conectar um dispositivo**
4. Escaneie o QR Code

### 5.4 Verificar Conexão

```bash
curl -X GET 'https://wpp.seudominio.com.br/instance/connectionState/sge-diario' \
  -H 'apikey: SUA_API_KEY_SEGURA_AQUI_123'
```

Resposta esperada:
```json
{
  "state": "open",
  "statusReason": 200
}
```

---

## Parte 6: Configurar SGE Diário Digital

### 6.1 Adicionar Variáveis de Ambiente

Edite o arquivo `.env.local` na raiz do projeto SGE:

```bash
# Evolution API
EVOLUTION_API_URL=https://wpp.seudominio.com.br
EVOLUTION_API_KEY=SUA_API_KEY_SEGURA_AQUI_123
EVOLUTION_INSTANCE=sge-diario
```

### 6.2 Reiniciar o Servidor de Desenvolvimento

```bash
npm run dev
```

### 6.3 Testar no Sistema

1. Acesse `/diario/mensagens`
2. O status deve mostrar "Online" ou "Conectado"
3. Selecione um professor com celular cadastrado
4. Envie uma mensagem de teste

---

## Parte 7: Manutenção

### Verificar Logs

```bash
cd ~/evolution-api
docker-compose logs -f evolution-api
```

### Reiniciar Serviços

```bash
cd ~/evolution-api
docker-compose restart
```

### Atualizar Evolution API

```bash
cd ~/evolution-api
docker-compose pull
docker-compose up -d
```

### Backup do MongoDB

```bash
docker exec evolution-mongodb mongodump --out /data/backup
docker cp evolution-mongodb:/data/backup ./backup-$(date +%Y%m%d)
```

---

## Troubleshooting

### QR Code expira rápido
- Normal, tem limite de 30 segundos
- Gere novo QR e escaneie rapidamente

### Desconecta frequentemente
- Verifique se o celular tem internet estável
- Não use o mesmo número em outro dispositivo
- Verifique logs: `docker-compose logs -f evolution-api`

### Erro 401 Unauthorized
- Verifique se a API Key está correta
- Verifique se está usando HTTPS

### Porta 8080 não acessível
- Verifique Security List no Oracle
- Verifique iptables: `sudo iptables -L -n`
- Verifique se container está rodando: `docker ps`

### Mensagens não chegam
- Verifique se o número está correto (com 55 + DDD)
- Verifique se o WhatsApp do destinatário está online
- Verifique logs da Evolution API

---

## Resumo de Custos

| Item | Custo Mensal |
|------|--------------|
| Oracle Cloud VM (Free Tier) | R$ 0 |
| Domínio (.com.br) | ~R$ 40/ano = R$ 3,33/mês |
| SSL (Let's Encrypt) | R$ 0 |
| **TOTAL** | **~R$ 3,33/mês** |

---

## Checklist Final

- [ ] VM criada no Oracle Cloud
- [ ] Security List configurada (portas 22, 80, 443, 8080)
- [ ] Docker e Docker Compose instalados
- [ ] Evolution API rodando
- [ ] Domínio apontando para o IP
- [ ] SSL configurado com Certbot
- [ ] Instância criada (sge-diario)
- [ ] WhatsApp conectado via QR Code
- [ ] Variáveis de ambiente configuradas no SGE
- [ ] Teste de envio realizado com sucesso
