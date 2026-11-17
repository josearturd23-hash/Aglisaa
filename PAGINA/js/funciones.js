// ===== CALCULADORA DE AGUA =====
(function () {
    'use strict';

    const abrirCalculadora = document.getElementById('abrirCalculadora');
    const cerrarCalculadora = document.getElementById('cerrarCalculadora');
    const modalCalculadora = document.getElementById('modalCalculadora');
    const formularioCalculadora = document.getElementById('formularioCalculadora');
    const pasosCalculadora = document.querySelectorAll('.paso-calculadora');
    const botonAnterior = document.getElementById('botonAnterior');
    const botonSiguiente = document.getElementById('botonSiguiente');
    const numeroPregunta = document.getElementById('numeroPregunta');
    const porcentajePregunta = document.getElementById('porcentajePregunta');
    const avanceProgreso = document.getElementById('avanceProgreso');
    const mensajeCalculadora = document.getElementById('mensajeCalculadora');
    const resultadoCalculadora = document.getElementById('resultadoCalculadora');
    const tituloResultado = document.getElementById('tituloResultado');
    const litrosResultado = document.getElementById('litrosResultado');
    const rellenoMedidor = document.getElementById('rellenoMedidor');
    const textoResultado = document.getElementById('textoResultado');
    const desgloseResultado = document.getElementById('desgloseResultado');
    const consejoAgua = document.getElementById('consejoAgua');
    const botonReiniciar = document.getElementById('botonReiniciar');

    if (!abrirCalculadora || !modalCalculadora || !formularioCalculadora || pasosCalculadora.length === 0) {
        return;
    }

    // ---------- VALORES QUE USA LA CALCULADORA ----------
    // Son estimaciones promedio. Las fuentes (CONAGUA, PROFECO, URSEA y otras)
    // dan rangos distintos, por eso se eligieron valores intermedios.
    // Si tu profesora prefiere otros, solo cambia los números de aquí.
    const valores = {
        // Litros que salen de la regadera por minuto (entre 9 y 15 en regaderas comunes)
        litrosPorMinutoRegadera: 12,

        // Si cierras la regadera al enjabonarte, se usa solo una parte del tiempo.
        // (Cerrarla ahorra entre 20 y 30 litros por baño)
        factorEnjabonar: { siempre: 0.7, aveces: 0.85, nunca: 1 },

        // Litros que se gastan en cada cepillado de dientes
        litrosPorCepillado: { siempre: 1, aveces: 3.5, nunca: 6 },

        // Litros que se gastan cada vez que te lavas las manos
        litrosPorLavadoManos: { siempre: 1.5, aveces: 3, nunca: 5 },

        // Litros por cada descarga del inodoro
        litrosPorDescarga: { botones: 4, palanca: 10, nosabe: 10 },

        // Litros que se gastan en cada lavada de platos
        litrosPorLavadaPlatos: { siempre: 12, aveces: 25, nunca: 40 },

        // Litros que gasta una lavadora en cada lavada
        litrosPorLavadaRopa: 70,

        // Minutos de regadera que se consideran un buen hábito
        minutosDuchaIdeal: 5,

        // Litros al día que se usan como referencia
        referenciaDiaria: 100
    };

    // Actividades que aparecen en el desglose del resultado
    const categorias = [
        { clave: 'ducha', nombre: 'Regadera', icono: 'fa-shower' },
        { clave: 'dientes', nombre: 'Cepillado de dientes', icono: 'fa-tooth' },
        { clave: 'manos', nombre: 'Lavado de manos', icono: 'fa-hands-bubbles' },
        { clave: 'bano', nombre: 'Inodoro', icono: 'fa-toilet' },
        { clave: 'platos', nombre: 'Lavar platos', icono: 'fa-utensils' },
        { clave: 'ropa', nombre: 'Lavar ropa', icono: 'fa-shirt' }
    ];

    let pasoActual = 0;

    // ---------- Contadores con botones + y - ----------
    function actualizarUnidad(paso) {
        const numero = paso.querySelector('.numero-contador');
        const unidad = paso.querySelector('.unidad-contador');

        unidad.textContent =
            Number(numero.textContent) === 1
                ? paso.dataset.singular
                : paso.dataset.plural;
    }

    function reiniciarContadores() {
        pasosCalculadora.forEach(function (paso) {
            if (paso.dataset.tipo !== 'numero') {
                return;
            }

            paso.querySelector('.numero-contador').textContent = paso.dataset.inicial;
            actualizarUnidad(paso);
        });
    }

    pasosCalculadora.forEach(function (paso) {
        if (paso.dataset.tipo !== 'numero') {
            return;
        }

        const minimo = Number(paso.dataset.minimo);
        const maximo = Number(paso.dataset.maximo);
        const numero = paso.querySelector('.numero-contador');

        paso.querySelectorAll('.boton-contador').forEach(function (boton) {
            boton.addEventListener('click', function () {
                const nuevo = Number(numero.textContent) + Number(boton.dataset.cambio);

                numero.textContent = Math.min(Math.max(nuevo, minimo), maximo);
                actualizarUnidad(paso);
            });
        });
    });

    // ---------- Abrir y cerrar ----------
    function mostrarCalculadora() {
        modalCalculadora.classList.add('activo');
        modalCalculadora.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    }

    function ocultarCalculadora() {
        modalCalculadora.classList.remove('activo');
        modalCalculadora.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    }

    // ---------- Mostrar la pregunta actual ----------
    function mostrarPaso() {
        const total = pasosCalculadora.length;
        const numero = pasoActual + 1;
        const porcentaje = Math.round((numero / total) * 100);

        pasosCalculadora.forEach(function (paso, indice) {
            paso.classList.toggle('paso-activo', indice === pasoActual);
        });

        numeroPregunta.textContent = `Pregunta ${numero} de ${total}`;
        porcentajePregunta.textContent = `${porcentaje}%`;
        avanceProgreso.style.width = `${porcentaje}%`;

        mensajeCalculadora.textContent = '';

        botonAnterior.classList.toggle('activo', pasoActual > 0);

        if (pasoActual === total - 1) {
            botonSiguiente.innerHTML = `
                Calcular resultado
                <i class="fa-solid fa-calculator"></i>
            `;
        } else {
            botonSiguiente.innerHTML = `
                Siguiente
                <i class="fa-solid fa-arrow-right"></i>
            `;
        }
    }

    // Las preguntas con contador siempre tienen respuesta; las de opciones, no
    function preguntaRespondida() {
        const paso = pasosCalculadora[pasoActual];

        if (paso.dataset.tipo === 'numero') {
            return true;
        }

        return paso.querySelector('input[type="radio"]:checked') !== null;
    }

    // ---------- Leer las respuestas ----------
    function leerRespuestas() {
        const respuestas = {};

        pasosCalculadora.forEach(function (paso) {
            const nombre = paso.dataset.nombre;

            if (paso.dataset.tipo === 'numero') {
                respuestas[nombre] = Number(
                    paso.querySelector('.numero-contador').textContent
                );
            } else {
                const elegida = paso.querySelector('input[type="radio"]:checked');

                respuestas[nombre] = elegida ? elegida.value : 'nunca';
            }
        });

        return respuestas;
    }

    // ---------- Calcular los litros al día ----------
    // Si "mejorado" es true, calcula cómo quedaría con los mejores hábitos
    function calcularGastos(respuestas, mejorado) {
        function habito(nombre) {
            return mejorado ? 'siempre' : respuestas[nombre];
        }

        const minutos = mejorado
            ? Math.min(respuestas.minutosDucha, valores.minutosDuchaIdeal)
            : respuestas.minutosDucha;

        // Se supone que la persona se baña todos los días
        const ducha = minutos *
            valores.litrosPorMinutoRegadera *
            valores.factorEnjabonar[habito('regaderaJabon')];

        const dientes = respuestas.vecesDientes *
            valores.litrosPorCepillado[habito('llaveDientes')];

        const manos = respuestas.vecesManos *
            valores.litrosPorLavadoManos[habito('llaveManos')];

        const bano = respuestas.vecesBano *
            valores.litrosPorDescarga[respuestas.tipoInodoro];

        // Las veces por semana se pasan a un promedio por día
        const platos = respuestas.vecesPlatos *
            valores.litrosPorLavadaPlatos[habito('llavePlatos')] / 7;

        // El agua de la ropa se reparte entre las personas de la casa
        const ropa = respuestas.lavadasRopa *
            valores.litrosPorLavadaRopa / respuestas.personasCasa / 7;

        return {
            ducha: ducha,
            dientes: dientes,
            manos: manos,
            bano: bano,
            platos: platos,
            ropa: ropa
        };
    }

    function sumarGastos(gastos) {
        return Object.keys(gastos).reduce(function (suma, clave) {
            return suma + gastos[clave];
        }, 0);
    }

    // ---------- Mostrar el resultado ----------
    function mostrarResultado() {
        const respuestas = leerRespuestas();
        const gastos = calcularGastos(respuestas, false);
        const gastosMejorados = calcularGastos(respuestas, true);

        const total = sumarGastos(gastos);
        const ahorro = Math.round(total - sumarGastos(gastosMejorados));

        // Título según los litros
        if (total <= valores.referenciaDiaria) {
            tituloResultado.textContent = '¡Excelente, cuidas muy bien el agua!';
        } else if (total <= valores.referenciaDiaria * 1.5) {
            tituloResultado.textContent = '¡Vas por buen camino!';
        } else {
            tituloResultado.textContent = '¡Puedes convertirte en un guardián del agua!';
        }

        litrosResultado.textContent = Math.round(total);

        // La barra llega al 100% con el doble de la referencia
        const proporcion = Math.min(total / (valores.referenciaDiaria * 2), 1);

        rellenoMedidor.style.width = '0%';

        setTimeout(function () {
            rellenoMedidor.style.width = (proporcion * 100) + '%';
        }, 50);

        // Desglose por actividad
        desgloseResultado.textContent = '';

        const mayorGasto = Math.max.apply(null, categorias.map(function (categoria) {
            return gastos[categoria.clave];
        }));

        let categoriaMayor = categorias[0];

        categorias.forEach(function (categoria) {
            const litros = gastos[categoria.clave];

            const fila = document.createElement('div');
            fila.className = 'fila-desglose';

            const datos = document.createElement('div');
            datos.className = 'datos-desglose';

            const icono = document.createElement('i');
            icono.classList.add('fa-solid', categoria.icono);

            const nombre = document.createElement('span');
            nombre.className = 'nombre-desglose';
            nombre.textContent = categoria.nombre;

            const cantidad = document.createElement('span');
            cantidad.className = 'litros-desglose';
            cantidad.textContent = Math.round(litros) + ' L';

            datos.appendChild(icono);
            datos.appendChild(nombre);
            datos.appendChild(cantidad);

            const barra = document.createElement('div');
            barra.className = 'barra-desglose';

            const relleno = document.createElement('span');
            relleno.style.width =
                mayorGasto > 0 ? (litros / mayorGasto) * 100 + '%' : '0%';

            barra.appendChild(relleno);

            fila.appendChild(datos);
            fila.appendChild(barra);
            desgloseResultado.appendChild(fila);

            if (litros === mayorGasto) {
                categoriaMayor = categoria;
            }
        });

        textoResultado.textContent =
            'Lo que más agua gasta en tu día: ' +
            categoriaMayor.nombre.toLowerCase() +
            ' (' + Math.round(mayorGasto) + ' litros).';

        // Consejo con el ahorro posible
        if (ahorro >= 5) {
            consejoAgua.textContent =
                'Si te bañas en 5 minutos y cierras la llave al enjabonarte, al cepillarte, ' +
                'al lavarte las manos y al lavar platos, podrías ahorrar unos ' + ahorro +
                ' litros al día (unos ' + (ahorro * 30) + ' litros al mes).';
        } else {
            consejoAgua.textContent =
                '¡Ya tienes muy buenos hábitos! Cuéntales a tu familia y a tus compañeros cómo lo haces.';
        }

        formularioCalculadora.style.display = 'none';
        resultadoCalculadora.classList.add('activo');

        // Se guarda el resultado en "Mi progreso"
        if (window.Progreso) {
            Progreso.guardarConsumo(Math.round(total));
        }
    }

    // ---------- Botones ----------
    abrirCalculadora.addEventListener('click', mostrarCalculadora);

    // Otros botones que también abren la calculadora (por ejemplo, en "Mi progreso")
    document.querySelectorAll('[data-abrir-calculadora]').forEach(function (boton) {
        boton.addEventListener('click', mostrarCalculadora);
    });

    cerrarCalculadora.addEventListener('click', ocultarCalculadora);

    modalCalculadora.addEventListener('click', function (evento) {
        if (evento.target === modalCalculadora) {
            ocultarCalculadora();
        }
    });

    botonSiguiente.addEventListener('click', function () {
        if (!preguntaRespondida()) {
            mensajeCalculadora.textContent = 'Elige una respuesta para continuar.';
            return;
        }

        if (pasoActual === pasosCalculadora.length - 1) {
            mostrarResultado();
            return;
        }

        pasoActual++;
        mostrarPaso();
    });

    botonAnterior.addEventListener('click', function () {
        if (pasoActual > 0) {
            pasoActual--;
            mostrarPaso();
        }
    });

    botonReiniciar.addEventListener('click', function () {
        formularioCalculadora.reset();
        reiniciarContadores();

        pasoActual = 0;

        formularioCalculadora.style.display = 'block';
        resultadoCalculadora.classList.remove('activo');

        mostrarPaso();
    });

    document.addEventListener('keydown', function (evento) {
        if (evento.key === 'Escape') {
            ocultarCalculadora();
        }
    });

    reiniciarContadores();
    mostrarPaso();
})();

