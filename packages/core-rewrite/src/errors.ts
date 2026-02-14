import { Data } from "effect";

/**
 * Base error for all OBS WebSocket errors
 */
export class OBSError extends Data.TaggedError("OBSError")<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

/**
 * Error when an input is not found in OBS
 */
export class InputNotFoundError extends Data.TaggedError("InputNotFoundError")<{
  readonly inputName: string;
}> {
  override get message() {
    return `Input not found: ${this.inputName}`;
  }
}

/**
 * Error when a scene is not found in OBS
 */
export class SceneNotFoundError extends Data.TaggedError("SceneNotFoundError")<{
  readonly sceneName: string;
}> {
  override get message() {
    return `Scene not found: ${this.sceneName}`;
  }
}

/**
 * Error when attempting to create an input with a name that already exists in OBS
 */
export class InputAlreadyExistsError extends Data.TaggedError(
  "InputAlreadyExistsError"
)<{
  readonly inputName: string;
}> {
  override get message() {
    return `An input already exists with the name "${this.inputName}"`;
  }
}

/**
 * Error when attempting to create an input with a name that already exists
 * but was not created by Sceneify (or has a different kind)
 */
export class NameConflictError extends Data.TaggedError("NameConflictError")<{
  readonly name: string;
  readonly expectedKind?: string;
  readonly actualKind?: string;
}> {
  override get message() {
    if (this.expectedKind && this.actualKind) {
      return `Name conflict: "${this.name}" exists with kind "${this.actualKind}" but expected "${this.expectedKind}"`;
    }
    return `Name conflict: "${this.name}" already exists and was not created by Sceneify`;
  }
}

/**
 * Error when a scene item is not found
 */
export class SceneItemNotFoundError extends Data.TaggedError(
  "SceneItemNotFoundError"
)<{
  readonly sceneName: string;
  readonly itemName: string;
}> {
  override get message() {
    return `Scene item "${this.itemName}" not found in scene "${this.sceneName}"`;
  }
}

/**
 * Error when a filter is not found on an input or scene
 */
export class FilterNotFoundError extends Data.TaggedError(
  "FilterNotFoundError"
)<{
  readonly sourceName: string;
  readonly filterName: string;
}> {
  override get message() {
    return `Filter "${this.filterName}" not found on source "${this.sourceName}"`;
  }
}

/**
 * Error when OBS WebSocket connection fails
 */
export class ConnectionError extends Data.TaggedError("ConnectionError")<{
  readonly url: string;
  readonly cause?: unknown;
}> {
  override get message() {
    return `Failed to connect to OBS at ${this.url}`;
  }
}
