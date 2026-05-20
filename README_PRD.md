Product Requirement Document (PRD)
Proyecto: Plataforma de Gestión de Pretemporada de Rugby
Fase: MVP (Minimum Viable Product)
Enfoque: Web App (Mobile-Responsive priorizado para Jugadores/Entrenadores)
1. Objetivos del Producto
Permitir la planificación y el seguimiento del entrenamiento remoto de un plantel de rugby fuera de temporada.
Centralizar la recolección de métricas físicas y de rendimiento a través de Tests asignados.
Garantizar la privacidad de los datos de los jugadores frente a sus pares, promoviendo la competencia sana mediante promedios grupales y rankings exclusivos para el staff técnico.

2. Matriz de Roles y Permisos
Permiso / Acción
Administrador
Head Coach
Entrenador
Jugador
Crear plantilla de Ejercicios/Tests
X






Crear Equipos (Generar ID)


X




Autorizar ingreso de Jugadores al equipo


X




Asignar/Editar/Clonar/Eliminar Agenda


X
X


Cargar métricas / Resultados de Tests




X
X (Propios)
Marcar entrenamiento como realizado






X (Propios)
Ver informes globales y Rankings


X
X


Ver gráficos evolutivos individuales


X
X
X (Solo propio)
Ver promedios del equipo/sector


X
X
X


3. Lógica de Jerarquías de Jugadores (Estructura de Datos)
El sistema debe contemplar la polifuncionalidad (un jugador puede pertenecer a más de una posición final). La estructura de asignación de entrenamientos y filtros de informes sigue este árbol jerárquico:
Plantel Completo (Jugadores)
Forwards
1° Línea (Pilar Izq. / Hooker / Pilar Der.)
2° Línea
3° Línea (Ala / Octavo)
Backs
Medio Scrum
Apertura
1° Centro
2° Centro
Wing
Fullback
Regla de Negocio Crítica (Deduplicación): Si un ejercicio o test es asignado a múltiples jerarquías (ej: a Forwards y a 3° Línea) y un jugador cumple con ambas condiciones, el sistema debe validar mediante el ID_Ejercicio y Fecha para mostrar la tarjeta una sola vez en la agenda del jugador.

3.1. Diferenciación entre Plantilla (Catálogo) e Instancia (Agenda)
El sistema debe separar estrictamente la información base del ejercicio de su asignación diaria:
* **Datos de Plantilla:** Título, Tipo, Clases, Video/Imagen y Descripción técnica del ejercicio. Son de solo lectura para el entrenador al momento de agendar.
* **Datos de Instancia (Comentario del Entrenador):** Campo de texto libre y modificable único para cada asignación en la agenda. Permite al entrenador especificar las cargas del día (ej: "3 series de 4 con mínimo 10kg"). 
* **Regla de Clonación y Edición:** Al usar la función "Clonar Ejercicio", la nueva instancia creada en el día de destino heredará el "Comentario del Entrenador" original. El entrenador podrá editar o borrar este comentario en el nuevo día sin que afecte al entrenamiento del día origen ni a la plantilla del catálogo.

4. Historias de Usuario Principales (User Stories)
Flujo de Onboarding e Ingreso
Como Head Coach, quiero crear un equipo para obtener un ID único y compartírselo a mis jugadores.
Como Jugador, quiero registrarme y colocar el ID de mi equipo para solicitar el ingreso.
Como Head Coach, quiero ver una lista de solicitudes pendientes para autorizar el ingreso de los jugadores al equipo y asignarles sus posiciones/roles.
Flujo de la Agenda (Staff Técnico)
Como Entrenador/Head Coach, quiero seleccionar un ejercicio o test de la base de datos para asignarlo a una fecha específica y a una o varias jerarquías de jugadores.
Como Entrenador/Head Coach, quiero disponer de botones de acción rápida en la agenda para Modificar, Eliminar o Clonar un ejercicio (copiarlo a otro día) de forma ágil.
Flujo de Ejecución (Jugador)
Como Jugador, quiero entrar a la app y ver mi To-Do List del día con mis entrenamientos y tests asignados.
Como Jugador, quiero poder navegar a días pasados o futuros para marcar entrenamientos como realizados o cargar los resultados de mis tests (ej: peso en Kg o tiempo en Test de Cooper) de manera adelantada o atrasada.
Flujo de Analítica e Informes
Como Jugador, quiero ver un gráfico de líneas de mi evolución física comparada con una línea de promedio del equipo (o de mi sector Forwards/Backs) para saber cómo estoy respecto al grupo sin violar la privacidad de mis compañeros.
Como Entrenador, quiero ver un panel de Cumplimiento Semanal con una grilla de círculos de colores (Verde/Gris) para controlar de un vistazo quién cumplió con la meta de días entrenados.
Como Entrenador, quiero ver informes globales y rankings de los resultados de los tests, pudiendo filtrar por cualquier nivel de la jerarquía (ej: ver solo el ranking de Cooper de los 3° Línea).

5. Especificaciones de Diseño UX/UI
Layout Contextual: Mobile-First estricto para las pantallas de Jugador (uso en el gimnasio/campo) y Web-Desktop para los páneles de informes avanzados del Staff Técnico.
Estética: Interfaz de alto rendimiento deportivo. Modo Oscuro predominante (grises muy oscuros y negros) con un color de acento energético (ej: Verde Neón o el color institucional del club) para los botones de acción principal (Check de completado / Enviar Test).
Tarjetas de Agenda diferenciadas:
Entrenamiento: Muestra video/imagen, campo "Detalle" expansible (si el texto es largo) y botón simple de estado.
Test: Incluye un campo de entrada numérica (Input) con la unidad de medida predefinida y botón de envío.