// ===== MASCOTA GOTI (SE PUEDE CREAR MÁS DE UNA) =====
function crearMascota(configuracion) {
    const boton = document.getElementById(configuracion.idBoton);
    const svg = document.getElementById(configuracion.idSvg);
    const globo = document.getElementById(configuracion.idGlobo);
    const texto = globo ? globo.querySelector('.mascota-texto') : null;

    if (!boton || !svg || !globo || !texto) {
        return null;
    }

    const salto = svg.querySelector('.goti-salto');
    const pupilas = svg.querySelector('.goti-pupilas');
    const frases = configuracion.frases || [];
    const menosMovimiento = window.matchMedia(
        '(prefers-reduced-motion: reduce)'
    ).matches;

    let indice = 0;
    let temporizadorAnimo = null;
    let intervaloFrases = null;

    function ponerAnimo(animo, duracion) {
        svg.classList.remove(
            'animo-feliz',
            'animo-contenta',
            'animo-triste',
            'animo-sorprendida'
        );
        svg.classList.add('animo-' + animo);

        clearTimeout(temporizadorAnimo);

        if (duracion) {
            temporizadorAnimo = setTimeout(function () {
                ponerAnimo('feliz');
            }, duracion);
        }
    }

    function decir(mensaje) {
        globo.classList.remove('cambia');
        void globo.offsetWidth;
        texto.textContent = mensaje;
        globo.classList.add('cambia');
    }

    function siguienteFrase() {
        indice = (indice + 1) % frases.length;
        decir(frases[indice]);
    }

    function saltar() {
        if (!salto) {
            return;
        }

        salto.classList.remove('salta');
        void salto.getBoundingClientRect();
        salto.classList.add('salta');
    }

    function reiniciarIntervalo() {
        clearInterval(intervaloFrases);

        intervaloFrases = setInterval(function () {
            if (!document.hidden) {
                siguienteFrase();
            }
        }, 10000);
    }

    boton.addEventListener('click', function () {
        saltar();
        ponerAnimo('sorprendida', 900);

        if (frases.length > 1) {
            siguienteFrase();
            reiniciarIntervalo();
        }
    });

    if (salto) {
        salto.addEventListener('animationend', function () {
            salto.classList.remove('salta');
        });
    }

    // Los ojos siguen al cursor
    if (pupilas && !menosMovimiento) {
        let ultimoX = 0;
        let ultimoY = 0;
        let pendiente = false;

        function moverOjos() {
            pendiente = false;

            const caja = svg.getBoundingClientRect();
            const centroX = caja.left + caja.width / 2;
            const centroY = caja.top + caja.height * 0.57;
            const dx = ultimoX - centroX;
            const dy = ultimoY - centroY;
            const distancia = Math.hypot(dx, dy) || 1;
            const fuerza = Math.min(distancia / 150, 1) * 5;

            pupilas.style.transform =
                'translate(' + (dx / distancia) * fuerza + 'px, ' +
                (dy / distancia) * fuerza + 'px)';
        }

        document.addEventListener('mousemove', function (evento) {
            ultimoX = evento.clientX;
            ultimoY = evento.clientY;

            if (!pendiente) {
                pendiente = true;
                requestAnimationFrame(moverOjos);
            }
        });
    }

    if (frases.length > 0) {
        decir(frases[0]);
    }

    if (frases.length > 1) {
        reiniciarIntervalo();
    }

    return {
        decir: decir,
        animo: ponerAnimo,
        saltar: saltar
    };
}

// Goti de la portada. Para usarlo desde otras partes:
// Goti.decir('¡Muy bien!'); Goti.animo('contenta', 3000); Goti.saltar();
window.Goti = crearMascota({
    idBoton: 'mascotaBoton',
    idSvg: 'gotiSvg',
    idGlobo: 'mascotaGlobo',
    frases: [
        '¡Hola! Soy Goti y te voy a ayudar a cuidar el agua.',
        'El ODS 6 busca que todas las personas tengan agua limpia y baños seguros.',
        'Si cierras la llave mientras te cepillas los dientes, no desperdicias agua.',
        'Una llave que gotea parece poca cosa, pero el agua se va sumando cada día.',
        'El agua dulce es limitada, por eso hay que cuidarla entre todos.',
        'Lavarte las manos con agua y jabón ayuda a evitar enfermedades.',
        '¿Quieres saber cuánta agua usas? Prueba la calculadora.'
    ]
});

// ===== SELECTOR DE NIVEL (PRIMARIA / SECUNDARIA) =====
(function () {
    'use strict';

    const contenedor = document.querySelector('.contenido-nivel');
    const selector = document.querySelector('.selector-nivel');
    const botones = document.querySelectorAll('.boton-nivel');

    if (!contenedor || botones.length === 0) {
        return;
    }

    function aplicarNivel(nivel) {
        contenedor.dataset.nivel = nivel;

        botones.forEach(function (boton) {
            const activo = boton.dataset.nivel === nivel;

            boton.classList.toggle('activo', activo);
            boton.setAttribute('aria-pressed', activo ? 'true' : 'false');
        });
    }

    function nivelBloqueado() {
        return selector !== null && selector.classList.contains('nivel-fijo');
    }

    botones.forEach(function (boton) {
        boton.addEventListener('click', function () {
            if (nivelBloqueado()) {
                return;
            }

            aplicarNivel(boton.dataset.nivel);
        });
    });

    // Usuario con cuenta: su nivel ya está elegido, así que solo se muestra el suyo y no se puede cambiar
    function fijarNivel(nivel) {
        aplicarNivel(nivel);

        if (selector) {
            selector.classList.add('nivel-fijo');
            selector.setAttribute('aria-label', 'Tu nivel');
        }

        botones.forEach(function (boton) {
            const esDelUsuario = boton.dataset.nivel === nivel;

            boton.hidden = !esDelUsuario;
            boton.tabIndex = -1;
        });
    }

    // Invitado: todavía no eligió nivel, así que puede ver los dos
    function liberarNivel() {
        if (selector) {
            selector.classList.remove('nivel-fijo');
            selector.setAttribute('aria-label', 'Elige tu nivel');
        }

        botones.forEach(function (boton) {
            boton.hidden = false;
            boton.removeAttribute('tabindex');
        });
    }

    // Para cambiar el nivel desde otras partes: NivelEducativo.aplicar('secundaria')
    window.NivelEducativo = {
        aplicar: aplicarNivel,
        fijar: fijarNivel,
        liberar: liberarNivel
    };
})();

// ===== CONEXIÓN CON LA BASE DE DATOS EN LÍNEA (SUPABASE) =====
// Maneja las cuentas y guarda el progreso de cada alumno en la nube.
window.Nube = (function () {
    'use strict';

    const URL_SUPABASE = 'https://fmcdejkuwqjollfrxwug.supabase.co';
    const CLAVE_PUBLICA = 'sb_publishable_Jo3zW7PJai0qzRLHmdZxKA_Li-ijF7l';

    // Los alumnos no tienen correo: se arma uno interno a partir de su usuario.
    // Nunca se envía ningún mensaje a esa dirección.
    const DOMINIO_CORREO = 'aglisaods6.netlify.app';

    let cliente = null;

    try {
        if (window.supabase) {
            cliente = window.supabase.createClient(URL_SUPABASE, CLAVE_PUBLICA, {
                auth: {
                    // La sesión se cierra al cerrar la pestaña (útil en computadoras compartidas)
                    storage: window.sessionStorage,
                    persistSession: true,
                    autoRefreshToken: true
                }
            });
        }
    } catch (error) {
        cliente = null;
    }

    function disponible() {
        return cliente !== null;
    }

    function correoDe(usuario) {
        return usuario.trim().toLowerCase() + '@' + DOMINIO_CORREO;
    }

    // De la tabla (snake_case) al formato que usa el sitio (camelCase)
    function deFila(fila) {
        return {
            consumoPrimero: fila.consumo_primero,
            consumoUltimo: fila.consumo_ultimo,
            quizPrimero: fila.quiz_primero,
            quizMejor: fila.quiz_mejor,
            quizTotal: fila.quiz_total || 0,
            compromisos: Array.isArray(fila.compromisos) ? fila.compromisos : [],
            juegoJugado: Boolean(fila.juego_jugado),
            juegoGanado: Boolean(fila.juego_ganado),
            juegoRecord: fila.juego_record || 0
        };
    }

    function aFila(datos, id) {
        return {
            id: id,
            consumo_primero: datos.consumoPrimero,
            consumo_ultimo: datos.consumoUltimo,
            quiz_primero: datos.quizPrimero,
            quiz_mejor: datos.quizMejor,
            quiz_total: datos.quizTotal,
            compromisos: datos.compromisos,
            juego_jugado: datos.juegoJugado,
            juego_ganado: datos.juegoGanado,
            juego_record: datos.juegoRecord,
            actualizado: new Date().toISOString()
        };
    }

    // Trae el perfil y el progreso del usuario que ya inició sesión
    async function cargarTodo(usuarioAuth) {
        const respuestaPerfil = await cliente
            .from('perfiles')
            .select('usuario, escuela, nivel')
            .eq('id', usuarioAuth.id)
            .maybeSingle();

        if (respuestaPerfil.error) {
            console.warn('AGLISA: no se pudo leer el perfil.', respuestaPerfil.error);
            return { ok: false, motivo: 'error' };
        }

        let perfil = respuestaPerfil.data;

        // Si el registro se cortó a la mitad, el perfil se repara con los datos guardados al crear la cuenta
        if (!perfil) {
            const meta = usuarioAuth.user_metadata || {};

            if (!meta.usuario || !meta.escuela || !meta.nivel) {
                return { ok: false, motivo: 'error' };
            }

            perfil = { usuario: meta.usuario, escuela: meta.escuela, nivel: meta.nivel };

            const reparado = await cliente.from('perfiles').insert({
                id: usuarioAuth.id,
                usuario: perfil.usuario,
                escuela: perfil.escuela,
                nivel: perfil.nivel
            });

            if (reparado.error) {
                console.warn('AGLISA: no se pudo reparar el perfil.', reparado.error);
                return { ok: false, motivo: 'error' };
            }
        }

        const respuestaProgreso = await cliente
            .from('progreso')
            .select('*')
            .eq('id', usuarioAuth.id)
            .maybeSingle();

        if (respuestaProgreso.error) {
            console.warn('AGLISA: no se pudo leer el progreso.', respuestaProgreso.error);
            return { ok: false, motivo: 'error' };
        }

        return {
            ok: true,
            perfil: perfil,
            progreso: respuestaProgreso.data ? deFila(respuestaProgreso.data) : null
        };
    }

    async function registrar(usuario, contrasena, escuela, nivel) {
        if (!cliente) {
            return { ok: false, motivo: 'sin-conexion' };
        }

        try {
            const respuesta = await cliente.auth.signUp({
                email: correoDe(usuario),
                password: contrasena,
                options: { data: { usuario: usuario, escuela: escuela, nivel: nivel } }
            });

            if (respuesta.error) {
                const texto = String(respuesta.error.message || '');

                if (respuesta.error.code === 'user_already_exists' || /already registered/i.test(texto)) {
                    return { ok: false, motivo: 'ya-existe' };
                }

                console.warn('AGLISA: error al crear la cuenta.', respuesta.error);
                return { ok: false, motivo: 'error' };
            }

            // Sin sesión significa que Supabase todavía pide confirmar el correo
            if (!respuesta.data.session) {
                return { ok: false, motivo: 'confirmacion' };
            }

            const id = respuesta.data.user.id;

            const perfilCreado = await cliente.from('perfiles').insert({
                id: id,
                usuario: usuario,
                escuela: escuela,
                nivel: nivel
            });

            if (perfilCreado.error) {
                console.warn('AGLISA: no se pudo guardar el perfil.', perfilCreado.error);
                return { ok: false, motivo: 'error' };
            }

            const progresoCreado = await cliente.from('progreso').insert({ id: id });

            if (progresoCreado.error) {
                console.warn('AGLISA: no se pudo crear el progreso.', progresoCreado.error);
                return { ok: false, motivo: 'error' };
            }

            return {
                ok: true,
                perfil: { usuario: usuario, escuela: escuela, nivel: nivel },
                progreso: null
            };
        } catch (error) {
            console.warn('AGLISA: sin conexión al registrar.', error);
            return { ok: false, motivo: 'sin-conexion' };
        }
    }

    async function iniciar(usuario, contrasena) {
        if (!cliente) {
            return { ok: false, motivo: 'sin-conexion' };
        }

        try {
            const respuesta = await cliente.auth.signInWithPassword({
                email: correoDe(usuario),
                password: contrasena
            });

            if (respuesta.error) {
                const texto = String(respuesta.error.message || '');

                if (respuesta.error.code === 'invalid_credentials' || /invalid login/i.test(texto)) {
                    return { ok: false, motivo: 'datos-incorrectos' };
                }

                console.warn('AGLISA: error al iniciar sesión.', respuesta.error);
                return { ok: false, motivo: 'error' };
            }

            return await cargarTodo(respuesta.data.user);
        } catch (error) {
            console.warn('AGLISA: sin conexión al iniciar sesión.', error);
            return { ok: false, motivo: 'sin-conexion' };
        }
    }

    // Al recargar la página: recupera la sesión que sigue abierta en esta pestaña
    async function recuperarSesion() {
        if (!cliente) {
            return { ok: false, motivo: 'sin-conexion' };
        }

        try {
            const respuesta = await cliente.auth.getSession();

            if (respuesta.error || !respuesta.data.session) {
                return { ok: false, motivo: 'sin-sesion' };
            }

            return await cargarTodo(respuesta.data.session.user);
        } catch (error) {
            return { ok: false, motivo: 'sin-conexion' };
        }
    }

    // Guarda el progreso completo del usuario (se llama cada vez que cambia algo)
    async function guardarProgreso(datos) {
        if (!cliente) {
            return;
        }

        try {
            const sesion = await cliente.auth.getSession();

            if (!sesion.data || !sesion.data.session) {
                return;
            }

            const respuesta = await cliente
                .from('progreso')
                .upsert(aFila(datos, sesion.data.session.user.id));

            if (respuesta.error) {
                console.warn('AGLISA: no se pudo guardar el progreso.', respuesta.error);
            }
        } catch (error) {
            console.warn('AGLISA: sin conexión al guardar el progreso.', error);
        }
    }

    async function cerrarSesion() {
        if (!cliente) {
            return;
        }

        try {
            await cliente.auth.signOut();
        } catch (error) {
            // Si falla, la sesión igual se cierra al cerrar la pestaña
        }
    }

    return {
        disponible: disponible,
        registrar: registrar,
        iniciar: iniciar,
        recuperarSesion: recuperarSesion,
        guardarProgreso: guardarProgreso,
        cerrarSesion: cerrarSesion
    };
})();

