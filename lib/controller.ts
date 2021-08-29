import * as path from "std/path/mod.ts";
import { parse, stringify } from "std/encoding/yaml.ts";

export type Participant = Record<string, unknown>;

export default class Controller {
  participants: Map<string, Participant> = new Map();
  sourcePath!: string;

  constructor(sourcePath: string) {
    this.sourcePath = sourcePath;
    console.log("Loading everything to memory...");

    for (const dirEntry of Deno.readDirSync(sourcePath)) {
      if (dirEntry.isFile) {
        const data = parse(
          Deno.readTextFileSync(path.join(sourcePath, dirEntry.name))
        ) as Participant;
        const key = fileToKey(dirEntry.name);
        this.participants.set(key, data);
      }
    }

    console.log("Loading finished: ", this.participants.size, " participants");
  }

  all() {
    return this.participants;
  }

  get(participant: string): Participant | undefined {
    return this.participants.get(participant);
  }

  // TODO: Validate it's the same person
  delete(participant: string) {
    this.participants.delete(participant);
    Deno.remove(this.file(participant));
  }

  // TODO: Validate that it's the same person
  set(participant: string, value: Participant): void {
    this.participants.set(participant, value);
    Deno.writeTextFile(this.file(participant), stringify(value));
  }

  private file(participant: string) {
    return path.join(this.sourcePath, keyToFile(participant));
  }
}

export function fileToKey(fileName: string): string {
  return fileName.slice(0, -4); // zequez.yml = zequez
}

export function keyToFile(keyName: string): string {
  return `/${keyName}.yml`;
}
