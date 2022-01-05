---
sidebar_position: 1
slug: /installation
---

# Installation

First of all, you will need to install [OBS Websocket v5](https://github.com/obsproject/obs-websocket/releases/latest) if you do not have it installed.

## Core

Then, install [@sceneify/core](/api/core) with your package manager of choice:

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

<Tabs groupId="package-managers">
<TabItem value="npm" label="npm">

```
npm i @sceneify/core@beta
```

</TabItem>
<TabItem value="yarn" label="Yarn">

```
yarn add @sceneify/core@beta
```

</TabItem>
<TabItem value="pnpm" label="pnpm">

```
pnpm i @sceneify/core@beta
```

</TabItem>
</Tabs>

## Extra Packages

Technically, [@sceneify/core](/api/core) is all you need to use Sceneify, but there are more packages that help to improve the experience:

- [@sceneify/sources](/api/sources) : Types and implementations for all of OBS's default sources, including special implementations for [BrowserSource](/api/sources/class/BrowserSource)
- [@sceneify/filters](/api/filters): Types and implementations for all of OBS's default filters

These can be installed in the same way as before:

<Tabs groupId="package-managers">
<TabItem value="npm" label="npm">

```
npm i @sceneify/sources@beta @sceneify/filters@beta
```

</TabItem>
<TabItem value="yarn" label="Yarn">

```
yarn add @sceneify/sources@beta @sceneify/filters@beta
```

</TabItem>
<TabItem value="pnpm" label="pnpm">

```
pnpm i @sceneify/sources@beta @sceneify/filters@beta
```

</TabItem>
</Tabs>