// ===== MI PROGRESO =====
// Guarda los resultados de cada usuario y los muestra en la sección "Mi progreso".
// Para usarlo desde otras partes:
// Progreso.guardarConsumo(120); Progreso.guardarQuiz(5, 7); Progreso.guardarCompromisos([0, 2]);
// Progreso.guardarJuego(true, 25);
window.Progreso = (function () {
    'use strict';

    const claveProgreso = 'aglisaProgreso';
    const claveSesion = 'aglisaSesion';

    const niveles = ['Gotita', 'Arroyo', 'Río', 'Océano'];

    // El progreso del invitado solo vive mientras la página está abierta
    let progresoInvitado = progresoVacio();
    // El progreso del usuario con cuenta se descarga al entrar y se guarda en la nube
    let progresoUsuario = null;
    let nivelAnterior = null;

    function progresoVacio() {
        return {
            consumoPrimero: null,
            consumoUltimo: null,
            quizPrimero: null,
            quizMejor: null,
            quizTotal: 0,
            compromisos: [],
            juegoJugado: false,
            juegoGanado: false,
            juegoRecord: 0
        };
    }

    // Devuelve el usuario que inició sesión, o null si es invitado
    function usuarioActual() {
        try {
            const sesion = JSON.parse(sessionStorage.getItem(claveSesion) || 'null');

            if (!sesion || sesion.invitado) {
                return null;
            }

            return sesion.usuario.toLowerCase();
        } catch (error) {
            return null;
        }
    }

    function leer() {
        const usuario = usuarioActual();

        if (usuario === null) {
            return progresoInvitado;
        }

        return Object.assign(progresoVacio(), progresoUsuario);
    }

    function guardar(datos) {
        const usuario = usuarioActual();

        if (usuario === null) {
            progresoInvitado = datos;
            return;
        }

        progresoUsuario = datos;

        // Se guarda en la nube sin hacer esperar al alumno
        if (window.Nube) {
            Nube.guardarProgreso(datos);
        }
    }

    // Se llama al entrar con una cuenta: recibe el progreso descargado de la nube
    function establecer(datos) {
        progresoUsuario = Object.assign(progresoVacio(), datos || {});
    }

    // Se llama al salir: borra de la memoria el progreso del usuario
    function limpiar() {
        progresoUsuario = null;
    }

    // ---------- Guardar resultados ----------
    function guardarConsumo(litros) {
        const datos = leer();

        if (datos.consumoPrimero === null) {
            datos.consumoPrimero = litros;
        }

        datos.consumoUltimo = litros;

        guardar(datos);
        mostrar();
    }

    function guardarQuiz(aciertos, total) {
        const datos = leer();

        if (datos.quizPrimero === null) {
            datos.quizPrimero = aciertos;
        }

        if (datos.quizMejor === null || aciertos > datos.quizMejor) {
            datos.quizMejor = aciertos;
        }

        datos.quizTotal = total;

        guardar(datos);
        mostrar();
    }

    function guardarCompromisos(lista) {
        const datos = leer();

        datos.compromisos = lista;

        guardar(datos);
        mostrar();
    }

    function leerCompromisos() {
        return leer().compromisos;
    }

    function guardarJuego(gano, llavesCerradas) {
        const datos = leer();

        datos.juegoJugado = true;

        if (gano) {
            datos.juegoGanado = true;
        }

        if (llavesCerradas > datos.juegoRecord) {
            datos.juegoRecord = llavesCerradas;
        }

        guardar(datos);
        mostrar();
    }

    // ---------- Mostrar la sección ----------
    function ponerTexto(id, texto) {
        const elemento = document.getElementById(id);

        if (elemento) {
            elemento.textContent = texto;
        }
    }

    function mostrar() {
        const datos = leer();
        const totalCompromisos = document.querySelectorAll('.compromiso').length;
        const compromisosHechos = datos.compromisos.length;

        // Aviso para el invitado
        const avisoInvitado = document.getElementById('avisoInvitado');

        if (avisoInvitado) {
            avisoInvitado.hidden = usuarioActual() !== null;
        }

        // Tarjeta del consumo de agua
        if (datos.consumoUltimo === null) {
            ponerTexto('cifraConsumo', '—');
            ponerTexto('textoConsumo', 'Todavía no usas la calculadora. ¡Descubre cuánta agua gastas!');
        } else {
            const diferencia = datos.consumoPrimero - datos.consumoUltimo;

            ponerTexto('cifraConsumo', datos.consumoUltimo + ' L al día');

            if (diferencia > 0) {
                ponerTexto('textoConsumo', 'La primera vez gastabas ' + datos.consumoPrimero +
                    ' litros al día. ¡Bajaste ' + diferencia + ' litros!');
            } else if (diferencia < 0) {
                ponerTexto('textoConsumo', 'La primera vez gastabas ' + datos.consumoPrimero +
                    ' litros al día. Subiste ' + (-diferencia) + ' litros, ¡tú puedes bajarlo!');
            } else {
                ponerTexto('textoConsumo', 'Prueba los consejos de la calculadora y vuelve a ' +
                    'calcular para ver si bajas tu consumo.');
            }
        }

        // Tarjeta del quiz
        if (datos.quizMejor === null) {
            ponerTexto('cifraQuiz', '—');
            ponerTexto('textoQuiz', 'Todavía no juegas el quiz de mitos y verdades.');
        } else {
            ponerTexto('cifraQuiz', datos.quizMejor + ' de ' + datos.quizTotal);

            if (datos.quizMejor > datos.quizPrimero) {
                ponerTexto('textoQuiz', 'Tu primer intento fue ' + datos.quizPrimero + ' de ' +
                    datos.quizTotal + '. ¡Mejoraste ' + (datos.quizMejor - datos.quizPrimero) +
                    ' respuestas!');
            } else {
                ponerTexto('textoQuiz', 'Es tu mejor puntaje. Puedes jugar otra vez para mejorarlo.');
            }
        }

        // Tarjeta de los compromisos
        ponerTexto('cifraCompromisos', compromisosHechos + ' de ' + totalCompromisos);
        ponerTexto('textoCompromisosProgreso', compromisosHechos === 0
            ? 'Todavía no eliges ningún compromiso.'
            : 'Son las acciones que te comprometiste a hacer para cuidar el agua.');

        // Logros: true si ya se cumplió
        const logros = {
            calculadora: datos.consumoUltimo !== null,
            ahorro: datos.consumoUltimo !== null && datos.consumoUltimo < datos.consumoPrimero,
            quiz: datos.quizMejor !== null,
            quizPerfecto: datos.quizMejor !== null && datos.quizMejor === datos.quizTotal,
            compromisosMitad: compromisosHechos >= 4,
            compromisosTodos: totalCompromisos > 0 && compromisosHechos === totalCompromisos,
            juego: datos.juegoJugado,
            juegoGanado: datos.juegoGanado
        };

        // Récord del juego
        ponerTexto('recordJuego', datos.juegoJugado
            ? 'Tu récord: ' + datos.juegoRecord + ' llaves cerradas.'
            : '');

        let logrados = 0;

        document.querySelectorAll('.logro').forEach(function (logro) {
            const cumplido = logros[logro.dataset.logro] === true;

            logro.classList.toggle('logrado', cumplido);

            if (cumplido) {
                logrados++;
            }
        });

        // Nivel según los logros: con todos los logros se llega a Océano
        const totalLogros = Object.keys(logros).length;
        const indiceNivel = Math.floor(logrados / totalLogros * (niveles.length - 1));

        ponerTexto('nombreNivel', niveles[indiceNivel]);

        const avanceNivel = document.getElementById('avanceNivel');

        if (avanceNivel) {
            avanceNivel.style.width = (logrados / totalLogros) * 100 + '%';
        }

        if (logrados === totalLogros) {
            ponerTexto('textoNivel', '¡Completaste los ' + totalLogros +
                ' logros! Eres un verdadero guardián del agua.');
        } else {
            ponerTexto('textoNivel', 'Llevas ' + logrados + ' de ' + totalLogros +
                ' logros. Completa más para subir de nivel.');
        }

        // Goti felicita cuando se sube de nivel
        if (nivelAnterior !== null && indiceNivel > nivelAnterior && window.Goti) {
            Goti.animo('contenta', 4000);
            Goti.saltar();
            Goti.decir('¡Subiste al nivel ' + niveles[indiceNivel] + '! Sigue así.');
        }

        nivelAnterior = indiceNivel;
    }

    // Se llama cuando alguien entra o sale del sitio
    function cambiarUsuario() {
        nivelAnterior = null;
        mostrar();
    }

    // Al salir, se borra lo que hizo el invitado
    function borrarInvitado() {
        progresoInvitado = progresoVacio();
    }

    return {
        guardarConsumo: guardarConsumo,
        guardarQuiz: guardarQuiz,
        guardarCompromisos: guardarCompromisos,
        leerCompromisos: leerCompromisos,
        guardarJuego: guardarJuego,
        mostrar: mostrar,
        cambiarUsuario: cambiarUsuario,
        borrarInvitado: borrarInvitado,
        establecer: establecer,
        limpiar: limpiar
    };
})();

