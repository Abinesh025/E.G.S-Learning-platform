const { getPool, sql } = require('../config/db');
const { ROLES, MESSAGES } = require('../common');

let rolesCache = null;
let lastFetchTime = 0;
const CACHE_TTL_MS = 60 * 1000; // 1 minute in-memory cache for speed

/**
 * Fetches all roles from the database Roles table
 * @param {boolean} forceRefresh - If true, bypasses the cache
 * @returns {Promise<Array<{ id: number, roleName: string, roleKey: string }>>}
 */
async function getAllRoles(forceRefresh = false) {
  const now = Date.now();
  if (!forceRefresh && rolesCache && (now - lastFetchTime < CACHE_TTL_MS)) {
    return rolesCache;
  }

  const pool = await getPool();
  const result = await pool.request().query(`
    SELECT id, roleName, createdAt, updatedAt
    FROM Roles
    ORDER BY id ASC
  `);

  rolesCache = result.recordset.map(row => ({
    id: row.id,
    roleName: row.roleName,
    roleKey: String(row.roleName).trim().toLowerCase(),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }));
  lastFetchTime = now;

  return rolesCache;
}

/**
 * Returns an array of valid role keys from the DB in lowercase, e.g. ['admin', 'staff', 'student']
 * @returns {Promise<string[]>}
 */
async function getValidRoleKeys() {
  const roles = await getAllRoles();
  return roles.map(r => r.roleKey);
}

/**
 * Checks whether a given role exists in the Roles database table
 * @param {string} role - Role name (e.g. 'Admin', 'admin', 'Staff')
 * @returns {Promise<boolean>}
 */
async function isValidRole(role) {
  if (!role) return false;
  const normalized = String(role).trim().toLowerCase();
  const validKeys = await getValidRoleKeys();
  return validKeys.includes(normalized);
}

/**
 * Gets role by name from DB
 * @param {string} roleName
 * @returns {Promise<{ id: number, roleName: string, roleKey: string } | null>}
 */
async function getRoleByName(roleName) {
  if (!roleName) return null;
  const roles = await getAllRoles();
  const normalized = String(roleName).trim().toLowerCase();
  return roles.find(r => r.roleKey === normalized) || null;
}

/**
 * Gets role by numeric ID from DB
 * @param {number} id
 * @returns {Promise<{ id: number, roleName: string, roleKey: string } | null>}
 */
async function getRoleById(id) {
  if (!id) return null;
  const roles = await getAllRoles();
  return roles.find(r => Number(r.id) === Number(id)) || null;
}

/**
 * Asserts that the role exists in the DB Roles table; throws error if invalid
 * @param {string} role
 */
async function assertRoleExists(role) {
  const valid = await isValidRole(role);
  if (!valid) {
    const validRoles = await getValidRoleKeys();
    throw new Error(`${MESSAGES.ROLE_NOT_FOUND_IN_DB}: '${role}'. Allowed in DB Roles table: [${validRoles.join(', ')}]`);
  }
}

module.exports = {
  getAllRoles,
  getValidRoleKeys,
  isValidRole,
  getRoleByName,
  getRoleById,
  assertRoleExists,
};
