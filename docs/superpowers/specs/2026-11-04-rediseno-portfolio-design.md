# Rediseño del portfolio de Carlos Vidal — diseño

Fecha: 2026-11-04 · Estado: aprobado por Carlos (2026-11-05)

Alcance de "terminado" **[Claude, por defecto mientras Carlos no diga otra cosa]**: la web nueva funcionando y revisada en la rama `rediseno-portfolio`. Publicarla en cvidal.dev es un paso aparte, cuando estén el CV de backend y los textos pendientes; los `[PLACEHOLDER]` no deben verse nunca en producción (en build de producción se ocultan las secciones o frases que aún los tengan).
Prototipos de referencia (desechables, no son código de producción): `docs/superpowers/prototypes/`
- `hero-avatar-y-juego.html`: hero con el avatar animado + juego Pub/Sub Rush + vitrina de logros.
- `proyectos-y-caso-de-estudio.html`: sección de proyectos y página de caso de estudio (dos pestañas).
- Son fragmentos HTML pensados para el visor de bocetos: para abrirlos sueltos hay que envolverlos en `<html><body style="background:#18181b">`. Las imágenes que usan están en la misma carpeta.

Leyenda: **[Carlos]** = decidido por Carlos. **[Claude]** = decisión mía que Carlos no ha discutido; se puede cambiar. **[Builder]** = queda a criterio de quien lo construya.

---

## 1. Intención

Carlos es Integration Developer en Top Doctors y busca puesto como **Backend / Go Developer**. El portfolio actual (plantilla Vite + shadcn, "Full Stack Developer", carrusel de 17 tecnologías) no le representa.

Lo que un recruiter tiene que llevarse en 30 segundos **[Carlos]**: *"es backend, pero tiene gusto y cuida los detalles como pocos"*. El diseño y lo creativo son su diferencia frente a otros integradores, y la web tiene que ser **divertida e interactiva**: que la gente se quede jugando. A la vez, un recruiter con prisa debe entender en 5 segundos quién es y qué hace.

Referencias que le gustan **[Carlos]**: jhey.dev (microinteracciones cuidadas), lynnandtonic.com (personalidad gráfica, le encantan los rojos), bruno-simon.com (impacto, pero esconde el contenido: eso no).

## 2. Objetivos, no objetivos y anti-objetivos

**Objetivos**
- Mensaje prioritario: Go, backend, APIs, integraciones, testing.
- Memorable: avatar ilustrado de Carlos que reacciona + minijuego opcional con logros.
- Proyectos como protagonistas, con casos de estudio propios.
- Lighthouse ≥ 90 en rendimiento y accesibilidad. Todo el texto legible sin JavaScript.

**No objetivos (ahora)**
- Ranking global del juego (fase 2, con una API propia en Go).
- Versión en inglés (la estructura queda preparada, el contenido no).
- Analítica, cookies, cuentas de usuario, sonido.

**Anti-objetivos (fracaso aunque funcione)**
- Que el juego o las animaciones tapen o retrasen el contenido.
- Inventar experiencia, métricas, clientes o responsabilidades, o presentar a Carlos como senior/experto.
- Que parezca una plantilla: nada de degradados genéricos, emojis decorativos en la interfaz ni carruseles de logos.

## 3. Restricciones (del brief de Carlos)

- Lighthouse ≥ 90 rendimiento y accesibilidad; lo interactivo se carga después del contenido.
- Texto legible sin JS (HTML estático/prerenderizado) para SEO y previsualizaciones de enlaces.
- Respetar `prefers-reduced-motion`. Móvil a 320–390 px sin desbordamiento horizontal.
- Metadatos y `og:image` nuevos y coherentes con "Backend Developer · Go". **Quitar `twitter:site @carlosvidal`**.
- CV: sustituir por `/CarlosVidal_Backend_CV.pdf` (lo añade Carlos). Todos los enlaces actuales a `CarlosVidal_FullStack_CV.pdf` (hero y navbar) cambian.
- Español; estructura preparada para inglés (textos fuera de los componentes, rutas que admitan prefijo de idioma).
- Dominio actual: `https://www.cvidal.dev`.
- No usar emojis en la interfaz (sí en mensajes de ejemplo del bot de WhatsApp, porque son contenido real).

