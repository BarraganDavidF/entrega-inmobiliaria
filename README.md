# Hábitat Inmobiliaria · Prototipo funcional

Proyecto de aula: arquitectura de información de un sitio web de una inmobiliaria que vende y arrienda inmuebles y permite guardar favoritos.

Prototipo en **HTML, CSS y JavaScript sin dependencias**. Los inmuebles y datos de contacto son ficticios.

## Cómo ejecutarlo
Abre `index.html` en el navegador. No requiere instalación ni servidor.

## Páginas
| Archivo | Contenido |
|---|---|
| `index.html` | Inicio con buscador rápido (Comprar / Arrendar) |
| `resultados.html` | Filtros, orden, tarjetas de inmuebles y botón de favoritos |
| `inmueble.html?id=1` | Ficha del inmueble, requisitos de arriendo y formulario de contacto |
| `favoritos.html` | Lista de guardados y comparador de hasta 3 inmuebles |
| `ayuda.html` | Preguntas frecuentes y contacto |
| `cuenta.html` | Iniciar sesión y registrarse (maqueta) |

## Estructura
```
css/styles.css     estilos, diseño móvil primero
js/data.js         datos ficticios de 12 inmuebles
js/app.js          favoritos (localStorage), filtros, ficha, comparador, formularios
docs/              capturas, wireframes y diagramas usados en el documento
```

## Accesibilidad y responsive
Enlace «Saltar al contenido», etiquetas en todos los campos, foco visible, `aria-live` para avisos, botones de al menos 44 px y diseño que se adapta de 320 px a escritorio. Revisión automática con axe-core: sin violaciones en las 6 páginas (móvil y escritorio).
