import type {
  CategorySlug,
  Comment,
  CommunityData,
  CoverKey,
  Notification,
  Post,
  PostType,
  User,
  UserRole,
} from "@/lib/types";

/**
 * Datos de ejemplo para que la comunidad no arranque vacía.
 * Las horas (`h`) son "hace X horas" respecto a la primera carga, para que el
 * feed se vea siempre vivo. Contenido de fans: especulativo, no oficial.
 */

/** Contraseña de todas las cuentas de ejemplo (se muestra en el login). */
export const DEMO_PASSWORD = "vicecity";
export const DEMO_USERNAME = "ViceQueen";

export const userIdFor = (username: string) => `u_${username.toLowerCase()}`;

type SeedUser = [username: string, displayName: string, bio: string, hue: number, role: UserRole, daysAgo: number, bonus: number, location?: string];

const USERS: SeedUser[] = [
  ["ViceQueen", "Vice Queen", "Fan de la saga desde Vice City (2002). Cazadora de detalles en tráilers y fotógrafa virtual.", 0, "moderador", 900, 420, "Valencia"],
  ["LeonidaLocal", "Leonida Local", "Recorro el mapa con lupa. Si hay un caimán escondido, lo encuentro.", 3, "miembro", 640, 610, "Sevilla"],
  ["TommyV", "Tommy V.", "Nostálgico de los 80. Opino de todo, sobre todo de coches.", 1, "miembro", 400, 120, "Madrid"],
  ["NeonRider", "Neon Rider", "Motos, velocidad y atardeceres. Grabo clips cuando puedo.", 4, "miembro", 210, 40],
  ["Ocean_Drive", "Ocean Drive", "Teórico profesional. Mis teorías aciertan el 12 % de las veces (récord personal).", 5, "miembro", 520, 900, "Barcelona"],
  ["StoryHunter", "Story Hunter", "Me interesa la narrativa por encima de todo.", 2, "miembro", 330, 260],
  ["PCMasterVice", "PC Master Vice", "Esperando la versión de PC con paciencia infinita (y un SSD nuevo).", 6, "miembro", 150, 30, "Bilbao"],
  ["GamerLeo", "Gamer Leo", "Online grinder. Si hay atraco en grupo, cuenta conmigo.", 7, "miembro", 95, 15],
  ["Rockstarlover", "Rockstar Lover", "Coleccionista de ediciones especiales y mapas en papel.", 0, "miembro", 1100, 1500, "Málaga"],
  ["GlitchHunter", "Glitch Hunter", "Speedrunner retirado. Reporto bugs por deporte.", 3, "miembro", 60, 0],
  ["VIComunidad", "Equipo GTA VI Community", "Cuenta del equipo de la comunidad. Normas, eventos y anuncios.", 5, "admin", 1200, 3000],
  ["GatorKing", "Gator King", "Pantanos, hidrodeslizadores y caimanes. Ese es mi Leonida.", 4, "miembro", 20, 0],
  ["JasonFan99", "Jason Fan", "Team Jason, pero respeto a Lucia.", 2, "miembro", 300, 80],
  ["Cartografo", "Cartógrafo", "Comparo mapas píxel a píxel.", 6, "miembro", 180, 50],
  ["MapLeaks", "Map Leaks", "Recopilo todo lo que se sabe del mapa.", 3, "miembro", 260, 140],
  ["OnlineGrinder", "Online Grinder", "Miles de horas en GTA Online.", 7, "miembro", 140, 20],
  ["Turbo305", "Turbo 305", "Coches, tuning y carreras callejeras.", 1, "miembro", 75, 10],
  ["Krakatoa", "Krakatoa", "", 5, "miembro", 45, 0],
  ["SpeedrunnerX", "Speedrunner X", "Si se puede pasar en menos tiempo, lo intentaré.", 4, "miembro", 220, 30],
  ["FPSVice", "FPS Vice", "Primera persona o nada.", 2, "miembro", 30, 0],
  ["LateGamer", "Late Gamer", "Siempre llego tarde a todo, menos a GTA VI.", 6, "miembro", 12, 0],
  ["OldGenPlayer", "Old Gen Player", "Todavía con mi PS4, ahorrando para la nueva.", 0, "miembro", 8, 0],
  ["GatorBait", "Gator Bait", "", 3, "miembro", 5, 0],
];

