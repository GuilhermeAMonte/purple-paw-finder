# Requirements Document

## Introduction

O **Paw Connect** (também conhecido como Purple Paw Finder) é uma aplicação web SPA (*Single Page Application*) para busca e agendamento de clínicas veterinárias. A plataforma conecta tutores de animais de estimação ("clientes") a clínicas veterinárias, permitindo busca por localização e especialidade, visualização de perfis detalhados de clínicas, criação de tickets de agendamento, comunicação via chat e acompanhamento de consultas.

O sistema possui dois tipos de usuário: **Cliente** (tutor de pet) e **Clínica** (estabelecimento veterinário). Cada tipo tem fluxos, permissões e interfaces distintos.

A stack atual é React 18 + TypeScript + Vite + shadcn/ui + Tailwind CSS + React Router v6 + TanStack Query + Zod + React Hook Form. A persistência é feita via `localStorage` (sem backend real nesta fase). Toda entrada do usuário deve ser validada com schemas Zod antes de ser processada ou persistida.

---

## Glossary

- **Sistema**: A aplicação web Paw Connect como um todo.
- **Cliente**: Usuário do tipo `client` — tutor de animal de estimação que busca e agenda serviços veterinários.
- **Clínica**: Usuário do tipo `clinic` — estabelecimento veterinário cadastrado na plataforma.
- **Ticket**: Solicitação de agendamento criada por um Cliente para uma Clínica, contendo dados do pet, serviço desejado, data e horário pretendidos.
- **Pet**: Animal de estimação cadastrado pelo Cliente.
- **Dashboard**: Painel de controle exclusivo da Clínica para gerenciar tickets, contatos, emergências, calendário e horários.
- **Chat**: Canal de mensagens de texto entre um Cliente e uma Clínica, vinculado a um Ticket.
- **Emergência**: Modalidade de contato direto e prioritário, sem criação de ticket, ativada pelo Cliente na página de detalhes da Clínica.
- **Plano**: Nível de assinatura da Clínica (`free`, `basic`, `intermediary`, `experience`).
- **AuthContext**: Contexto React que gerencia estado de autenticação e dados do usuário autenticado.
- **FavoritesContext**: Contexto React que gerencia a lista de clínicas favoritas do Cliente.
- **Validator**: Camada de validação de entrada baseada em schemas Zod.
- **Router**: React Router v6, responsável pelo roteamento da SPA.
- **localStorage**: Mecanismo de persistência do lado do cliente utilizado nesta fase do projeto.

---

## Requirements

### Requirement 1: Cadastro de Usuário

**User Story:** Como visitante, quero me cadastrar na plataforma como Cliente ou Clínica, para que eu possa acessar os recursos correspondentes ao meu perfil.

#### Acceptance Criteria

1. WHEN um visitante submete o formulário de cadastro, THE Validator SHALL rejeitar a submissão se qualquer um dos seguintes critérios não for atendido: nome entre 1 e 150 caracteres, e-mail no formato RFC 5322, senha entre 8 e 128 caracteres, `userType` igual a `client` ou `clinic`, e — para clínicas — plano selecionado; erros devem ser exibidos por campo sem revelar detalhes de implementação.
2. WHEN um visitante submete o formulário de cadastro com todos os campos válidos, THE Sistema SHALL criar a conta, persistir os dados no `localStorage` e redirecionar o usuário para o próximo passo do onboarding correspondente ao tipo de usuário.
3. IF o e-mail informado já estiver cadastrado no `localStorage`, THEN THE Sistema SHALL retornar uma mensagem de erro que não confirme a existência do e-mail nem identifique qual campo está em conflito.
4. THE Validator SHALL aceitar apenas os valores `client` ou `clinic` para o campo `userType`, rejeitando qualquer outro valor com erro de campo.
5. WHERE o tipo de usuário for `clinic`, THE Sistema SHALL exibir o seletor de plano (`free`, `basic`, `intermediary` ou `experience`) como campo obrigatório no formulário de cadastro.
6. IF o tipo de usuário for `clinic` e nenhum plano estiver selecionado, THEN THE Validator SHALL bloquear a criação da conta e exibir erro no campo de plano.
7. THE Sistema SHALL nunca persistir a senha em texto puro no `localStorage`; a senha SHALL ser processada por uma função de hash antes do armazenamento.
8. THE Sistema SHALL nunca incluir senhas, hashes de senha, tokens ou identificadores de sessão em mensagens de erro exibidas ao usuário ou em outputs acessíveis via interface.
9. WHEN o formulário de cadastro exibir campo de confirmação de senha, THE Validator SHALL rejeitar a submissão se o valor de "confirmar senha" for diferente do valor de "senha", exibindo erro no campo de confirmação sem revelar o conteúdo de nenhum dos campos.

---

### Requirement 2: Autenticação (Login e Logout)

