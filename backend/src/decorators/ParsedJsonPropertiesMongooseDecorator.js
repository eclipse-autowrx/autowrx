// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const { Model } = require('mongoose');

/**
 * Helper function to safely retrieve a value from a nested object path.
 * @param {object} obj - The object to traverse.
 * @param {string[]} path - An array of keys representing the path.
 * @returns {*} The value found at the path, or undefined if the path is invalid or not found.
 * @throws {Error} If the path is invalid or if the object is not an object.
 */
function getValueByPath(obj, path) {
  let current = obj;
  for (let i = 0; i < path.length; i++) {
    // Check if current level is valid before accessing the next key
    if (!current || typeof current !== 'object') {
      const parentPath = path.slice(0, i).join('.');
      throw new Error(`Cannot access property '${path[i]}' on non-object parent at path '${parentPath}'.`);
    }
    current = current[path[i]];
  }
  return current;
}

/**
 * Helper function to safely set a value at a nested object path.
 * Creates intermediate objects if they don't exist.
 * @param {object} obj - The object to modify (typically data._doc).
 * @param {string[]} path - An array of keys representing the path.
 * @param {*} value - The value to set at the final path location.
 * @throws {Error} If unable to set the value (e.g., trying to set a property on a non-object).
 */
function setValueByPath(obj, path, value) {
  let current = obj;
  // Iterate up to the second-to-last key to ensure the parent exists
  for (let i = 0; i < path.length - 1; i++) {
    // Check if current level is valid before accessing the next key
    if (!current || typeof current !== 'object') {
      const parentPath = path.slice(0, i).join('.');
      throw new Error(`Cannot access property '${path[i]}' on non-object parent at path '${parentPath}'.`);
    }

    const nextParent = current[path[i]];

    // If nextParent is mongoose model, we need to access its _doc property
    if (nextParent && typeof nextParent === 'object' && typeof nextParent._doc === 'object' && nextParent instanceof Model) {
      current = nextParent._doc;
      continue;
    }

    current = nextParent;
  }

  // Set the value at the final key, ensuring the parent 'current' is an object

  const finalKey = path[path.length - 1];
  if (current && typeof current === 'object') {
    current[finalKey] = value;
  } else {
    // This should ideally not happen if the loop above works correctly, but acts as a safeguard
    const parentPath = path.slice(0, -1).join('.');
    throw new Error(`Cannot set property '${finalKey}' on non-object parent at path '${parentPath}'.`);
  }
}

/**
 * Decorator class to parse specified JSON string properties within a Mongoose document object,
 * supporting nested fields via dot notation.
 * It modifies the original document's internal _doc property.
 */
class ParsedJsonPropertiesMongooseDecorator {
  /**
   * Creates an instance of ParsedJsonPropertiesMongooseDecorator.
   *
   * @param {object} data - The Mongoose document object (must contain the _doc property).
   * @param {...string} fields - One or more names of the fields (can include dot notation for nesting, e.g., "parent.child") whose string values need to be parsed as JSON.
   * @throws {Error} If data is invalid, not a Mongoose document, or if field names are invalid.
   */
  constructor(data, ...fields) {
    // Validate the data object
    if (!data || typeof data !== 'object') {
      throw new Error('Error initializing parser: Invalid data format. Data must be an object.');
    }

    // Validate if it looks like a Mongoose document (presence of _doc)
    // Note: _doc might not reflect deeply nested structures initially if not populated/accessed.
    if (!data._doc) {
      throw new Error(
        'Error initializing parser: Data does not appear to be a Mongoose Document. _doc property is missing.'
      );
    }

    // Validate the fields array
    if (!fields || fields.length === 0) {
      throw new Error('Error initializing parser: At least one field name must be provided.');
    }

    // Validate each field name (still needs to be a non-empty string, dots are allowed)
    fields.forEach((field, index) => {
      if (!field || typeof field !== 'string' || field.trim() === '') {
        throw new Error(
          `Error initializing parser: Invalid field name at index ${index}. All field names must be non-empty strings.`
        );
      }
    });

    this.data = data;
    this.fields = fields;
  }

  /**
   * Parses the JSON string content of the specified fields (including nested ones) within the Mongoose document.
   * Updates the document's internal _doc property with the parsed objects at the correct paths.
   *
   * @returns {object} The original Mongoose document object with specified fields parsed.
   * @throws {Error} If a specified field path is missing/invalid, the value is not a string, or contains invalid JSON.
   */
  getParsedPropertiesData() {
    for (const field of this.fields) {
      // Split the field string by dots to handle nesting
      const pathComponents = field.split('.');

      const fieldData = getValueByPath(this.data, pathComponents);
      // --- Parse and Set ---
      if (typeof fieldData === 'string') {
        // Handle empty strings before parsing
        if (fieldData.trim() === '') {
          throw new Error(
            `Error parsing JSON data: Field path "${field}" contains an empty or whitespace-only string, which is not valid JSON.`
          );
        }
        try {
          // Parse the JSON string
          const parsedFieldData = JSON.parse(fieldData);

          // Set the PARSED value at the correct nested path WITHIN _doc
          setValueByPath(this.data._doc, pathComponents, parsedFieldData);
        } catch (error) {
          // Catch JSON parsing errors
          throw new Error(`Error parsing JSON data in field path "${field}": ${error.message}`);
        }
      } else {
        // The value at the path exists but is not a string. It doesn't need JSON parsing.
        // Log a warning.
        console.warn(`Skipping field path "${field}": Value is not a string (type: ${typeof fieldData}).`);
      }
    } // End loop through fields

    // Return the modified data object (modified in place)
    return this.data;
  }
}

module.exports = ParsedJsonPropertiesMongooseDecorator;
