import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, PawPrint } from 'lucide-react';

const LAST_UPDATED = '2026-06-11';
const VERSION = '1.0';
const DPO_EMAIL = 'pawconnect@gmail.com';
const COMPANY = 'Purple-Paw-Connect';

const PrivacyPolicy = () => (
  <div className="min-h-screen bg-white">
    <header className="border-b border-gray-100 sticky top-0 bg-white z-10">
      <div className="max-w-3xl mx-auto px-5 py-4 flex items-center gap-3">
        <Link to="/" className="inline-flex items-center gap-2 text-gray-600 hover:text-purple-600 transition-colors text-sm">
          <ArrowLeft className="w-4 h-4" />
          Voltar ao início
        </Link>
        <span className="text-gray-300">|</span>
        <div className="flex items-center gap-1.5">
          <PawPrint className="w-4 h-4 text-purple-500" />
          <span className="font-semibold text-gray-800 text-sm">PawConnect</span>
        </div>
      </div>
    </header>

    <main className="max-w-3xl mx-auto px-5 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Política de Privacidade</h1>
      <p className="text-sm text-gray-500 mb-10">
        Versão {VERSION} · Última atualização: {LAST_UPDATED}
      </p>

      <div className="prose prose-gray max-w-none space-y-8 text-gray-700 leading-relaxed">

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Quem somos</h2>
          <p>
            O <strong>{COMPANY}</strong> ("PawConnect", "nós") é uma plataforma digital que conecta tutores de animais
            a clínicas veterinárias. Esta Política descreve como coletamos, usamos e protegemos os dados pessoais
            de nossos usuários, em conformidade com a <strong>Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018)</strong> e,
            para usuários localizados no Espaço Econômico Europeu, com o <strong>Regulamento Geral de Proteção de Dados (GDPR — UE 2016/679)</strong>.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Dados que coletamos</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
              <thead className="bg-purple-50">
                <tr>
                  <th className="text-left px-4 py-2 font-semibold text-gray-700">Categoria</th>
                  <th className="text-left px-4 py-2 font-semibold text-gray-700">Dados</th>
                  <th className="text-left px-4 py-2 font-semibold text-gray-700">Finalidade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <td className="px-4 py-2">Cadastro</td>
                  <td className="px-4 py-2">Nome, e-mail, telefone, endereço</td>
                  <td className="px-4 py-2">Criação e autenticação de conta</td>
                </tr>
                <tr>
                  <td className="px-4 py-2">Pets</td>
                  <td className="px-4 py-2">Nome, espécie, raça, data de nascimento, peso, foto</td>
                  <td className="px-4 py-2">Gestão do perfil do animal para agendamentos</td>
                </tr>
                <tr>
                  <td className="px-4 py-2">Agendamentos</td>
                  <td className="px-4 py-2">Serviço solicitado, data/hora, descrição, arquivo de encaminhamento</td>
                  <td className="px-4 py-2">Prestação do serviço de agendamento</td>
                </tr>
                <tr>
                  <td className="px-4 py-2">Comunicação</td>
                  <td className="px-4 py-2">Mensagens de chat entre tutor e clínica</td>
                  <td className="px-4 py-2">Facilitar a comunicação sobre o atendimento</td>
                </tr>
                <tr>
                  <td className="px-4 py-2">Localização</td>
                  <td className="px-4 py-2">Coordenadas geográficas (opcional, somente com sua permissão)</td>
                  <td className="px-4 py-2">Busca de clínicas próximas</td>
                </tr>
                <tr>
                  <td className="px-4 py-2">Clínicas</td>
                  <td className="px-4 py-2">CNPJ, endereço, especialidades, horários, logo</td>
                  <td className="px-4 py-2">Listagem pública de clínicas na plataforma</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Base legal para o tratamento</h2>
          <ul className="list-disc pl-5 space-y-1.5 text-sm">
            <li><strong>Execução de contrato (LGPD, art. 7º, V / GDPR, art. 6º, 1, b):</strong> dados necessários para prestar o serviço de agendamento.</li>
            <li><strong>Consentimento (LGPD, art. 7º, I / GDPR, art. 6º, 1, a):</strong> uso de localização geográfica e comunicações de marketing.</li>
            <li><strong>Interesse legítimo (LGPD, art. 7º, IX / GDPR, art. 6º, 1, f):</strong> segurança da plataforma, prevenção de fraudes e melhoria do serviço.</li>
            <li><strong>Cumprimento de obrigação legal (LGPD, art. 7º, II):</strong> registros fiscais e outros requisitos legais aplicáveis.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Compartilhamento com terceiros</h2>
          <p className="mb-3">Seus dados podem ser processados pelos seguintes fornecedores, todos contratados com cláusulas de proteção de dados:</p>
          <ul className="list-disc pl-5 space-y-1.5 text-sm">
            <li><strong>Supabase Inc. (EUA/UE):</strong> banco de dados, autenticação e armazenamento de arquivos. Dados transferidos com base em cláusulas contratuais padrão (GDPR, art. 46).</li>
            <li><strong>ViaCEP (Brasil):</strong> consulta de CEP para autocompletar endereço — somente o CEP digitado é enviado, sem dados pessoais.</li>
            <li><strong>APIs de geocodificação:</strong> conversão de endereço em coordenadas para busca por proximidade.</li>
          </ul>
          <p className="mt-3 text-sm">Não vendemos dados pessoais a terceiros. Dados só são divulgados a autoridades quando exigido por lei.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Retenção de dados</h2>
          <ul className="list-disc pl-5 space-y-1.5 text-sm">
            <li>Conta ativa: dados mantidos enquanto a conta existir.</li>
            <li>Conta excluída: dados pessoais eliminados em até 15 dias úteis após solicitação, salvo obrigação legal de retenção.</li>
            <li>Registros de auditoria e logs de segurança: retidos por 6 meses.</li>
            <li>Dados fiscais/contábeis: retidos pelo prazo legal exigido (mínimo 5 anos).</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Seus direitos</h2>
          <p className="mb-3 text-sm">Nos termos da LGPD (art. 18) e do GDPR (art. 15–22), você tem os seguintes direitos:</p>
          <ul className="list-disc pl-5 space-y-1.5 text-sm">
            <li><strong>Acesso:</strong> saber quais dados temos sobre você.</li>
            <li><strong>Correção:</strong> corrigir dados incompletos ou incorretos.</li>
            <li><strong>Exclusão ("direito ao esquecimento"):</strong> solicitar a eliminação dos seus dados.</li>
            <li><strong>Portabilidade:</strong> exportar seus dados em formato estruturado.</li>
            <li><strong>Revogação do consentimento:</strong> retirar o consentimento a qualquer momento, sem prejuízo do tratamento anterior.</li>
            <li><strong>Oposição:</strong> opor-se ao tratamento baseado em interesse legítimo.</li>
            <li><strong>Informação sobre compartilhamento:</strong> saber com quem seus dados são compartilhados.</li>
          </ul>
          <p className="mt-3 text-sm">Para exercer seus direitos, envie e-mail para <a href={`mailto:${DPO_EMAIL}`} className="text-purple-600 hover:underline">{DPO_EMAIL}</a>. Respondemos em até 15 dias úteis.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Segurança dos dados</h2>
          <p className="text-sm">
            Adotamos medidas técnicas e organizacionais adequadas: criptografia em trânsito (TLS), controle de acesso baseado em papéis (Row-Level Security),
            autenticação com hash de senha (bcrypt gerenciado pelo provedor de identidade) e monitoramento de segurança. Em caso de incidente,
            notificaremos a ANPD e os titulares afetados nos prazos legais.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Cookies e tecnologias similares</h2>
          <p className="text-sm">
            Utilizamos cookies de sessão estritamente necessários para autenticação. Não utilizamos cookies de rastreamento ou publicidade sem seu consentimento explícito.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Transferência internacional de dados</h2>
          <p className="text-sm">
            Seus dados podem ser armazenados em servidores fora do Brasil (Supabase). Essas transferências são realizadas com salvaguardas adequadas,
            incluindo cláusulas contratuais padrão compatíveis com o GDPR, garantindo nível de proteção equivalente ao da LGPD.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">10. Encarregado (DPO)</h2>
          <p className="text-sm">
            Nosso Encarregado de Proteção de Dados (DPO), conforme exigido pelo art. 41 da LGPD, pode ser contactado pelo e-mail:{' '}
            <a href={`mailto:${DPO_EMAIL}`} className="text-purple-600 hover:underline">{DPO_EMAIL}</a>.
          </p>
          <p className="mt-2 text-sm">
            Você também tem o direito de apresentar reclamação à Autoridade Nacional de Proteção de Dados (ANPD) em{' '}
            <a href="https://www.gov.br/anpd" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">www.gov.br/anpd</a>.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">11. Alterações nesta Política</h2>
          <p className="text-sm">
            Podemos atualizar esta Política periodicamente. Notificaremos alterações relevantes por e-mail ou aviso na plataforma.
            O uso continuado após a notificação implica aceitação das alterações.
          </p>
        </section>

      </div>

      <div className="mt-12 pt-8 border-t border-gray-100 text-xs text-gray-400 flex flex-col sm:flex-row justify-between gap-2">
        <span>© {new Date().getFullYear()} {COMPANY}. Todos os direitos reservados.</span>
        <span>Versão {VERSION} · Atualizada em {LAST_UPDATED}</span>
      </div>
    </main>
  </div>
);

export default PrivacyPolicy;
