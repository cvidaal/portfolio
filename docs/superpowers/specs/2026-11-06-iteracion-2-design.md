# Iteración 2 del portfolio — diseño

Fecha: 2026-11-06 · Estado: aprobado por Carlos en conversación (bocetos de menú, entrada al juego, experiencia y contacto; textos nuevos; cara nueva).
Complementa (no sustituye) `2026-11-04-rediseno-portfolio-design.md`; todas sus restricciones globales siguen vigentes.
Boceto aprobado: `docs/superpowers/prototypes/ajustes-iteracion-2.html` (las imágenes del boceto se sustituyen por `assets-src/face.webp`).

Leyenda: **[Carlos]** decidido por Carlos · **[Claude]** decisión mía, cambiable.

## 1. Cara de Carlos: menú y favicon [Carlos]
- Fuente: `assets-src/face.webp` (1254×1254, PNG/WebP con alfa, cabeza ilustrada en tinta roja). La aportó Carlos.
- **Menú (opción A del boceto)** [Carlos]: se quita el texto "Carlos Vidal" de la barra. A la izquierda va la cara en un círculo (fondo papel `#F1EDE6`, borde acento), enlace a `#top`, con un pequeño gesto al pasar el ratón o al enfocar (giro/bote) [Claude]. La barra **no se ve mientras el hero está en pantalla** y aparece fija al bajar (transición corta; sin animación con reduced motion; sin JS la barra es visible siempre para no perder la navegación). En los casos de estudio la barra se ve siempre.
- **Favicon** [Carlos]: la cara sustituye al "CV". `favicon.ico` (16/32/48), `favicon.png` 192 px (también apple-touch-icon) y `favicon.svg` se eliminan o se sustituyen por un PNG; a 16 px se recorta a la cara (sin el pelo excesivo) para que se reconozca [Claude]. Lo genera `scripts/make-favicon.mjs`.

## 2. Entrada al juego y logros [Carlos]
- El botón discontinuo "▶ ¿Te atreves a hacer mi trabajo?" se sustituye por una **tarjeta tipo máquina arcade** bajo los CTA del hero: pantalla oscura con mensajes `POST /pagos`, `POST /reservas`, `POST /avisos` desfilando (con su forma), título **PUB/SUB RUSH**, subtítulo *"Haz mi trabajo durante 45 segundos. Si aguantas, desbloqueas cosas."*, **▶ PULSA START** parpadeante y pegatina **LOGROS n/6**. Toda la tarjeta abre el juego; la pegatina abre los logros.
- Con reduced motion: sin desfile ni parpadeo. Sin JS: la tarjeta no aparece (igual que el botón actual).
- **La vitrina sale de la home.** Pasa a un panel (diálogo accesible: foco atrapado, Escape cierra, devuelve el foco) que se abre desde la pegatina LOGROS y desde un botón "Ver logros" en el post-mortem. Mantiene progreso, toggles y temas.

## 3. Carteles de sección más contenidos [Carlos]
- Los separadores tipo cartel (`Poster`) dejan de ir a sangre: dentro del ancho del contenido, con la tipografía y la altura bastante menores (referencia del boceto: título ~56 px en escritorio). Se aplica a **todos** los carteles para que sean coherentes [Claude].

## 4. Experiencia [Carlos]
Tarjeta por trabajo con **hueco de logo** (64 px) a la izquierda, empresa, puesto, fechas, frase principal, puntos y etiquetas. Orden: Top Doctors, Ulandu, Aeternum. Textos literales (en `es.ts`):

**Top Doctors** · Integration Developer · mar. 2026 – actualidad · Remoto
- Frase: "Conecto la plataforma con sistemas externos en Go: más de 10 integraciones en producción."
- "Diseñé y desarrollé en solitario el pipeline de datos de medicamentos del NHS (Reino Unido), de la ingesta a la entrega."
- "Mensajería asíncrona con GCP Pub/Sub, servicios en Docker y testing en cada integración."
- Etiquetas: Go · GCP Pub/Sub · Docker · Testing

**Ulandu** · Desarrollador Flutter · Prácticas · mar. – jun. 2025
- Frase: "Llevé la app de Bendita Burger de cero a las tiendas: hoy está publicada en App Store y Google Play."
- "Desarrollé la app en Flutter y conecté los pagos con Stripe."
- Enlace "Ver el proyecto" → `#proyectos`. Etiquetas: Flutter · Stripe · Firebase

**Aeternum Game Studios** · Diseñador gráfico de escenarios · mar. 2020 – jul. 2022
- Frase: "Di forma visual a los niveles de *Aeterna Noctis*, el primer juego del estudio, publicado en PC y consolas."
- "Diseñé gráficamente más de 35 niveles: la atmósfera, el estilo y la identidad de cada zona, en Unity."
- Etiquetas: Unity · Diseño gráfico
- Verificado (Wikipedia, 2026-11-06): desarrollado por Aeternum Game Studios, publicado en diciembre de 2021 para Windows, PS5, Xbox Series X/S y Switch. "Primer juego del estudio" y "Unity" son declaración de Carlos.

**Logos** [Carlos]: oficiales de cada empresa. Hasta tenerlos, el hueco muestra las iniciales de la empresa en monoespaciada sobre papel (nunca un logo inventado). Se añaden en una tarea aparte cuando Carlos autorice descargarlos o los aporte.

## 5. Sobre mí [Carlos]
Sección visible (deja de ser placeholder).
- Titular [Claude, opción A propuesta; Carlos no eligió otra]: "Empecé dibujando mundos. Ahora construyo lo que hay debajo."
- Texto:
  > Pasé más de dos años diseñando los escenarios de *Aeterna Noctis*. Después hice apps en Flutter y acabé en el backend: hoy escribo Go en Top Doctors e integro sistemas que tienen que funcionar aunque nadie los vea.
  >
  > Del diseño gráfico me traje la manía por el detalle. Una API también se puede hacer con gusto: nombres claros, errores que se entienden y tests que cuentan qué hace el código.
  >
  > Soy de los que se ríen en las reuniones y prueban la herramienta nueva el mismo día que sale. En paralelo llevo ACELERIK, donde construyo productos propios como Acelerik Booking.
- Datos rápidos (monoespaciada, formato `clave: valor`):
  - `ubicación:` Talavera de la Reina, Toledo · Madrid · Remoto
  - `stack:` Go · Pub/Sub · Docker · PostgreSQL
  - `antes:` diseño gráfico de videojuegos
  - `fuera del código:` trasteando con lo último en tecnología e IA
- Sin foto en esta iteración [Claude].

## 6. Contacto [Carlos]
Se mantiene el bloque terminal y al lado (debajo en móvil) una rejilla de 4 tarjetas-icono grandes: **Email** (copia el email, con el mismo feedback que el botón actual), **LinkedIn**, **GitHub** (iconos oficiales de marca, SVG del paquete `simple-icons`, en color acento) y **CV** (descarga `/CarlosVidal_Backend_CV.pdf`). Objetivo táctil ≥ 44 px.

## 7. Fuera de esta iteración
Logos oficiales (pendiente de permiso/archivos), CV en PDF, "Qué aprendí", "El problema", nota secreta.