**User Story:** Como usuário cadastrado, quero fazer login e logout, para que eu possa acessar minha conta com segurança e encerrá-la quando desejar.

#### Acceptance Criteria

1. WHEN um usuário submete o formulário de login com e-mail e senha corretos, THE AuthContext SHALL autenticar o usuário, persistir a sessão no `localStorage` e redirecionar para a página inicial.
2. IF as credenciais de login forem inválidas, THEN THE Sistema SHALL exibir uma mensagem de erro genérica sem indicar qual campo está incorreto, nunca revelando se o e-mail existe ou se a senha está errada.
3. WHEN um usuário autenticado aciona o logout, THE AuthContext SHALL remover a sessão do `localStorage` e redirecionar para a página inicial.
4. WHEN um usuário tenta navegar para uma rota privada, THE Router SHALL verificar a existência de uma sessão válida no `localStorage` antes de conceder acesso, bloqueando o acesso caso a sessão esteja ausente ou corrompida.
5. IF um usuário não autenticado tentar acessar uma rota privada, THEN THE Router SHALL redirecionar para a página de login.
6. THE Sistema SHALL nunca expor o hash da senha ou dados de sessão de outros usuários em qualquer resposta do sistema, incluindo respostas para usuários autenticados acessando rotas protegidas.
7. IF um usuário acumular 5 tentativas de login com falha dentro de uma janela móvel de 5 minutos para o mesmo e-mail, THEN THE Sistema SHALL bloquear novas tentativas de login para aquele e-mail por 15 minutos — independentemente da senha fornecida —, exibindo mensagem informativa sem revelar o motivo técnico do bloqueio.
8. WHEN a sessão do usuário autenticado completar 8 horas sem atividade, THE AuthContext SHALL encerrar automaticamente a sessão, remover os dados do `localStorage` e exibir aviso ao usuário antes de redirecionar para a página de login.

---

### Requirement 3: Busca de Clínicas

**User Story:** Como Cliente, quero buscar clínicas veterinárias por localização e especialidade, para que eu possa encontrar profissionais próximos adequados ao meu pet.

#### Acceptance Criteria

1. THE Sistema SHALL exibir na página inicial um formulário de busca com campos de localização (bairro, cidade ou estado) e especialidade.
2. WHEN o usuário digita pelo menos 2 caracteres no campo de localização, THE Sistema SHALL exibir até 10 sugestões de localidades correspondentes às clínicas cadastradas, normalizando acentos e maiúsculas/minúsculas na comparação.
3. WHEN o usuário submete o formulário de busca com campos válidos, THE Sistema SHALL filtrar e exibir as clínicas que correspondam simultaneamente ao critério de localização e ao de especialidade.
4. IF nenhuma clínica corresponder aos critérios informados, THEN THE Sistema SHALL exibir uma mensagem informativa ao usuário sem expor detalhes internos do sistema.
5. THE Validator SHALL rejeitar entradas nos campos de busca que contenham caracteres fora do intervalo imprimível (printable range) ou que excedam 200 caracteres, bloqueando a submissão do formulário nesses casos.
6. WHEN o usuário solicita detecção de localização e concede permissão no diálogo do navegador, THE Sistema SHALL utilizar as coordenadas GPS para pré-preencher o campo de localização com a cidade/bairro detectados e fechar o `LocationPermissionDialog`.
7. WHEN o usuário solicita detecção de localização e nega permissão no diálogo do navegador, THE Sistema SHALL fechar o `LocationPermissionDialog` e permitir que o usuário informe a localização manualmente, mantendo a funcionalidade de busca disponível.
8. THE Sistema SHALL disponibilizar filtro por especialidade a partir de uma lista de valores permitidos (`CLINIC_SPECIALTIES`), rejeitando valores fora dessa lista.
9. IF a API de geolocalização retornar um erro (permissão negada, indisponível ou timeout), THEN THE Sistema SHALL exibir uma mensagem de erro não-técnica e manter o campo de localização editável para entrada manual.

---

### Requirement 4: Visualização de Detalhes da Clínica

**User Story:** Como Cliente, quero visualizar o perfil completo de uma clínica, para que eu possa tomar uma decisão informada antes de agendar.

#### Acceptance Criteria

