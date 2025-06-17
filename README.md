Buceo en Roatán | Roatán Dive Experience¡Bienvenido al repositorio del proyecto "Buceo en Roatán"! Este proyecto es un sitio web multi-página diseñado para un centro de buceo ficticio en Roatán, Honduras, ofreciendo una experiencia interactiva y visualmente atractiva para sus visitantes.Descripción del Proyecto"Buceo en Roatán" es un sitio web moderno y responsivo que destaca los servicios de buceo, la belleza submarina y la experiencia que ofrece el centro "Roatán Dive Experience". Incorpora un diseño vibrante con colores inspirados en el océano, elementos interactivos como video de fondo y un menú de navegación adaptable, y funcionalidades de autenticación básica de usuarios.Características PrincipalesPágina de Inicio (index.html): Una portada inmersiva con video de fondo, información destacada y enlaces a las secciones clave del sitio.Servicios (servicios.html): Detalles sobre los cursos PADI, inmersiones guiadas y tours de snorkel.Calendario (calendario.html): Consulta las próximas fechas de inmersiones y eventos.Mapa de Puntos de Buceo (mapasdebuceo.html): Explora los sitios de buceo en Roatán, Utila y Cayos Cochinos.Testimonios (testimonios.html): Lo que dicen los clientes satisfechos sobre sus experiencias.Tienda Online (ecomerce.html): Una sección para explorar y comprar equipo, accesorios y souvenirs de buceo.Galería Avanzada (galeria.html): Una colección de fotos y videos del mundo submarino.Contacto (contacto.html): Formulario de contacto y información directa para consultas.Acceso Usuarios (login.html): Un sistema básico de inicio de sesión/registro de usuarios integrado con Firebase Authentication.Tecnologías UtilizadasHTML5: Estructura semántica del contenido.CSS3 (con Tailwind CSS): Estilos modernos, responsivos y altamente personalizables.JavaScript: Para interactividad (menú de hamburguesa) y lógica de autenticación.Firebase Authentication: Para el sistema de registro e inicio de sesión de usuarios (requiere configuración de proyecto Firebase).Google Maps Embed: Para la visualización de mapas (integración básica).Google Fonts (Inter): Tipografía moderna y legible.Estructura de Archivosbuceoenroatan/
├── index.html                  # Página de inicio
├── servicios.html              # Página de servicios
├── calendario.html             # Página de calendario
├── mapasdebuceo.html           # Página de mapa de puntos de buceo
├── testimonios.html            # Página de testimonios
├── ecomerce.html               # Página de tienda online
├── galeria.html                # Página de galería
├── contacto.html               # Página de contacto
├── login.html                  # Página de acceso de usuarios
├── img/                        # (Opcional) Carpeta para imágenes locales
│   └── ...
├── css/                        # (Opcional) Carpeta para estilos CSS personalizados
│   └── styles.css
├── js/                         # (Opcional) Carpeta para scripts JS adicionales
│   └── script.js
├── site.webmanifest            # Manifiesto para PWA
├── favicon.ico                 # Icono de favoritos
├── favicon-96x96.png           # Iconos de favoritos para diferentes tamaños
├── favicon.svg
├── apple-touch-icon.png
├── robots.txt                  # Para instrucciones a los rastreadores de motores de búsqueda
├── sitemap.xml                 # Mapa del sitio para motores de búsqueda
└── README.md                   # Este archivo
Cómo Configurar y Ejecutar el ProyectoClonar el Repositorio:git clone https://github.com/tu-usuario/buceoenroatan.git
cd buceoenroatan
(Reemplaza tu-usuario con tu nombre de usuario de GitHub si el repositorio es público, o ajusta la URL del repositorio).Abrir el Sitio Localmente:Simplemente abre el archivo index.html en tu navegador web. Puedes arrastrarlo y soltarlo en la ventana del navegador, o hacer doble clic en el archivo.Para ver las otras páginas, haz clic en los enlaces de navegación o abre sus respectivos archivos HTML directamente.Configuración de Firebase (para Acceso Usuarios login.html):Crea un Proyecto en Firebase: Ve a console.firebase.google.com, crea un nuevo proyecto o selecciona uno existente.Habilita Authentication: En tu proyecto de Firebase, ve a "Build" > "Authentication" > "Get started". Luego, en la pestaña "Sign-in method", habilita el método "Email/Password".Obtén la Configuración de tu App Web: En "Project settings" (icono de engranaje) > "Your apps", añade una nueva web app (</>). Copia el objeto firebaseConfig que te proporciona.Importante para GitHub Pages / Hosting: Si estás subiendo esto a GitHub Pages o a otro hosting, el entorno de Canvas se encarga de inyectar la configuración de Firebase a través de __firebase_config. Si lo ejecutas puramente local, tendrás que reemplazar la línea de inicialización en login.html (y cualquier otro archivo JS que use Firebase) con tu objeto firebaseConfig directamente:// En login.html, reemplaza:
// const firebaseConfig = JSON.parse(typeof __firebase_config !== 'undefined' ? __firebase_config : '{}');
// const app = initializeApp(firebaseConfig);

// Por tu configuración real:
const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "TU_AUTH_DOMAIN",
  projectId: "TU_PROJECT_ID",
  storageBucket: "TU_STORAGE_BUCKET",
  messagingSenderId: "TU_MESSAGING_SENDER_ID",
  appId: "TU_APP_ID"
};
const app = initializeApp(firebaseConfig);
Reglas de Seguridad: Para un sistema de usuarios real, es CRÍTICO que configures las reglas de seguridad de Firebase Authentication y Firestore (si almacenas datos de usuario) para proteger tu base de datos. Consulta la documentación de Firebase para esto.Actualizar el Contenido:Imágenes y Videos: Reemplaza los placeholders de imágenes (https://picsum.photos/..., https://placehold.co/...) y los videos de ejemplo (https://assets.mixkit.co/..., https://www.youtube.com/embed/...) con tus propios activos de alta calidad para personalizar el sitio.Textos: Edita todo el texto para que refleje la información real de tu centro de buceo.Futuras Mejoras PotencialesImplementación Completa de Formularios: Conectar el formulario de contacto y el formulario de reservas a un backend real (ej. Firebase Functions, Node.js, PHP) para procesar los envíos.Galería Interactiva Avanzada: Implementar una galería con lightbox, filtros o categorías.Integración de API de Mapas Real: Usar la API de Google Maps o Mapbox para un mapa de puntos de buceo interactivo y personalizado con marcadores.Dashboard de Usuario: Crear una sección protegida para usuarios logueados para gestionar sus reservas o perfil.Funcionalidad de Tienda Online Completa: Integrar un carrito de compras y pasarela de pago.SEO Avanzado: Más optimizaciones de contenido, velocidad de carga y datos estructurados.Blog Dinámico: Un sistema para gestionar y mostrar publicaciones de blog.¡Esperamos que disfrutes de este proyecto y que "Roatán Dive Experience" sea un éxito en línea!
