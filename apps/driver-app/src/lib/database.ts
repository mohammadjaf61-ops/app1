import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

export async function initDatabase() {
  try {
    db = await SQLite.openDatabaseAsync('driver_offline.db');

    // Create tables for offline support
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS deliveries (
        id TEXT PRIMARY KEY,
        order_number TEXT,
        status TEXT,
        customer_name TEXT,
        customer_phone TEXT,
        delivery_address TEXT,
        notes TEXT,
        total INTEGER,
        payment_method TEXT,
        ready_at TEXT,
        created_at TEXT,
        data TEXT,
        synced_at TEXT
      );

      CREATE TABLE IF NOT EXISTS delivery_items (
        id TEXT PRIMARY KEY,
        order_id TEXT,
        product_name TEXT,
        quantity INTEGER,
        FOREIGN KEY (order_id) REFERENCES deliveries(id)
      );

      CREATE TABLE IF NOT EXISTS pending_actions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        action_type TEXT,
        order_id TEXT,
        payload TEXT,
        created_at TEXT,
        retries INTEGER DEFAULT 0
      );

      CREATE INDEX IF NOT EXISTS idx_delivery_items_order_id ON delivery_items(order_id);
      CREATE INDEX IF NOT EXISTS idx_pending_actions_order_id ON pending_actions(order_id);
    `);

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database:', error);
  }
}

export function getDatabase(): SQLite.SQLiteDatabase | null {
  return db;
}

// Save deliveries for offline access
export async function saveDeliveriesOffline(deliveries: any[]) {
  if (!db) return;

  const now = new Date().toISOString();

  for (const delivery of deliveries) {
    await db.runAsync(
      `INSERT OR REPLACE INTO deliveries
       (id, order_number, status, customer_name, customer_phone, delivery_address, notes, total, payment_method, ready_at, created_at, data, synced_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        delivery.id,
        delivery.orderNumber,
        delivery.status,
        delivery.customerName,
        delivery.customerPhone,
        delivery.deliveryAddressText,
        delivery.notes || '',
        delivery.total,
        delivery.paymentMethod || 'COD',
        delivery.readyAt || '',
        delivery.createdAt,
        JSON.stringify(delivery),
        now,
      ]
    );

    // Save delivery items
    if (delivery.items) {
      for (const item of delivery.items) {
        await db.runAsync(
          `INSERT OR REPLACE INTO delivery_items
           (id, order_id, product_name, quantity)
           VALUES (?, ?, ?, ?)`,
          [
            item.id,
            delivery.id,
            item.product?.nameAr || '',
            item.quantity,
          ]
        );
      }
    }
  }
}

// Get offline deliveries
export async function getOfflineDeliveries(): Promise<any[]> {
  if (!db) return [];

  const deliveries = await db.getAllAsync<any>(
    'SELECT * FROM deliveries ORDER BY created_at DESC'
  );

  return deliveries.map((delivery) => ({
    ...JSON.parse(delivery.data || '{}'),
    id: delivery.id,
    orderNumber: delivery.order_number,
    status: delivery.status,
    customerName: delivery.customer_name,
    customerPhone: delivery.customer_phone,
    deliveryAddressText: delivery.delivery_address,
    total: delivery.total,
    createdAt: delivery.created_at,
  }));
}

// Get offline delivery with items
export async function getOfflineDelivery(orderId: string): Promise<any | null> {
  if (!db) return null;

  const delivery = await db.getFirstAsync<any>(
    'SELECT * FROM deliveries WHERE id = ?',
    [orderId]
  );
  if (!delivery) return null;

  const items = await db.getAllAsync<any>(
    'SELECT * FROM delivery_items WHERE order_id = ?',
    [orderId]
  );

  const deliveryData = JSON.parse(delivery.data || '{}');
  deliveryData.items = items.map((item) => ({
    id: item.id,
    quantity: item.quantity,
    product: {
      nameAr: item.product_name,
    },
  }));

  return deliveryData;
}

// Queue status update for offline sync
export async function queueStatusUpdate(
  orderId: string,
  actionType: string,
  payload: any = {}
) {
  if (!db) return;

  const now = new Date().toISOString();

  await db.runAsync(
    'INSERT INTO pending_actions (action_type, order_id, payload, created_at) VALUES (?, ?, ?, ?)',
    [actionType, orderId, JSON.stringify(payload), now]
  );
}

// Update local delivery status
export async function updateDeliveryStatusOffline(orderId: string, status: string) {
  if (!db) return;

  await db.runAsync('UPDATE deliveries SET status = ? WHERE id = ?', [status, orderId]);
}

// Get pending actions to sync
export async function getPendingActions(): Promise<any[]> {
  if (!db) return [];

  return db.getAllAsync<any>(
    'SELECT * FROM pending_actions ORDER BY created_at ASC'
  );
}

// Remove synced action
export async function removePendingAction(actionId: number) {
  if (!db) return;

  await db.runAsync('DELETE FROM pending_actions WHERE id = ?', [actionId]);
}

// Clear old offline data
export async function clearOldOfflineData() {
  if (!db) return;

  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  await db.runAsync('DELETE FROM deliveries WHERE synced_at < ?', [oneDayAgo]);
  await db.runAsync(
    'DELETE FROM delivery_items WHERE order_id NOT IN (SELECT id FROM deliveries)'
  );
}