1. WHEN o usuário seleciona uma clínica nos resultados de busca, THE Sistema SHALL exibir a página de detalhes com nome, avaliação média (0–5), número de avaliações, distância em quilômetros, endereço, telefone, especialidades, serviços, horários de funcionamento e descrição; campos não preenchidos SHALL ser omitidos ou exibidos com indicação "Não informado".
2. WHILE o horário atual estiver dentro do intervalo de funcionamento configurado pela clínica, THE Sistema SHALL exibir o rótulo "Aberto" em verde; WHILE o horário atual estiver fora desse intervalo, THE Sistema SHALL exibir o rótulo "Fechado" em vermelho; IF a clínica não tiver horários cadastrados, THEN THE Sistema SHALL exibir "Horário não informado" sem indicar status de abertura.
3. WHERE a clínica tiver a flag `is24Hours` ativada, THE Sistema SHALL exibir o badge "24h" em destaque visual na página de detalhes.
4. THE Sistema SHALL sempre exibir o botão "Contato Normal" na página de detalhes; WHERE a clínica oferecer atendimento de emergência (flag `is24Hours` ou flag de emergência ativa), THE Sistema SHALL também exibir o botão "Emergência".
5. IF a clínica referenciada pelo `:id` da rota não existir no `localStorage`, THEN THE Sistema SHALL exibir uma mensagem de erro não-técnica e oferecer link de retorno à busca, sem expor detalhes internos.
6. THE Sistema SHALL garantir que caracteres especiais HTML (`<`, `>`, `"`, `'`, `&`) presentes em qualquer campo do perfil da clínica sejam encodados antes de serem inseridos no DOM, de modo que injetar `<script>alert(1)</script>` em qualquer campo não execute código no navegador.

---

### Requirement 5: Gerenciamento de Clínicas Favoritas

**User Story:** Como Cliente, quero marcar clínicas como favoritas, para que eu possa acessá-las rapidamente em consultas futuras.

#### Acceptance Criteria

1. WHEN o Cliente aciona o botão de favorito em um card de clínica com ID válido, THE FavoritesContext SHALL alternar o estado de favorito em no máximo 100ms, adicionando ou removendo a clínica da lista.
2. THE FavoritesContext SHALL persistir a lista de favoritos no `localStorage` e restaurá-la ao recarregar a página.
3. IF o `localStorage` contiver dados de favoritos malformados ou corrompidos ao inicializar, THEN THE FavoritesContext SHALL descartar os dados inválidos, inicializar com lista vazia e registrar aviso em log sem propagar erro para o usuário.
4. WHILE uma clínica estiver marcada como favorita, THE Sistema SHALL exibir o ícone de coração preenchido e colorido no card correspondente; WHILE não estiver marcada, THE Sistema SHALL exibir o ícone de coração vazado em estado neutro.
5. IF o identificador da clínica for nulo, undefined ou uma string vazia, THEN THE FavoritesContext SHALL ignorar a operação de toggle sem propagar erros.

---

### Requirement 6: Perfil do Cliente

**User Story:** Como Cliente, quero editar meu perfil pessoal e gerenciar meus pets cadastrados, para que minhas informações estejam sempre atualizadas.

#### Acceptance Criteria

1. THE Sistema SHALL disponibilizar ao Cliente autenticado uma página de perfil com abas "Dados Pessoais" e "Meus Pets", acessível apenas para usuários com `userType === 'client'` autenticados.
2. WHEN o Cliente submete o formulário de dados pessoais com nome (1–150 chars), e-mail RFC 5322 válido, telefone e endereço preenchidos, THE Sistema SHALL persistir as alterações no `localStorage` e exibir toast de confirmação de sucesso.
3. THE Validator SHALL validar o formato de e-mail (RFC 5322) no campo de e-mail do perfil ao digitar (debounce de 300ms) e ao submeter o formulário, exibindo erro de campo inline se o formato for inválido.
4. WHEN o Cliente tenta fazer upload de um arquivo de avatar, THE Sistema SHALL validar o tipo MIME (`image/jpeg`, `image/png`, `image/webp`, `image/gif`) e o tamanho (máximo 5 MB) antes de iniciar qualquer processamento.
5. IF o arquivo de avatar exceder 5 MB ou não for um dos tipos MIME permitidos, THEN THE Sistema SHALL exibir mensagem de erro descritiva e descartar o arquivo sem processá-lo ou armazená-lo.
6. WHEN o Cliente submete o formulário de adição de pet, THE Validator SHALL exigir nome (1–100 chars), espécie (valor da allowlist) e raça como campos obrigatórios, exibindo erro por campo se algum estiver ausente ou inválido.
7. THE Validator SHALL aceitar apenas os valores `dog`, `cat`, `bird`, `rabbit`, `hamster`, `fish`, `reptile` ou `other` para o campo `species`, rejeitando qualquer outro valor.
8. WHEN o Cliente confirma a remoção de um pet, THE Sistema SHALL excluir do `localStorage` tanto os dados do pet quanto a chave de foto associada, de modo que após a remoção nenhuma leitura do `localStorage` retorne dados do pet excluído.
9. WHEN o Cliente tenta fazer upload de foto do pet, THE Sistema SHALL validar o tipo MIME (`image/jpeg`, `image/png`, `image/webp`) e o tamanho (máximo 5 MB) antes de iniciar qualquer processamento, bloqueando o upload se os critérios não forem atendidos.
10. WHEN um Cliente acessa a página de perfil com os parâmetros de URL `tab=pets&add=1&returnTo=<rota>`, THE Sistema SHALL abrir automaticamente a aba "Meus Pets" com o formulário de adição expandido e, após o cadastro bem-sucedido do pet, redirecionar para `<rota>` com o ID do pet recém-criado como parâmetro de query.

