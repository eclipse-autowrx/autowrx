// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const mongoose = require('mongoose');
const { toJSON, paginate, captureChange } = require('./plugins');
const { stateTypes } = require('../config/enums');

const apiSchema = mongoose.Schema(
  {
    VSC: {
      type: [String],
    },
    VSS: {
      type: [String],
    },
  },
  { _id: false }
);

const descriptionSchema = mongoose.Schema(
  {
    problem: {
      type: String,
      max: 4095,
    },
    says_who: {
      type: String,
      max: 4095,
    },
    solution: {
      type: String,
      max: 4095,
    },
    status: {
      type: String,
      max: 255,
    },
    text: {
      type: String,
    },
  },
  {
    _id: false,
  }
);

const portfolioSchema = mongoose.Schema(
  {
    effort_estimation: Number,
    needs_addressed: Number,
    relevance: Number,
  },
  {
    _id: false,
  }
);

const tagSchema = mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
  },
  {
    _id: false,
  }
);

const ratingSchema = mongoose.Schema({
  rating: {
    type: Number,
    required: true,
  },
  rated_time: {
    type: Date,
    required: true,
    default: Date.now,
  },
});

const prototypeSchema = new mongoose.Schema(
  {
    apis: {
      type: apiSchema,
      default: {
        VSC: [],
        VSS: [],
      },
    },
    code: {
      type: String,
      default:
        'from sdv_model import Vehicle import plugins from browser import aio vehicle = Vehicle() # write your code here',
    },
    extend: {
      type: mongoose.SchemaTypes.Mixed,
    },
    complexity_level: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
      default: 3,
    },
    customer_journey: {
      type: String,
      required: true,
      default: ' ',
    },
    description: {
      type: descriptionSchema,
      default: {
        problem: '',
        says_who: '',
        solution: '',
        status: '',
      },
    },
    image_file: {
      type: String,
    },
    journey_image_file: {
      type: String,
    },
    analysis_image_file: {
      type: String,
    },
    model_id: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'Model',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxLength: 255,
    },
    portfolio: {
      type: portfolioSchema,
      default: {
        effort_estimation: 0,
        needs_addressed: 0,
        relevance: 0,
      },
    },
    skeleton: {
      type: String,
    },
    state: {
      type: String,
      required: true,
      default: stateTypes.DEVELOPMENT,
      enums: Object.values(stateTypes),
    },
    tags: {
      type: [tagSchema],
    },
    widget_config: {
      type: String,
    },
    last_viewed: {
      type: Date,
    },
    rated_by: {
      type: Map,
      of: ratingSchema,
      default: {},
    },
    autorun: {
      type: Boolean,
      default: false,
    },
    related_ea_components: {
      type: String,
    },
    partner_logo: {
      type: String,
    },
    created_by: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'User',
      required: true,
    },
    executed_turns: {
      type: Number,
      default: 0,
    },
    language: {
      type: String,
      default: 'python',
      maxLength: 20,
    },
    requirements: {
      type: String,
    },
    requirements_data: {
      type: mongoose.SchemaTypes.Mixed,
    },
    flow: {
      type: mongoose.SchemaTypes.Mixed,
    },
    editors_choice: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
prototypeSchema.plugin(toJSON);
prototypeSchema.plugin(paginate);
prototypeSchema.set('toJSON', {
  virtuals: true,
});

prototypeSchema.virtual('model', {
  ref: 'Model',
  localField: 'model_id',
  foreignField: '_id',
  justOne: true,
});

prototypeSchema.statics.existsPrototypeInModel = async function (model_id, name, excludeId) {
  const prototype = await this.findOne({ name, model_id, _id: { $ne: excludeId } });
  return !!prototype;
};

prototypeSchema.pre('save', captureChange.captureUpdates);
prototypeSchema.post('save', captureChange.captureCreate);
prototypeSchema.post('remove', captureChange.captureRemove);

/**
 * @typedef Prototype
 */
const Prototype = mongoose.model('Prototype', prototypeSchema);

module.exports = Prototype;
