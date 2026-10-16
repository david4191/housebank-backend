'use strict';

const express = require('express');
const { Validator } = require('../../utils/validator');
const response = require('../../utils/response');
const { requireAuth, requireRole } = require('../../middleware/auth');
const Property = require('../../models/Property');
const Wishlist = require('../../models/Wishlist');

const router = express.Router();
const wrap = (fn) => (req, res, next) => fn(req, res, next).catch(next);

/** GET /wishlist/mine (customer) — saved approved properties from the database. */
router.get(
  '/mine',
  requireAuth,
  requireRole('customer'),
  wrap(async (req, res) => {
    const rows = await Wishlist.forCustomer(req.authUser.sub);
    return response.success(res, rows);
  })
);

/** POST /wishlist (customer) — save an approved property by property_id. */
router.post(
  '/',
  requireAuth,
  requireRole('customer'),
  wrap(async (req, res) => {
    const v = new Validator(req.body);
    v.required('property_id').integer('property_id');
    if (v.fails()) return response.validationError(res, v.errors());

    const propertyId = Number(v.validated().property_id);
    const property = await Property.findById(propertyId);
    if (!property || property.status !== 'approved') {
      return response.notFound(res, 'Available property not found.');
    }

    await Wishlist.add(req.authUser.sub, propertyId);
    return response.success(res, { property_id: propertyId }, 'Property saved.');
  })
);

/** DELETE /wishlist/:propertyId (customer) — remove one saved property. */
router.delete(
  '/:propertyId',
  requireAuth,
  requireRole('customer'),
  wrap(async (req, res) => {
    const propertyId = Number(req.params.propertyId);
    if (!Number.isSafeInteger(propertyId) || propertyId < 1) {
      return response.validationError(res, { property_id: ['Must be a positive integer.'] });
    }

    await Wishlist.remove(req.authUser.sub, propertyId);
    return response.success(res, null, 'Property removed from wishlist.');
  })
);

module.exports = router;