## 4. Dirección visual [Carlos, a partir de bocetos]

- **Base oscura** `#101012`, **papel/crema** `#F1EDE6`, **rojo único de acento** `#E4251B` (tinta de dibujo: `#D8261C`; tinta clara: `#F0A193`). Sustituye al cian de Go + ámbar del brief original **[Carlos]**.
- **Estética risografía**: ilustración y fotos "impresas" a una tinta roja sobre papel crema, tramas diagonales, desajustes de impresión.
- **Golpes de cartel**: separadores de sección en rojo a sangre con tipografía gigante (como el bloque "PROYECTOS" del boceto).
- **Tipografía [Claude, aprobada al ver los bocetos]**: display *Bricolage Grotesque* (800, interlineado muy cerrado, combinando relleno y trazo hueco en el nombre) + *JetBrains Mono* para datos técnicos, etiquetas y estados. Autoalojadas.
- Formas geométricas duras (cuadrados) en vez de círculos para elementos de "sistema".
- Imágenes de proyecto: en reposo, duotono rojo (escala de grises + capa roja en modo *lighten* sobre papel); al hacer hover se revelan a color con un leve desplazamiento.

## 5. Estructura del sitio

Rutas:
- `/` — home de una página: Hero → Experiencia → Proyectos → Sobre mí → Contacto. Cada bloque principal va precedido de un separador tipo cartel con número (`// 01`, `// 02`…).
- `/proyectos/acelerik-booking` — caso de estudio.
- `/proyectos/bot-pedidos-whatsapp` — caso de estudio **[Claude: slug]**.
- 404 propia con el mismo estilo.
- Bendita Burger **no** tiene caso de estudio: su tarjeta enlaza a las tiendas.

Navegación: barra superior mínima (nombre, Experiencia, Proyectos, Contacto, botón CV). Transiciones suaves entre home y casos de estudio.

## 6. Hero [Carlos]

Izquierda: "Carlos" en relleno + "Vidal" en trazo hueco; etiqueta roja `Backend Developer · Go`; botones **Ver proyectos** (rojo) y **Descargar CV**; estado `■ Abierto a oportunidades · Backend / Go`; botón secundario discontinuo **"▶ ¿Te atreves a hacer mi trabajo?"** que abre el juego.

Derecha: **avatar ilustrado de Carlos** a partir de `avatar-ref.webp` (ilustración proporcionada por Carlos; él confirma que puede usarla), recoloreado a tinta roja estilo risografía, con trama roja diagonal detrás. La camiseta se difumina hacia abajo. **Sin nodos ni paquetes** alrededor (se descartaron).

Comportamiento del avatar (ver prototipo):
- **Ojos** siguen al ratón con suavizado; vuelven al centro si el ratón sale de la página. Solo siguen al ratón (seguir a la vez otros objetos se descartó: "los ojos se vuelven locos").
- **Parpadeo** aleatorio cada 3–6 s.
- **Gestos solos** cada 3–6 s: sonrisa, risa (boca abierta con dientes), mueca a cada lado (sonrisa de lado + ceja levantada), pensativo (ceño + boca apretada).
- **Hover en "Ver proyectos"**: risa + cejas arriba.
- **Movimiento muy rápido del ratón**: sorpresa = solo cejas muy arriba + media sonrisa. **La boca en "o" se descartó** ("parece tonto").
- **Clic en "Descargar CV"** (y clic sobre el avatar): **guiño** — ojo cerrado en arco con pestaña, ceja de ese lado baja, la otra sube, sonrisa de lado; ~1 s. La descarga del CV no se bloquea.
- Accesorios desbloqueados en el juego (gafas, cadenas) se muestran sobre el avatar.
- `prefers-reduced-motion`: sin gestos automáticos ni seguimiento suave (posición fija o salto directo); sin parpadeo animado.
- Móvil **[Claude]**: se pinta primero la imagen base estática (ligera, en el HTML). El compositor de capas **no** se carga al inicio: solo se carga en diferido cuando hace falta, es decir, al abrir el juego o si el visitante tiene accesorios o un tema desbloqueados en `localStorage`. Sin ratón no hay seguimiento de ojos; parpadeo y gestos solo durante el juego. Así la primera carga en móvil no paga el coste del avatar animado.