// ===== ACCESO: INICIO DE SESIÓN Y REGISTRO =====
(function () {
    'use strict';

    const pantallaAcceso = document.getElementById('pantallaAcceso');
    const sitio = document.getElementById('sitio');

    if (!pantallaAcceso || !sitio) {
        return;
    }

    const pasoInicio = document.getElementById('pasoInicio');
    const formularioIngreso = document.getElementById('formularioIngreso');
    const formularioRegistro = document.getElementById('formularioRegistro');
    const botonIrIngreso = document.getElementById('botonIrIngreso');
    const botonIrRegistro = document.getElementById('botonIrRegistro');
    const botonInvitado = document.getElementById('botonInvitado');
    const botonesVolver = document.querySelectorAll('[data-volver]');
    const casillasMostrar = document.querySelectorAll('[data-mostrar-contrasena]');
    const nombreUsuarioSesion = document.getElementById('nombreUsuarioSesion');
    const botonSalir = document.getElementById('botonSalir');

    const gotiAcceso = crearMascota({
        idBoton: 'mascotaBotonAcceso',
        idSvg: 'gotiSvgAcceso',
        idGlobo: 'globoAcceso',
        frases: []
    });

    const claveSesion = 'aglisaSesion';

    const mensajeInicio = '¡Hola! Soy Goti. ¿Ya tienes cuenta o eres nuevo?';

    const pasos = {
        inicio: pasoInicio,
        ingreso: formularioIngreso,
        registro: formularioRegistro
    };

    let ocupado = false;

    // ---------- Goti habla ----------
    function gotiDice(mensaje, animo) {
        if (!gotiAcceso) {
            return;
        }

        gotiAcceso.decir(mensaje);

        if (animo) {
            gotiAcceso.animo(animo, 2500);
        }
    }

    // ---------- Sesión de esta pestaña ----------
    function leerSesion() {
        try {
            return JSON.parse(sessionStorage.getItem(claveSesion) || 'null');
        } catch (error) {
            return null;
        }
    }

    function guardarSesion(sesion) {
        try {
            sessionStorage.setItem(claveSesion, JSON.stringify(sesion));
        } catch (error) {
            // Si no se puede guardar, la sesión dura mientras la página siga abierta
        }
    }

    function borrarSesion() {
        try {
            sessionStorage.removeItem(claveSesion);
        } catch (error) {
            // No pasa nada si no había nada que borrar
        }
    }

    // ---------- Pasos de la pantalla ----------
    function mostrarPaso(nombre) {
        Object.keys(pasos).forEach(function (clave) {
            pasos[clave].hidden = clave !== nombre;
        });
    }

    function limpiarFormularios() {
        formularioIngreso.reset();
        formularioRegistro.reset();

        document.getElementById('ingresoContrasena').type = 'password';
        document.getElementById('registroContrasena').type = 'password';
    }

    // ---------- Entrar y salir del sitio ----------
    function abrirSitio(sesion) {
        sitio.hidden = false;
        document.body.classList.remove('acceso-abierto');

        nombreUsuarioSesion.textContent =
            sesion.invitado ? 'Invitado' : sesion.usuario;

        if (window.NivelEducativo) {
            if (sesion.nivel) {
                NivelEducativo.fijar(sesion.nivel);
            } else {
                NivelEducativo.liberar();
            }
        }

        // Cada usuario ve sus propios compromisos y su propio progreso
        if (window.Compromisos) {
            Compromisos.cargar();
        }

        if (window.Progreso) {
            Progreso.cambiarUsuario();
        }

        window.scrollTo(0, 0);
        window.dispatchEvent(new Event('resize'));
    }

    function entrar(sesion, mensaje) {
        ocupado = true;

        guardarSesion(sesion);

        gotiDice(mensaje, 'contenta');

        if (gotiAcceso) {
            gotiAcceso.saltar();
        }

        setTimeout(function () {
            abrirSitio(sesion);
            pantallaAcceso.classList.add('saliendo');

            setTimeout(function () {
                pantallaAcceso.hidden = true;
                pantallaAcceso.classList.remove('saliendo');
                limpiarFormularios();
                mostrarPaso('inicio');
                ocupado = false;
            }, 500);
        }, 1500);
    }

    function salir() {
        borrarSesion();

        if (window.VentanaJuegos) {
            VentanaJuegos.cerrar();
            VentanaJuegos.reiniciarRecords();
        }

        if (window.Juego) {
            Juego.detener();
        }

        if (window.Progreso) {
            Progreso.borrarInvitado();
            Progreso.limpiar();
        }

        if (window.Nube) {
            Nube.cerrarSesion();
        }

        sitio.hidden = true;
        pantallaAcceso.hidden = false;
        document.body.classList.add('acceso-abierto');

        limpiarFormularios();
        mostrarPaso('inicio');

        gotiDice('¡Hasta pronto! Aquí estaré cuando quieras volver.', 'feliz');

        window.scrollTo(0, 0);
    }

    // ---------- Botones de la pantalla ----------
    botonIrIngreso.addEventListener('click', function () {
        mostrarPaso('ingreso');
        gotiDice('¡Qué bueno verte! Escribe tu usuario y tu contraseña.', 'contenta');
        document.getElementById('ingresoUsuario').focus();
    });

    botonIrRegistro.addEventListener('click', function () {
        mostrarPaso('registro');
        gotiDice('¡Vamos a crear tu cuenta! Inventa un nombre de usuario, no uses tu nombre real.', 'contenta');
        document.getElementById('registroUsuario').focus();
    });

    botonInvitado.addEventListener('click', function () {
        if (ocupado) {
            return;
        }

        entrar({ invitado: true }, '¡Pasa! Puedes crear tu cuenta cuando quieras.');
    });

    botonesVolver.forEach(function (boton) {
        boton.addEventListener('click', function () {
            mostrarPaso('inicio');
            gotiDice(mensajeInicio, 'feliz');
        });
    });

    casillasMostrar.forEach(function (casilla) {
        casilla.addEventListener('change', function () {
            const campo = document.getElementById(casilla.dataset.mostrarContrasena);

            if (campo) {
                campo.type = casilla.checked ? 'text' : 'password';
            }
        });
    });

    botonSalir.addEventListener('click', salir);

    // ---------- Inicio de sesión ----------
    formularioIngreso.addEventListener('submit', async function (evento) {
        evento.preventDefault();

        if (ocupado) {
            return;
        }

        if (!Nube.disponible()) {
            gotiDice('No pude conectarme. Revisa tu internet e inténtalo otra vez.', 'triste');
            return;
        }

        const usuario = document.getElementById('ingresoUsuario').value.trim();
        const contrasena = document.getElementById('ingresoContrasena').value;

        if (usuario === '' || contrasena === '') {
            gotiDice('Escribe tu usuario y tu contraseña.', 'triste');
            return;
        }

        ocupado = true;
        gotiDice('Un momento, estoy buscando tu cuenta...');

        const resultado = await Nube.iniciar(usuario, contrasena);

        ocupado = false;

        if (!resultado.ok) {
            if (resultado.motivo === 'datos-incorrectos') {
                gotiDice('Ese usuario o esa contraseña no son correctos. ¡Intenta otra vez!', 'triste');
            } else if (resultado.motivo === 'sin-conexion') {
                gotiDice('No pude conectarme. Revisa tu internet e inténtalo otra vez.', 'triste');
            } else {
                gotiDice('Algo salió mal. Inténtalo otra vez en un momento.', 'triste');
            }

            return;
        }

        Progreso.establecer(resultado.progreso);

        entrar(
            { usuario: resultado.perfil.usuario, escuela: resultado.perfil.escuela, nivel: resultado.perfil.nivel },
            '¡Bienvenido de nuevo, ' + resultado.perfil.usuario + '!'
        );
    });

    // ---------- Registro ----------
    formularioRegistro.addEventListener('submit', async function (evento) {
        evento.preventDefault();

        if (ocupado) {
            return;
        }

        if (!Nube.disponible()) {
            gotiDice('No pude conectarme. Revisa tu internet e inténtalo otra vez.', 'triste');
            return;
        }

        const usuario = document.getElementById('registroUsuario').value.trim();
        const contrasena = document.getElementById('registroContrasena').value;
        const escuela = document.getElementById('registroEscuela').value.trim();
        const nivelElegido = formularioRegistro.querySelector(
            'input[name="nivelRegistro"]:checked'
        );

        if (!/^[A-Za-z0-9_]{3,20}$/.test(usuario)) {
            gotiDice('Tu usuario debe tener de 3 a 20 letras o números, sin espacios.', 'triste');
            return;
        }

        if (contrasena.length < 6) {
            gotiDice('Tu contraseña necesita al menos 6 caracteres.', 'triste');
            return;
        }

        if (escuela === '') {
            gotiDice('Escribe el nombre de tu escuela.', 'triste');
            return;
        }

        if (!nivelElegido) {
            gotiDice('Falta elegir tu nivel: primaria o secundaria.', 'triste');
            return;
        }

        ocupado = true;
        gotiDice('Un momento, estoy creando tu cuenta...');

        const resultado = await Nube.registrar(usuario, contrasena, escuela, nivelElegido.value);

        ocupado = false;

        if (!resultado.ok) {
            if (resultado.motivo === 'ya-existe') {
                gotiDice('Ese usuario ya existe. ¡Elige otro nombre!', 'triste');
            } else if (resultado.motivo === 'sin-conexion') {
                gotiDice('No pude conectarme. Revisa tu internet e inténtalo otra vez.', 'triste');
            } else if (resultado.motivo === 'confirmacion') {
                gotiDice('No pude terminar tu cuenta. Avísale a tu maestro.', 'triste');
            } else {
                gotiDice('Algo salió mal. Inténtalo otra vez en un momento.', 'triste');
            }

            return;
        }

        Progreso.establecer(resultado.progreso);

        entrar(
            { usuario: resultado.perfil.usuario, escuela: resultado.perfil.escuela, nivel: resultado.perfil.nivel },
            '¡Listo, ' + resultado.perfil.usuario + '! Tu cuenta está creada.'
        );
    });

    // ---------- Al abrir la página ----------
    async function iniciarPagina() {
        const sesionActual = leerSesion();

        // Invitado: no hay nada que descargar
        if (sesionActual && sesionActual.invitado) {
            pantallaAcceso.hidden = true;
            abrirSitio(sesionActual);
            return;
        }

        // Usuario con cuenta: se recupera su sesión y su progreso de la nube
        if (sesionActual) {
            pantallaAcceso.hidden = true;

            const resultado = await Nube.recuperarSesion();

            if (resultado.ok) {
                Progreso.establecer(resultado.progreso);

                abrirSitio({
                    usuario: resultado.perfil.usuario,
                    escuela: resultado.perfil.escuela,
                    nivel: resultado.perfil.nivel
                });

                return;
            }

            // No se pudo recuperar: se vuelve a la pantalla de acceso
            borrarSesion();
            pantallaAcceso.hidden = false;
        }

        mostrarPaso('inicio');
        gotiDice(mensajeInicio);
    }

    iniciarPagina();
})();

// ===== MAPA INTERACTIVO DE MÉXICO =====
(function () {
    'use strict';

    const mapa = document.getElementById('mapaMexico');
    const nombreEstado = document.getElementById('nombreEstado');
    const cifraEstado = document.getElementById('cifraEstado');
    const notaEstado = document.getElementById('notaEstado');
    const extraEstado = document.getElementById('extraEstado');
    const fuenteEstado = document.getElementById('fuenteEstado');

    if (!mapa || !nombreEstado || !cifraEstado || !notaEstado || !extraEstado || !fuenteEstado) {
        return;
    }

    const fuenteGeneral = 'INEGI, Censo de Población y Vivienda 2020 (Compendio de SEMARNAT)';

    // Porcentaje de la población con servicio de agua entubada en 2020.
    // La clave de cada estado es la misma que tiene su dibujo en el index (data-clave).
    // "extra" es un dato adicional que solo tienen algunos estados.
    const datosEstados = {
        AGU: { nombre: 'Aguascalientes', porcentaje: 99.33 },
        BCN: { nombre: 'Baja California', porcentaje: 97.68 },
        BCS: {
            nombre: 'Baja California Sur', porcentaje: 94.14,
            extra: 'Tener tubería no siempre significa tener agua cada día: un análisis de BBVA Research (2022) encontró que menos del 32% de los hogares recibió agua entubada todos los días.',
            fuenteExtra: 'BBVA Research'
        },
        CAM: { nombre: 'Campeche', porcentaje: 95.57 },
        CHP: {
            nombre: 'Chiapas', porcentaje: 88.87,
            extra: 'Unas 133,616 viviendas no tienen agua entubada, una de las cifras más altas del país. En 2010 el porcentaje era 77.3%.',
            fuenteExtra: 'El CEO, con datos del Censo 2020'
        },
        CHH: { nombre: 'Chihuahua', porcentaje: 98.13 },
        CMX: { nombre: 'Ciudad de México', porcentaje: 98.65 },
        COA: { nombre: 'Coahuila', porcentaje: 98.86 },
        COL: { nombre: 'Colima', porcentaje: 99.07 },
        DUR: { nombre: 'Durango', porcentaje: 97.50 },
        MEX: {
            nombre: 'Estado de México', porcentaje: 97.14,
            extra: 'Aunque el porcentaje es alto, como viven tantas personas, unas 118,409 viviendas no tienen agua entubada.',
            fuenteExtra: 'El CEO, con datos del Censo 2020'
        },
        GUA: { nombre: 'Guanajuato', porcentaje: 96.88 },
        GRO: {
            nombre: 'Guerrero', porcentaje: 88.08,
            extra: 'Es el estado con el porcentaje más bajo del país. Unas 103,991 viviendas no tienen agua entubada. En 2010 el porcentaje era 69.8%, así que ha mejorado mucho.',
            fuenteExtra: 'El CEO, con datos del Censo 2020'
        },
        HID: { nombre: 'Hidalgo', porcentaje: 96.03 },
        JAL: { nombre: 'Jalisco', porcentaje: 98.62 },
        MIC: { nombre: 'Michoacán', porcentaje: 97.10 },
        MOR: { nombre: 'Morelos', porcentaje: 95.73 },
        NAY: { nombre: 'Nayarit', porcentaje: 96.88 },
        NLE: { nombre: 'Nuevo León', porcentaje: 98.96 },
        OAX: {
            nombre: 'Oaxaca', porcentaje: 89.79,
            extra: 'Unas 110,050 viviendas no tienen agua entubada. En 2010 el porcentaje era 76.1%.',
            fuenteExtra: 'El CEO, con datos del Censo 2020'
        },
        PUE: { nombre: 'Puebla', porcentaje: 95.26 },
        QUE: { nombre: 'Querétaro', porcentaje: 97.58 },
        ROO: { nombre: 'Quintana Roo', porcentaje: 97.22 },
        SLP: { nombre: 'San Luis Potosí', porcentaje: 92.28 },
        SIN: { nombre: 'Sinaloa', porcentaje: 98.52 },
        SON: { nombre: 'Sonora', porcentaje: 98.60 },
        TAB: { nombre: 'Tabasco', porcentaje: 93.78 },
        TAM: { nombre: 'Tamaulipas', porcentaje: 98.22 },
        TLA: { nombre: 'Tlaxcala', porcentaje: 97.55 },
        VER: {
            nombre: 'Veracruz', porcentaje: 91.28,
            extra: 'Es el estado con más viviendas sin agua entubada: unas 202,241.',
            fuenteExtra: 'El CEO, con datos del Censo 2020'
        },
        YUC: { nombre: 'Yucatán', porcentaje: 98.77 },
        ZAC: { nombre: 'Zacatecas', porcentaje: 98.05 }
    };

    // Elige el color del estado según su porcentaje (igual que la leyenda)
    function colorDeEstado(porcentaje) {
        if (porcentaje >= 98) {
            return 'color-muy-alto';
        }

        if (porcentaje >= 96) {
            return 'color-alto';
        }

        if (porcentaje >= 93) {
            return 'color-medio';
        }

        return 'color-bajo';
    }

    // Escribe un texto en sus dos versiones; el selector de nivel muestra la que toca
    function escribirPorNivel(elemento, textos) {
        elemento.textContent = '';

        ['primaria', 'secundaria'].forEach(function (nivel) {
            const parte = document.createElement('span');

            parte.className = 'texto-' + nivel;
            parte.textContent = textos[nivel];
            elemento.appendChild(parte);
        });
    }

    // Muestra los datos del estado en el panel
    function mostrarEstado(estado) {
        nombreEstado.textContent = estado.nombre;
        cifraEstado.textContent = estado.porcentaje.toFixed(1) + '%';

        escribirPorNivel(notaEstado, {
            primaria: 'De cada 100 personas, unas ' + Math.round(estado.porcentaje) +
                ' tienen agua entubada.',
            secundaria: 'El ' + estado.porcentaje.toFixed(1) +
                '% de la población tenía servicio de agua entubada en 2020.'
        });

        if (estado.extra) {
            extraEstado.textContent = estado.extra;
            extraEstado.hidden = false;
        } else {
            extraEstado.textContent = '';
            extraEstado.hidden = true;
        }

        fuenteEstado.textContent = 'Fuente: ' + fuenteGeneral +
            (estado.fuenteExtra ? '; ' + estado.fuenteExtra : '') + '.';
    }

    const dibujos = mapa.querySelectorAll('.estado-mapa');

    function seleccionar(dibujo) {
        const estado = datosEstados[dibujo.dataset.clave];

        if (!estado) {
            return;
        }

        dibujos.forEach(function (otro) {
            otro.classList.remove('seleccionado');
            otro.setAttribute('aria-pressed', 'false');
        });

        dibujo.classList.add('seleccionado');
        dibujo.setAttribute('aria-pressed', 'true');

        // Se pasa al final del dibujo para que su borde se vea encima de los vecinos
        mapa.appendChild(dibujo);

        mostrarEstado(estado);
    }

    dibujos.forEach(function (dibujo) {
        const estado = datosEstados[dibujo.dataset.clave];

        if (!estado) {
            return;
        }

        dibujo.classList.add(colorDeEstado(estado.porcentaje));

        // Para poder usar el mapa también con el teclado (Tab y Enter)
        dibujo.setAttribute('tabindex', '0');
        dibujo.setAttribute('role', 'button');
        dibujo.setAttribute('aria-label', estado.nombre);
        dibujo.setAttribute('aria-pressed', 'false');

        dibujo.addEventListener('click', function () {
            seleccionar(dibujo);
        });

        dibujo.addEventListener('keydown', function (evento) {
            if (evento.key === 'Enter' || evento.key === ' ') {
                evento.preventDefault();
                seleccionar(dibujo);
            }
        });
    });
})();

