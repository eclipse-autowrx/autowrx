const Joi = require('joi');
const { objectId } = require('./custom.validation');

const visibility = Joi.string().valid('public', 'private', 'editable');

const list = {
  query: Joi.object().keys({
    name: Joi.string(),
    visibility,
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const get = {
  params: Joi.object().keys({ id: Joi.string().custom(objectId) }),
};

const create = {
  body: Joi.object().keys({
    name: Joi.string().required().max(255),
    description: Joi.string().allow(''),
    image: Joi.string().allow(''),
    visibility: visibility.default('public'),
    is_default: Joi.boolean().default(false),
    config: Joi.any(),
  }),
};

const update = {
  params: Joi.object().keys({ id: Joi.string().custom(objectId) }),
  body: Joi.object()
    .keys({
      name: Joi.string().max(255),
      description: Joi.string().allow(''),
      image: Joi.string().allow(''),
      visibility,
      is_default: Joi.boolean(),
      config: Joi.any(),
    })
    .min(1),
};

const remove = {
  params: Joi.object().keys({ id: Joi.string().custom(objectId) }),
};

module.exports = { list, get, create, update, remove };


