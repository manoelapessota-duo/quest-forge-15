# PDI QUEST — plano de implementação do MVP jogável

## Visão de entrega

Construir um pequeno RPG de exploração completo, em português, no qual o mapa é a tela central e todo o desenvolvimento profissional acontece por meio de regiões, missões, NPCs, perguntas e recompensas.

O aplicativo será local-first e preparado para hospedagem na intranet da empresa, sem login e sem servidor no MVP. A planilha enviada será transformada em dados internos do jogo: ela já contém os 48 materiais e as 480 perguntas oficiais, com os três formatos, dificuldades, respostas, justificativas e XP.

## 1. Fundação visual e identidade

- Criar um sistema visual próprio do PDI QUEST com a paleta Eiaye aplicada à magia, HUD, portais, marcadores e estados ativos; natureza, pedra, madeira, água e vegetação formam o mundo.
- Usar tipografia display elegante nos momentos narrativos e sans-serif legível na interface, sem pixel art, neon excessivo, glassmorphism ou aparência de SaaS.
- Gerar ilustrações originais e coesas para os três arquétipos, tela inicial e Chefão Semanal, sem reproduzir personagens ou assets das referências.
- Definir tokens semânticos, estados de foco, contraste, movimento reduzido e animações ambientais discretas.

## 2. Estrutura do jogo e rotas

Criar rotas reais e conectadas para:

- `/` — tela de título e retomada de jogo salvo;
- `/character` — nome e escolha entre Arqueiro, Caçador e Mago;
- `/prologue` — sequência narrativa;
- `/diagnostic` e `/diagnostic-result` — missão inicial e status revelado;
- `/world` — mapa principal e âncora de navegação;
- `/quest/$questId` — missão, perguntas e feedback;
- `/profile`, `/competencies`, `/weekly-boss`, `/settings`;
- `/direction` — modo reservado de análise local, sem ranking individual.

Cada rota terá metadados próprios, estados vazios coerentes e proteção contra acesso em ordem inválida, redirecionando o jogador ao próximo passo válido.

## 3. Mundo explorável

- Construir um mapa contínuo em SVG multicamada, com composição isométrica/top-down, grande área navegável e coordenadas próprias.
- Distribuir organicamente Vila do Vale, campos, rios, pontes, biblioteca, oficinas, floresta, ruínas, mecanismos, fortalezas, templos, montanhas, neve/névoa e a torre final.
- Implementar pan por arraste, zoom por controles/roda/pinça, recentralização no personagem e navegação por teclado.
- Exibir personagem conforme classe, NPCs reutilizáveis, portais, baús, criaturas decorativas, landmarks e os 48 materiais como pontos reais no mundo.
- Representar regiões bloqueadas sem escondê-las, com barreiras, guardiões e mensagens acolhedoras; refletir estados bloqueado, disponível, em andamento e concluído.
- Adicionar água, vegetação, bandeiras, luzes e partículas com animações leves e desativáveis.
- Adaptar o mapa para tablet e mobile com câmera aproximada, HUD compacto e painéis inferiores, mantendo zoom e pan.

## 4. Dados oficiais e regras centralizadas

- Converter a planilha enviada para dados TypeScript/JSON versionados, sem dependência da planilha em tempo de execução.
- Modelar `Player`, `Question`, `Quest`, `Region`, `Material`, `Axis`, `AnswerRecord`, `WeeklyBossRun`, `Achievement` e `Settings`.
- Preservar as 480 perguntas oficiais: 288 múltipla escolha, 96 verdadeiro/falso e 96 associação; 48 materiais e 11.040 XP.
- Manter classes, regiões, níveis, materiais, eixos, conquistas, NPCs, mapa e Chefão Semanal em arquivos de configuração independentes da interface.
- Criar um mapeamento de material para os oito eixos oficiais, configurável e substituível sem alterar telas ou mecanismos.
- Validar os dados no carregamento para detectar IDs duplicados, gabaritos inválidos, XP incorreto e relações quebradas.

## 5. Estado, persistência e integridade

- Criar um provedor de jogo com ações tipadas e estado derivado, evitando regras duplicadas nas telas.
- Persistir e migrar as chaves `pdiQuest.player`, `pdiQuest.progress`, `pdiQuest.answers`, `pdiQuest.weeklyBoss` e `pdiQuest.settings`.
- Implementar criação, retomada e reset confirmado; normalizar nível sempre a partir do XP.
- Impedir XP negativo ou duplicado, conclusão dupla, resposta vazia, acesso prematuro, jogador sem classe e segunda tentativa semanal.
- Registrar tentativas, acertos, erros, data, eixo, região, material e dificuldade; acerto inicial retira a pergunta do baralho e erro volta após sete dias valendo metade do XP.
- Manter troca de classe limitada a uma vez a cada seis meses sem alterar progresso.