---

### Requirement 7: Criação de Ticket (Agendamento)

**User Story:** Como Cliente, quero criar um ticket de agendamento para uma clínica, para que eu possa solicitar atendimento veterinário para o meu pet.

#### Acceptance Criteria

1. WHEN o Cliente submete o formulário de criação de ticket, THE Validator SHALL rejeitar a submissão se qualquer um dos seguintes critérios não for atendido: serviço selecionado (allowlist), título com 1–100 caracteres, descrição com 1–1000 caracteres, data igual ou posterior à data atual, horário da lista disponível da clínica, e pet selecionado.
2. WHEN o Cliente acessa o formulário de criação de ticket, THE Sistema SHALL exibir um dropdown com os pets cadastrados no perfil do Cliente; ao selecionar um pet, THE Sistema SHALL pré-preencher automaticamente os campos de nome, espécie e raça com os dados do pet selecionado.
3. IF o Cliente não tiver pets cadastrados ao acessar o formulário, THEN THE Sistema SHALL exibir um link para cadastrar um novo pet, retendo o identificador da clínica atual; WHEN o Cliente retornar após cadastrar o pet, THE Sistema SHALL reabrir o formulário de ticket para a mesma clínica.
4. WHEN o Cliente seleciona um serviço especializado (diferente de "Clínica Geral"), THE Sistema SHALL tornar o campo de anexo de encaminhamento obrigatório e bloquear a submissão enquanto ele estiver ausente.
5. THE Validator SHALL aceitar apenas arquivos de encaminhamento nos formatos PDF, JPG, JPEG, PNG, DOC e DOCX, com tamanho máximo de 10 MB; IF o arquivo não atender a esses critérios, THEN THE Validator SHALL exibir imediatamente uma mensagem de erro descritiva e bloquear a submissão até que o arquivo seja substituído ou removido.
6. WHEN o Cliente interage com o seletor de data, THE Sistema SHALL desabilitar todas as datas anteriores à data atual no fuso horário do sistema, impedindo a seleção de datas passadas.
7. IF o Cliente tentar selecionar ou inserir um horário que não pertença à lista de horários disponíveis definida pela clínica, THEN THE Sistema SHALL rejeitar o valor e exibir erro no campo de horário.
8. THE Sistema SHALL associar o ticket ao `userId` do usuário autenticado no `AuthContext`, nunca aceitando ou utilizando um `userId` fornecido pelo cliente via campos do formulário.
9. WHEN o ticket é persistido com sucesso no `localStorage`, THE Sistema SHALL exibir toast de confirmação contendo o título do ticket e a data agendada, e redirecionar o Cliente para a página "Meus Agendamentos".
10. IF a persistência do ticket no `localStorage` falhar, THEN THE Sistema SHALL exibir mensagem de erro não-técnica, preservar os dados do formulário preenchido e não redirecionar o Cliente.
11. WHEN o ticket é submetido com sucesso, THE Sistema SHALL sempre exibir confirmação ao Cliente, independentemente do estado da persistência.

---

### Requirement 8: Acompanhamento de Agendamentos (Cliente)

**User Story:** Como Cliente, quero visualizar todos os meus agendamentos e seus status, para que eu possa acompanhar se foram aprovados, recusados ou estão pendentes.

#### Acceptance Criteria

1. WHEN o Cliente acessa a página "Meus Agendamentos", THE Sistema SHALL listar apenas os tickets cujo campo `userId` seja igual ao `userId` do usuário autenticado no `AuthContext`, nunca exibindo tickets de outros usuários.
2. WHEN o Cliente acessa a página "Meus Agendamentos" e os tickets são carregados, THE Sistema SHALL exibir para cada ticket: nome da clínica, serviço, data, horário, título, descrição e badge de status correspondente ao valor de `approvalStatus` (`Pendente`, `Aprovado` ou `Recusado`).
3. WHEN o `approvalStatus` do ticket for `rejected`, THE Sistema SHALL exibir o motivo da recusa armazenado em `rejectionReason` e um botão que navega para o chat vinculado ao ticket.
4. WHEN o `approvalStatus` do ticket for `approved`, THE Sistema SHALL exibir mensagem contendo a data e horário do agendamento, orientando o Cliente a comparecer, mantendo o ticket visível na lista.
5. IF o Cliente não tiver tickets associados ao seu `userId`, THEN THE Sistema SHALL exibir mensagem explicitando que não há agendamentos registrados, sem renderizar lista vazia.
6. WHILE os tickets estão sendo carregados do `localStorage`, THE Sistema SHALL exibir indicador visual de carregamento (skeleton ou spinner) no lugar da lista.
7. IF ocorrer erro ao ler os tickets do `localStorage`, THEN THE Sistema SHALL exibir mensagem de erro não-técnica e oferecer opção de tentar novamente, sem exibir stack trace ou detalhes internos.

