// Copyright (c) 2026 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const Feedback = require('../../../src/models/feedback.model');
const feedbackService = require('../../../src/services/feedback.service');
const FeedbackPrototypeDecorator = require('../../../src/decorators/FeedbackPrototypeDecorator');
const FeedbackPrototypeListDecorator = require('../../../src/decorators/FeedbackPrototypeListDecorator');

jest.mock('../../../src/models/feedback.model');

describe('feedbackService score calculations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('calcAvgScore', () => {
    test('returns 0 when score is missing or has no positive ratings', async () => {
      await expect(feedbackService.calcAvgScore(null)).resolves.toBe(0);
      await expect(feedbackService.calcAvgScore({})).resolves.toBe(0);
      await expect(feedbackService.calcAvgScore({ easy_to_use: 0, need_address: 0, relevance: 0 })).resolves.toBe(0);
    });

    test('computes the mean of the three score fields', async () => {
      await expect(feedbackService.calcAvgScore({ easy_to_use: 3, need_address: 5, relevance: 4 })).resolves.toBe(4);
    });
  });

  describe('calcAvgScoreOfPrototype', () => {
    test('returns null when prototype has no feedback entries', async () => {
      Feedback.find.mockResolvedValue([]);
      const avg = await feedbackService.calcAvgScoreOfPrototype({ id: '507f1f77bcf86cd799439011' });
      expect(Feedback.find).toHaveBeenCalledWith({ ref: '507f1f77bcf86cd799439011' });
      expect(avg).toBeNull();
    });

    test('supports prototype._id and averages stored and fallback score entries', async () => {
      Feedback.find.mockResolvedValue([
        { avg_score: 4.5 },
        { avg_score: null, score: { easy_to_use: 3, need_address: 3, relevance: 3 } },
      ]);
      const avg = await feedbackService.calcAvgScoreOfPrototype({ _id: '507f1f77bcf86cd799439012' });
      expect(Feedback.find).toHaveBeenCalledWith({ ref: '507f1f77bcf86cd799439012' });
      expect(avg).toBeCloseTo(3.75, 5);
    });
  });

  describe('calcAvgScoreOfPrototypes', () => {
    test('aggregates average scores per prototype and falls back to score when avg_score is missing', async () => {
      Feedback.find.mockResolvedValue([
        { ref: 'proto-1', avg_score: 5 },
        { ref: 'proto-1', score: { easy_to_use: 3, need_address: 3, relevance: 3 } },
        { ref: 'proto-2', avg_score: 2 },
      ]);
      const result = await feedbackService.calcAvgScoreOfPrototypes(['proto-1', 'proto-2']);
      expect(result).toEqual({
        'proto-1': 4,
        'proto-2': 2,
      });
    });
  });

  describe('FeedbackPrototypeDecorator and FeedbackPrototypeListDecorator', () => {
    test('attaches computed avg_score to single prototype and prototype list', async () => {
      Feedback.find.mockResolvedValueOnce([
        { ref: 'proto-1', avg_score: 4 },
        { ref: 'proto-1', score: { easy_to_use: 5, need_address: 4, relevance: 3 } },
      ]);
      const decorated = await new FeedbackPrototypeDecorator({
        toJSON: () => ({ id: 'proto-1', name: 'Prototype 1' }),
      }).getPrototype();
      expect(decorated).toEqual({
        id: 'proto-1',
        name: 'Prototype 1',
        avg_score: 4,
      });

      Feedback.find.mockResolvedValueOnce([{ ref: 'proto-1', avg_score: 4.25 }]);
      const list = await new FeedbackPrototypeListDecorator([
        { toJSON: () => ({ id: 'proto-1', name: 'Prototype 1' }) },
        { toJSON: () => ({ id: 'proto-2', name: 'Prototype 2' }) },
      ]).getPrototypeList();
      expect(list).toEqual([
        { id: 'proto-1', name: 'Prototype 1', avg_score: 4.25 },
        { id: 'proto-2', name: 'Prototype 2', avg_score: null },
      ]);
    });
  });
});
