---
sidebar_position: 1
---

# Installation

## Core

First of all, you will need to install [OBS Websocket v5](https://github.com/obsproject/obs-websocket/releases/latest) if you do not have it installed.

Then, install [@simple-obs/core](/api/core) with your package manager of choice:

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

<Tabs groupId="package-managers">
<TabItem value="npm" label="npm">

```
npm i @simple-obs/core
```

</TabItem>
<TabItem value="yarn" label="Yarn">

```
yarn add @simple-obs/core
```

</TabItem>
<TabItem value="pnpm" label="pnpm">

```
pnpm i @simple-obs/core
```

</TabItem>
</Tabs>

## Extra Packages

Technically, [@simple-obs/core](/api/core) is all you need to use Simple OBS, but there are more packages that help to improve the experience:

- [@simple-obs/sources](/api/sources) : Types and implementations for all of OBS's default sources, including special implementations for [BrowserSource](/api/sources/class/BrowserSource)
- [@simple-obs/filters](/api/filters): Types and implementations for all of OBS's default filters

These can be installed in the same way as before:

<Tabs groupId="package-managers">
<TabItem value="npm" label="npm">

```
npm i @simple-obs/sources @simple-obs/filters
```

</TabItem>
<TabItem value="yarn" label="Yarn">

```
yarn add @simple-obs/sources @simple-obs/filters
```

</TabItem>
<TabItem value="pnpm" label="pnpm">

```
pnpm i @simple-obs/sources @simple-obs/filters
```

</TabItem>
</Tabs>