---

### Requirement 9: Chat entre Cliente e Clínica

**User Story:** Como Cliente ou Clínica, quero trocar mensagens de texto em um chat vinculado a um ticket, para que possamos nos comunicar sobre o atendimento.

#### Acceptance Criteria

1. WHEN um usuário acessa a rota `/chat/:ticketId`, THE Sistema SHALL carregar e exibir os últimos 200 mensagens do histórico do chat identificado por `ticketId` a partir do `localStorage`.
2. IF o `ticketId` da rota não pertencer ao usuário autenticado (como Cliente ou como Clínica destinatária), THEN THE Sistema SHALL bloquear o acesso, exibir mensagem de erro não-técnica e redirecionar para a página inicial.
3. IF o campo de mensagem estiver vazio ou contiver apenas espaços em branco (incluindo espaço, tab e quebra de linha), THEN THE Sistema SHALL desabilitar o botão de envio e bloquear o envio via tecla Enter.
4. IF o comprimento da mensagem exceder 1000 caracteres, THEN THE Sistema SHALL desabilitar o envio e exibir contador de caracteres indicando o limite excedido.
5. IF o chat for do tipo emergencial (`?emergency=true`) e a mensagem a ser enviada for a primeira do Cliente naquele chat, THEN THE Validator SHALL limitar o comprimento a 120 caracteres, bloqueando o envio se o limite for excedido.
6. WHEN uma mensagem é renderizada no DOM, THE Sistema SHALL garantir que caracteres HTML especiais (`<`, `>`, `"`, `'`, `&`) sejam encodados, incluindo mensagens do Cliente, da Clínica e mensagens de sistema.
7. WHEN o usuário envia uma mensagem válida, THE Sistema SHALL exibir a nova mensagem na interface em no máximo 100ms e tentar persistir o histórico no `localStorage`; IF a persistência falhar, THE Sistema SHALL manter a mensagem visível na interface sem bloquear novos envios.
8. THE Sistema SHALL exibir mensagens do Cliente alinhadas à direita, mensagens da Clínica alinhadas à esquerda, e mensagens de sistema (tipo `system`) centralizadas com estilo visual distinto.
9. WHEN a Clínica recusa um ticket, THE Sistema SHALL criar automaticamente uma mensagem do tipo `system` no chat correspondente, contendo o motivo da recusa (máximo 500 caracteres); IF o motivo estiver vazio, THE Sistema SHALL usar o texto padrão "Agendamento recusado pela clínica".
10. WHILE o chat for do tipo emergencial, THE Sistema SHALL exibir o cabeçalho com fundo vermelho e o texto "EMERGÊNCIA - Atendimento prioritário" de forma persistente durante toda a sessão do chat.
11. WHEN o usuário aciona "Denunciar" no chat, THE Sistema SHALL exibir diálogo de confirmação; WHEN confirmado, THE Sistema SHALL registrar a denúncia no `localStorage` com timestamp e exibir feedback de sucesso ao usuário.
12. WHEN o usuário aciona "Bloquear" no chat, THE Sistema SHALL exibir diálogo de confirmação; WHEN confirmado, THE Sistema SHALL registrar o bloqueio no `localStorage` e ocultar novas mensagens da parte bloqueada sem remover o histórico existente.

---

### Requirement 10: Dashboard da Clínica

**User Story:** Como Clínica, quero acessar um painel de controle completo, para que eu possa gerenciar agendamentos, contatos, emergências, calendário e horários em um único lugar.

#### Acceptance Criteria

