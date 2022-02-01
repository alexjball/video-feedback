import { isDefined } from "./utils"

type Versioned = { version: number }

export type Schema<A> = {
  check(v: any): A
  fields: any
}

export interface Upgrade<Previous, Current> {
  schema: Schema<Current>
  apply: (from: Previous) => Current
}

export class Versions<Current> {
  private base: Schema<any>
  private upgrades: Upgrade<any, any>[] = []
  private validateAll: boolean

  constructor(base: Schema<Current>, validateAll = false) {
    this.base = base
    this.validateAll = validateAll
  }

  add<Next extends Versioned>(upgrade: Upgrade<Current, Next>): Versions<Next> {
    this.upgrades.push(upgrade)
    return this as any
  }

  /** Throws if v is not a valid instance of some version */
  upgrade(v: any): Current {
    if (typeof v !== "object") {
      throw Error(v + " is not an object")
    }

    let out: any, start: number

    if (isDefined(v.version)) {
      start = this.upgrades.findIndex(u => u.schema.fields?.version?.value === v.version)

      if (start === -1) throw Error("Version not found: " + v.version)

      out = this.upgrades[start].schema.check(v)

      if (start === this.upgrades.length - 1) {
        return out
      } else {
        start++
      }
    } else {
      start = 0
      out = this.base.check(v)
    }

    this.upgrades.slice(start).forEach(upgrade => {
      out = upgrade.apply(out)
      if (this.validateAll) upgrade.schema.check(out)
    })
    if (!this.validateAll) this.upgrades[this.upgrades.length - 1].schema.check(out)

    return out
  }
}

export function createUpgrade<Previous, Current extends Versioned>(
  schema: Schema<Current>,
  upgrade: (from: Previous) => Current
): Upgrade<Previous, Current> {
  return { schema: schema, apply: upgrade }
}