type SeedComment = { a: string; b: string; h: number; s?: number; solution?: boolean; r?: SeedComment[] };

type SeedPost = {
  id: string;
  type: PostType;
  cat: CategorySlug;
  title: string;
  body: string;
  a: string;
  h: number;
  likes: number;
  views?: number;
  tags: string[];
  cover?: CoverKey;
  pinned?: boolean;
  c?: SeedComment[];
};

const POSTS: SeedPost[] = [
  {
    id: "bienvenida",
    type: "noticia",
    cat: "noticias",
    title: "Bienvenidos a GTA VI Community: normas y cómo ganar puntos",
    body: "¡Hola, Leonida! Este es el punto de encuentro para todo lo relacionado con GTA VI.\n\n**Cómo funciona:**\n- Publica noticias, preguntas, teorías, guías o capturas.\n- Ganas puntos al publicar (+10), responder preguntas (+5), comentar (+3), recibir likes (+2) y cuando tu respuesta es elegida como solución (+25).\n- Con los puntos subes de rango: de *Nuevo en Vice City* a *Leyenda de Vice City*.\n\n**Normas básicas:** respeto, nada de spoilers sin avisar en el título y cita la fuente cuando publiques noticias o filtraciones.\n\n¡Nos vemos en el feed!",
    a: "VIComunidad",
    h: 300,
    likes: 412,
    views: 9800,
    tags: ["normas", "comunidad"],
    cover: "sunset",
    pinned: true,
    c: [
      { a: "ViceQueen", b: "¡Por fin un sitio así en español! Me encanta el sistema de rangos.", h: 290, s: 34 },
      { a: "Ocean_Drive", b: "¿Las teorías sin pruebas cuentan como spoiler? Lo digo por si acaso 😅", h: 280, s: 12, r: [{ a: "VIComunidad", b: "Las teorías no son spoilers, pero si mencionas contenido filtrado márcalo en el título.", h: 270, s: 20 }] },
    ],
  },
  {
    id: "tamano-mapa",
    type: "pregunta",
    cat: "mapa",
    title: "¿Cuánto creéis que medirá el mapa de GTA 6?",
    body: "Viendo los tráilers parece enorme: Vice City, los cayos, los pantanos, zonas rurales... ¿Será más grande que el de GTA V? ¿Se sabe cuántas zonas tendrá el estado de Leonida?",
    a: "TommyV",
    h: 5,
    likes: 238,
    views: 4120,
    tags: ["mapa", "leonida", "vice-city"],
    cover: "keys",
    c: [
      {
        a: "MapLeaks",
        b: "No hay cifras oficiales. En los tráilers se ven Vice City, los cayos, zonas pantanosas tipo Everglades y áreas rurales, así que todo apunta a que será más grande y variado que Los Santos.",
        h: 4.6,
        s: 87,
        solution: true,
        r: [
          { a: "TommyV", b: "Gracias, muy buena explicación. Lo de la variedad es lo que más me ilusiona.", h: 3, s: 6 },
          { a: "GamerLeo", b: "Ojalá con transporte público usable, que con un mapa así hace falta.", h: 2, s: 9 },
        ],
      },
      { a: "Ocean_Drive", b: "Mi apuesta: el doble que GTA V contando el agua. Sin el agua, un 50 % más.", h: 4, s: 21 },
      { a: "GatorKing", b: "Mientras los pantanos sean grandes y haya hidrodeslizadores, yo feliz 🐊", h: 1, s: 14 },
    ],
  },
  {
    id: "personajes-clasicos",
    type: "teoria",
    cat: "teorias",
    title: "Teoría sobre el regreso de personajes clásicos",
    body: "Vice City ya apareció en la saga en 2002 y en Vice City Stories. Mi teoría: veremos cameos (no protagonismo) de personajes de esa época, probablemente en forma de referencias: un cartel, una mansión abandonada, una emisora de radio que menciona nombres conocidos...\n\nRockstar suele separar los universos 3D y HD, así que dudo que vuelvan personajes tal cual, pero las referencias son casi seguras. ¿Qué personaje os gustaría ver referenciado?",
    a: "Ocean_Drive",
    h: 9,
    likes: 176,
    views: 3010,
    tags: ["teoria", "cameos", "vice-city"],
    cover: "neon",
    c: [
      { a: "StoryHunter", b: "Totalmente de acuerdo con lo del universo HD. Las referencias en la radio son la vía más probable.", h: 8, s: 40 },
      { a: "Rockstarlover", b: "Si aparece algo relacionado con la mansión de Vice City, lloro.", h: 7, s: 33, r: [{ a: "ViceQueen", b: "Esa mansión es icónica, sería el easter egg perfecto.", h: 6, s: 11 }] },
      { a: "TommyV", b: "Con mi nombre de usuario no puedo ser objetivo 😎", h: 2, s: 18 },
    ],
  },
  {
    id: "vehiculos-confirmados",
    type: "guia",
    cat: "vehiculos",
    title: "Todos los vehículos confirmados hasta ahora (lista que iremos actualizando)",
    body: "Recopilación de vehículos vistos en material oficial. Solo cuenta lo que se ve claramente; lo dudoso va al final.\n\n**Coches:** deportivos de estilo clásico, muscle cars, SUVs, pick-ups y coches de policía de Leonida.\n**Agua:** lanchas, motos de agua, barcos de pesca y hidrodeslizadores en los pantanos.\n**Aire:** avionetas y helicópteros.\n**Dos ruedas:** motos deportivas y de estilo chopper.\n\n¿Me he dejado algo? Comentad con la marca de tiempo del tráiler y lo añado.",
    a: "NeonRider",
    h: 20,
    likes: 302,
    views: 6230,
    tags: ["vehiculos", "lista", "trailer"],
    cover: "highway",
    c: [
      { a: "GatorKing", b: "Te faltan los quads del campo, se ven en una toma muy rápida.", h: 18, s: 15, r: [{ a: "NeonRider", b: "¡Añadido! Gracias 🙌", h: 17, s: 4 }] },
      { a: "PCMasterVice", b: "Gran trabajo. ¿Podrías separar por zonas del mapa donde aparecen?", h: 12, s: 8 },
    ],
  },
  {
    id: "gta-online-lanzamiento",
    type: "pregunta",
    cat: "online",
    title: "¿Creéis que GTA 6 Online estará disponible desde el lanzamiento?",
    body: "Me interesa sobre todo el multijugador. Con GTA V el Online llegó unas semanas después del juego. ¿Pensáis que esta vez saldrá a la vez o que Rockstar repetirá la estrategia?",
    a: "OnlineGrinder",
    h: 14,
    likes: 154,
    views: 2890,
    tags: ["online", "lanzamiento"],
    cover: "marina",
    c: [
      { a: "Ocean_Drive", b: "No está confirmado. Con GTA V el modo online llegó unas dos semanas después del lanzamiento, así que podría pasar algo parecido.", h: 13, s: 45 },
      { a: "PCMasterVice", b: "Dar unas semanas para que la gente juegue la historia tiene sentido, además de estabilizar servidores.", h: 11, s: 22 },
    ],
  },
  {
    id: "secretos-vice-city",
    type: "descubrimiento",
    cat: "secretos",
    title: "Posibles secretos escondidos en Vice City",
    body: "Hilo para recopilar posibles secretos y easter eggs. Mis sospechas:\n\n1. Referencias a OVNIs o criaturas en los pantanos (clásico de la saga).\n2. Un faro o zona aislada en los cayos con una historia rara.\n3. Guiños a juegos anteriores en carteles y radios.\n\nAñadid las vuestras 👇",
    a: "ViceQueen",
    h: 30,
    likes: 211,
    views: 3900,
    tags: ["easter-eggs", "secretos", "misterios"],
    cover: "swamp",
    c: [
      { a: "GatorKing", b: "El monstruo del pantano tiene que existir. Lo exijo.", h: 28, s: 31 },
      { a: "Ocean_Drive", b: "Apunto: el gran misterio de este juego estará bajo el agua. Atentos a los arrecifes.", h: 25, s: 19 },
    ],
  },
  {
    id: "propiedades-jason-lucia",
    type: "debate",
    cat: "jason-y-lucia",
    title: "¿Jason y Lucia podrán tener propiedades diferentes?",
    body: "En GTA V cada protagonista tenía sus propiedades y su casa. ¿Os gustaría que Jason y Lucia compartieran base o que cada uno tuviera la suya? Siendo pareja, una base compartida tendría sentido narrativo, pero también molaría personalizar cada personaje por separado.",
    a: "StoryHunter",
    h: 26,
    likes: 133,
    views: 2140,
    tags: ["jason", "lucia", "propiedades"],
    cover: "beach",
    c: [
      { a: "ViceQueen", b: "Base compartida + cada uno con su escondite. Lo mejor de los dos mundos.", h: 25, s: 27 },
      { a: "TommyV", b: "Yo quiero comprar un club nocturno en Vice City, como en los viejos tiempos.", h: 22, s: 24, r: [{ a: "Rockstarlover", b: "Sería un homenaje precioso.", h: 21, s: 10 }] },
    ],
  },
  {
    id: "precio-gta6",
    type: "pregunta",
    cat: "preguntas",
    title: "¿Cuánto costará GTA 6?",
    body: "He visto rumores de todo tipo, desde 70 hasta 100 €. ¿Hay algún precio oficial para la edición estándar?",
    a: "TommyV",
    h: 16.7,
    likes: 42,
    tags: ["precio", "ediciones"],
    c: [
      { a: "LeonidaLocal", b: "Rockstar no ha confirmado un precio oficial en sus comunicados. Lo más prudente es mirar las tiendas oficiales de PlayStation y Xbox cuando abran la reserva.", h: 15.7, s: 31 },
      { a: "NeonRider", b: "Yo apostaría por el precio estándar de la generación (unos 80 €), pero es pura especulación.", h: 13.7, s: 9 },
    ],
  },
  {
    id: "gta6-pc",
    type: "pregunta",
    cat: "noticias",
    title: "¿Cuándo sale GTA 6 para PC?",
    body: "La fecha anunciada es solo para PS5 y Xbox Series X|S. ¿Se sabe algo de la versión de PC?",
    a: "PCMasterVice",
    h: 49.9,
    likes: 57,
    tags: ["pc", "plataformas"],
    c: [
      { a: "Ocean_Drive", b: "De momento no hay fecha para PC. Con GTA V y Red Dead Redemption 2 la versión de PC llegó bastante después que la de consola, así que lo normal es esperar un retraso similar.", h: 47.9, s: 48, solution: true },
      { a: "GamerLeo", b: "Atentos a la web de Rockstar Newswire, ahí es donde suelen anunciarlo primero.", h: 43.9, s: 12 },
    ],
  },
  {
    id: "jugar-lucia",
    type: "pregunta",
    cat: "jason-y-lucia",
    title: "¿Se podrá jugar con Lucia?",
    body: "En los tráilers aparece mucho. ¿Será protagonista jugable o solo un personaje de la historia?",
    a: "ViceQueen",
    h: 62.3,
    likes: 63,
    tags: ["lucia", "protagonistas"],
    c: [
      { a: "JasonFan99", b: "Sí. Rockstar presentó a Lucia y Jason como los dos protagonistas del juego, así que podrás jugar con ella.", h: 61.3, s: 55, solution: true },
      { a: "StoryHunter", b: "Por lo que se ve en el segundo tráiler parece que la historia gira en torno a los dos, al estilo de una pareja tipo Bonnie y Clyde.", h: 58.3, s: 20 },
    ],
  },
  {
    id: "lucia-historia",
    type: "teoria",
    cat: "jason-y-lucia",
    title: "Lucia es el verdadero centro de la historia (y Jason lo sabe)",
    body: "Repasando los tráilers, muchas escenas clave se construyen desde el punto de vista de Lucia. Mi teoría es que la trama arranca con ella y Jason entra como su apoyo, no al revés.\n\nEsto encajaría con una historia de pareja donde la confianza entre ambos es el eje dramático.",
    a: "StoryHunter",
    h: 48,
    likes: 265,
    views: 5100,
    tags: ["lucia", "historia", "teoria"],
    cover: "sunset",
    c: [
      { a: "Ocean_Drive", b: "Comprado. Y apuesto a que hay una traición en el tercer acto.", h: 46, s: 38, r: [{ a: "StoryHunter", b: "Rockstar y las traiciones, una historia de amor 😂", h: 45, s: 21 }] },
      { a: "ViceQueen", b: "Me encanta este enfoque. Ojalá podamos cambiar entre ambos libremente como en GTA V.", h: 40, s: 15 },
    ],
  },
  {
    id: "atardecer-fanart",
    type: "imagen",
    cat: "mapa",
    title: "Recreé el atardecer de Vice City en mi fondo de pantalla",
    body: "Fan art inspirado en los atardeceres de los tráilers. Paleta: rosa, naranja y morado. ¿Os gusta? Si queréis la versión 4K la subo.",
    a: "NeonRider",
    h: 7,
    likes: 189,
    views: 2300,
    tags: ["fanart", "wallpaper", "atardecer"],
    cover: "skyline",
    c: [
      { a: "ViceQueen", b: "¡Precioso! Súbela en 4K por favor 🙏", h: 6, s: 16 },
      { a: "GamerLeo", b: "Ya es mi fondo de pantalla.", h: 3, s: 5 },
    ],
  },
  {
    id: "fisicas-conduccion",
    type: "gameplay",
    cat: "gameplay",
    title: "Análisis: ¿cómo serán las físicas de conducción?",
    body: "Fijándome en los tráilers, la suspensión de los coches parece más pesada que en GTA V, más cerca de RDR2 en sensación de peso.\n\nCreo que será un punto intermedio entre arcade y simulación. ¿Qué preferís vosotros?",
    a: "Turbo305",
    h: 60,
    likes: 120,
    views: 2600,
    tags: ["conduccion", "fisicas", "analisis"],
    cover: "highway",
    c: [
      { a: "NeonRider", b: "Mientras las motos no sean de mantequilla como en GTA IV, firmo.", h: 58, s: 22 },
      { a: "PCMasterVice", b: "Prefiero algo intermedio. GTA IV era demasiado pesado para mi gusto.", h: 55, s: 13 },
    ],
  },
  {
    id: "radio-emisoras",
    type: "debate",
    cat: "historia",
    title: "¿Qué estilos de música queréis en las emisoras de radio?",
    body: "La radio es media identidad de un GTA. Yo pido: reguetón, trap latino, synthwave, hip-hop de Florida y una emisora de rock clásico. ¿Y vosotros?",
    a: "Rockstarlover",
    h: 80,
    likes: 98,
    views: 1700,
    tags: ["radio", "musica"],
    c: [
      { a: "ViceQueen", b: "Una emisora 80s como homenaje a Vice City sería obligatoria.", h: 78, s: 25 },
      { a: "GamerLeo", b: "Talk radio con humor ácido. Las de GTA V eran oro.", h: 70, s: 17 },
    ],
  },
  {
    id: "bugs-a-evitar",
    type: "bug",
    cat: "gameplay",
    title: "¿Qué bugs de GTA V esperáis no volver a ver?",
    body: "Hilo medio en broma, medio en serio. Empiezo yo: coches que aparecen de la nada justo detrás de ti y la IA de tráfico que se lanza al agua.",
    a: "GlitchHunter",
    h: 16,
    likes: 76,
    views: 1300,
    tags: ["bugs", "ia", "trafico"],
    c: [
      { a: "NeonRider", b: "Los peatones que se tiran delante del coche sin motivo 😤", h: 15, s: 19 },
      { a: "GamerLeo", b: "Las pantallas de carga infinitas del Online. Por favor.", h: 10, s: 30 },
    ],
  },
  {
    id: "guia-preparacion",
    type: "guia",
    cat: "guias",
    title: "Guía: cómo prepararte para el lanzamiento (espacio, ediciones y más)",
    body: "Pequeña checklist para llegar listo:\n\n1. **Espacio libre:** deja un buen margen en el SSD de tu consola.\n2. **Precarga:** si reservas digital, activa las descargas automáticas.\n3. **Spoilers:** silencia palabras clave en redes los primeros días.\n4. **Rejuega GTA V o RDR2** si quieres refrescar el estilo de Rockstar.\n\n¿Añadiríais algo?",
    a: "LeonidaLocal",
    h: 100,
    likes: 144,
    views: 3300,
    tags: ["guia", "lanzamiento", "consejos"],
    cover: "marina",
    c: [{ a: "PCMasterVice", b: "Punto 5: pedir vacaciones en el trabajo 😂", h: 98, s: 41 }],
  },
  {
    id: "coches-reales",
    type: "pregunta",
    cat: "vehiculos",
    title: "¿Los vehículos tendrán marcas reales?",
    body: "",
    a: "Turbo305",
    h: 138.1,
    likes: 11,
    tags: ["vehiculos", "marcas"],
    c: [{ a: "NeonRider", b: "Rockstar siempre usa marcas inventadas inspiradas en las reales (Grotti, Pegassi, Vapid...). Lo lógico es que siga igual.", h: 136.1, s: 8 }],
  },
  {
    id: "sistema-armas",
    type: "pregunta",
    cat: "armas",
    title: "¿Cambiará el sistema de armas respecto a GTA V?",
    body: "Me gustaría saber si habrá límite de armas en el inventario como en Red Dead Redemption 2.",
    a: "Krakatoa",
    h: 168,
    likes: 17,
    tags: ["armas", "inventario"],
  },
  {
    id: "historia-duracion",
    type: "pregunta",
    cat: "historia",
    title: "¿Cuánto durará la historia principal?",
    body: "¿Alguien sabe cuántas horas tendrá el modo historia aproximadamente?",
    a: "SpeedrunnerX",
    h: 195.3,
    likes: 21,
    tags: ["historia", "duracion"],
    c: [{ a: "StoryHunter", b: "No hay datos oficiales. GTA V rondaba las 30-35 horas y RDR2 unas 50, así que yo esperaría algo entre medias.", h: 187.3, s: 10 }],
  },
  {
    id: "gameplay-primera-persona",
    type: "pregunta",
    cat: "gameplay",
    title: "¿Tendrá modo en primera persona?",
    body: "En GTA V se añadió en la versión de nueva generación. ¿Estará desde el principio?",
    a: "FPSVice",
    h: 207.8,
    likes: 8,
    tags: ["primera-persona", "camara"],
  },
  {
    id: "fecha-lanzamiento",
    type: "pregunta",
    cat: "noticias",
    title: "¿Cuál es la fecha de lanzamiento oficial de GTA 6?",
    body: "Con tanto retraso ya me he perdido. ¿Cuál es la última fecha confirmada?",
    a: "LateGamer",
    h: 240.6,
    likes: 34,
    tags: ["lanzamiento", "fecha"],
    c: [{ a: "LeonidaLocal", b: "La última fecha anunciada por Rockstar es el 19 de noviembre de 2026 para PS5 y Xbox Series X|S. Revisa siempre la web oficial por si hubiera cambios.", h: 239.6, s: 30, solution: true }],
  },
  {
    id: "ps4-xbox-one",
    type: "pregunta",
    cat: "preguntas",
    title: "¿Saldrá en PS4 o Xbox One?",
    body: "",
    a: "OldGenPlayer",
    h: 260,
    likes: 6,
    tags: ["plataformas"],
    c: [{ a: "GamerLeo", b: "No, solo se ha anunciado para PS5 y Xbox Series X|S.", h: 259, s: 7 }],
  },
  {
    id: "animales-mapa",
    type: "pregunta",
    cat: "mapa",
    title: "¿Habrá animales salvajes como caimanes?",
    body: "En el primer tráiler sale un caimán entrando en una tienda. ¿Serán parte del mundo abierto?",
    a: "GatorBait",
    h: 286.4,
    likes: 15,
    tags: ["fauna", "caimanes"],
  },
  {
    id: "misiones-atracos",
    type: "debate",
    cat: "historia",
    title: "¿Atracos con planificación como en GTA V o algo nuevo?",
    body: "Los atracos con fase de preparación fueron lo mejor de GTA V. ¿Repetirán la fórmula o veremos algo diferente, más orientado a la pareja?",
    a: "Ocean_Drive",
    h: 120,
    likes: 110,
    views: 2050,
    tags: ["atracos", "misiones"],
    c: [{ a: "StoryHunter", b: "Con dos protagonistas que son pareja, imagino atracos más íntimos y menos de banda grande.", h: 118, s: 20 }],
  },
  {
    id: "mods-futuro",
    type: "debate",
    cat: "mods",
    title: "Si llegan los mods: ¿qué es lo primero que instalaríais?",
    body: "Pensando a largo plazo (y si algún día son compatibles en PC): ¿qué mod os gustaría ver primero? Yo: un modo realista de tráfico y gasolina.",
    a: "GlitchHunter",
    h: 200,
    likes: 64,
    views: 980,
    tags: ["mods", "pc"],
  },
  {
    id: "clima-huracanes",
    type: "teoria",
    cat: "teorias",
    title: "¿Habrá huracanes dinámicos en Leonida?",
    body: "Florida + verano = tormentas tropicales. Un sistema de clima con huracanes que inunden calles y cambien misiones sería espectacular. ¿Demasiado ambicioso?",
    a: "ViceQueen",
    h: 3,
    likes: 58,
    views: 700,
    tags: ["clima", "huracanes", "teoria"],
    cover: "neon",
    c: [{ a: "GatorKing", b: "Imaginad los caimanes en las calles inundadas 💀", h: 2, s: 11 }],
  },
];

