'use client';

import { Box, Container, Typography, Paper, Divider, Button } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useRouter } from 'next/navigation';

export default function PoliticaPrivacidadePage() {
  const router = useRouter();

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#F5F7FA', py: 4 }}>
      <Container maxWidth="md">
        <Button
          startIcon={<ArrowBack />}
          onClick={() => router.back()}
          sx={{ mb: 3, color: '#2A3F5F' }}
        >
          Voltar
        </Button>

        <Paper sx={{ p: { xs: 3, md: 5 }, borderRadius: 3 }}>
          {/* Header */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Box
              component="img"
              src="/logos/Logo.png"
              alt="Luminar"
              sx={{ height: 60, mb: 2 }}
            />
            <Typography variant="h4" fontWeight={700} color="#2A3F5F" gutterBottom>
              Politica de Privacidade
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Ultima atualizacao: 24 de Janeiro de 2026
            </Typography>
          </Box>

          <Divider sx={{ mb: 4 }} />

          {/* Conteudo */}
          <Box sx={{ '& h6': { mt: 4, mb: 2, color: '#2A3F5F', fontWeight: 600 } }}>
            <Typography variant="h6">1. Introducao</Typography>
            <Typography paragraph>
              A <strong>Plataforma Luminar</strong> (&quot;nos&quot;, &quot;nosso&quot; ou &quot;Luminar&quot;) e um sistema de gestao educacional
              desenvolvido para o <strong>Centro de Educacao Integral Christ Master</strong>, localizado em Manaus, Amazonas, Brasil.
            </Typography>
            <Typography paragraph>
              Esta Politica de Privacidade descreve como coletamos, usamos, armazenamos e protegemos suas informacoes
              pessoais quando voce utiliza nossa plataforma educacional.
            </Typography>

            <Typography variant="h6">2. Informacoes que Coletamos</Typography>
            <Typography paragraph>
              Coletamos os seguintes tipos de informacoes:
            </Typography>
            <Typography component="div" sx={{ pl: 2 }}>
              <Typography paragraph>
                <strong>2.1 Dados de Professores e Funcionarios:</strong>
              </Typography>
              <ul>
                <li>Nome completo e email institucional (@christmaster.com.br)</li>
                <li>CPF (opcional, para identificacao)</li>
                <li>Numero de celular (para notificacoes via WhatsApp)</li>
                <li>Disciplinas e turmas vinculadas</li>
                <li>Registros de atividades no sistema</li>
              </ul>

              <Typography paragraph sx={{ mt: 2 }}>
                <strong>2.2 Dados de Alunos:</strong>
              </Typography>
              <ul>
                <li>Nome completo e matricula</li>
                <li>Data de nascimento</li>
                <li>Turma e serie</li>
                <li>Foto de perfil (opcional)</li>
                <li>Nome e telefone do responsavel</li>
                <li>Registros academicos (notas, frequencia, conceitos)</li>
              </ul>

              <Typography paragraph sx={{ mt: 2 }}>
                <strong>2.3 Dados de Uso:</strong>
              </Typography>
              <ul>
                <li>Logs de acesso ao sistema</li>
                <li>Dispositivos e navegadores utilizados</li>
                <li>Acoes realizadas na plataforma</li>
              </ul>
            </Typography>

            <Typography variant="h6">3. Como Usamos suas Informacoes</Typography>
            <Typography paragraph>
              Utilizamos as informacoes coletadas para:
            </Typography>
            <ul>
              <li>Gerenciar o processo educacional (chamadas, notas, conceitos)</li>
              <li>Enviar comunicados via WhatsApp para responsaveis e professores</li>
              <li>Gerar relatorios academicos e estatisticas</li>
              <li>Autenticar usuarios via Google Workspace</li>
              <li>Melhorar a experiencia do usuario na plataforma</li>
              <li>Cumprir obrigacoes legais e regulatorias</li>
            </ul>

            <Typography variant="h6">4. Compartilhamento de Dados</Typography>
            <Typography paragraph>
              <strong>Nao vendemos, alugamos ou comercializamos</strong> dados pessoais.
              Podemos compartilhar informacoes apenas com:
            </Typography>
            <ul>
              <li><strong>Google Cloud Platform:</strong> Armazenamento de dados (Firestore) e autenticacao</li>
              <li><strong>Google Drive:</strong> Armazenamento de fotos e documentos</li>
              <li><strong>Vercel:</strong> Hospedagem da aplicacao</li>
              <li><strong>Autoridades competentes:</strong> Quando exigido por lei</li>
            </ul>

            <Typography variant="h6">5. Armazenamento e Seguranca</Typography>
            <Typography paragraph>
              Seus dados sao armazenados em servidores seguros do Google Cloud Platform, com:
            </Typography>
            <ul>
              <li>Criptografia em transito (HTTPS/TLS)</li>
              <li>Criptografia em repouso</li>
              <li>Autenticacao via Google OAuth 2.0</li>
              <li>Controle de acesso baseado em permissoes</li>
              <li>Backup automatico diario</li>
            </ul>

            <Typography variant="h6">6. Retencao de Dados</Typography>
            <Typography paragraph>
              Mantemos seus dados pelo tempo necessario para:
            </Typography>
            <ul>
              <li>Dados academicos: Durante todo o periodo escolar do aluno + 5 anos apos conclusao</li>
              <li>Dados de funcionarios: Durante o vinculo + 5 anos apos desligamento</li>
              <li>Logs de acesso: 1 ano</li>
              <li>Mensagens WhatsApp: 2 anos</li>
            </ul>

            <Typography variant="h6">7. Seus Direitos (LGPD)</Typography>
            <Typography paragraph>
              De acordo com a Lei Geral de Protecao de Dados (Lei 13.709/2018), voce tem direito a:
            </Typography>
            <ul>
              <li>Confirmar a existencia de tratamento de dados</li>
              <li>Acessar seus dados pessoais</li>
              <li>Corrigir dados incompletos ou desatualizados</li>
              <li>Solicitar anonimizacao ou exclusao de dados desnecessarios</li>
              <li>Solicitar portabilidade dos dados</li>
              <li>Revogar consentimento a qualquer momento</li>
            </ul>
            <Typography paragraph>
              Para exercer seus direitos, entre em contato com a coordenacao pedagogica.
            </Typography>

            <Typography variant="h6">8. Cookies e Tecnologias Similares</Typography>
            <Typography paragraph>
              Utilizamos cookies essenciais para:
            </Typography>
            <ul>
              <li>Manter sua sessao autenticada</li>
              <li>Lembrar preferencias do usuario</li>
              <li>Funcionamento do PWA (Progressive Web App)</li>
            </ul>
            <Typography paragraph>
              Nao utilizamos cookies de rastreamento ou publicidade.
            </Typography>

            <Typography variant="h6">9. Menores de Idade</Typography>
            <Typography paragraph>
              O sistema pode conter dados de alunos menores de 18 anos. Estes dados sao coletados
              e tratados exclusivamente para fins educacionais, com consentimento implicito dos
              responsaveis no ato da matricula escolar, conforme permitido pela LGPD.
            </Typography>

            <Typography variant="h6">10. Alteracoes nesta Politica</Typography>
            <Typography paragraph>
              Podemos atualizar esta politica periodicamente. Notificaremos sobre alteracoes
              significativas atraves de comunicados no sistema ou por email.
            </Typography>

            <Typography variant="h6">11. Contato</Typography>
            <Typography paragraph>
              Para duvidas sobre esta politica ou sobre seus dados pessoais:
            </Typography>
            <Box sx={{ bgcolor: '#F5F7FA', p: 2, borderRadius: 2, mt: 2 }}>
              <Typography><strong>Centro de Educacao Integral Christ Master</strong></Typography>
              <Typography>Manaus, Amazonas - Brasil</Typography>
              <Typography>Email: coordenacao@christmaster.com.br</Typography>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