Técnica **[Claude]**: el prototipo recolorea y separa capas en el navegador (~1,5 M píxeles en cada carga): **no** vale para producción. En producción, generar las capas **una vez en build** (o a mano) a partir del prototipo: imagen base sin iris/cejas/labios + capas de párpados, cejas (2), labio superior, labio inferior, ya en tinta roja, en WebP/PNG optimizados. En el navegador solo se componen y transforman (canvas o SVG con `<image>`). Una versión 100 % vectorial es mejora opcional futura. El HTML del hero debe pintar ya la imagen base estática antes de que cargue el JS.

## 7. Juego "Pub/Sub Rush" [Carlos]

Opcional; nunca tapa el contenido. Se abre con el botón del hero: el texto del hero se aparta y el tablero ocupa la mitad izquierda; el avatar queda a la derecha reaccionando.

Mecánica (ver prototipo):
- Cola de mensajes entrantes (`POST /pagos` ■, `POST /reservas` ●, `POST /avisos` ▲, forma + texto) con barra de caducidad. Servicios `/pagos`, `/reservas`, `/avisos`.
- Enrutar: clic en mensaje + clic en servicio, o teclas **1/2/3** (enrutan el seleccionado o, si no hay, el más antiguo).
- Acierto `200 OK +N`; error `400 Bad Request`; caducado `504 Timeout`. Errores → *dead letter queue*; con 5 se cae el sistema.
- Turno de 45 s; ritmo y caducidad aumentan con el tiempo. *Webhooks urgentes* (borde discontinuo, ~13 %) valen el doble y caducan antes. Multiplicador +1 cada 5 aciertos seguidos (máx. x4).
- Reacciones del avatar: sonrisa con rachas, risa a las 10, sorpresa si salvas un mensaje en el último 20 %, pensativo al fallar o con cola llena, guiño al batir récord.

Añadidos aprobados para la v1 **[Carlos]**:
1. **Incidentes aleatorios** (~cada 15 s): pico de tráfico (ráfaga), servicio caído (un servicio en rojo ~5 s; enviarle algo falla), deploy (los servicios cambian de orden). El avatar pone cara de "uy".
2. **Post-mortem final compartible**: pantalla de fin en estilo terminal (entregados, dead letters, racha máx., peor momento…) con botón compartir (Web Share API; si no hay, copiar texto + enlace): *"He sobrevivido a un turno de guardia de Carlos: N pts"* + URL.
3. **Puente al contenido**: al terminar, línea tipo *"Esto, pero de verdad, es lo que hago en Top Doctors"* con enlaces a Experiencia y Proyectos.
4. **Primera partida guiada + móvil**: los 3 primeros mensajes llegan despacio con pista ("este va a /pagos, pulsa 1"); en móvil los servicios son botones grandes abajo y se toca el mensaje para seleccionarlo.

