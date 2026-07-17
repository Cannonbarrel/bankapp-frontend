export default class Customer {
  constructor({ id = '', name = '' } = {}) {
    this.id = id
    this.name = name
  }

  // Safely extract a flat string ID whether Mongo gives us a raw string
  // (e.g. "64bbf4c...") or an ObjectId-shaped object (e.g. { "$oid": "64bbf4c..." })
  static extractId(rawId) {
    if (!rawId) return ''
    if (typeof rawId === 'string') return rawId
    if (typeof rawId === 'object' && rawId.$oid) return rawId.$oid
    return ''
  }

  static from(obj) {
    // Note: My backend uses `userName` instead of `name`. We must handle this mapping gracefully!
    return new Customer({
      id: Customer.extractId(obj.id) || Customer.extractId(obj._id),
      name: obj.userName || obj.name || ''
    })
  }
}