/** [userId, email, contraseña] de las cuentas de ejemplo. */
export const SEED_PASSWORDS: [string, string, string][] = USERS.map(([username]) => [
  userIdFor(username),
  `${username.toLowerCase()}@demo.gtavi`,
  DEMO_PASSWORD,
]);

export function createSeedData(now = Date.now()): CommunityData {
  const ago = (hours: number) => new Date(now - hours * 3_600_000).toISOString();

  const users: User[] = USERS.map(([username, displayName, bio, hue, role, daysAgo, bonus, location]) => ({
    id: userIdFor(username),
    username,
    displayName,
    bio,
    avatarHue: hue,
    role,
    joinedAt: ago(daysAgo * 24),
    bonusPoints: bonus,
    location,
  }));

  const posts: Post[] = [];
  const comments: Comment[] = [];
  let counter = 0;

  const addComments = (postId: string, list: SeedComment[] | undefined, parentId: string | null): string | undefined => {
    let solutionId: string | undefined;
    for (const c of list ?? []) {
      const id = `c_seed${++counter}`;
      comments.push({ id, postId, parentId, authorId: userIdFor(c.a), body: c.b, createdAt: ago(c.h), score: c.s ?? 0 });
      if (c.solution) solutionId = id;
      addComments(postId, c.r, id);
    }
    return solutionId;
  };

  // La web se centra en preguntas y respuestas.
  for (const p of POSTS.filter((x) => x.type === "pregunta")) {
    const solutionId = addComments(p.id, p.c, null);
    posts.push({
      id: p.id,
      type: p.type,
      category: p.cat,
      title: p.title,
      body: p.body,
      tags: p.tags,
      authorId: userIdFor(p.a),
      createdAt: ago(p.h),
      likeCount: p.likes,
      viewCount: p.views ?? p.likes * 40,
      solutionId,
      pinned: p.pinned,
    });
  }

  // Notificaciones de ejemplo para la cuenta demo.
  const me = userIdFor(DEMO_USERNAME);
  const notifications: Notification[] = [
    { id: "n_seed1", userId: me, type: "comment", actorId: userIdFor("GatorKing"), postId: "clima-huracanes", createdAt: ago(2), read: false },
    { id: "n_seed2", userId: me, type: "like", actorId: userIdFor("TommyV"), postId: "secretos-vice-city", createdAt: ago(4), read: false },
    { id: "n_seed3", userId: me, type: "comment", actorId: userIdFor("GatorKing"), postId: "secretos-vice-city", createdAt: ago(28), read: false },
    { id: "n_seed4", userId: me, type: "rank", text: "Has alcanzado el rango Criminal veterano. ¡Sigue así!", createdAt: ago(50), read: true },
  ];

  return { users, posts, comments, likes: [], commentVotes: [], saves: [], notifications };
}
