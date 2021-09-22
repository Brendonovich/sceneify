# `simple-obs`

### _La forma más sencilla de controlar OBS desde JS 🎥_

[![Downloads](https://img.shields.io/npm/dt/simple-obs.svg?style=flat&colorA=000000&colorB=000000)](https://www.npmjs.com/package/simple-obs)
[![Downloads](https://img.shields.io/npm/v/simple-obs.svg?style=flat&colorA=000000&colorB=000000)](https://www.npmjs.com/package/simple-obs)
[![Build Size](https://img.shields.io/bundlephobia/min/simple-obs?label=bundle%20size&style=flat&colorA=000000&colorB=000000)](https://bundlephobia.com/result?p=simple-obs)

Usar `obs-websocket` puede ser complicado. Pequeñas manipulaciones de escenas y elementos de escena son manejables , pero hacer un seguimiento de las escenas, las fuentes, la configuración, los filtros y más puede convertirse rápidamente en una tarea abrumadora.

`simple-obs` tiene como objetivo solucionar este problema. Al trabajar con los objetos `Scene`,` Source` y `SceneItem`, puedes tener un control incomparable sobre sus diseños OBS.

Si está familiarizado con las bases de datos, ¡es como un ORM para OBS!

# Advertencia Beta

Esta biblioteca no está bien probada y todavía se encuentra en intenso desarrollo. Siéntase libre de usarlo, pero asegúrese de hacer una copia de seguridad de sus colecciones de escenas antes de hacer cualquier cosa con `simple-obs`.

## Características

- Persistencia en las recargas de código, por lo que las escenas y los elementos no se eliminan ni se vuelven a crear cada vez que ejecuta su código
- Solicitud automática por lotes
- `Scene`,` Source` y `SceneItem` están diseñados para ser anulados, lo que permite abstraer diseños complejos en subclases
- Fácil integración en diseños existentes con `Scene.link ()`, lo que permite una migración incremental a `simple-obs` sin entregar todo el diseño a su código

## Instalación

1. Instale el  [fork de `obs-websocket`](https://github.com/MemedowsTeam/obs-websocket/releases)

   `simple-obs` expone alguna funcionalidad (por ejemplo,` obs.clean () `,` Scene.remove () `) que requiere la instalación del fork personalizado de` obs-websocket`. Este fork simplemente agrega soporte para eliminar
    escenas, conservando todas las demás funciones anteriores. `simple-obs` admitirá ` obs-websocket` v5 cuando se lance, que tiene soporte nativo para eliminar escenas, y también v4 para compatibilidad con versiones anteriores.

2. Instale `simple-obs`

   ```
   yarn add simple-obs
   ```

   o npm

   ```
   npm install simple-obs
   ```

   Si estás usando typescript, asegúrese de estar usando al menos `typescript@4.4.0`, ya que `simple-obs` usa algunas características para proporcionar tipos más precisos para solicitudes y eventos..

3. Conéctese a OBS. Consulte la carpeta de ejemplo para obtener más información.

## Agradecimientos

- [JDudeTV](https://twitch.tv/jdudetv) por ser el catalizador de este proyecto, ayudar con el desarrollo y utilizarlo en la producción de su flujo.
- [HannahGBS](https://twitter.com/hannah_gbs) por agregar soporte RemoveScene al fork `obs-websocket` y ayudar con el desarrollo y la documentación de fuentes y tipos de filtros.
- [lclc98](https://github.com/lclc98) por ayudar a los tipos de filtro y fuente de documentos
