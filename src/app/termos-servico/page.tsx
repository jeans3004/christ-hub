'use client';

import { Box, Container, Typography, Paper, Divider, Button } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useRouter } from 'next/navigation';

export default function TermosServicoPage() {
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
              Termos de Servico
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Ultima atualizacao: 24 de Janeiro de 2026
            </Typography>
          </Box>

          <Divider sx={{ mb: 4 }} />

          {/* Conteudo */}
          <Box sx={{ '& h6': { mt: 4, mb: 2, color: '#2A3F5F', fontWeight: 600 } }}>
            <Typography variant="h6">1. Aceitacao dos Termos</Typography>
            <Typography paragraph>
              Ao acessar e usar a <strong>Plataforma Luminar</strong>, voce concorda com estes Termos de Servico.
              Se voce nao concordar com qualquer parte destes termos, nao podera acessar o servico.
            </Typography>

            <Typography variant="h6">2. Descricao do Servico</Typography>
            <Typography paragraph>
              A Plataforma Luminar e um sistema de gestao educacional que oferece:
            </Typography>
            <ul>
              <li>Registro de chamadas e frequencia</li>
              <li>Gestao de notas e conceitos</li>
              <li>Dossie digital de alunos</li>
              <li>Comunicacao via WhatsApp</li>
              <li>Gestao de horarios e grade curricular</li>
              <li>Relatorios academicos</li>
              <li>Integracao com Google Classroom</li>
              <li>Mapeamento de sala</li>
            </ul>

            <Typography variant="h6">3. Elegibilidade e Acesso</Typography>
            <Typography paragraph>
              O acesso a plataforma e restrito a:
            </Typography>
            <ul>
              <li>Professores, coordenadores e administradores do Centro de Educacao Integral Christ Master</li>
              <li>Usuarios com conta Google no dominio @christmaster.com.br</li>
              <li>Usuarios previamente cadastrados por um administrador</li>
            </ul>
            <Typography paragraph>
              Cada usuario recebe um conjunto de permissoes especificas baseadas em seu cargo e funcao.
            </Typography>

            <Typography variant="h6">4. Conta de Usuario</Typography>
            <Typography paragraph>
              <strong>4.1 Responsabilidades do Usuario:</strong>
            </Typography>
            <ul>
              <li>Manter a seguranca de suas credenciais Google</li>
              <li>Nao compartilhar seu acesso com terceiros</li>
              <li>Notificar imediatamente sobre uso nao autorizado</li>
              <li>Usar apenas dispositivos seguros e atualizados</li>
            </ul>
            <Typography paragraph sx={{ mt: 2 }}>
              <strong>4.2 Uso Permitido:</strong>
            </Typography>
            <ul>
              <li>Registrar informacoes academicas de forma precisa</li>
              <li>Acessar apenas dados necessarios para sua funcao</li>
              <li>Comunicar-se profissionalmente com responsaveis</li>
            </ul>

            <Typography variant="h6">5. Condutas Proibidas</Typography>
            <Typography paragraph>
              E expressamente proibido:
            </Typography>
            <ul>
              <li>Acessar dados de alunos ou turmas fora de sua responsabilidade</li>
              <li>Compartilhar informacoes confidenciais externamente</li>
              <li>Usar o sistema para fins nao educacionais</li>
              <li>Tentar burlar controles de seguranca ou permissoes</li>
              <li>Inserir dados falsos ou imprecisos intencionalmente</li>
              <li>Usar o WhatsApp integrado para fins pessoais</li>
              <li>Exportar dados em massa sem autorizacao</li>
              <li>Fotografar ou capturar telas com dados sensiveis</li>
            </ul>

            <Typography variant="h6">6. Propriedade Intelectual</Typography>
            <Typography paragraph>
              A Plataforma Luminar, incluindo codigo-fonte, design, funcionalidades e documentacao,
              e de propriedade do Centro de Educacao Integral Christ Master e seus desenvolvedores.
            </Typography>
            <Typography paragraph>
              Os dados inseridos no sistema (notas, chamadas, etc.) sao de propriedade da instituicao
              de ensino e dos titulares (alunos/responsaveis), conforme a LGPD.
            </Typography>

            <Typography variant="h6">7. Disponibilidade do Servico</Typography>
            <Typography paragraph>
              Nos esforcamos para manter o servico disponivel 24/7, porem:
            </Typography>
            <ul>
              <li>Podem ocorrer interrupcoes para manutencao programada</li>
              <li>Falhas tecnicas podem afetar temporariamente o acesso</li>
              <li>O servico depende de infraestrutura de terceiros (Google, Vercel)</li>
            </ul>
            <Typography paragraph>
              Nao garantimos disponibilidade ininterrupta e nao somos responsaveis por perdas
              decorrentes de indisponibilidade temporaria.
            </Typography>

            <Typography variant="h6">8. Funcionalidade Offline (PWA)</Typography>
            <Typography paragraph>
              A plataforma funciona como Progressive Web App (PWA) com recursos limitados offline:
            </Typography>
            <ul>
              <li>Visualizacao de dados previamente carregados</li>
              <li>Preenchimento de formularios (sincronizacao posterior)</li>
            </ul>
            <Typography paragraph>
              Acoes que exigem conexao serao sincronizadas automaticamente quando a conexao for restabelecida.
            </Typography>

            <Typography variant="h6">9. Integracoes de Terceiros</Typography>
            <Typography paragraph>
              O sistema integra-se com servicos externos:
            </Typography>
            <ul>
              <li><strong>Google Workspace:</strong> Autenticacao e Google Classroom</li>
              <li><strong>Google Drive:</strong> Armazenamento de arquivos</li>
              <li><strong>WhatsApp Business:</strong> Envio de mensagens (via Evolution API)</li>
            </ul>
            <Typography paragraph>
              O uso dessas integracoes esta sujeito aos termos de servico de cada plataforma.
            </Typography>

            <Typography variant="h6">10. Limitacao de Responsabilidade</Typography>
            <Typography paragraph>
              Na extensao maxima permitida por lei:
            </Typography>
            <ul>
              <li>O servico e fornecido &quot;como esta&quot;, sem garantias</li>
              <li>Nao nos responsabilizamos por decisoes tomadas com base nos dados do sistema</li>
              <li>Nao nos responsabilizamos por perda de dados devido a uso indevido</li>
              <li>Nossa responsabilidade total e limitada ao custo do servico (R$ 0,00 - gratuito)</li>
            </ul>

            <Typography variant="h6">11. Suspensao e Encerramento</Typography>
            <Typography paragraph>
              Podemos suspender ou encerrar seu acesso se voce:
            </Typography>
            <ul>
              <li>Violar estes Termos de Servico</li>
              <li>Usar o sistema de forma prejudicial</li>
              <li>Tiver seu vinculo com a instituicao encerrado</li>
            </ul>
            <Typography paragraph>
              Voce pode solicitar o encerramento de sua conta a qualquer momento atraves da coordenacao.
            </Typography>

            <Typography variant="h6">12. Alteracoes nos Termos</Typography>
            <Typography paragraph>
              Reservamo-nos o direito de modificar estes termos a qualquer momento.
              Alteracoes significativas serao comunicadas com antecedencia de 15 dias.
            </Typography>
            <Typography paragraph>
              O uso continuado apos alteracoes constitui aceitacao dos novos termos.
            </Typography>

            <Typography variant="h6">13. Lei Aplicavel</Typography>
            <Typography paragraph>
              Estes termos sao regidos pelas leis da Republica Federativa do Brasil.
              Qualquer disputa sera resolvida no foro da comarca de Manaus, Estado do Amazonas.
            </Typography>

            <Typography variant="h6">14. Contato</Typography>
            <Typography paragraph>
              Para duvidas sobre estes termos:
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
