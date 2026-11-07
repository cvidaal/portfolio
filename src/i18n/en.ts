import type { es } from './es';

// English copy. Same keys as es.ts (TypeScript fails if one is missing).
export const en: Record<keyof typeof es, string> = {
  // Meta
  'meta.titulo': 'Carlos Vidal · Backend Developer · Go',
  'meta.descripcion': 'Carlos Vidal, Backend Developer in Go: APIs, integrations and testing.',

  // Navigation
  'nav.inicio': 'Home',
  'nav.experiencia': 'Experience',
  'nav.proyectos': 'Projects',
  'nav.contacto': 'Contact',
  'nav.cv': 'CV',
  'nav.aria': 'Main navigation',
  'nav.saltar': 'Skip to content',

  // Language switcher
  'idioma.otro': 'ES',
  'idioma.cambiar': 'Ver la web en español',
  'idioma.ogLocale': 'en_US',

  // Hero
  'hero.nombre1': 'Carlos',
  'hero.nombre2': 'Vidal',
  'hero.rol': 'Backend Developer · Go',
  'hero.verProyectos': 'See projects',
  'hero.descargarCv': 'Download CV',
  'hero.estado': 'Open to opportunities · Backend / Go',
  'hero.avatarAlt': 'Illustration of Carlos Vidal in red risograph-style ink',

  // Game entry: arcade machine under the hero CTAs
  'arcade.titulo': 'PUB/SUB RUSH',
  'arcade.sub': 'Do my job for 45 seconds. Survive and you unlock things.',
  'arcade.start': '▶ PRESS START',
  'arcade.logros': 'ACHIEVEMENTS {n}/{total}',
  'arcade.jugar': 'PUB/SUB RUSH: play (45 s)',
  'arcade.verLogros': 'See achievements · {n}/{total}',

  // CV
  'cv.href': '/CarlosVidal_Backend_CV_EN.pdf',
  'cv.descarga': 'CarlosVidal_Backend_CV_EN.pdf',
  'cv.hoverNav': '↓ PDF',
  'cv.hoverHero': '↓ PDF · 1 page',
  'cv.ok': 'GET /cv → 200 OK',

  // Section posters
  'seccion.experiencia': 'Experience',
  'seccion.proyectos': 'Projects',
  'seccion.sobre': 'About me',
  'seccion.contacto': 'Contact',
  'seccion.proyectosResumen': '3 projects · Go · Python · Flutter',

  // Experience. Bullets and tags separated by "|"; *text* is rendered in italics.
  'exp.topdoctors.empresa': 'Top Doctors',
  'exp.topdoctors.iniciales': 'TD',
  'exp.topdoctors.puesto': 'Integration Developer',
  'exp.topdoctors.fechas': 'Mar 2026 – present',
  'exp.topdoctors.lugar': 'Remote',
  'exp.topdoctors.frase': 'I connect the platform with insurers, hospitals and clinical software in Go: 10+ integrations with third-party APIs.',
  'exp.topdoctors.puntos':
    'Master data sync (centres, doctors, services, insurers) and the full appointment lifecycle: availability, booking, cancellation and rescheduling.|Asynchronous processing with GCP Pub/Sub, incoming webhooks and REST clients, with an adapter layer that serves several providers without changing the API contract.|Designed and built, on my own, the ingestion pipeline for the NHS public medicines catalogue: XML parsing, relational model, migrations and a query API.|Layered unit tests and production incident fixing: duplicate bookings, concurrency and mapping errors.',
  'exp.topdoctors.etiquetas': 'Go|REST APIs|Webhooks|GCP Pub/Sub|Docker|SQL',
  'exp.ulandu.empresa': 'Ulandu',
  'exp.ulandu.iniciales': 'UL',
  'exp.ulandu.puesto': 'Mobile Developer (Flutter) · Internship',
  'exp.ulandu.fechas': 'Mar – Jun 2025',
  'exp.ulandu.frase': 'I took the Bendita Burger app from zero to the stores: it is live on the App Store and Google Play.',
  'exp.ulandu.puntos': 'Ordering flow, Stripe payments, Firebase push notifications and the REST APIs of a Laravel backend.|Barcode scanner and bookings for padel clubs; fixing critical bugs before every release.',
  'exp.ulandu.enlace': 'See the project',
  'exp.ulandu.etiquetas': 'Flutter|Stripe|Firebase|REST APIs',
  'exp.aeternum.empresa': 'Aeternum Game Studios',
  'exp.aeternum.iniciales': 'AG',
  'exp.aeternum.puesto': 'Level Designer',
  'exp.aeternum.fechas': 'May 2020 – Jul 2022',
  'exp.aeternum.frase':
    'I designed levels for *Aeterna Noctis*, the studio’s first game, released on PlayStation, Xbox, Switch and PC.',
  'exp.aeternum.puntos':
    'Technical design of 35+ levels in Unity, together with the programming team.',
  'exp.aeternum.etiquetas': 'Unity|Level design',

  // Projects
  'proyectos.verCaso': 'Read the case study',
  'proyectos.verTiendas': 'See in the stores',
  'proyectos.bot.ejemplo': 'Example',
  'proyectos.bot.audio': '"Put me down for 10 more baguettes tomorrow"',
  'proyectos.bot.notaVoz': 'Voice note',
  'proyectos.bot.audioDuracion': '0:07',
  'proyectos.bot.respuesta': 'Noted for Friday 30/10: 10 more baguettes. Is that right?',
  'proyectos.ab.altReserva': 'Screenshot of the Acelerik Booking birthday booking screen',
  'proyectos.bot.altLogo': 'Hnos. Sánchez logo',

  // Case study (template)
  'caso.migas': 'Path',
  'caso.inicio': 'cvidal.dev',
  'caso.migasProyectos': 'projects',
  'caso.rol': 'Role',
  'caso.tipo': 'Type',
  'caso.stack': 'Stack',
  'caso.estado': 'Status',
  'caso.enlaces': 'Links',
  'caso.indice': 'Case study contents',
  'caso.volver': 'Back to projects',
  'caso.volverTodos': 'All',
  'caso.siguiente': 'Next case',
  'caso.sufijoTitulo': 'Case study',
  'caso.tipo.producto': 'Own product',
  'caso.tipo.cliente': 'Client',
  'caso.tipo.practicas': 'Internship',

  // About me; *text* is rendered in italics
  'sobre.titular': 'From building virtual worlds to building real systems.',
  'sobre.p1':
    'I spent over two years designing levels for *Aeterna Noctis*. Then I built Flutter apps and ended up in the backend: today I write Go at Top Doctors and integrate systems that have to work even when nobody is looking.',
  'sobre.p2':
    'Level design left me obsessed with detail. An API can be made with taste too: clear names, errors you can understand and tests that tell you what the code does.',
  'sobre.p3':
    'I’m the one who laughs in meetings and tries the new tool the day it comes out. On the side I run ACELERIK, where I build my own products like Acelerik Booking.',
  'sobre.datos.ubicacion.clave': 'location:',
  'sobre.datos.ubicacion.valor': 'Madrid · Remote',
  'sobre.datos.stack.clave': 'stack:',
  'sobre.datos.stack.valor': 'Go · Pub/Sub · Docker · PostgreSQL',
  'sobre.datos.antes.clave': 'before:',
  'sobre.datos.antes.valor': 'video game level design',
  'sobre.datos.fuera.clave': 'off the clock:',
  'sobre.datos.fuera.valor': 'tinkering with the latest in tech and AI',

  // Stack
  'stack.titulo': 'Stack',
  'stack.items': 'Go|REST APIs|Webhooks|GCP Pub/Sub|Docker|Testing|PostgreSQL',

  // Contact
  'contacto.peticion': 'POST /contact',
  'contacto.estado': '200 OK',
  'contacto.email': 'carlosvidal.developer@gmail.com',
  'contacto.linkedin': 'https://www.linkedin.com/in/carlosvidaldev/',
  'contacto.github': 'https://github.com/cvidaal',
  'contacto.nombre.email': 'Email',
  'contacto.nombre.linkedin': 'LinkedIn',
  'contacto.nombre.github': 'GitHub',
  'contacto.nombre.cv': 'CV',
  'contacto.sub.linkedin': '/carlosvidaldev',
  'contacto.sub.github': '/cvidaal',
  'contacto.sub.cv': 'Download PDF',
  'contacto.copiar': 'Copy email',
  'contacto.copiado': 'Email copied',
  'contacto.copiarError': 'Couldn’t copy it. Copy it by hand: carlosvidal.developer@gmail.com',

  // Game
  'logros.hola.nombre': 'Hello, world',
  'logros.hola.desc': 'Route your first message',
  'logros.racha.nombre': 'On a roll',
  'logros.racha.desc': '10 correct in a row',
  'logros.racha.recompensa': 'Sunglasses',
  'logros.hooks.nombre': 'Webhook hunter',
  'logros.hooks.desc': '5 webhooks in one shift',
  'logros.hooks.recompensa': 'Chains',
  'logros.cero.nombre': 'Zero failures',
  'logros.cero.desc': 'A full shift with no dead letters and at least 12 messages routed',
  'logros.cero.recompensa': '"Blue ink" theme',
  'logros.mil.nombre': 'High load',
  'logros.mil.desc': '500 points in one shift',
  'logros.mil.recompensa': '"Terminal green" theme',
  'logros.secreto.nombre': 'You’ve seen it all',
  'logros.secreto.desc': 'Get the four achievements with rewards',
  'logros.secreto.recompensa': 'A personal note from Carlos',
  'juego.notaSecreta':
    'Never give up. I started out designing video game levels and today I write Go; if you made it this far, you don’t give up either. Tell me your high score at carlosvidal.developer@gmail.com. Carlos',
  'juego.notaPendiente': 'Carlos is still writing this note. Come back soon.',

  // Game: board
  'juego.region': 'Pub/Sub Rush game',
  'juego.titulo': 'pub/sub rush · on-call shift',
  'juego.salir': 'Exit',
  'juego.hud.score': 'score',
  'juego.hud.racha': 'streak',
  'juego.hud.dlq': 'dead letters',
  'juego.hud.tiempo': 's',
  'juego.cola': 'queue · incoming',
  'juego.servicios': 'services',
  'juego.ruta.pago': '/payments',
  'juego.ruta.reserva': '/bookings',
  'juego.ruta.aviso': '/alerts',
  'juego.msg': 'POST {ruta}',
  'juego.webhook': 'webhook x2',
  'juego.caido': 'down',
  'juego.pista': 'this one goes to {ruta}, press {tecla}',
  'juego.ayuda':
    'Tap a message and then its service, or use keys 1, 2 and 3 (they route the selected one or the oldest). Dashed ones are urgent webhooks: worth double and expire sooner. Every 5 correct in a row raises the multiplier. Esc to exit.',
  'juego.ok': '200 OK +{pts}',
  'juego.bad': '400 Bad Request',
  'juego.timeout': '504 Timeout',
  'juego.incidente.pico': 'incident: traffic spike',
  'juego.incidente.caido': 'incident: {ruta} down (503)',
  'juego.incidente.deploy': 'deploy in progress: services are reordering',
  'juego.logro': 'Achievement: {nombre}',
  'juego.logroRecompensa': 'Achievement: {nombre} · + {recompensa}',

  // Game: post-mortem
  'juego.fin.titulo': '// post-mortem: end of shift',
  'juego.fin.caida': '// post-mortem: the system went down (5 dead letters)',
  'juego.fin.pts': '{n} pts',
  'juego.fin.entregados': 'delivered',
  'juego.fin.dlq': 'dead letters',
  'juego.fin.racha': 'best streak',
  'juego.fin.puntos': 'score',
  'juego.fin.record': 'high score',
  'juego.fin.peor': 'worst moment',
  'juego.fin.peorValor': '{n} queued at {s} s',
  'juego.fin.nuevoRecord': 'New high score. Carlos winks at you.',
  'juego.fin.puente': 'This, but for real, is what I do at Top Doctors.',
  'juego.fin.verExperiencia': 'See experience',
  'juego.fin.verProyectos': 'See projects',
  'juego.compartir': 'Share result',
  'juego.compartido': 'Shared',
  'juego.copiado': 'Copied to clipboard',
  'juego.copiarError': 'Couldn’t copy it. Copy it by hand: {texto}',
  'juego.compartirTexto': 'I survived an on-call shift as Carlos: {n} pts',
  'juego.compartirCopia': '{texto} — {url}',
  'juego.url': 'https://www.cvidal.dev/en/',
  'juego.otra': 'Play again',
  'juego.volver': 'Back',
  'juego.verLogros': 'See achievements',

  // Game: achievements panel
  'logros.panel.titulo': 'Achievements',
  'logros.panel.cerrar': 'Close',
  'vitrina.intro': 'Saved only in this browser.',
  'vitrina.oculto': '???',
  'vitrina.recompensa': 'Reward: {r}',
  'vitrina.progreso.racha': 'best streak: {n}/{meta}',
  'vitrina.progreso.hooks': 'webhooks: {n}/{meta}',
  'vitrina.progreso.mil': 'points: {n}/{meta}',
  'vitrina.gafas': 'Sunglasses',
  'vitrina.cadenas': 'Chains',
  'vitrina.usarAzul': 'Use blue ink',
  'vitrina.usarVerde': 'Use terminal green',
  'vitrina.volverRojo': 'Back to red',
  'vitrina.record': 'High score',
  'vitrina.puntos': '{n} points',

  // Footer
  'footer.copy': '© 2026 Carlos Vidal',
  'footer.subir': 'Back to top',

  // 404
  'error404.titulo': 'Page not found',
  'error404.descripcion': 'The page you are looking for does not exist.',
  'error404.texto': 'This page does not exist',
  'error404.volver': 'Back to home',
};