Logros y recompensas (guardados en `localStorage`, con **progreso visible**, p. ej. "racha máx.: 7/10"):
| Logro | Condición | Recompensa |
|---|---|---|
| Hola, mundo | primer mensaje enrutado | — |
| En racha | 10 aciertos seguidos | gafas de sol (wayfarer con reflejos y trama) |
| Webhook hunter | 5 webhooks en un turno | cadenas (una gruesa al cuello + una fina con chapa `200`) |
| Cero fallos | turno completo sin dead letters con un mínimo de mensajes | tema "tinta azul" |
| Alta carga | 500 puntos en un turno | tema "verde terminal" |
| ??? → "Lo has visto todo" | los cuatro con recompensa | nota personal de Carlos `[PLACEHOLDER]` |

- *Cero fallos* debe ser **más fácil que en el prototipo** **[Carlos]**: bajar el mínimo (≈12) y/o suavizar el ritmo final. Ajuste fino → **[Builder]** con pruebas de juego.
- Vitrina de logros visible bajo el hero (o en un panel plegable **[Builder]**), con interruptores para activar/quitar accesorios y temas. Los temas cambian el acento de toda la web y el avatar.
- Accesorios dibujados con el mismo estilo que la ilustración; el sistema debe permitir añadir más (gorra, auriculares…) en el futuro.
- Sin sonido. Accesible por teclado; `prefers-reduced-motion` reduce animaciones del tablero.
- **Fase 2 (fuera de alcance)**: ranking global con API propia en Go.

## 8. Experiencia [Carlos]

**Top Doctors · Integration Developer** · mar 2026 – actualidad · Remoto.
- Más de 10 integraciones con sistemas externos.
- Pipeline de datos de medicamentos (NHS) desarrollado en solitario.
- Go, GCP Pub/Sub, testing, Docker.
Sin nombres de clientes ni nada confidencial.

**Ulandu · Prácticas** · mar – jun 2025: desarrollo de la app de Bendita Burger en Flutter e integración de pagos con Stripe (enlaza a la tarjeta del proyecto).

## 9. Proyectos [Carlos]

