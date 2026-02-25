import Dexie from 'dexie'

export const db = new Dexie('ChoresPlanner')

db.version(1).stores({
  categories: '++id, name',
  assignees: '++id, name',
  chores: '++id, categoryId, assigneeId, createdAt',
  choreInstances: '++id, choreId, date, status',
})

// v2: remove assignees table
db.version(2).stores({
  categories: '++id, name',
  assignees: null,
  chores: '++id, categoryId, createdAt',
  choreInstances: '++id, choreId, date, status',
})

// Seed default categories on first install
db.on('populate', async () => {
  await db.categories.bulkAdd([
    { name: 'Financial',        icon: 'dollar-sign', color: '#10b981' },
    { name: 'Personal',         icon: 'user',        color: '#8b5cf6' },
    { name: 'Hygiene',          icon: 'sparkles',    color: '#06b6d4' },
    { name: 'Car Maintenance',  icon: 'car',         color: '#f59e0b' },
    { name: 'Bike Maintenance', icon: 'bike',        color: '#ef4444' },
  ])
})

export default db