## 6. Mecanismos de progressão e missões

- Centralizar `calculateLevelFromXP`, `getXPForNextLevel`, `getLevelTitle` e `getUnlockedRegions` na tabela oficial de 20 níveis.
- Respeitar desbloqueios nos níveis 1, 6, 10 e 14; nível 20 em 12.000 XP, alcançável por Chefão Semanal.
- Implementar `getAvailableQuests`, `getQuestById`, `completeQuest`, `isQuestCompleted`, `getQuestProgress` e `getRegionProgress`.
- Implementar embaralhamento estável de perguntas e alternativas sem corromper o gabarito, seleção sem repetição inadequada, validação dos três formatos e concessão idempotente de XP.
- Mostrar feedback educativo imediato, explicação, resposta correta e XP; concluir material após suas dez perguntas e registrar selo de domínio para 8+ acertos na primeira tentativa.
- Criar cerimônia de subida de nível e abertura de portal com tratamento especial para novo território.

## 7. Diagnóstico e recomendações

- Apresentar o diagnóstico como missão de entrada, usando uma amostra balanceada por eixo, região, formato e dificuldade.
- Calcular precisão, cobertura, força e oportunidade por eixo, sem transformar apenas o total de acertos em nível.
- Renderizar o resultado como status de personagem, com barras/radar temáticos, pontos fortes, lacunas e “Seu próximo caminho”.
- Recomendar missões ligadas aos eixos de oportunidade, sem bloquear escolhas já permitidas.
- Registrar o diagnóstico como respostas reais sem duplicar XP em futuras revisitas.

## 8. Telas complementares

- **Perfil:** ficha de personagem com avatar, classe, título, nível, XP, missões, respostas, acurácia, regiões, troféus e competências.
- **Competências:** constelação/radar de oito eixos com cobertura, precisão, evolução e oportunidades.
- **Weekly Boss:** arena própria, uma tentativa por semana, composição oficial 2/3/3/2, XP dobrado, bônus de 200 XP com 8+ e troféu semanal.
- **Conquistas:** conjunto enxuto solicitado, com desbloqueio automático e inventário visual.
- **Direção:** métricas agregadas deste armazenamento local — acurácia, nível, regiões, eixos, cobertura das 480 perguntas, top 10 erros e recorrência — sem leaderboard.
- **Configurações:** som sintético opcional inicialmente desligado, animações e reset de progresso.

## 9. Componentização

Separar em módulos reutilizáveis de mapa, HUD, personagem, NPC, marcador, portal, diálogo, missão, pergunta por formato, feedback, XP, level-up, ficha, competências, chefão e conquistas. Separar também os mecanismos puros de progressão, diagnóstico, perguntas, analytics, persistência e calendário semanal.

## 10. Verificação obrigatória

- Testar as funções puras de XP, níveis, desbloqueios, respostas, repetição, cobertura, conquistas, reset e idempotência.
- Percorrer o fluxo completo no navegador: título → personagem → prólogo → diagnóstico → resultado → mapa → missão → feedback → XP → perfil.
- Testar conclusão/reabertura de missão, bloqueios, Chefão Semanal, troca de classe, configurações e Modo Direção.
- Recarregar em etapas críticas para confirmar persistência e migração.
- Verificar desktop e mobile com interação real de mapa, textos sem sobreposição, foco por teclado e movimento reduzido.
- Conferir build, tipos, rotas, console e rede; remover imports e código mortos.

## Decisões técnicas

- Manter TanStack Start/Vite já existente e React 19; não adicionar backend, autenticação ou APIs externas.
- Empacotar dados, fontes, ilustrações e demais recursos junto do aplicativo, sem exigir acesso à internet durante o uso na intranet.
- Manter caminhos e navegação compatíveis com hospedagem interna e recarregamento de páginas; documentar a configuração mínima do servidor da intranet para servir as rotas do aplicativo.
- Tratar o progresso como local ao navegador e ao dispositivo neste MVP; sem backend, ele não será compartilhado entre computadores nem ficará disponível para consolidação real entre colaboradores.
- Usar SVG/HTML/CSS para o mundo e interações, evitando uma biblioteca pesada de jogo ou 3D.
- Usar contexto + reducer e funções puras para o estado, com persistência versionada em `localStorage`.
- Usar os componentes e dependências já instalados quando forem adequados; adicionar somente o mínimo necessário para testes.
