'use strict';

const { pool } = require('../config/db');

async function forCustomer(userId) {
  const [rows] = await pool.execute(
    `SELECT w.created_at AS saved_at, p.id, p.uuid, p.title, p.slug, p.description,
            p.listing_type, p.price, p.currency, p.bedrooms, p.bathrooms, p.size_sqm,
            p.address, p.city, p.state, pt.name AS property_type_name,
            c.company_name, ap.full_name AS realtor_name,
            (SELECT pi.file_path FROM property_images pi
              WHERE pi.property_id = p.id
              ORDER BY pi.is_primary DESC, pi.sort_order ASC LIMIT 1) AS cover_image
       FROM wishlists w
       JOIN properties p ON p.id = w.property_id
       JOIN property_types pt ON pt.id = p.property_type_id
       LEFT JOIN companies c ON c.id = p.company_id
       LEFT JOIN agent_profiles ap ON ap.user_id = p.listed_by_user_id AND p.company_id IS NULL
      WHERE w.user_id = ? AND p.status = 'approved' AND p.deleted_at IS NULL
      ORDER BY w.created_at DESC`,
    [userId]
  );
  return rows;
}

async function add(userId, propertyId) {
  await pool.execute(
    'INSERT IGNORE INTO wishlists (user_id, property_id) VALUES (?, ?)',
    [userId, propertyId]
  );
}

async function remove(userId, propertyId) {
  await pool.execute('DELETE FROM wishlists WHERE user_id = ? AND property_id = ?', [userId, propertyId]);
}

module.exports = { forCustomer, add, remove };