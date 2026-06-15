/**
 * @swagger
 * /api/super-admin/acl/permission:
 *   get:
 *     summary: Get all ACLs
 *     description: Retrieve a list of ACLs.
 *     tags:
 *       - ACL
 *     responses:
 *       200:
 *         description: A list of ACLs.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   name:
 *                     type: string
 */
export {};