1. IF o usuário autenticado tiver `userType !== 'clinic'` e tentar acessar `/clinic-dashboard`, THEN THE Router SHALL redirecionar imediatamente para a página inicial sem exibir qualquer conteúdo do dashboard.
2. THE Dashboard SHALL exibir um menu de navegação com as seções: Aprovações Pendentes, Contatos, Emergências, Calendário, Pacientes Agendados e Horários; a seção ativa SHALL ser visualmente destacada.
3. WHEN a Clínica acessa a seção "Aprovações Pendentes", THE Sistema SHALL listar todos os tickets com `approvalStatus === 'pending'` cujo `clinicId` corresponda ao ID da clínica autenticada, lidos do `localStorage`.
4. WHEN a Clínica aprova um ticket, THE Sistema SHALL atualizar `approvalStatus` para `approved` e `status` para `confirmed` no `localStorage` e remover o ticket da lista de pendentes na interface em no máximo 100ms.
5. WHEN a Clínica tenta recusar um ticket, THE Sistema SHALL exibir campo de motivo de recusa obrigatório (1–500 caracteres) e bloquear a confirmação enquanto o campo estiver vazio; WHEN o motivo for informado e confirmado, THE Sistema SHALL atualizar `approvalStatus` para `rejected` no `localStorage`.
6. WHEN a Clínica confirma a recusa de um ticket, THE Sistema SHALL criar automaticamente uma mensagem do tipo `system` no chat do ticket contendo o motivo da recusa.
7. THE Sistema SHALL exibir no título da seção "Aprovações Pendentes" a contagem atual de tickets pendentes; WHEN um ticket for aprovado ou recusado, THE Sistema SHALL atualizar essa contagem imediatamente.
8. WHEN a Clínica acessa a seção "Contatos", THE Sistema SHALL listar os clientes que iniciaram contato via ticket ou chat, permitindo selecionar um para visualizar o histórico de mensagens correspondente.
9. WHEN a Clínica acessa a seção "Emergências", THE Sistema SHALL listar apenas os contatos com flag `isEmergency === true`, exibindo cada item com borda e fundo vermelhos e badge "EMERGÊNCIA".
10. WHEN a Clínica acessa a seção "Calendário", THE Sistema SHALL exibir um calendário do mês atual com marcadores nos dias que possuam agendamentos com `status === 'confirmed'`.
11. WHEN a Clínica submete o dialog de edição de perfil com nome (1–150 chars), telefone, endereço, descrição (máx. 1000 chars), flag `is24Hours` e especialidades válidas, THE Sistema SHALL persistir as alterações via `updateUserProfile` e exibir toast de sucesso; IF a persistência falhar, THE Sistema SHALL exibir toast de erro sem fechar o dialog.

---

### Requirement 11: Configuração do Perfil da Clínica (Onboarding)

**User Story:** Como Clínica recém-cadastrada, quero configurar meu perfil com informações detalhadas, para que clientes possam me encontrar e conhecer meus serviços.

#### Acceptance Criteria

1. WHEN a Clínica submete o formulário de setup, THE Validator SHALL rejeitar a submissão se qualquer um dos seguintes critérios não for atendido: nome da clínica (1–100 chars), telefone (10–11 dígitos numéricos), CNPJ válido com dígito verificador correto, logradouro, número, bairro, cidade e estado preenchidos, pelo menos uma especialidade selecionada, e pelo menos um tipo de animal selecionado.
2. IF algum campo obrigatório do formulário de setup estiver ausente ou inválido, THEN THE Sistema SHALL exibir mensagem de erro inline por campo e bloquear a progressão para a próxima etapa.
3. THE Validator SHALL aceitar apenas valores de especialidade pertencentes à lista `CLINIC_SPECIALTIES` do sistema, rejeitando qualquer valor fora dessa lista com erro de campo.
4. THE Validator SHALL aceitar apenas os valores `dog`, `cat`, `bird`, `rabbit`, `hamster`, `fish`, `reptile` ou `other` para o campo de tipo de animal, rejeitando qualquer outro valor; a presença de um valor válido não elimina erros de outros campos obrigatórios ausentes.
5. WHEN o formulário de setup é submetido com todos os campos válidos, THE Sistema SHALL persistir os dados via `updateUserProfile` e redirecionar para `/clinic-visual-setup`.
6. IF a persistência do setup falhar, THEN THE Sistema SHALL exibir mensagem de erro não-técnica, manter o formulário com os dados preenchidos e não redirecionar.
7. WHEN a Clínica acessa o formulário de setup e já existem dados salvos no `localStorage` para o usuário autenticado (telefone, CEP, estado, cidade, endereço), THE Sistema SHALL pré-preencher esses campos automaticamente; IF não existirem dados salvos, THE Sistema SHALL exibir o formulário em branco.
8. WHEN a Clínica marca "Atendimento 24 horas" e salva o perfil, THE Sistema SHALL persistir `is24Hours: true` e exibir o badge "24h" no perfil público; WHEN a Clínica desmarca e salva, THE Sistema SHALL persistir `is24Hours: false` e remover o badge do perfil público.

---

### Requirement 12: Planos para Clínicas

**User Story:** Como Clínica, quero escolher um plano de assinatura durante o cadastro, para que eu possa acessar os recursos correspondentes ao meu nível de plano.

#### Acceptance Criteria

