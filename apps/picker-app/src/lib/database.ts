import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

export async function initDatabase() {
  try {
    db = await SQLite.openDatabaseAsync('picker_offline.db');

    // Create tables for offline support
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        order_number TEXT,
        status TEXT,
        customer_name TEXT,
        customer_phone TEXT,
        delivery_address TEXT,
        notes TEXT,
        created_at TEXT,
        priority INTEGER DEFAULT 0,
        data TEXT,
        synced_at TEXT
      );

      CREATE TABLE IF NOT EXISTS order_items (
        id TEXT PRIMARY KEY,
        order_id TEXT,
        product_id TEXT,
        product_name TEXT,
        product_sku TEXT,
        quantity INTEGER,
        aisle TEXT,
        shelf TEXT,
        is_picked INTEGER DEFAULT 0,
        is_unavailable INTEGER DEFAULT 0,
        unavailable_reason TEXT,
        unavailable_notes TEXT,
        picked_at TEXT,
        data TEXT,
        FOREIGN KEY (order_id) REFERENCES orders(id)
      );

      CREATE TABLE IF NOT EXISTS pending_actions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        action_type TEXT,
        order_id TEXT,
        item_id TEXT,
        payload TEXT,
        created_at TEXT,
        retries INTEGER DEFAULT 0
      );

      CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
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

// Save orders for offline access
export async function saveOrdersOffline(orders: any[]) {
  if (!db) {
    return;
  }

  const now = new Date().toISOString();

  for (const order of orders) {
    await db.runAsync(
      `INSERT OR REPLACE INTO orders
       (id, order_number, status, customer_name, customer_phone, delivery_address, notes, created_at, priority, data, synced_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        order.id,
        order.orderNumber,
        order.status,
        order.customerName,
        order.customerPhone,
        order.deliveryAddressText,
        order.notes || '',
        order.createdAt,
        order.priority || 0,
        JSON.stringify(order),
        now,
      ],
    );

    // Save order items
    if (order.items) {
      for (const item of order.items) {
        await db.runAsync(
          `INSERT OR REPLACE INTO order_items
           (id, order_id, product_id, product_name, product_sku, quantity, aisle, shelf, is_picked, is_unavailable, unavailable_reason, unavailable_notes, data)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            item.id,
            order.id,
            item.productId,
            item.product?.nameAr || '',
            item.product?.sku || '',
            item.quantity,
            item.product?.aisle || '',
            item.product?.shelf || '',
            item.isPicked ? 1 : 0,
            item.isUnavailable ? 1 : 0,
            item.unavailableReason || '',
            item.unavailableNotes || '',
            JSON.stringify(item),
          ],
        );
      }
    }
  }
}

// Get offline orders
export async function getOfflineOrders(): Promise<any[]> {
  if (!db) {
    return [];
  }

  const orders = await db.getAllAsync<any>('SELECT * FROM orders ORDER BY created_at DESC');

  return orders.map((order) => ({
    ...JSON.parse(order.data || '{}'),
    id: order.id,
    orderNumber: order.order_number,
    status: order.status,
    customerName: order.customer_name,
    createdAt: order.created_at,
  }));
}

// Get offline order with items
export async function getOfflineOrder(orderId: string): Promise<any | null> {
  if (!db) {
    return null;
  }

  const order = await db.getFirstAsync<any>('SELECT * FROM orders WHERE id = ?', [orderId]);
  if (!order) {
    return null;
  }

  const items = await db.getAllAsync<any>(
    'SELECT * FROM order_items WHERE order_id = ? ORDER BY aisle, shelf',
    [orderId],
  );

  const orderData = JSON.parse(order.data || '{}');
  orderData.items = items.map((item) => ({
    ...JSON.parse(item.data || '{}'),
    id: item.id,
    productId: item.product_id,
    quantity: item.quantity,
    isPicked: item.is_picked === 1,
    isUnavailable: item.is_unavailable === 1,
    unavailableReason: item.unavailable_reason,
    product: {
      nameAr: item.product_name,
      sku: item.product_sku,
      aisle: item.aisle,
      shelf: item.shelf,
    },
  }));

  return orderData;
}

// Mark item as picked offline
export async function markItemPickedOffline(orderId: string, itemId: string) {
  if (!db) {
    return;
  }

  const now = new Date().toISOString();

  await db.runAsync('UPDATE order_items SET is_picked = 1, picked_at = ? WHERE id = ?', [
    now,
    itemId,
  ]);

  // Queue action for sync
  await db.runAsync(
    'INSERT INTO pending_actions (action_type, order_id, item_id, payload, created_at) VALUES (?, ?, ?, ?, ?)',
    ['PICK_ITEM', orderId, itemId, '{}', now],
  );
}

// Mark item unavailable offline
export async function markItemUnavailableOffline(
  orderId: string,
  itemId: string,
  reason: string,
  notes?: string,
) {
  if (!db) {
    return;
  }

  const now = new Date().toISOString();

  await db.runAsync(
    'UPDATE order_items SET is_unavailable = 1, unavailable_reason = ?, unavailable_notes = ? WHERE id = ?',
    [reason, notes || '', itemId],
  );

  // Queue action for sync
  await db.runAsync(
    'INSERT INTO pending_actions (action_type, order_id, item_id, payload, created_at) VALUES (?, ?, ?, ?, ?)',
    ['MARK_UNAVAILABLE', orderId, itemId, JSON.stringify({ reason, notes }), now],
  );
}

// Get pending actions to sync
export async function getPendingActions(): Promise<any[]> {
  if (!db) {
    return [];
  }

  return db.getAllAsync<any>('SELECT * FROM pending_actions ORDER BY created_at ASC');
}

// Remove synced action
export async function removePendingAction(actionId: number) {
  if (!db) {
    return;
  }

  await db.runAsync('DELETE FROM pending_actions WHERE id = ?', [actionId]);
}

// Clear old offline data
export async function clearOldOfflineData() {
  if (!db) {
    return;
  }

  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  await db.runAsync('DELETE FROM orders WHERE synced_at < ?', [oneDayAgo]);
  await db.runAsync('DELETE FROM order_items WHERE order_id NOT IN (SELECT id FROM orders)');
}