// ===== EL VIAJE DE UNA GOTA (DIBUJO) =====
(function () {
    'use strict';

    const camino = document.getElementById('caminoGota');
    const gota = document.getElementById('gotaViaje');
    const estaciones = document.querySelectorAll('.estacion-viaje');
    const detalles = document.querySelectorAll('.detalle-etapa');
    const puntos = document.querySelectorAll('.punto-viaje');
    const botonViajeAnterior = document.getElementById('botonViajeAnterior');
    const botonViajeSiguiente = document.getElementById('botonViajeSiguiente');

    if (!camino || !gota || estaciones.length === 0) {
        return;
    }

    const ultimaEtapa = estaciones.length - 1;
    const menosMovimiento = window.matchMedia(
        '(prefers-reduced-motion: reduce)'
    ).matches;

    let etapaActual = 0;
    let longitudActual = 0;
    let longitudes = null;
    let animacion = null;

    // Calcula en qué punto del camino queda cada etapa.
    // Se hace la primera vez que se necesita, cuando el sitio ya está a la vista.
    function calcularLongitudes() {
        try {
            const total = camino.getTotalLength();

            if (!total) {
                return false;
            }

            longitudes = Array.from(estaciones).map(function (estacion) {
                const x = Number(estacion.dataset.x);
                const y = Number(estacion.dataset.y);

                let mejorLongitud = 0;
                let mejorDistancia = Infinity;

                for (let longitud = 0; longitud <= total; longitud += 2) {
                    const punto = camino.getPointAtLength(longitud);
                    const distancia = Math.hypot(punto.x - x, punto.y - y);

                    if (distancia < mejorDistancia) {
                        mejorDistancia = distancia;
                        mejorLongitud = longitud;
                    }
                }

                return mejorLongitud;
            });

            return true;
        } catch (error) {
            return false;
        }
    }

    function longitudesListas() {
        return longitudes !== null || calcularLongitudes();
    }

    // Pone la gota en un punto del camino
    function ponerEnLongitud(longitud) {
        longitudActual = longitud;

        const punto = camino.getPointAtLength(longitud);

        gota.setAttribute('transform', 'translate(' + punto.x + ' ' + punto.y + ')');
    }

    // Mueve la gota despacio por el camino hasta la etapa elegida
    function moverGotaHasta(indice) {
        cancelAnimationFrame(animacion);

        if (!longitudesListas()) {
            const estacion = estaciones[indice];

            gota.setAttribute(
                'transform',
                'translate(' + estacion.dataset.x + ' ' + estacion.dataset.y + ')'
            );
            return;
        }

        const inicio = longitudActual;
        const destino = longitudes[indice];
        const recorrido = destino - inicio;

        const duracion = menosMovimiento
            ? 0
            : Math.min(2600, Math.max(600, Math.abs(recorrido) * 4));

        if (duracion === 0) {
            ponerEnLongitud(destino);
            return;
        }

        const horaInicio = performance.now();

        function darPaso(ahora) {
            const avance = Math.min((ahora - horaInicio) / duracion, 1);
            const suave = avance < 0.5
                ? 2 * avance * avance
                : 1 - Math.pow(-2 * avance + 2, 2) / 2;

            ponerEnLongitud(inicio + recorrido * suave);

            if (avance < 1) {
                animacion = requestAnimationFrame(darPaso);
            }
        }

        animacion = requestAnimationFrame(darPaso);
    }

    // Cambia la etapa que se ve (texto, números y botones)
    function mostrarEtapa(indice) {
        etapaActual = indice;

        estaciones.forEach(function (estacion, posicion) {
            estacion.classList.toggle('activa', posicion === indice);
        });

        detalles.forEach(function (detalle, posicion) {
            detalle.hidden = posicion !== indice;
        });

        puntos.forEach(function (punto, posicion) {
            punto.classList.toggle('activo', posicion === indice);
            punto.setAttribute('aria-current', posicion === indice ? 'step' : 'false');
        });

        botonViajeAnterior.disabled = indice === 0;

        if (indice === ultimaEtapa) {
            botonViajeSiguiente.innerHTML = `
                Empezar de nuevo
                <i class="fa-solid fa-rotate-right"></i>
            `;
        } else {
            botonViajeSiguiente.innerHTML = `
                Siguiente
                <i class="fa-solid fa-arrow-right"></i>
            `;
        }
    }

    function irAEtapa(indice) {
        mostrarEtapa(indice);
        moverGotaHasta(indice);
    }

    botonViajeAnterior.addEventListener('click', function () {
        if (etapaActual > 0) {
            irAEtapa(etapaActual - 1);
        }
    });

    botonViajeSiguiente.addEventListener('click', function () {
        if (etapaActual === ultimaEtapa) {
            irAEtapa(0);
        } else {
            irAEtapa(etapaActual + 1);
        }
    });

    puntos.forEach(function (punto) {
        punto.addEventListener('click', function () {
            irAEtapa(Number(punto.dataset.indice));
        });
    });

    estaciones.forEach(function (estacion) {
        estacion.addEventListener('click', function () {
            irAEtapa(Number(estacion.dataset.indice));
        });
    });

    // Al empezar, la gota está en el río
    mostrarEtapa(0);
})();

// ===== METAS DEL ODS 6 (TARJETAS QUE SE VOLTEAN) =====
(function () {
    'use strict';

    const metas = document.querySelectorAll('.meta');

    metas.forEach(function (meta) {
        meta.addEventListener('click', function () {
            const volteada = meta.getAttribute('aria-pressed') === 'true';

            meta.setAttribute('aria-pressed', volteada ? 'false' : 'true');
        });
    });
})();

// ===== ¿QUÉ PUEDO HACER YO? (COMPROMISOS) =====
(function () {
    'use strict';

    const casillas = document.querySelectorAll('.compromiso input');
    const textoCompromisos = document.getElementById('textoCompromisos');
    const avanceCompromisos = document.getElementById('avanceCompromisos');
    const mensajeCompromisos = document.getElementById('mensajeCompromisos');

    if (casillas.length === 0 || !textoCompromisos || !avanceCompromisos || !mensajeCompromisos) {
        return;
    }

    // Guarda cuáles compromisos están marcados (cada usuario tiene los suyos)
    function guardarCompromisos() {
        const marcados = [];

        casillas.forEach(function (casilla, indice) {
            if (casilla.checked) {
                marcados.push(indice);
            }
        });

        if (window.Progreso) {
            Progreso.guardarCompromisos(marcados);
        }
    }

    // Marca los compromisos que el usuario guardó la última vez
    function cargarCompromisos() {
        const guardados = window.Progreso ? Progreso.leerCompromisos() : [];

        casillas.forEach(function (casilla, indice) {
            casilla.checked = guardados.indexOf(indice) !== -1;
        });
    }

    function actualizarCompromisos(celebrar) {
        let total = 0;

        casillas.forEach(function (casilla) {
            if (casilla.checked) {
                total++;
            }
        });

        textoCompromisos.textContent =
            total + ' de ' + casillas.length + ' compromisos';

        avanceCompromisos.style.width =
            (total / casillas.length) * 100 + '%';

        if (total === 0) {
            mensajeCompromisos.textContent = 'Elige tu primera acción.';
        } else if (total === casillas.length) {
            mensajeCompromisos.textContent =
                '¡Eres un guardián del agua! Completaste todos tus compromisos.';

            if (celebrar && window.Goti) {
                Goti.animo('contenta', 4000);
                Goti.saltar();
                Goti.decir('¡Completaste todos tus compromisos! Gracias por cuidar el agua.');
            }
        } else {
            mensajeCompromisos.textContent = '¡Muy bien! Sigue sumando acciones.';
        }
    }

    casillas.forEach(function (casilla) {
        casilla.addEventListener('change', function () {
            guardarCompromisos();
            actualizarCompromisos(true);
        });
    });

    cargarCompromisos();
    actualizarCompromisos(false);

    // Para volver a cargarlos cuando entra otro usuario: Compromisos.cargar()
    window.Compromisos = {
        cargar: function () {
            cargarCompromisos();
            actualizarCompromisos(false);
        }
    };
})();