Orden y etiquetas:
1. **Acelerik Booking** — tarjeta grande destacada. Etiqueta `Producto propio · ACELERIK`. Titular: *"Una API en Go que no deja que dos familias reserven la última plaza."* Datos: cero overbooking con locks en PostgreSQL; pagos con Stripe idempotentes y webhooks firmados; de MVP en n8n a API en Go. Stack: Go, PostgreSQL, Stripe, Docker, OpenAPI. Enlaces: `booking.acelerik.com`, repo `github.com/cvidaal/acelerik-demo`.
2. **Bot de pedidos por WhatsApp** — cliente real de ACELERIK, **con nombre y logo de la panadería** (Carlos lo autoriza; el logo está en `Proyectos/Panaderia/logo_sinfondo.png`). Etiqueta `Cliente ACELERIK · en piloto`. Titular: *"Notas de voz convertidas en la hoja de producción de las 02:00. La IA propone, el código decide."* Stack: Python, FastAPI, WhatsApp Cloud API, LLM, ~880 tests. Imagen: logo + mini conversación de WhatsApp (nota de voz + confirmación del bot). **No mencionar Claude Code ni desarrollo asistido por IA** **[Carlos]**.
3. **App Bendita Burger** — `Prácticas · Ulandu · 2025`. App de pedidos en Flutter con pagos por Stripe, publicada. Capturas: **las de la App Store** **[Carlos]**. Enlaces: [App Store](https://apps.apple.com/es/app/bendita-burger/id1525077901), [Google Play](https://play.google.com/store/apps/details?id=com.bendita.benditaMobile&hl=es). Stack: Flutter, Stripe, Firebase.

Eliminar: web SaaS de Acelerik y Taller Manager.

El separador de la sección muestra "3 proyectos" y lenguajes (Go · Python · Flutter). La cifra "2 en producción" del boceto **solo** si es cierta (Booking es demo pública; el bot está en piloto): por defecto, quitarla.

## 10. Casos de estudio [Carlos]

Plantilla común (ver prototipo, pestaña 2): migas de pan; etiqueta de tipo; título relleno + hueco; titular; fila de metadatos (Rol, Tipo, Stack, Estado, Enlaces); imagen principal en duotono; índice lateral fijo con la sección activa resaltada; secciones numeradas; navegación "volver / siguiente caso".

**Acelerik Booking** — secciones:
1. El problema — *suposición, confirmar con Carlos*: parques que gestionan cumpleaños por teléfono/WhatsApp y libreta; franjas solapadas, señales cobradas a mano.
2. La v1 — Jungla Mágica (React + n8n + Supabase), repo `github.com/cvidaal/jungla-admin`. Validó la idea.
3. Por qué Go — *"Funcionaba, pero no se podía tocar sin miedo"*. Tres razones de Carlos: Go es su lenguaje; código más editable/mantenible (tipado, Git, tests) que los flujos de n8n; mucho más barato de alojar (un binario estático en un contenedor pequeño).
4. Decisiones técnicas (tarjetas; la primera desplegada con código real):
   - Cero overbooking: `pg_advisory_xact_lock` por franja dentro de la transacción antes de contar plazas.
   - Pagos sin duplicados: idempotency key por reserva, reutiliza Checkout abierto, webhook con firma verificada, comprueba importe/moneda y que la sesión pertenece a la reserva; un pago tardío en reserva cancelada nunca reabre la plaza.
   - Estados a prueba de errores: máquina de estados con `SELECT … FOR UPDATE`; cambio inválido → 409.
   - Plazas que se liberan solas: sin Checkout, caduca a la hora; la caducidad del Checkout de Stripe está alineada con esa hora.
   - Listo para desplegar: Docker multi-stage, binario estático, usuario no root, healthcheck que hace ping a la BD, OpenAPI generado (Huma).
5. Arquitectura — diagrama en estilo risografía: Web → API Go (Huma; módulos booking/payment) → PostgreSQL; ↔ Stripe Checkout con webhook firmado.
6. Testing — contado tal cual: transiciones de estado, firma de webhooks, aplicación de sesiones de pago, Checkout bloqueado sin clave de test, acceso privado de la demo y rutas, configuración obligatoria. **No** decir "bien testeado" sin más.
7. Qué aprendí — `[PLACEHOLDER]`.
8. Siguiente — CI con GitHub Actions. **El repo no tiene CI hoy**: no afirmar "CI" en ningún sitio salvo que Carlos la añada antes de publicar.

Hechos verificados en `Proyectos/acelerik-demo-cumple/backend` (~1.500 líneas de Go). El fragmento de código mostrado debe copiarse del repo real.

**Bot de pedidos por WhatsApp** — misma plantilla. Contenido base (de `Proyectos/Panaderia/BRIEF.md`, `ia_pani/CLAUDE.md` y el historial):
1. El problema: panadería industrial (~30 empleados) que reparte a bares, hoteles y tiendas; los pedidos llegan por notas de voz de WhatsApp y alguien los escucha y apunta a mano cada mañana; clientes que no usarán apps ni formularios.
2. La solución: WhatsApp Cloud API (webhook) → transcripción → extracción con LLM y salida estructurada → reglas de negocio → confirmación al cliente → hoja de producción a las 02:00.
3. Decisiones: "la IA propone, el código decide"; ningún mensaje se pierde (se guarda antes de procesarse, los errores van a revisión); nunca se inventa producto/cantidad; hora límite 02:00 en `Europe/Madrid` con cambio de hora y el "mañana" de madrugada; agrupación de audios seguidos; envío solo a números autorizados; simulador.
4. Testing: ~880 tests, TDD en fechas, reglas y procesador. *(Recontar justo antes de publicar.)*
5. Estado: en piloto/desarrollo. Qué aprendí `[PLACEHOLDER]`.
**[Builder]**: revisar el código del bot antes de redactar para no afirmar nada que no esté implementado (el brief describe más de lo que puede estar terminado). No mencionar Claude Code.

## 11. Sobre mí [Carlos]

Breve y personal: `[PLACEHOLDER texto de Carlos]`. Fuera la cita de Steve Jobs y las frases genéricas. Foto opcional; si se usa, `src/assets/profile.jpg` en duotono.

## 12. Stack mostrado [Carlos]

Solo: Go, APIs REST, Webhooks, GCP Pub/Sub, Docker, testing, PostgreSQL (confirmado: Acelerik Booking usa PostgreSQL). Como lista de etiquetas en monoespaciada, nada de carrusel.

## 13. Contacto [Carlos]

Bloque estilo terminal: `POST /contacto` → respuesta JSON con email `carlosvidal.developer@gmail.com`, LinkedIn `https://www.linkedin.com/in/carlosvidaldev/`, GitHub `https://github.com/cvidaal`. Enlaces clicables dentro del JSON; botón para copiar el email. **[Claude]** Sin formulario (no hay backend ni servicio de terceros que revisar).

## 14. Movimiento

- Animaciones de entrada en scroll sobrias (aparición + desplazamiento corto) y transiciones entre páginas. El brief pedía GSAP ScrollTrigger + Lenis: **[Builder]** puede usarlos o resolverlo con CSS/View Transitions si rinde mejor; el criterio es Lighthouse ≥ 90 y `prefers-reduced-motion`.
- Microinteracciones: hover de tarjetas (sube 4 px, borde crema, imagen a color, flecha que avanza), botones, enlaces.

## 15. Stack técnico [Claude]

- **Astro** (salida estática) con **islas de React** solo para el avatar, el juego y la vitrina; Tailwind o CSS propio **[Builder]**. Motivo: HTML estático legible sin JS, SEO y rendimiento, manteniendo React donde aporta.
- Se reconstruye desde cero en este repo (rama `rediseno-portfolio`); se eliminan las dependencias de la plantilla que no se usen (radix, recharts, react-query, etc.).
- Contenido (textos, proyectos, casos de estudio) en archivos de contenido separados de los componentes, con estructura por idioma (`es/` ahora, `en/` en el futuro).
- Fuentes autoalojadas; imágenes optimizadas (WebP/AVIF con tamaños).
- Despliegue: donde esté hoy `cvidal.dev` **[Builder: averiguarlo; el README dice Vercel/Netlify]**.
- `og:image` nueva: cartel con el avatar en tinta roja + "Carlos Vidal · Backend Developer · Go".

## 16. CLAUDE.md del repo [Carlos]

Crear con estas reglas permanentes:
- No inventar experiencia, métricas ni responsabilidades.
- No presentar a Carlos como senior ni experto en tecnologías que aún aprende.
- Diferenciar siempre experiencia profesional de proyectos/productos propios.
- Prioridad de mensaje: Go, backend, APIs, integraciones, testing.
- Rendimiento y accesibilidad no se sacrifican por efectos.
Añadir **[Claude]**: no mencionar Claude Code ni desarrollo asistido por IA en los textos del portfolio; marcar con `[PLACEHOLDER]` todo texto pendiente de Carlos.

## 17. Pendiente de Carlos (no bloquea empezar)

- `CarlosVidal_Backend_CV.pdf`.
- Textos: Sobre mí, "Qué aprendí" (×2), nota personal secreta del juego.
- Confirmar "el problema" de Acelerik Booking.
- (Opcional) Añadir CI al repo de Acelerik Booking para poder mencionarla.
- (Recomendado) Avisar a Ulandu de que usa la app de Bendita Burger en su portfolio.

## 18. Lo que queda a quien construya

Ajuste fino de dificultad y tiempos del juego; animaciones concretas; organización de componentes; elección entre canvas o SVG para componer las capas del avatar; GSAP/Lenis frente a CSS; diseño exacto de la 404 y del post-mortem, siguiendo el estilo de los prototipos.
