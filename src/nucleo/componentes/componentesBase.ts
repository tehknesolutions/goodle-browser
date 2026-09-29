import type { DefinicaoComponente } from "./RegistroComponentes";
import { RegistroComponentes } from "./RegistroComponentes";

export const registroComponentesBase = new RegistroComponentes();

const componentes: DefinicaoComponente[] = [
  { tipo: "aplicacao", nome: "Painel", versao: "0.1.0", descricao: "Área visual reutilizável.", criar: (id) => ({ id, tipo: "aplicacao", nome: "Painel", versao: "0.1.0", manifestacao: "visual" }) },
  { tipo: "jogo", nome: "Personagem", versao: "0.1.0", descricao: "Entidade interativa.", criar: (id) => ({ id, tipo: "jogo", nome: "Personagem", versao: "0.1.0", manifestacao: "hibrida" }) },
  { tipo: "jogo", nome: "Movimento", versao: "0.1.0", descricao: "Movimentação de entidade.", criar: (id) => ({ id, tipo: "jogo", nome: "Movimento", versao: "0.1.0", manifestacao: "interativa" }) },
  { tipo: "sistema", nome: "Vida", versao: "0.1.0", descricao: "Pontos de vida.", criar: (id) => ({ id, tipo: "sistema", nome: "Vida", versao: "0.1.0", manifestacao: "sistema" }) },
  { tipo: "sistema", nome: "Inventário", versao: "0.1.0", descricao: "Itens e inventário.", criar: (id) => ({ id, tipo: "sistema", nome: "Inventário", versao: "0.1.0", manifestacao: "sistema" }) },
  { tipo: "sistema", nome: "Diálogo", versao: "0.1.0", descricao: "Diálogo entre entidades.", criar: (id) => ({ id, tipo: "sistema", nome: "Diálogo", versao: "0.1.0", manifestacao: "hibrida" }) },
];

for (const componente of componentes) registroComponentesBase.registrar(componente);
