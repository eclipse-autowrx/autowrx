// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

// ParsedJsonPropertiesMongooseDecorator that handles multiple fields.
const ParsedJsonPropertiesMongooseDecorator = require('./ParsedJsonPropertiesMongooseDecorator');

/**
 * Decorator class to parse specified JSON string properties for each object
 * within a list (array) of Mongoose documents.
 * It modifies the original documents' internal _doc properties by leveraging
 * ParsedJsonPropertiesMongooseDecorator for each item.
 */
class ParsedJsonPropertiesMongooseListDecorator {
  /**
   * @param {Array<object>} dataList - An array of Mongoose document objects (each should contain _doc).
   * @param {...string} fields - One or more names of the fields whose string values need to be parsed as JSON within each document in the list.
   * @throws {Error} If dataList is not an array or if field names are invalid.
   */
  constructor(dataList, ...fields) {
    // Validate the dataList input
    if (!dataList || !Array.isArray(dataList)) {
      throw new Error('Error initializing list parser: Invalid data list format. Data must be an array.');
    }

    // Validate the fields array (must have at least one field)
    if (!fields || fields.length === 0) {
      throw new Error('Error initializing list parser: At least one field name must be provided.');
    }

    // Validate each field name (must be a non-empty string)
    fields.forEach((field, index) => {
      if (!field || typeof field !== 'string' || field.trim() === '') {
        throw new Error(
          `Error initializing list parser: Invalid field name at index ${index}. All field names must be non-empty strings.`
        );
      }
    });

    this.dataList = dataList;
    this.fields = fields;
  }

  /**
   * Iterates through the list of Mongoose documents and parses the specified
   * JSON string properties for each document using ParsedJsonPropertiesMongooseDecorator.
   * Updates each document's internal _doc property in place.
   *
   * @returns {Array<object>} The original array of Mongoose documents, where each document
   * has had its specified fields parsed (modifies original objects).
   * @throws {Error} If parsing fails for any document within the list (includes list index in message).
   */
  getParsedPropertiesDataList() {
    // Use map to iterate through each document in the list
    return this.dataList.map((data, index) => {
      try {
        // Basic check before passing to the single-item decorator
        if (!data || typeof data !== 'object') {
          throw new Error(`Item is not an object.`);
        }

        // Create an instance of the single-item parser for the current document ('data'),
        // passing ALL the required field names using the spread syntax (...this.fields).
        const singleItemParser = new ParsedJsonPropertiesMongooseDecorator(data, ...this.fields);

        // Execute the parsing method of the single-item parser.
        return singleItemParser.getParsedPropertiesData();
      } catch (error) {
        // If any error occurs during instantiation or parsing for an item,
        // catch it and re-throw with the list index for better context.
        throw new Error(`Error while processing item at list index ${index}: ${error.message}`);
      }
    });
  }
}

module.exports = ParsedJsonPropertiesMongooseListDecorator;
