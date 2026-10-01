export type NivelEquivalencia = "direta" | "aproximada" | "contextual" | "com_perda";
export type FamiliaOrigem = "goodle" | "phaser" | "godot" | "byond" | "rpg-maker" | "typescript" | "react" | "backend";
export type ResolucaoSemantica = { idCanonico: string; termoPtBr: string; origem: FamiliaOrigem; equivalencia: NivelEquivalencia; termoOriginal: string };
type AliasSemantico = Omit<ResolucaoSemantica, "termoOriginal"> & { aliases: string[]; exigeOrigem?: boolean };
const removerAcentos = (v: string) => v.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
const normalizar = (v: string) => removerAcentos(v.trim().toLocaleLowerCase("pt-BR"));
const entrada = (idCanonico: string, termoPtBr: string, aliases: string[], origem: FamiliaOrigem = "goodle", equivalencia: NivelEquivalencia = "direta", exigeOrigem = false): AliasSemantico => ({ idCanonico, termoPtBr, aliases, origem, equivalencia, exigeOrigem });

const aliases: AliasSemantico[] = [
  entrada("logica.condicao.se", "se", ["se", "if"]), entrada("logica.condicao.senao", "senão", ["senão", "senao", "else"]),
  entrada("logica.comparacao.maior_que", "maior que", ["maior que", "greater than"]), entrada("logica.comparacao.menor_que", "menor que", ["menor que", "less than"]), entrada("logica.comparacao.igual", "igual", ["igual", "equals", "equal to"]),
  entrada("logica.repeticao", "repetir", ["repetir", "loop"]), entrada("logica.repeticao.parar", "parar repetição", ["parar repetição", "parar repeticao", "break loop"]),
  entrada("comportamento.reacao.quando", "quando", ["quando", "when"]), entrada("comportamento.evento", "evento", ["evento"]),
  entrada("comportamento.acao", "ação", ["ação", "acao"]), entrada("comportamento.emissao", "emitir", ["emitir", "emit"]),
  entrada("evento.toque", "tocar", ["tocar", "toque", "touch", "touches"]),
  entrada("evento.iniciar", "iniciar", ["iniciar", "start"]), entrada("evento.atualizar", "atualizar", ["atualizar", "update"]),\n  entrada("evento.tecla.pressionar", "pressionar tecla", ["pressionar tecla", "press key"]), entrada("evento.tecla.soltar", "soltar tecla", ["soltar tecla", "release key"]), entrada("evento.clique", "clicar", ["clicar", "click"]),
  entrada("evento.temporizador.disparar", "temporizador", ["temporizador", "timer", "timeout"]), entrada("evento.tempo.esperar", "esperar", ["esperar", "wait"]), entrada("evento.tempo.intervalo", "intervalo", ["intervalo", "interval", "a_cada"]),
  entrada("dados.valor.definir", "definir", ["definir", "set"]), entrada("dados.valor.diminuir", "diminuir", ["diminuir", "decrease"]),
  entrada("comportamento.funcao", "função", ["função", "funcao"]), entrada("estrutura.entidade", "entidade", ["entidade", "entity"]),
  entrada("estrutura.componente", "componente", ["componente"]), entrada("estrutura.cena", "cena", ["cena"]), entrada("estrutura.mundo", "mundo", ["mundo"]),
  entrada("estrutura.mapa", "mapa", ["mapa"]), entrada("estrutura.area", "área", ["área", "area"]), entrada("estrutura.recurso", "recurso", ["recurso"]),
  entrada("estrutura.recurso.precarregar", "pré-carregar", ["pré-carregar", "pre-carregar", "precarregar"]), entrada("dados.dado", "dado", ["dado"]),
  entrada("dados.estado", "estado", ["estado"]), entrada("dados.lista", "lista", ["lista"]), entrada("dados.base", "banco", ["banco", "base de dados"]),
  entrada("mundo.personagem", "personagem", ["personagem"]), entrada("mundo.objeto", "objeto", ["objeto"]), entrada("mundo.terreno", "terreno", ["terreno"]),
  entrada("mundo.camera", "câmera", ["câmera", "camera"]), entrada("sistema.entrada", "entrada", ["entrada"]), entrada("sistema.fisica", "física", ["física", "fisica"]),
  entrada("sistema.animacao", "animação", ["animação", "animacao"]), entrada("sistema.cliente", "cliente", ["cliente"]),
  entrada("persistencia.arquivo", "arquivo persistente", ["arquivo persistente"]), entrada("ciclo.pronto", "pronto", ["pronto"]),
  entrada("ciclo.atualizar", "atualizar", ["atualizar"]), entrada("fisica.colisao", "colisão", ["colisão", "colisao"]),
  entrada("tempo.temporizador", "temporizador", ["temporizador"]), entrada("midia.audio", "áudio", ["áudio", "audio"]),
  entrada("interface.elemento", "interface", ["interface"]), entrada("narrativa.dialogo", "diálogo", ["diálogo", "dialogo"]),
  entrada("jogo.inventario", "inventário", ["inventário", "inventario"]), entrada("backend.rota", "rota", ["rota"]),
  entrada("backend.persistencia", "persistência", ["persistência", "persistencia"]), entrada("rede.tempo_real", "tempo real", ["tempo real"]), entrada("rede.servidor", "servidor", ["servidor"]),
  entrada("dados.propriedade", "propriedade", ["propriedade"]), entrada("dados.dicionario", "dicionário", ["dicionário", "dicionario"]),
  entrada("modelo.heranca", "herança", ["herança", "heranca"]), entrada("modelo.composicao", "composição", ["composição", "composicao"]),
  entrada("entidade.criar", "criar entidade", ["criar entidade"]), entrada("entidade.destruir", "destruir entidade", ["destruir entidade"]),
  entrada("hierarquia.adicionar_filho", "adicionar filho", ["adicionar filho"]), entrada("hierarquia.pai", "pai", ["pai"]),
  entrada("espaco.transformacao", "transformação", ["transformação", "transformacao"]), entrada("espaco.posicao", "posição", ["posição", "posicao", "position"]),
  entrada("espaco.movimento", "movimento", ["movimento", "mover", "move"]), entrada("visual.sprite", "sprite", ["sprite"]), entrada("visual.tilemap", "mapa de tiles", ["mapa de tiles"]),
  entrada("camera.seguir", "seguir câmera", ["seguir câmera", "seguir camera"]), entrada("navegacao.caminho", "encontrar caminho", ["encontrar caminho"]),
  entrada("jogo.estado", "estado de jogo", ["estado de jogo", "state"]), entrada("cena.transicao", "transição de cena", ["transição de cena", "transicao de cena"]),
  entrada("comportamento.funcao", "função", ["function"], "typescript", "direta", true), entrada("estrutura.componente", "componente", ["component"], "react", "contextual", true),
  entrada("dados.propriedade", "propriedade", ["property"], "typescript", "direta", true), entrada("dados.lista", "lista", ["array"], "typescript", "direta", true),
  entrada("dados.dicionario", "dicionário", ["record"], "typescript", "aproximada", true), entrada("modelo.heranca", "herança", ["extends"], "typescript", "contextual", true), entrada("modelo.composicao", "composição", ["children"], "react", "contextual", true),
  entrada("estrutura.entidade", "entidade", ["node"], "godot", "contextual", true), entrada("estrutura.cena", "cena", ["scene"], "godot", "aproximada", true),
  entrada("estrutura.recurso", "recurso", ["resource"], "godot", "direta", true), entrada("estrutura.recurso.precarregar", "pré-carregar", ["preload"], "godot", "contextual", true),
  entrada("comportamento.emissao", "emitir", ["signal"], "godot", "contextual", true), entrada("sistema.entrada", "entrada", ["input"], "godot", "aproximada", true),
  entrada("sistema.animacao", "animação", ["animationplayer"], "godot", "contextual", true), entrada("ciclo.pronto", "pronto", ["ready"], "godot", "contextual", true),
  entrada("tempo.temporizador", "temporizador", ["timer"], "godot", "contextual", true), entrada("interface.elemento", "interface", ["control"], "godot", "contextual", true),
  entrada("entidade.criar", "criar entidade", ["instantiate"], "godot", "contextual", true), entrada("entidade.destruir", "destruir entidade", ["queue_free"], "godot", "contextual", true),
  entrada("hierarquia.adicionar_filho", "adicionar filho", ["add_child"], "godot", "contextual", true), entrada("hierarquia.pai", "pai", ["parent"], "godot", "contextual", true),
  entrada("espaco.transformacao", "transformação", ["transform"], "godot", "contextual", true), entrada("navegacao.caminho", "encontrar caminho", ["pathfinding"], "godot", "aproximada", true),
  entrada("estrutura.entidade", "entidade", ["game object", "gameobject"], "phaser", "aproximada", true), entrada("estrutura.cena", "cena", ["scene"], "phaser", "aproximada", true),
  entrada("mundo.camera", "câmera", ["camera"], "phaser", "direta", true), entrada("sistema.entrada", "entrada", ["input"], "phaser", "aproximada", true), entrada("sistema.fisica", "física", ["physics"], "phaser", "aproximada", true),
  entrada("sistema.animacao", "animação", ["animation"], "phaser", "aproximada", true), entrada("ciclo.atualizar", "atualizar", ["update"], "phaser", "contextual", true), entrada("fisica.colisao", "colisão", ["collider"], "phaser", "contextual", true),
  entrada("midia.audio", "áudio", ["sound"], "phaser", "aproximada", true), entrada("espaco.posicao", "posição", ["position"], "phaser", "direta", true), entrada("visual.sprite", "sprite", ["sprite"], "phaser", "direta", true),
  entrada("visual.tilemap", "mapa de tiles", ["tilemap"], "phaser", "contextual", true), entrada("camera.seguir", "seguir câmera", ["follow"], "phaser", "contextual", true),
  entrada("estrutura.entidade", "entidade", ["atom"], "byond", "aproximada", true), entrada("mundo.personagem", "personagem", ["mob"], "byond", "contextual", true), entrada("mundo.objeto", "objeto", ["obj"], "byond", "aproximada", true),
  entrada("mundo.terreno", "terreno", ["turf"], "byond", "contextual", true), entrada("estrutura.area", "área", ["area"], "byond", "aproximada", true), entrada("estrutura.mundo", "mundo", ["world"], "byond", "aproximada", true),
  entrada("comportamento.acao", "ação", ["proc"], "byond", "contextual", true), entrada("comportamento.acao.usuario", "ação do usuário", ["verb"], "byond", "contextual", true), entrada("sistema.cliente", "cliente", ["client"], "byond", "contextual", true),
  entrada("persistencia.arquivo", "arquivo persistente", ["savefile"], "byond", "contextual", true), entrada("dados.lista", "lista", ["list"], "byond", "aproximada", true), entrada("rede.servidor", "servidor", ["server"], "byond", "contextual", true),
  entrada("estrutura.mapa", "mapa", ["map"], "rpg-maker", "aproximada", true), entrada("comportamento.evento", "evento", ["event"], "rpg-maker", "contextual", true), entrada("comportamento.evento.pagina", "página de evento", ["event page"], "rpg-maker", "contextual", true),
  entrada("comportamento.acao.compartilhada", "ação compartilhada", ["common event"], "rpg-maker", "contextual", true), entrada("dados.estado", "estado", ["switch"], "rpg-maker", "contextual", true), entrada("dados.dado", "dado", ["variable"], "rpg-maker", "aproximada", true),
  entrada("dados.base", "banco", ["database"], "rpg-maker", "aproximada", true), entrada("logica.repeticao", "repetir", ["loop"], "rpg-maker", "direta", true), entrada("logica.repeticao.parar", "parar repetição", ["break loop"], "rpg-maker", "direta", true),
  entrada("narrativa.dialogo", "diálogo", ["show text"], "rpg-maker", "contextual", true), entrada("jogo.inventario", "inventário", ["change items"], "rpg-maker", "contextual", true), entrada("cena.transicao", "transição de cena", ["change map"], "rpg-maker", "contextual", true),
  entrada("backend.rota", "rota", ["route"], "backend", "contextual", true), entrada("backend.persistencia", "persistência", ["database"], "backend", "contextual", true), entrada("rede.tempo_real", "tempo real", ["websocket"], "backend", "contextual", true),
];

export function resolverTermoSemantico(termo: string, origem?: FamiliaOrigem): ResolucaoSemantica | undefined {
  const chave = normalizar(termo);
  const candidatas = aliases.filter((item) => item.aliases.some((alias) => normalizar(alias) === chave));
  const encontrada = origem ? candidatas.find((item) => item.origem === origem) ?? candidatas.find((item) => item.origem === "goodle" && !item.exigeOrigem) : candidatas.find((item) => item.origem === "goodle" && !item.exigeOrigem);
  if (!encontrada) return undefined;
  return { idCanonico: encontrada.idCanonico, termoPtBr: encontrada.termoPtBr, origem: encontrada.origem, equivalencia: encontrada.equivalencia, termoOriginal: termo };
}
export const DICIONARIO_SEMANTICO_V1 = aliases;