// ===== MITOS Y VERDADES (QUIZ) =====
(function () {
    'use strict';

    const progresoQuiz = document.getElementById('progresoQuiz');
    const afirmacionQuiz = document.getElementById('afirmacionQuiz');
    const botonVerdad = document.getElementById('botonVerdad');
    const botonMito = document.getElementById('botonMito');
    const retroalimentacion = document.getElementById('retroalimentacionQuiz');
    const resultadoRespuesta = document.getElementById('resultadoRespuesta');
    const explicacionQuiz = document.getElementById('explicacionQuiz');
    const botonSiguienteQuiz = document.getElementById('botonSiguienteQuiz');
    const vistaPregunta = document.getElementById('vistaPregunta');
    const vistaFinal = document.getElementById('vistaFinal');
    const tituloFinalQuiz = document.getElementById('tituloFinalQuiz');
    const textoFinalQuiz = document.getElementById('textoFinalQuiz');
    const botonReiniciarQuiz = document.getElementById('botonReiniciarQuiz');

    if (!progresoQuiz || !afirmacionQuiz || !botonVerdad || !botonMito || !vistaPregunta || !vistaFinal) {
        return;
    }

    const preguntas = [
        {
            afirmacion: 'En el planeta hay agua dulce infinita para usar.',
            esVerdad: false,
            explicacion: {
                primaria: 'El agua dulce que podemos usar es poca. Por eso hay que cuidarla entre todos.',
                secundaria: 'Solo una pequeña parte del agua del planeta es agua dulce utilizable, por eso su gestión sostenible es tan importante.'
            }
        },
        {
            afirmacion: 'Una llave que gotea no desperdicia mucha agua.',
            esVerdad: false,
            explicacion: {
                primaria: 'Cada gota parece poca cosa, pero si gotea todo el día se pierde mucha agua.',
                secundaria: 'Una fuga pequeña, sumada durante días y semanas, puede desperdiciar una cantidad importante de agua.'
            }
        },
        {
            afirmacion: 'Cerrar la llave mientras te cepillas los dientes ayuda a ahorrar agua.',
            esVerdad: true,
            explicacion: {
                primaria: '¡Sí! Si la llave está cerrada, el agua no corre mientras te cepillas.',
                secundaria: 'Correcto: mantener la llave abierta sin necesidad hace que el agua corra sin que se use.'
            }
        },
        {
            afirmacion: 'Todas las personas tienen agua potable y baños limpios en su casa o en su escuela.',
            esVerdad: false,
            explicacion: {
                primaria: 'Todavía hay personas y escuelas sin agua limpia o sin baños seguros. Por eso existe el ODS 6.',
                secundaria: 'Aún hay personas y escuelas sin acceso a agua potable ni a saneamiento adecuado; el ODS 6 busca cambiar eso.'
            }
        },
        {
            afirmacion: 'Es buena idea tirar el aceite de cocina por el drenaje.',
            esVerdad: false,
            explicacion: {
                primaria: 'El aceite ensucia el agua y tapa las tuberías. Se guarda en un envase cerrado y se tira a la basura.',
                secundaria: 'El aceite contamina el agua y puede obstruir el alcantarillado; conviene guardarlo en un recipiente cerrado y desecharlo como residuo.'
            }
        },
        {
            afirmacion: 'Lavarte las manos con agua y jabón ayuda a evitar enfermedades.',
            esVerdad: true,
            explicacion: {
                primaria: '¡Sí! Lavarte las manos quita gérmenes y nos ayuda a no enfermar.',
                secundaria: 'Correcto: la higiene de manos reduce la propagación de microorganismos que causan enfermedades.'
            }
        },
        {
            afirmacion: 'Si una casa tiene tuberías, siempre sale agua todos los días.',
            esVerdad: false,
            explicacion: {
                primaria: 'No siempre. En algunos lugares hay tubos, pero el agua no llega todos los días.',
                secundaria: 'No necesariamente: tener tubería no garantiza un suministro diario; la continuidad del servicio también importa.'
            }
        }
    ];

    let indicePregunta = 0;
    let aciertos = 0;

    // Escribe un texto en sus dos versiones; el selector de nivel muestra la que toca
    function escribirPorNivel(elemento, textos) {
        elemento.textContent = '';

        ['primaria', 'secundaria'].forEach(function (nivel) {
            const parte = document.createElement('span');

            parte.className = 'texto-' + nivel;
            parte.textContent = textos[nivel];
            elemento.appendChild(parte);
        });
    }

    function mostrarPregunta() {
        const pregunta = preguntas[indicePregunta];

        progresoQuiz.textContent =
            'Pregunta ' + (indicePregunta + 1) + ' de ' + preguntas.length;

        afirmacionQuiz.textContent = pregunta.afirmacion;

        botonVerdad.disabled = false;
        botonMito.disabled = false;
        botonVerdad.classList.remove('correcta', 'incorrecta');
        botonMito.classList.remove('correcta', 'incorrecta');

        retroalimentacion.hidden = true;
    }

    function responder(eligioVerdad) {
        const pregunta = preguntas[indicePregunta];
        const acerto = eligioVerdad === pregunta.esVerdad;
        const botonElegido = eligioVerdad ? botonVerdad : botonMito;

        if (acerto) {
            aciertos++;
        }

        botonVerdad.disabled = true;
        botonMito.disabled = true;
        botonElegido.classList.add(acerto ? 'correcta' : 'incorrecta');

        resultadoRespuesta.textContent = acerto
            ? '¡Correcto!'
            : 'Casi. ' + (pregunta.esVerdad ? 'Es verdad.' : 'Es un mito.');

        resultadoRespuesta.className =
            'resultado-respuesta ' + (acerto ? 'acierto' : 'error');

        escribirPorNivel(explicacionQuiz, pregunta.explicacion);

        botonSiguienteQuiz.textContent =
            indicePregunta === preguntas.length - 1 ? 'Ver resultado' : 'Siguiente';

        retroalimentacion.hidden = false;
    }

    function mostrarResultadoFinal() {
        vistaPregunta.hidden = true;
        vistaFinal.hidden = false;

        if (aciertos === preguntas.length) {
            tituloFinalQuiz.textContent = '¡Eres un guardián del agua!';
        } else if (aciertos >= 5) {
            tituloFinalQuiz.textContent = '¡Muy bien!';
        } else {
            tituloFinalQuiz.textContent = '¡Sigue aprendiendo!';
        }

        textoFinalQuiz.textContent =
            'Acertaste ' + aciertos + ' de ' + preguntas.length + '.';

        // Se guarda el puntaje en "Mi progreso"
        if (window.Progreso) {
            Progreso.guardarQuiz(aciertos, preguntas.length);
        }
    }

    botonVerdad.addEventListener('click', function () {
        responder(true);
    });

    botonMito.addEventListener('click', function () {
        responder(false);
    });

    botonSiguienteQuiz.addEventListener('click', function () {
        if (indicePregunta === preguntas.length - 1) {
            mostrarResultadoFinal();
            return;
        }

        indicePregunta++;
        mostrarPregunta();
    });

    botonReiniciarQuiz.addEventListener('click', function () {
        indicePregunta = 0;
        aciertos = 0;

        vistaFinal.hidden = true;
        vistaPregunta.hidden = false;

        mostrarPregunta();
    });

    mostrarPregunta();
})();

// ===== VENTANA DE JUEGOS: PANTALLA GRANDE, PAUSA Y CIERRE =====
// Cada juego se registra aquí con: titulo, preparar(), pausar(), reanudar(), detener() y jugando().
window.VentanaJuegos = (function () {
    'use strict';

    const ventana = document.getElementById('ventanaJuego');
    const tituloVentana = document.getElementById('tituloVentanaJuego');
    const botonPausa = document.getElementById('botonPausaJuego');
    const botonCerrar = document.getElementById('botonCerrarJuego');
    const cortina = document.getElementById('cortinaPausa');
    const botonContinuar = document.getElementById('botonContinuarJuego');
    const botonSalirJuego = document.getElementById('botonSalirJuego');
    const paneles = document.querySelectorAll('.panel-juego');
    const opciones = document.querySelectorAll('.opcion-juego');

    const juegos = {};
    let abierto = null;
    let enPausa = false;
    let ultimoFoco = null;

    function registrar(nombre, juego) {
        juegos[nombre] = juego;
    }

    // Si falta algo en la página, los juegos siguen funcionando sin la ventana
    if (!ventana || !tituloVentana || !botonPausa || !botonCerrar || !cortina ||
        !botonContinuar || !botonSalirJuego) {
        const nada = function () {};

        return {
            registrar: registrar,
            abrir: nada,
            cerrar: nada,
            pausar: nada,
            reanudar: nada,
            estadoCambio: nada,
            reiniciarRecords: nada
        };
    }

    function estadoDelJuego() {
        return abierto !== null && juegos[abierto].jugando();
    }

    // Activa o desactiva el botón de pausa según haya una partida en curso
    function estadoCambio() {
        botonPausa.disabled = !estadoDelJuego();

        botonPausa.innerHTML = enPausa
            ? '<i class="fa-solid fa-play"></i> Continuar'
            : '<i class="fa-solid fa-pause"></i> Pausa';
    }

    function abrir(nombre) {
        const juego = juegos[nombre];

        if (!juego) {
            return;
        }

        if (abierto !== null) {
            juegos[abierto].detener();
        } else {
            ultimoFoco = document.activeElement;
        }

        abierto = nombre;
        enPausa = false;

        paneles.forEach(function (panel) {
            panel.hidden = panel.dataset.juego !== nombre;
        });

        tituloVentana.textContent = juego.titulo;
        cortina.hidden = true;
        ventana.hidden = false;
        document.body.classList.add('juego-abierto');

        juego.preparar();
        estadoCambio();
        botonCerrar.focus();
    }

    function cerrar() {
        if (abierto === null) {
            return;
        }

        juegos[abierto].detener();

        abierto = null;
        enPausa = false;

        ventana.hidden = true;
        cortina.hidden = true;
        document.body.classList.remove('juego-abierto');

        if (ultimoFoco && typeof ultimoFoco.focus === 'function') {
            ultimoFoco.focus();
        }

        ultimoFoco = null;
        estadoCambio();
    }

    function pausar() {
        if (!estadoDelJuego() || enPausa) {
            return;
        }

        juegos[abierto].pausar();
        enPausa = true;
        cortina.hidden = false;
        estadoCambio();
        botonContinuar.focus();
    }

    function reanudar() {
        if (abierto === null || !enPausa) {
            return;
        }

        enPausa = false;
        cortina.hidden = true;
        juegos[abierto].reanudar();
        estadoCambio();
        botonPausa.focus();
    }

    function reiniciarRecords() {
        Object.keys(juegos).forEach(function (nombre) {
            if (typeof juegos[nombre].reiniciarRecord === 'function') {
                juegos[nombre].reiniciarRecord();
            }
        });
    }

    // Que el teclado no salga de la ventana mientras está abierta
    function enfocables() {
        return Array.from(ventana.querySelectorAll('button')).filter(function (elemento) {
            return !elemento.disabled && !elemento.closest('[hidden]');
        });
    }

    opciones.forEach(function (opcion) {
        opcion.addEventListener('click', function () {
            abrir(opcion.dataset.juego);
        });
    });

    botonCerrar.addEventListener('click', cerrar);
    botonSalirJuego.addEventListener('click', cerrar);
    botonContinuar.addEventListener('click', reanudar);

    botonPausa.addEventListener('click', function () {
        if (enPausa) {
            reanudar();
        } else {
            pausar();
        }
    });

    document.addEventListener('keydown', function (evento) {
        if (abierto === null) {
            return;
        }

        if (evento.key === 'Escape') {
            evento.preventDefault();

            // Esc pausa la partida; si no hay partida o ya está en pausa, cierra la ventana
            if (estadoDelJuego() && !enPausa) {
                pausar();
            } else {
                cerrar();
            }

            return;
        }

        if ((evento.key === 'p' || evento.key === 'P') && estadoDelJuego()) {
            evento.preventDefault();

            if (enPausa) {
                reanudar();
            } else {
                pausar();
            }

            return;
        }

        if (evento.key === 'Tab') {
            const lista = enfocables();

            if (lista.length === 0) {
                return;
            }

            const primero = lista[0];
            const ultimo = lista[lista.length - 1];

            if (!ventana.contains(document.activeElement)) {
                evento.preventDefault();
                primero.focus();
            } else if (evento.shiftKey && document.activeElement === primero) {
                evento.preventDefault();
                ultimo.focus();
            } else if (!evento.shiftKey && document.activeElement === ultimo) {
                evento.preventDefault();
                primero.focus();
            }
        }
    });

    // Si la persona cambia de pestaña, la partida se pausa sola
    document.addEventListener('visibilitychange', function () {
        if (document.hidden) {
            pausar();
        }
    });

    return {
        registrar: registrar,
        abrir: abrir,
        cerrar: cerrar,
        pausar: pausar,
        reanudar: reanudar,
        estadoCambio: estadoCambio,
        reiniciarRecords: reiniciarRecords
    };
})();

// ===== JUEGO 1: ¡CIERRA LAS LLAVES! =====
(function () {
    'use strict';

    const llaves = document.querySelectorAll('.llave');
    const tablero = document.getElementById('tableroLlaves');
    const tiempoJuego = document.getElementById('tiempoJuego');
    const cerradasJuego = document.getElementById('cerradasJuego');
    const nivelTanque = document.getElementById('nivelTanque');
    const mensajeJuego = document.getElementById('mensajeJuego');
    const botonJuego = document.getElementById('botonJuego');

    if (llaves.length === 0 || !tablero || !tiempoJuego || !cerradasJuego || !nivelTanque || !mensajeJuego || !botonJuego) {
        return;
    }

    // ---------- VALORES DEL JUEGO (se pueden cambiar) ----------
    const duracionJuego = 30;         // segundos que dura una partida
    const aguaPorLlave = 2;           // agua que pierde el tanque por cada llave abierta, cada segundo
    const rapidezPrimaria = 1200;     // cada cuánto se abre una llave en primaria (milisegundos)
    const rapidezSecundaria = 850;    // en secundaria las llaves se abren más rápido
    const tiempoDeDosEnDos = 10;      // cuando quedan estos segundos o menos, las llaves se abren de 2 en 2

    let tiempo = duracionJuego;
    let agua = 100;
    let cerradas = 0;
    let jugando = false;
    let pausado = false;
    let relojSegundos = null;
    let relojGoteo = null;

    function avisarVentana() {
        if (window.VentanaJuegos) {
            VentanaJuegos.estadoCambio();
        }
    }

    function actualizarMarcador() {
        tiempoJuego.textContent = tiempo;
        cerradasJuego.textContent = cerradas;
        nivelTanque.style.width = agua + '%';
        nivelTanque.classList.toggle('poca-agua', agua < 30);
    }

    function contarAbiertas() {
        return document.querySelectorAll('.llave.goteando').length;
    }

    // Elige una llave cerrada al azar y la pone a gotear
    function abrirLlaveAlAzar() {
        const llavesCerradas = Array.from(llaves).filter(function (llave) {
            return !llave.classList.contains('goteando');
        });

        if (llavesCerradas.length === 0) {
            return;
        }

        const elegida = llavesCerradas[Math.floor(Math.random() * llavesCerradas.length)];

        elegida.classList.add('goteando');
    }

    // Normalmente se abre una llave por vez; al final del tiempo se abren de 2 en 2
    function abrirLlavesAlAzar() {
        const cantidad = tiempo <= tiempoDeDosEnDos ? 2 : 1;

        for (let i = 0; i < cantidad; i++) {
            abrirLlaveAlAzar();
        }
    }

    function rapidezActual() {
        const contenido = document.querySelector('.contenido-nivel');
        const esSecundaria = contenido && contenido.dataset.nivel === 'secundaria';

        return esSecundaria ? rapidezSecundaria : rapidezPrimaria;
    }

    function avisarDeDosEnDos() {
        tablero.classList.add('de-dos-en-dos');
        tiempoJuego.classList.add('critico');
        mensajeJuego.className = 'mensaje-juego alerta';
        mensajeJuego.textContent = '¡Cuidado! Ahora las llaves se abren de 2 en 2.';
    }

    // Pasa cada segundo: baja el tiempo y se pierde agua por cada llave abierta
    function pasarSegundo() {
        tiempo--;
        agua = Math.max(agua - contarAbiertas() * aguaPorLlave, 0);

        actualizarMarcador();

        if (agua === 0) {
            terminar(false);
        } else if (tiempo === 0) {
            terminar(true);
        } else if (tiempo === tiempoDeDosEnDos) {
            avisarDeDosEnDos();
        }
    }

    function empezar() {
        tiempo = duracionJuego;
        agua = 100;
        cerradas = 0;
        jugando = true;
        pausado = false;

        llaves.forEach(function (llave) {
            llave.classList.remove('goteando', 'recien-cerrada');
            llave.disabled = false;
        });

        tablero.classList.remove('de-dos-en-dos', 'pausado');
        tiempoJuego.classList.remove('critico');

        botonJuego.hidden = true;
        mensajeJuego.className = 'mensaje-juego';
        mensajeJuego.textContent = '¡Rápido! Cierra las llaves que gotean.';

        actualizarMarcador();

        // En secundaria las llaves se abren más rápido
        relojSegundos = setInterval(pasarSegundo, 1000);
        relojGoteo = setInterval(abrirLlavesAlAzar, rapidezActual());

        abrirLlaveAlAzar();
        avisarVentana();
    }

    function pausar() {
        if (!jugando || pausado) {
            return;
        }

        pausado = true;

        clearInterval(relojSegundos);
        clearInterval(relojGoteo);

        tablero.classList.add('pausado');
    }

    function reanudar() {
        if (!jugando || !pausado) {
            return;
        }

        pausado = false;

        tablero.classList.remove('pausado');

        relojSegundos = setInterval(pasarSegundo, 1000);
        relojGoteo = setInterval(abrirLlavesAlAzar, rapidezActual());
    }

    // Detiene los relojes y deja las llaves quietas
    function detener() {
        clearInterval(relojSegundos);
        clearInterval(relojGoteo);

        jugando = false;
        pausado = false;

        tablero.classList.remove('pausado');

        llaves.forEach(function (llave) {
            llave.classList.remove('goteando');
            llave.disabled = true;
        });
    }

    // Deja el juego listo para empezar de cero (se usa al abrir la ventana)
    function preparar() {
        detener();

        tiempo = duracionJuego;
        agua = 100;
        cerradas = 0;

        tablero.classList.remove('de-dos-en-dos');
        tiempoJuego.classList.remove('critico');

        mensajeJuego.className = 'mensaje-juego';
        mensajeJuego.textContent = 'Presiona el botón para empezar.';

        botonJuego.innerHTML = '<i class="fa-solid fa-play"></i> ¡Empezar!';
        botonJuego.hidden = false;

        actualizarMarcador();
    }

    function terminar(gano) {
        detener();

        if (gano) {
            mensajeJuego.className = 'mensaje-juego ganado';
            mensajeJuego.textContent = '¡Ganaste! Cerraste ' + cerradas +
                ' llaves y quedó ' + agua + '% de agua en el tanque.';
        } else {
            mensajeJuego.className = 'mensaje-juego perdido';
            mensajeJuego.textContent = '¡Oh no! El tanque se vació. Cerraste ' + cerradas +
                ' llaves. ¡Inténtalo otra vez!';
        }

        botonJuego.innerHTML = '<i class="fa-solid fa-rotate-right"></i> Jugar otra vez';
        botonJuego.hidden = false;

        // Se guarda el resultado en "Mi progreso"
        if (window.Progreso) {
            Progreso.guardarJuego(gano, cerradas);
        }

        if (gano && window.Goti) {
            Goti.animo('contenta', 4000);
            Goti.decir('¡Cerraste ' + cerradas + ' llaves en el juego! Así se cuida el agua.');
        }

        avisarVentana();
    }

    // Al hacer clic en una llave que gotea, se cierra
    llaves.forEach(function (llave) {
        llave.addEventListener('click', function () {
            if (!jugando || pausado || !llave.classList.contains('goteando')) {
                return;
            }

            llave.classList.remove('goteando');
            llave.classList.add('recien-cerrada');

            setTimeout(function () {
                llave.classList.remove('recien-cerrada');
            }, 300);

            cerradas++;
            actualizarMarcador();
        });
    });

    botonJuego.addEventListener('click', empezar);

    actualizarMarcador();

    VentanaJuegos.registrar('llaves', {
        titulo: '¡Cierra las llaves!',
        preparar: preparar,
        pausar: pausar,
        reanudar: reanudar,
        detener: detener,
        jugando: function () { return jugando; }
    });

    // Para detener el juego desde otras partes (por ejemplo, al salir): Juego.detener()
    window.Juego = {
        detener: detener
    };
})();