Stack Tecnológico Actualizado
Frontend Web: Next.js (React) con Tailwind CSS.
Ventaja de Producto: Permite renderizar las vistas de informes pesados en el servidor (SSR) para los entrenadores y, al mismo tiempo, se puede configurar como una PWA (Progressive Web App) para que los jugadores la instalen en el celular.
Backend / API: Next.js App Router (Server Actions / API Handlers).
Ventaja de Producto: No necesitás mantener un servidor separado. Toda la lógica de negocio (como la regla de deduplicación de ejercicios para polifuncionales) se procesa dentro del mismo ecosistema de Next.js.
Base de Datos y Servicios Backend: Supabase (PostgreSQL).
Autenticación: Se utiliza el módulo de Supabase Auth para el registro de jugadores y control de roles.
Base de Datos: PostgreSQL relacional para manejar de forma segura las relaciones complejas (Equipos, Posiciones Múltiples, Agendas y Métricas).
Storage: Se utiliza Supabase Storage para que el Administrador pueda subir las imágenes de las plantillas de entrenamiento.

Modificaciones Específicas al PRD (Sección Técnica)
6. Arquitectura Técnica (Next.js + Supabase)
Flujo de Registro Segurizado: Cuando un jugador se registra mediante Supabase Auth, se crea un registro en la tabla usuarios con estado pendiente. Al ingresar el ID del equipo, se genera la solicitud que el Head Coach verá en su panel. Una vez aprobado, el Head Coach modifica el rol en la base de datos a jugador y le asigna sus posiciones.
Estrategia de Transición a Mobile: La lógica de consultas a la base de datos que se use en Next.js se conectará directamente a las tablas de Supabase. Cuando se desarrolle la app mobile en React Native/Expo, esa app se conectará directamente a las mismas tablas y servicios de Supabase, reutilizando el 100% de la base de datos, las imágenes guardadas y el sistema de usuarios sin tener que migrar nada.
Seguridad de Datos (RLS - Row Level Security): Se aplicarán políticas estrictas en Supabase para cumplir con el requerimiento de privacidad del Pilar 2:
Los Jugadores solo tienen permiso para leer y escribir sus propias filas de métricas individuales.
Los Jugadores pueden leer una tabla/vista calculada de "Promedios" generales del equipo.
Los Entrenadores y Head Coaches tienen permisos RLS para leer todas las filas de todos los jugadores de su equipo.

7. Gestión de Catálogo: Clasificación de Ejercicios y Tests

Para optimizar la búsqueda, organización y balance de las cargas de entrenamiento por parte del staff técnico, el sistema implementará un modelo de etiquetado basado en **Tipos** y **Clases Múltiples**.

7.1. Tipos de Contenido (Excluyente)
Cada elemento creado en la biblioteca del Administrador debe pertenecer obligatoriamente a una de estas dos categorías raíz:
* **Ejercicio:** Rutina o bloque de entrenamiento físico/técnico enfocado en la ejecución. Requiere un feedback de estado binario (`Realizado` / `No Realizado`).
* **Test:** Evaluación física o de rendimiento enfocada en la medición. Requiere la carga obligatoria de un resultado numérico o temporal mapeado a una métrica.

7.2. Sistema de Clases (Etiquetado Múltiple / N-to-N)
Un mismo Ejercicio o Test puede contener **ninguna, una o varias clases** asignadas de forma simultánea. El árbol de clases oficial de la plataforma se divide en tres ejes:

A. Capacidad Física Principal (Objetivo Fisiológico)
* `Fuerza`: Enfoque en sobrecarga, hipertrofia o fuerza máxima.
* `Potencia`: Movimientos explosivos, pliometría o derivados de levantamiento olímpico.
* `Velocidad`: Sprints, aceleración y velocidad lineal.
* `Agilidad`: Cambios de dirección, juego de pies, evasión y coordinación.
* `Resistencia`: Capacidad aeróbica/anaeróbica, pasadas e intermitentes.
* `Movilidad`: Flexibilidad y amplitud articular.

B. Zona Anatómica (Foco Muscular)
* `Tren Superior`: Pectorales, dorsales, hombros, brazos.
* `Tren Inferior`: Cuádriceps, isquiotibiales, glúteos, gemelos.
* `Core`: Zona media, abdominales, lumbares, estabilidad (crítico para Scrum/Tacle).
* `Full Body`: Movimientos compuestos globales (ej: Peso Muerto, Cargadas).

C. Especificidad de Rugby (Contexto de Juego)
* `Prevención`: Ejercicios de *Prehab* para fortalecimiento de zonas propensas a lesiones (cuello, hombros, rodillas).
* `Destrezas`: Trabajo técnico individual que puede realizarse de forma remota y aislada (ej: manejo de pelota, lanzamientos de hooker, juego de patada).
* `Contacto`: Preparación física de posturas específicas para las fases de obtención o disputa (postura de tacle, empuje, estabilidad en el piso).

7.3. Requerimientos de UX/UI para Clases
* **Filtros Multi-Select (Vista Entrenador):** La biblioteca de ejercicios debe permitir filtrar cruzando el Tipo con múltiples Clases mediante componentes de tipo *Badges* o *Checkboxes* (ej: Buscar un `Test` que sea de `Resistencia` y `Full Body`).
* **Formulario de Creación (Vista Administrador):** El panel de carga de nuevas plantillas debe incluir un selector múltiple amigable para tildar las clases correspondientes de forma ágil antes de guardar el ejercicio en el catálogo.
