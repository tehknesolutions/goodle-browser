import type { DefinicaoComponente } from "./RegistroComponentes";
import { RegistroComponentes } from "./RegistroComponentes";

export const registroComponentesBase = new RegistroComponentes();

const componentes: DefinicaoComponente[] = [
  {
    tipo: "aplicacao",
    nome: "Painel",
    versao: "0.1.0",
    descricao: "Área visual reutilizável para agrupar conteúdo.",
    criar: (id) => ({
      id,
      tipo: "aplicacao",
      nome: "Painel",
      versao: "0.1.0",
    }),
  },
  {
    tipo: "jogo",
    nome: "Personagem",
    versao: "0.1.0",
    descricao: "Entidade controlável de uma experiência de jogo.",
    criar: (id) => ({
      id,
      tipo: "jogo",
      nome: "Personagem",
      versao: "0.1.0",
    }),
  },
  {
    tipo: "jogo",
    nome: "Movimento",
    versao: "0.1.0",
    descricao: "Comportamento de movimentação de uma entidade.",
    criar: (id) => ({
      id,
      tipo: "jogo",
      nome: "Movimento",
      versao: "0.1.0",
    }),
  },
  {
    tipo: "sistema",
    nome: "Vida",
    versao: "0.1.0",
    descricao: "Sistema simples de pontos de vida.",
    criar: (id) => ({
      id,
      tipo: "sistema",
      nome: "Vida",
      versao: "0.1.0",
    }),
  },
  {
    tipo: "sistema",
    nome: "Inventário",
    versao: "0.1.0",
    descricao: "Sistema de itens e inventário.",
    criar: (id) => ({
      id,
      tipo: "sistema",
      nome: "Inventário",
      versao: "0.1.0",
    }),
  },
  {
    tipo: "sistema",
    nome: "Diálogo",
    versao: "0.1.0",
    descricao: "Sistema de diálogo entre entidades.",
    criar: (id) => ({
      id,
      tipo: "sistema",
      nome: "Diálogo",
      versao: "0.1.0",
    }),
  },
];

for (const componente of componentes) {
  registroComponentesBase.registrar(componente);
}