// ===== JUEGO 2: ATRAPA LAS GOTAS =====
(function () {
    'use strict';

    const lienzo = document.getElementById('lienzoAtrapa');
    const tiempoAtrapa = document.getElementById('tiempoAtrapa');
    const puntosAtrapa = document.getElementById('puntosAtrapa');
    const vidasAtrapa = document.getElementById('vidasAtrapa');
    const mensajeAtrapa = document.getElementById('mensajeAtrapa');
    const botonAtrapa = document.getElementById('botonAtrapa');
    const recordAtrapa = document.getElementById('recordAtrapa');

    if (!lienzo || !tiempoAtrapa || !puntosAtrapa || !vidasAtrapa || !mensajeAtrapa || !botonAtrapa || !recordAtrapa) {
        return;
    }

    const pincel = lienzo.getContext ? lienzo.getContext('2d') : null;

    if (!pincel) {
        return;
    }

    // ---------- VALORES DEL JUEGO (se pueden cambiar) ----------
    const ANCHO = lienzo.width;
    const ALTO = lienzo.height;
    const duracion = 40;               // segundos que dura una partida
    const vidasIniciales = 3;          // gotas sucias que se pueden atrapar antes de perder
    const cubeta = { ancho: 120, alto: 50 };
    const velocidadCubeta = 600;       // rapidez de la cubeta con el teclado (píxeles por segundo)

    const niveles = {
        primaria: {
            meta: 12,                  // gotas limpias necesarias para ganar
            velocidad: [170, 260],     // rapidez de caída: al empezar y al final
            espera: [0.95, 0.60],      // segundos entre gotas: al empezar y al final
            probSucia: 0.22            // probabilidad de que una gota sea sucia
        },
        secundaria: {
            meta: 18,
            velocidad: [220, 360],
            espera: [0.75, 0.42],
            probSucia: 0.28
        }
    };

    let config = niveles.primaria;
    let gotas = [];
    let x = ANCHO / 2;
    let puntos = 0;
    let vidas = vidasIniciales;
    let restante = duracion;
    let espera = 0;
    let golpe = 0;
    let metaAvisada = false;
    let jugando = false;
    let pausado = false;
    let cuadro = null;
    let ultimaMarca = null;
    let mejor = 0;
    const teclas = { izquierda: false, derecha: false };

    function avisarVentana() {
        if (window.VentanaJuegos) {
            VentanaJuegos.estadoCambio();
        }
    }

    function nivelDelSitio() {
        const contenido = document.querySelector('.contenido-nivel');

        return contenido && contenido.dataset.nivel === 'secundaria'
            ? niveles.secundaria
            : niveles.primaria;
    }

    function limitar(valor) {
        return Math.min(Math.max(valor, cubeta.ancho / 2), ANCHO - cubeta.ancho / 2);
    }

    function avance() {
        return 1 - restante / duracion;
    }

    function crearGota() {
        const radio = 15;
        const p = avance();
        const velocidad = config.velocidad[0] + (config.velocidad[1] - config.velocidad[0]) * p;

        gotas.push({
            x: radio + Math.random() * (ANCHO - radio * 2),
            y: -radio * 2,
            r: radio,
            vel: velocidad * (0.9 + Math.random() * 0.2),
            sucia: Math.random() < config.probSucia
        });
    }

    // ---------- Dibujo ----------
    function dibujarGota(gota) {
        const c = pincel;
        const r = gota.r;

        c.beginPath();
        c.moveTo(gota.x, gota.y - r * 1.7);
        c.bezierCurveTo(gota.x + r * 1.2, gota.y - r * 0.1, gota.x + r * 1.05, gota.y + r * 1.05, gota.x, gota.y + r * 1.05);
        c.bezierCurveTo(gota.x - r * 1.05, gota.y + r * 1.05, gota.x - r * 1.2, gota.y - r * 0.1, gota.x, gota.y - r * 1.7);
        c.closePath();

        c.fillStyle = gota.sucia ? '#6d4c2f' : '#00b4d8';
        c.fill();
        c.lineWidth = 3;
        c.strokeStyle = gota.sucia ? '#3e2a17' : '#023e8a';
        c.stroke();

        if (gota.sucia) {
            // La X permite distinguirlas aunque no se vean bien los colores
            const k = r * 0.38;

            c.strokeStyle = '#ffffff';
            c.lineWidth = 3;
            c.lineCap = 'round';
            c.beginPath();
            c.moveTo(gota.x - k, gota.y - k + 2);
            c.lineTo(gota.x + k, gota.y + k + 2);
            c.moveTo(gota.x + k, gota.y - k + 2);
            c.lineTo(gota.x - k, gota.y + k + 2);
            c.stroke();
        } else {
            c.fillStyle = 'rgba(255, 255, 255, 0.75)';
            c.beginPath();
            c.arc(gota.x - r * 0.35, gota.y + r * 0.1, r * 0.25, 0, Math.PI * 2);
            c.fill();
        }
    }

    function trazarCubeta() {
        const c = pincel;
        const arriba = ALTO - cubeta.alto - 8;
        const izquierda = x - cubeta.ancho / 2;
        const derecha = x + cubeta.ancho / 2;

        c.beginPath();
        c.moveTo(izquierda, arriba);
        c.lineTo(derecha, arriba);
        c.lineTo(derecha - 12, arriba + cubeta.alto);
        c.lineTo(izquierda + 12, arriba + cubeta.alto);
        c.closePath();
    }

    function dibujarCubeta() {
        const c = pincel;
        const arriba = ALTO - cubeta.alto - 8;
        const nivelAgua = Math.min(puntos / config.meta, 1);

        trazarCubeta();
        c.fillStyle = golpe > 0 ? '#e76f51' : '#0077b6';
        c.fill();

        if (nivelAgua > 0) {
            const altoAgua = (cubeta.alto - 8) * nivelAgua;

            c.save();
            trazarCubeta();
            c.clip();
            c.fillStyle = '#48cae4';
            c.fillRect(x - cubeta.ancho / 2, arriba + cubeta.alto - altoAgua, cubeta.ancho, altoAgua);
            c.restore();
        }

        trazarCubeta();
        c.lineWidth = 5;
        c.lineJoin = 'round';
        c.strokeStyle = '#023e8a';
        c.stroke();
    }

    function dibujar() {
        const c = pincel;
        const cielo = c.createLinearGradient(0, 0, 0, ALTO);

        c.clearRect(0, 0, ANCHO, ALTO);

        cielo.addColorStop(0, '#caf0f8');
        cielo.addColorStop(1, '#eef7ff');
        c.fillStyle = cielo;
        c.fillRect(0, 0, ANCHO, ALTO);

        c.fillStyle = '#90e0ef';
        c.fillRect(0, ALTO - 8, ANCHO, 8);

        gotas.forEach(dibujarGota);
        dibujarCubeta();
    }

    // ---------- Marcador ----------
    function actualizarMarcador() {
        tiempoAtrapa.textContent = Math.max(0, Math.ceil(restante));
        puntosAtrapa.textContent = puntos + ' / ' + config.meta;

        if (vidasAtrapa.dataset.vidas !== String(vidas)) {
            let corazones = '';

            for (let i = 0; i < vidasIniciales; i++) {
                corazones += '<i class="fa-solid fa-heart' + (i >= vidas ? ' perdida' : '') + '"></i>';
            }

            vidasAtrapa.innerHTML = corazones;
            vidasAtrapa.dataset.vidas = String(vidas);
            vidasAtrapa.setAttribute('aria-label', vidas + ' de ' + vidasIniciales + ' vidas');
        }
    }

    function mostrarRecord() {
        recordAtrapa.textContent = mejor > 0
            ? 'Tu mejor marca en esta visita: ' + mejor + ' gotas limpias.'
            : '';
    }

    // ---------- Reglas ----------
    function actualizar(dt) {
        restante -= dt;
        golpe = Math.max(golpe - dt, 0);

        if (teclas.izquierda) {
            x = limitar(x - velocidadCubeta * dt);
        }

        if (teclas.derecha) {
            x = limitar(x + velocidadCubeta * dt);
        }

        espera -= dt;

        if (espera <= 0) {
            crearGota();
            espera += config.espera[0] + (config.espera[1] - config.espera[0]) * avance();
        }

        const bordeCubeta = ALTO - cubeta.alto - 8;

        for (let i = gotas.length - 1; i >= 0; i--) {
            const gota = gotas[i];

            gota.y += gota.vel * dt;

            const alcanzaCubeta = gota.y + gota.r >= bordeCubeta &&
                gota.y < ALTO &&
                Math.abs(gota.x - x) <= cubeta.ancho / 2;

            if (alcanzaCubeta) {
                gotas.splice(i, 1);

                if (gota.sucia) {
                    vidas--;
                    golpe = 0.35;
                } else {
                    puntos++;

                    if (puntos === config.meta && !metaAvisada) {
                        metaAvisada = true;
                        mensajeAtrapa.className = 'mensaje-juego ganado';
                        mensajeAtrapa.textContent = '¡Meta lograda! Sigue atrapando para mejorar tu marca.';
                    }
                }
            } else if (gota.y - gota.r > ALTO) {
                gotas.splice(i, 1);
            }
        }

        if (vidas <= 0) {
            vidas = 0;
            terminar('vidas');
        } else if (restante <= 0) {
            restante = 0;
            terminar('tiempo');
        }
    }

    function bucle(marca) {
        cuadro = null;

        if (!jugando || pausado) {
            return;
        }

        if (ultimaMarca === null) {
            ultimaMarca = marca;
        }

        const dt = Math.min((marca - ultimaMarca) / 1000, 0.05);

        ultimaMarca = marca;

        actualizar(dt);
        dibujar();
        actualizarMarcador();

        if (jugando && !pausado) {
            cuadro = requestAnimationFrame(bucle);
        }
    }

    function detener() {
        jugando = false;
        pausado = false;
        teclas.izquierda = false;
        teclas.derecha = false;

        if (cuadro !== null) {
            cancelAnimationFrame(cuadro);
            cuadro = null;
        }
    }

    function reiniciarPartida() {
        detener();

        config = nivelDelSitio();
        gotas = [];
        x = ANCHO / 2;
        puntos = 0;
        vidas = vidasIniciales;
        restante = duracion;
        espera = 0.4;
        golpe = 0;
        metaAvisada = false;
        ultimaMarca = null;

        actualizarMarcador();
        dibujar();
    }

    function preparar() {
        reiniciarPartida();

        mensajeAtrapa.className = 'mensaje-juego';
        mensajeAtrapa.textContent = 'Atrapa ' + config.meta + ' gotas limpias antes de que se acabe el tiempo.';

        botonAtrapa.innerHTML = '<i class="fa-solid fa-play"></i> ¡Empezar!';
        botonAtrapa.hidden = false;

        mostrarRecord();
    }

    function empezar() {
        reiniciarPartida();

        jugando = true;

        botonAtrapa.hidden = true;
        mensajeAtrapa.className = 'mensaje-juego';
        mensajeAtrapa.textContent = '¡Atrapa las gotas azules y esquiva las sucias!';

        cuadro = requestAnimationFrame(bucle);
        avisarVentana();
    }

    function terminar(motivo) {
        const gano = motivo === 'tiempo' && puntos >= config.meta;

        detener();
        dibujar();
        actualizarMarcador();

        if (gano) {
            mensajeAtrapa.className = 'mensaje-juego ganado';
            mensajeAtrapa.textContent = '¡Ganaste! Atrapaste ' + puntos + ' gotas limpias.';
        } else if (motivo === 'vidas') {
            mensajeAtrapa.className = 'mensaje-juego perdido';
            mensajeAtrapa.textContent = '¡Oh no! Te quedaste sin vidas. Atrapaste ' + puntos +
                ' gotas limpias. ¡Inténtalo otra vez!';
        } else {
            mensajeAtrapa.className = 'mensaje-juego perdido';
            mensajeAtrapa.textContent = 'Se acabó el tiempo. Atrapaste ' + puntos + ' de ' +
                config.meta + ' gotas limpias. ¡Inténtalo otra vez!';
        }

        if (puntos > mejor) {
            mejor = puntos;
        }

        mostrarRecord();

        botonAtrapa.innerHTML = '<i class="fa-solid fa-rotate-right"></i> Jugar otra vez';
        botonAtrapa.hidden = false;

        avisarVentana();
    }

    function pausar() {
        if (!jugando || pausado) {
            return;
        }

        pausado = true;
        teclas.izquierda = false;
        teclas.derecha = false;

        if (cuadro !== null) {
            cancelAnimationFrame(cuadro);
            cuadro = null;
        }
    }

    function reanudar() {
        if (!jugando || !pausado) {
            return;
        }

        pausado = false;
        ultimaMarca = null;
        cuadro = requestAnimationFrame(bucle);
    }

    // ---------- Controles: mouse, dedo y teclado ----------
    function moverConPuntero(evento) {
        if (!jugando || pausado) {
            return;
        }

        const caja = lienzo.getBoundingClientRect();

        if (caja.width === 0) {
            return;
        }

        x = limitar(((evento.clientX - caja.left) / caja.width) * ANCHO);
    }

    lienzo.addEventListener('pointermove', moverConPuntero);
    lienzo.addEventListener('pointerdown', moverConPuntero);

    function cambiarTecla(evento, presionada) {
        if (!jugando || pausado) {
            return;
        }

        if (evento.key === 'ArrowLeft' || evento.key === 'a' || evento.key === 'A') {
            teclas.izquierda = presionada;
            evento.preventDefault();
        } else if (evento.key === 'ArrowRight' || evento.key === 'd' || evento.key === 'D') {
            teclas.derecha = presionada;
            evento.preventDefault();
        }
    }

    document.addEventListener('keydown', function (evento) {
        cambiarTecla(evento, true);
    });

    document.addEventListener('keyup', function (evento) {
        cambiarTecla(evento, false);
    });

    botonAtrapa.addEventListener('click', empezar);

    config = nivelDelSitio();
    actualizarMarcador();

    VentanaJuegos.registrar('atrapa', {
        titulo: 'Atrapa las gotas',
        preparar: preparar,
        pausar: pausar,
        reanudar: reanudar,
        detener: detener,
        jugando: function () { return jugando; },
        reiniciarRecord: function () {
            mejor = 0;
            mostrarRecord();
        }
    });
})();

