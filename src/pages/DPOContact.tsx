import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, PawPrint, Mail, Shield, FileText, Trash2, Eye, Edit, Download } from 'lucide-react';

const DPO_EMAIL = 'dpo@pawconnect.com.br';
const RESPONSE_DAYS = 15;
const LAST_UPDATED = '2026-06-11';

const rights = [
  { icon: Eye,      title: 'Confirmação e acesso',        desc: 'Confirmar a existência de tratamento e acessar seus dados (Art. 18, I e II).' },
  { icon: Edit,     title: 'Correção',                    desc: 'Solicitar a correção de dados incompletos, inexatos ou desatualizados (Art. 18, III).' },
  { icon: Trash2,   title: 'Anonimização ou eliminação',  desc: 'Pedir anonimização, bloqueio ou exclusão de dados desnecessários ou tratados em desconformidade (Art. 18, IV).' },
  { icon: Download, title: 'Portabilidade',               desc: 'Receber seus dados em formato estruturado para transferência a outro fornecedor (Art. 18, V).' },
  { icon: Trash2,   title: 'Eliminação com consentimento', desc: 'Requerer a exclusão de dados tratados com base no consentimento, podendo revogar a qualquer momento (Art. 18, VI e Art. 8, §5º).' },
  { icon: FileText, title: 'Informação sobre compartilhamento', desc: 'Obter informações sobre entidades públicas e privadas com quem compartilhamos seus dados (Art. 18, VII).' },
  { icon: Shield,   title: 'Oposição',                    desc: 'Opor-se a tratamento que descumpra a LGPD (Art. 18, §2º).' },
];

const DPOContact = () => (
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
      <div className="flex items-center gap-3 mb-2">
        <Shield className="w-8 h-8 text-purple-500" />
        <h1 className="text-3xl font-bold text-gray-900">Encarregado de Dados (DPO)</h1>
      </div>
      <p className="text-sm text-gray-500 mb-10">
        Canal oficial para exercício de direitos previstos na LGPD · Atualizado em {LAST_UPDATED}
      </p>

      <div className="space-y-10 text-gray-700 leading-relaxed">

        {/* Who is the DPO */}
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">Quem é o Encarregado?</h2>
          <p>
            O <strong>Encarregado pelo Tratamento de Dados Pessoais</strong> (também chamado de <em>Data Protection Officer</em> — DPO)
            é a pessoa responsável por atuar como canal de comunicação entre a PawConnect, os titulares de dados e a
            <strong> Autoridade Nacional de Proteção de Dados (ANPD)</strong>, conforme exigido pelo{' '}
            <strong>Art. 41 da LGPD (Lei nº 13.709/2018)</strong>.
          </p>
        </section>

        {/* Contact */}
        <section className="bg-purple-50 border border-purple-100 rounded-2xl p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Mail className="w-5 h-5 text-purple-500" />
            Como entrar em contato
          </h2>
          <p className="mb-4">
            Para exercer qualquer direito previsto na LGPD ou tirar dúvidas sobre o tratamento dos seus dados,
            envie um e-mail diretamente ao nosso Encarregado:
          </p>
          <a
            href={`mailto:${DPO_EMAIL}?subject=Exerc%C3%ADcio%20de%20direito%20LGPD`}
            className="inline-flex items-center gap-2 bg-purple-600 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-purple-700 transition-colors"
          >
            <Mail className="w-4 h-4" />
            {DPO_EMAIL}
          </a>
          <p className="mt-4 text-sm text-gray-600">
            Responderemos em até <strong>{RESPONSE_DAYS} dias úteis</strong>, conforme prazo estabelecido
            pelo Art. 18, §3º da LGPD.
          </p>
          <p className="mt-2 text-sm text-gray-600">
            Inclua no e-mail: seu nome completo, o e-mail cadastrado na plataforma, e uma descrição clara
            do direito que deseja exercer.
          </p>
        </section>

        {/* Rights */}
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-5">Seus direitos como titular (Art. 18, LGPD)</h2>
          <div className="space-y-4">
            {rights.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex gap-4 p-4 rounded-xl border border-gray-100 hover:border-purple-100 hover:bg-purple-50/30 transition-colors">
                <div className="mt-0.5 flex-shrink-0">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-purple-600" />
                  </div>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{title}</p>
                  <p className="text-sm text-gray-600 mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ANPD */}
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">Reclamação à ANPD</h2>
          <p>
            Caso sua solicitação não seja atendida de forma satisfatória, você tem o direito de peticionar
            à <strong>Autoridade Nacional de Proteção de Dados (ANPD)</strong>, pelo portal:{' '}
            <span className="text-purple-600 font-medium">gov.br/anpd</span>
          </p>
        </section>

        {/* Related links */}
        <section className="border-t border-gray-100 pt-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Documentos relacionados</h2>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/privacidade"
              className="inline-flex items-center gap-1.5 text-sm text-purple-600 hover:text-purple-700 border border-purple-200 rounded-lg px-3 py-1.5 hover:bg-purple-50 transition-colors"
            >
              <FileText className="w-4 h-4" />
              Política de Privacidade
            </Link>
            <Link
              to="/termos"
              className="inline-flex items-center gap-1.5 text-sm text-purple-600 hover:text-purple-700 border border-purple-200 rounded-lg px-3 py-1.5 hover:bg-purple-50 transition-colors"
            >
              <FileText className="w-4 h-4" />
              Termos de Uso
            </Link>
          </div>
        </section>

      </div>
    </main>
  </div>
);

export default DPOContact;