1. THE Validator SHALL aceitar apenas os valores `free`, `basic`, `intermediary` ou `experience` para o campo `plan`, rejeitando qualquer outro valor com erro de campo.
2. WHEN uma Clínica conclui o cadastro, THE Sistema SHALL associar o plano selecionado ao campo `plan` do perfil e persistir no `localStorage`; IF nenhum plano for selecionado, THE Sistema SHALL bloquear a conclusão do cadastro com erro no campo de plano.
3. THE Sistema SHALL controlar o acesso a funcionalidades conforme o plano da clínica em toda renderização de componente ou rota protegida, aplicando a seguinte hierarquia: `free` ⊂ `basic` ⊂ `intermediary` ⊂ `experience`, onde cada nível inclui todas as funcionalidades dos níveis anteriores.
4. IF a Clínica tentar acessar uma funcionalidade não disponível no seu plano atual, THEN THE Sistema SHALL exibir indicação de upgrade necessário sem conceder acesso parcial ao recurso.

---

### Requirement 13: Segurança e Validação de Entradas

**User Story:** Como operador do sistema, quero garantir que todas as entradas de usuário sejam validadas e que dados sensíveis sejam protegidos, para que a plataforma seja resistente a ataques comuns e abusos.

#### Acceptance Criteria

1. THE Validator SHALL validar todos os schemas de formulário via Zod antes de processar ou persistir qualquer dado fornecido pelo usuário.
2. THE Validator SHALL utilizar listas de permissão (allowlist) para campos com valores conhecidos como `userType`, `plan`, `species`, `specialty` e `service`, rejeitando valores fora da lista.
3. THE Validator SHALL aplicar validação de tipo e comprimento a todos os campos de texto controlados pelo usuário, com limites mínimo de 1 e máximo de 255 caracteres para campos gerais, e mínimo de 8 e máximo de 128 caracteres para senhas.
4. THE Sistema SHALL garantir que caracteres HTML especiais (`<`, `>`, `"`, `'`, `&`) em qualquer conteúdo de entrada do usuário sejam encodados antes de serem inseridos no DOM, prevenindo XSS refletido, armazenado e baseado em DOM.
5. IF a validação de um campo falhar, THEN THE Sistema SHALL registrar a falha em log sem incluir o valor inválido completo, nem senhas, tokens ou identificadores de sessão.
6. THE Sistema SHALL retornar mensagens de erro genéricas ao usuário em todas as situações de falha de validação ou autenticação, sem expor stack traces, IDs internos ou detalhes de implementação.
7. THE Validator SHALL validar tipo MIME, extensão e tamanho (máximo 10 MB para encaminhamentos, 5 MB para imagens) de todos os arquivos enviados pelo usuário antes de processá-los; a validação SHALL incluir verificação de magic bytes além de extensão e MIME declarado.
8. WHEN um backend for implementado, THE Sistema SHALL utilizar prepared statements ou ORM parameter binding em toda interação com banco de dados, nunca concatenando entrada do usuário em queries SQL.
9. WHEN um backend for implementado, THE Sistema SHALL implementar rate limiting nas rotas de autenticação (login, registro) com limite de 5 tentativas em 5 minutos por IP antes de bloquear por 15 minutos, e nas demais rotas sensíveis com limites proporcionais ao risco.
10. THE Sistema SHALL nunca derivar identidade do usuário (userId, userType) a partir de campos fornecidos pelo cliente nos formulários, usando exclusivamente o estado autenticado do AuthContext.

---

### Requirement 14: Navegação e Roteamento

**User Story:** Como usuário, quero navegar entre as páginas da aplicação de forma intuitiva, para que eu possa acessar facilmente todas as funcionalidades disponíveis para o meu tipo de conta.

#### Acceptance Criteria

1. THE Router SHALL disponibilizar as seguintes rotas públicas acessíveis sem autenticação: `/` (página inicial), `/login`, `/register`, `/client-register`.
2. THE Router SHALL disponibilizar as seguintes rotas protegidas para Clientes autenticados (`userType === 'client'`): `/profile`, `/my-appointments`, `/clinic/:id`, `/clinic/:id/create-ticket`, `/chat/:ticketId`.
3. THE Router SHALL disponibilizar as seguintes rotas protegidas para Clínicas autenticadas (`userType === 'clinic'`): `/clinic-dashboard`, `/clinic-setup`, `/clinic-visual-setup`.
4. THE Router SHALL disponibilizar a rota `/clinic/:id/chat` para usuários autenticados (qualquer tipo) sem exigir ticket prévio, destinada ao contato emergencial.
5. IF o usuário acessar uma rota inexistente no sistema, THEN THE Router SHALL renderizar a página `NotFound` com link de retorno à página inicial; WHEN a rota existir, THE Router SHALL nunca renderizar `NotFound`.
6. THE Header SHALL exibir: para usuários não autenticados — links "Login" e "Cadastrar"; para Clientes autenticados — links "Início", "Meus Agendamentos" e "Perfil" mais opção de logout; para Clínicas autenticadas — link "Dashboard" e opção de logout.

---

### Requirement 15: Qualidade e Performance

**User Story:** Como usuário, quero que a aplicação responda rapidamente e funcione bem em diferentes dispositivos e tamanhos de tela, para que eu tenha uma experiência de uso fluida.

