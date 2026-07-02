import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, PawPrint } from 'lucide-react';
import SEO from '@/components/SEO';

const LAST_UPDATED = '2026-06-11';
const VERSION = '1.0';
const CONTACT_EMAIL = 'pawconnect@gmail.com';
const COMPANY = 'Purple-Paw-Connect';

const TermsOfUse = () => (
  <div className="min-h-screen bg-white">
    <SEO title="Termos de Uso" description="Termos de uso do Paw Connect." />
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
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Termos de Uso</h1>
      <p className="text-sm text-gray-500 mb-10">
        Versão {VERSION} · Última atualização: {LAST_UPDATED}
      </p>

      <div className="prose prose-gray max-w-none space-y-8 text-gray-700 leading-relaxed">

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Aceitação dos termos</h2>
          <p>
            Ao criar uma conta ou usar o <strong>PawConnect</strong> (plataforma operada por <strong>{COMPANY}</strong>),
            você confirma que leu, compreendeu e concorda com estes Termos de Uso e com a nossa{' '}
            <Link to="/privacidade" className="text-purple-600 hover:underline">Política de Privacidade</Link>.
            Se não concordar, não utilize a plataforma.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Descrição do serviço</h2>
          <p>
            O PawConnect é uma plataforma de intermediação que conecta tutores de animais de estimação a clínicas
            veterinárias. Não somos uma clínica veterinária, não prestamos serviços médicos veterinários e não somos
            responsáveis pela qualidade, resultado ou adequação dos atendimentos prestados pelas clínicas cadastradas.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Cadastro e elegibilidade</h2>
          <ul className="list-disc pl-5 space-y-1.5 text-sm">
            <li>Você deve ter pelo menos <strong>18 anos</strong> ou estar representado por um responsável legal para criar uma conta.</li>
            <li>As informações fornecidas no cadastro devem ser verdadeiras, completas e atualizadas.</li>
            <li>Você é responsável pela segurança de sua senha e por todas as atividades realizadas na sua conta.</li>
            <li>É proibido criar contas em nome de terceiros sem autorização.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Obrigações dos tutores (clientes)</h2>
          <ul className="list-disc pl-5 space-y-1.5 text-sm">
            <li>Fornecer informações precisas sobre seus pets para facilitar o atendimento.</li>
            <li>Respeitar os horários agendados e cancelar com antecedência razoável quando necessário.</li>
            <li>Tratar os profissionais das clínicas com respeito e cordialidade.</li>
            <li>Não utilizar a plataforma para fins fraudulentos ou ilegais.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Obrigações das clínicas</h2>
          <ul className="list-disc pl-5 space-y-1.5 text-sm">
            <li>Manter as informações cadastrais (endereço, especialidades, horários) sempre atualizadas e verdadeiras.</li>
            <li>Possuir os registros e licenças exigidos pela legislação vigente (CFMV, vigilância sanitária, etc.).</li>
            <li>Responder às solicitações de agendamento dentro de prazo razoável.</li>
            <li>Ser a única responsável pela qualidade e segurança dos serviços veterinários prestados.</li>
            <li>Não utilizar os dados dos tutores obtidos pela plataforma para outros fins além do atendimento agendado.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Planos e pagamentos</h2>
          <p className="text-sm">
            Clínicas podem contratar planos pagos para acesso a recursos avançados. Os valores e condições de cada plano
            são exibidos na página de cadastro. O pagamento é processado por um gateway de pagamentos licenciado pelo Banco Central do Brasil.
            O PawConnect não armazena dados de cartão de crédito. Cancelamentos e reembolsos seguem a política exibida no momento da contratação
            e o Código de Defesa do Consumidor (Lei nº 8.078/1990).
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Condutas proibidas</h2>
          <p className="mb-2 text-sm">É expressamente proibido:</p>
          <ul className="list-disc pl-5 space-y-1.5 text-sm">
            <li>Usar a plataforma para praticar qualquer atividade ilegal.</li>
            <li>Publicar conteúdo falso, enganoso, difamatório ou que viole direitos de terceiros.</li>
            <li>Tentar acessar dados de outros usuários sem autorização.</li>
            <li>Usar bots, scrapers ou meios automatizados sem permissão escrita prévia.</li>
            <li>Realizar engenharia reversa ou tentativas de comprometer a segurança da plataforma.</li>
            <li>Contatar tutores ou clínicas por meios externos à plataforma para fins comerciais não autorizados.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Conteúdo gerado por usuários</h2>
          <p className="text-sm">
            Ao enviar fotos, descrições ou mensagens na plataforma, você concede ao PawConnect uma licença não exclusiva,
            gratuita e mundial para usar esse conteúdo exclusivamente para a operação do serviço. Você declara ter os
            direitos necessários sobre o conteúdo enviado.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Limitação de responsabilidade</h2>
          <p className="text-sm">
            O PawConnect é uma plataforma de intermediação. Não garantimos a disponibilidade contínua do serviço,
            a qualidade dos atendimentos veterinários, nem a veracidade das informações fornecidas pelas clínicas.
            Na máxima extensão permitida por lei, nossa responsabilidade por danos indiretos, lucros cessantes ou
            danos consequenciais é limitada ao valor pago pelo usuário nos últimos 3 meses.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">10. Suspensão e encerramento de conta</h2>
          <p className="text-sm">
            Reservamo-nos o direito de suspender ou encerrar contas que violem estes Termos, sem aviso prévio nos casos
            de violação grave. Você pode encerrar sua conta a qualquer momento nas configurações de perfil.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">11. Propriedade intelectual</h2>
          <p className="text-sm">
            A marca PawConnect, o design da plataforma e o código-fonte são propriedade do {COMPANY}.
            É vedada qualquer reprodução ou uso comercial sem autorização prévia por escrito.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">12. Alterações nos termos</h2>
          <p className="text-sm">
            Podemos modificar estes Termos a qualquer momento. Alterações relevantes serão comunicadas por e-mail
            ou aviso na plataforma com antecedência mínima de 30 dias. O uso continuado após esse prazo implica aceitação.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">13. Lei aplicável e foro</h2>
          <p className="text-sm">
            Estes Termos são regidos pelas leis da <strong>República Federativa do Brasil</strong>.
            Fica eleito o foro da Comarca de <strong>São Paulo/SP</strong> para dirimir quaisquer conflitos,
            com renúncia a qualquer outro, por mais privilegiado que seja.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">14. Contato</h2>
          <p className="text-sm">
            Dúvidas sobre estes Termos:{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-purple-600 hover:underline">{CONTACT_EMAIL}</a>
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

export default TermsOfUse;