// ===== JUEGO 3: MEMORIA DEL AGUA =====
(function () {
    'use strict';

    const tablero = document.getElementById('tableroMemoria');
    const tiempoMemoria = document.getElementById('tiempoMemoria');
    const movimientosMemoria = document.getElementById('movimientosMemoria');
    const parejasMemoria = document.getElementById('parejasMemoria');
    const mensajeMemoria = document.getElementById('mensajeMemoria');
    const botonMemoria = document.getElementById('botonMemoria');
    const recordMemoria = document.getElementById('recordMemoria');

    if (!tablero || !tiempoMemoria || !movimientosMemoria || !parejasMemoria || !mensajeMemoria || !botonMemoria || !recordMemoria) {
        return;
    }

    // ---------- VALORES DEL JUEGO (se pueden cambiar) ----------
    const parejasPrimaria = 6;         // 12 cartas
    const parejasSecundaria = 8;       // 16 cartas
    const esperaVolteo = 800;          // milisegundos que se ven dos cartas distintas antes de taparse

    const figuras = [
        { id: 'gota', icono: 'fa-droplet', nombre: 'Gota' },
        { id: 'llave', icono: 'fa-faucet', nombre: 'Llave' },
        { id: 'regadera', icono: 'fa-shower', nombre: 'Regadera' },
        { id: 'inodoro', icono: 'fa-toilet', nombre: 'Inodoro' },
        { id: 'manos', icono: 'fa-hands-bubbles', nombre: 'Manos' },
        { id: 'lluvia', icono: 'fa-cloud-rain', nombre: 'Lluvia' },
        { id: 'planta', icono: 'fa-seedling', nombre: 'Plantas' },
        { id: 'pez', icono: 'fa-fish', nombre: 'Peces' }
    ];

    const records = { primaria: null, secundaria: null };

    let abiertas = [];
    let bloqueado = false;
    let encontradas = 0;
    let totalParejas = parejasPrimaria;
    let movimientos = 0;
    let segundos = 0;
    let jugando = false;
    let pausado = false;
    let reloj = null;
    let temporizadorVolteo = null;

    function avisarVentana() {
        if (window.VentanaJuegos) {
            VentanaJuegos.estadoCambio();
        }
    }

    function nivelDelSitio() {
        const contenido = document.querySelector('.contenido-nivel');

        return contenido && contenido.dataset.nivel === 'secundaria' ? 'secundaria' : 'primaria';
    }

    function mezclar(lista) {
        for (let i = lista.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            const guardada = lista[i];

            lista[i] = lista[j];
            lista[j] = guardada;
        }

        return lista;
    }

    function actualizarMarcador() {
        tiempoMemoria.textContent = segundos;
        movimientosMemoria.textContent = movimientos;
        parejasMemoria.textContent = encontradas + ' / ' + totalParejas;
    }

    function mostrarRecord() {
        const marca = records[nivelDelSitio()];

        recordMemoria.textContent = marca !== null
            ? 'Tu mejor marca en esta visita: ' + marca + ' movimientos.'
            : '';
    }

    function ocultarCarta(carta) {
        carta.classList.remove('volteada');
        carta.setAttribute('aria-label', 'Carta boca abajo');
    }

    function construir() {
        totalParejas = nivelDelSitio() === 'secundaria' ? parejasSecundaria : parejasPrimaria;

        const elegidas = mezclar(figuras.slice()).slice(0, totalParejas);
        const baraja = mezclar(elegidas.concat(elegidas));

        tablero.innerHTML = '';

        baraja.forEach(function (figura) {
            const carta = document.createElement('button');

            carta.type = 'button';
            carta.className = 'carta-memoria';
            carta.dataset.figura = figura.id;
            carta.dataset.nombre = figura.nombre;
            carta.setAttribute('aria-label', 'Carta boca abajo');
            carta.innerHTML =
                '<span class="carta-cara carta-dorso"><i class="fa-solid fa-droplet"></i></span>' +
                '<span class="carta-cara carta-frente"><i class="fa-solid ' + figura.icono + '"></i>' +
                '<small>' + figura.nombre + '</small></span>';

            carta.addEventListener('click', function () {
                voltear(carta);
            });

            tablero.appendChild(carta);
        });
    }

    function voltear(carta) {
        if (!jugando || pausado || bloqueado) {
            return;
        }

        if (carta.classList.contains('volteada') || carta.classList.contains('encontrada')) {
            return;
        }

        carta.classList.add('volteada');
        carta.setAttribute('aria-label', carta.dataset.nombre);
        abiertas.push(carta);

        if (abiertas.length < 2) {
            return;
        }

        movimientos++;
        actualizarMarcador();

        const primera = abiertas[0];
        const segunda = abiertas[1];

        if (primera.dataset.figura === segunda.dataset.figura) {
            [primera, segunda].forEach(function (par) {
                par.classList.remove('volteada');
                par.classList.add('encontrada');
                par.setAttribute('aria-label', par.dataset.nombre + ' (pareja encontrada)');
            });

            abiertas = [];
            encontradas++;
            actualizarMarcador();

            if (encontradas === totalParejas) {
                ganar();
            }
        } else {
            bloqueado = true;

            temporizadorVolteo = setTimeout(function () {
                ocultarCarta(primera);
                ocultarCarta(segunda);

                abiertas = [];
                bloqueado = false;
                temporizadorVolteo = null;
            }, esperaVolteo);
        }
    }

    function arrancarReloj() {
        reloj = setInterval(function () {
            segundos++;
            actualizarMarcador();
        }, 1000);
    }

    function detener() {
        clearInterval(reloj);
        clearTimeout(temporizadorVolteo);

        reloj = null;
        temporizadorVolteo = null;
        jugando = false;
        pausado = false;
        bloqueado = false;
    }

    // Deja un tablero nuevo, boca abajo y listo para empezar
    function preparar() {
        detener();

        abiertas = [];
        encontradas = 0;
        movimientos = 0;
        segundos = 0;

        construir();
        tablero.classList.add('inactivo');
        actualizarMarcador();

        mensajeMemoria.className = 'mensaje-juego';
        mensajeMemoria.textContent = 'Presiona el botón para empezar.';

        botonMemoria.innerHTML = '<i class="fa-solid fa-play"></i> ¡Empezar!';
        botonMemoria.hidden = false;

        mostrarRecord();
    }

    function empezar() {
        preparar();

        jugando = true;

        tablero.classList.remove('inactivo');
        botonMemoria.hidden = true;
        mensajeMemoria.textContent = 'Encuentra todas las parejas.';

        arrancarReloj();
        avisarVentana();
    }

    function ganar() {
        const nivel = nivelDelSitio();

        detener();

        if (records[nivel] === null || movimientos < records[nivel]) {
            records[nivel] = movimientos;
        }

        mensajeMemoria.className = 'mensaje-juego ganado';
        mensajeMemoria.textContent = '¡Lo lograste! Encontraste todas las parejas en ' + movimientos +
            ' movimientos y ' + segundos + ' segundos.';

        botonMemoria.innerHTML = '<i class="fa-solid fa-rotate-right"></i> Jugar otra vez';
        botonMemoria.hidden = false;

        mostrarRecord();
        avisarVentana();
    }

    function pausar() {
        if (!jugando || pausado) {
            return;
        }

        pausado = true;
        clearInterval(reloj);
        reloj = null;
    }

    function reanudar() {
        if (!jugando || !pausado) {
            return;
        }

        pausado = false;
        arrancarReloj();
    }

    botonMemoria.addEventListener('click', empezar);

    totalParejas = nivelDelSitio() === 'secundaria' ? parejasSecundaria : parejasPrimaria;
    actualizarMarcador();

    VentanaJuegos.registrar('memoria', {
        titulo: 'Memoria del agua',
        preparar: preparar,
        pausar: pausar,
        reanudar: reanudar,
        detener: detener,
        jugando: function () { return jugando; },
        reiniciarRecord: function () {
            records.primaria = null;
            records.secundaria = null;
            mostrarRecord();
        }
    });
})();

// ===== AL TERMINAR DE CARGAR TODO =====
if (window.Progreso) {
    Progreso.mostrar();
}

// ===== AJUSTE AUTOMÁTICO DEL ENCABEZADO (PANTALLAS DE CUALQUIER TAMAÑO) =====
// Mide la altura real del menú de arriba y la guarda en --alto-encabezado,
// para que ninguna sección quede tapada en celulares, tablets o computadoras.
(function () {
    'use strict';

    const encabezado = document.querySelector('.encabezado');

    if (!encabezado) {
        return;
    }

    function medirEncabezado() {
        const alto = encabezado.offsetHeight;

        if (alto > 0) {
            document.documentElement.style.setProperty('--alto-encabezado', alto + 'px');
        }
    }

    if ('ResizeObserver' in window) {
        new ResizeObserver(medirEncabezado).observe(encabezado);
    }

    window.addEventListener('resize', medirEncabezado);
    window.addEventListener('orientationchange', medirEncabezado);

    medirEncabezado();
})();