#### Acceptance Criteria

1. THE Sistema SHALL renderizar a página inicial, incluindo o formulário de busca e a lista de clínicas em destaque, em menos de 3 segundos em conexões de banda larga padrão (≥10 Mbps de download), sem aplicar esse limite a outros tipos de conexão.
2. THE Sistema SHALL ser responsivo e funcionar corretamente em dispositivos móveis com largura mínima de 320px e em desktops com largura mínima de 1280px, sem conteúdo cortado ou sobreposição de elementos.
3. THE Sistema SHALL utilizar o hook `use-mobile` para adaptar layouts, tamanhos de fonte e espaçamentos em viewports menores que 768px de largura.
4. THE Sistema SHALL utilizar TanStack Query para gerenciar cache de dados remotos e evitar requisições duplicadas quando os dados já estiverem disponíveis em cache válido.
5. WHEN operações assíncronas estiverem em andamento (login, registro, atualização de perfil, envio de ticket), THE Sistema SHALL exibir indicador visual de carregamento (spinner ou skeleton) que desapareça ao término da operação.
6. THE Sistema SHALL exibir notificações de sucesso e erro via componente `Toast`/`Sonner` de forma não-bloqueante, com auto-dismiss após exatamente 5 segundos para todas as notificações.

---

### Requirement 16: Acessibilidade

**User Story:** Como usuário com necessidades de acessibilidade, quero que a interface seja utilizável com tecnologias assistivas, para que eu possa usar a plataforma de forma independente.

#### Acceptance Criteria

1. THE Sistema SHALL utilizar elementos HTML semânticos (`<main>`, `<header>`, `<footer>`, `<nav>`, `<section>`) nas seguintes páginas: página inicial, login, cadastro, detalhes da clínica, criação de ticket, meus agendamentos, perfil e dashboard da clínica.
2. THE Sistema SHALL incluir atributo `aria-label` descritivo em todos os componentes interativos que não possuam texto visível, incluindo: botões de ícone (favorito, logout, envio de mensagem), avatars e elementos de navegação sem rótulo textual.
3. THE Sistema SHALL garantir contraste mínimo de 4,5:1 entre texto e fundo em todos os componentes de interface, conforme WCAG 2.1 nível AA.
4. THE Sistema SHALL permitir a navegação completa pelos formulários de cadastro, login e criação de ticket utilizando apenas o teclado (Tab para avançar, Shift+Tab para recuar, Enter para submeter, Space para marcar checkboxes), sem armadilhas de foco.
5. THE Sistema SHALL associar cada campo de formulário ao seu respectivo `<label>` via atributo `htmlFor` igual ao `id` do campo, em todos os formulários da aplicação.

---

### Requirement 17: Configuração Visual da Clínica

**User Story:** Como Clínica, quero personalizar a identidade visual do meu perfil (logotipo, foto de capa e cor principal), para que minha página pública tenha aparência profissional e reconhecível.

#### Acceptance Criteria

1. WHEN a Clínica acessa `/clinic-visual-setup`, THE Router SHALL permitir acesso apenas a usuários com `userType === 'clinic'` autenticados; usuários não autenticados SHALL ser redirecionados para `/login` e clientes autenticados SHALL ser redirecionados para `/`.
2. WHEN a Clínica tenta fazer upload de logotipo ou foto de capa, THE Sistema SHALL validar o tipo MIME (`image/jpeg`, `image/png`, `image/webp`), o tamanho máximo de 5 MB e os magic bytes antes de iniciar qualquer processamento; IF qualquer critério falhar, THE Sistema SHALL exibir mensagem de erro descritiva e descartar o arquivo.
3. WHEN o upload de imagem é válido, THE Sistema SHALL exibir uma pré-visualização da imagem antes de persistir, permitindo que a Clínica confirme ou cancele.
4. WHEN a Clínica seleciona uma cor principal, THE Sistema SHALL aceitar apenas valores de cor no formato hexadecimal de 6 dígitos (`#RRGGBB`), rejeitando formatos inválidos com erro de campo.
5. WHEN a Clínica submete o formulário de configuração visual com dados válidos, THE Sistema SHALL persistir `logoUrl`, `coverUrl` e `primaryColor` no perfil da clínica via `updateUserProfile` e redirecionar para `/clinic-dashboard`; IF a persistência falhar, THE Sistema SHALL exibir toast de erro sem redirecionar e preservar os campos preenchidos.
6. THE Sistema SHALL exibir os dados de configuração visual já salvos (logotipo, capa, cor) como estado inicial do formulário, para que a Clínica possa editar valores existentes.
7. WHEN a Clínica conclui a configuração visual após o onboarding inicial, THE Sistema SHALL marcar `isProfileComplete: true` no perfil do usuário autenticado no `localStorage`.
